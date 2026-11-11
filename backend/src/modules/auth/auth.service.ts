import {
  Injectable,
  Logger,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  /**
   * Hash a plain-text password using bcrypt.
   */
  async hashPassword(password: string): Promise<string> {
    const saltOrRounds = 12;
    return bcrypt.hash(password, saltOrRounds);
  }

  /**
   * Compare a plain-text password against a stored hash.
   */
  async comparePassword(
    plain: string,
    hash: string,
  ): Promise<boolean> {
    return bcrypt.compare(plain, hash);
  }

  /**
   * Generate an access + refresh token pair for a user.
   */
  generateTokens(userId: string, email: string, roleKey: string) {
    const payload = { sub: userId, email, role: roleKey };
    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET') ?? '',
      expiresIn:
        this.configService.get<string>('JWT_REFRESH_EXPIRATION') || '7d',
    });
    return { accessToken, refreshToken };
  }

  /**
   * Register a new user within their organization.
   * Creates the organization if it does not exist (first user = org admin).
   */
  async register(registerDto: RegisterDto) {
    const { email, password, firstName, lastName, organizationSlug } =
      registerDto;

    // Check if email already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Derive a default organization slug from the email domain if none provided
    const slug = organizationSlug || email.split('@')[1]?.replace(/[^a-z0-9-]/g, '-') || 'org';

    // Resolve or create organization
    let organization = await this.prisma.organization.findUnique({
      where: { slug },
    });
    let isOrgAdmin = false;

    if (!organization) {
      organization = await this.prisma.organization.create({
        data: {
          name: slug,
          slug,
          plan: 'starter',
        },
      });
      isOrgAdmin = true;
    }

    // Resolve or create the admin role for this organization
    let adminRole = await this.prisma.role.findFirst({
      where: { organizationId: organization.id, key: 'ORG_ADMIN' },
    });
    if (!adminRole) {
      adminRole = await this.prisma.role.create({
        data: {
          organizationId: organization.id,
          name: 'Organization Admin',
          key: 'ORG_ADMIN',
          description: 'Full access to organization resources',
          permissions: ['*'],
        },
      });
    }

    // Determine role: first user in an org becomes ORG_ADMIN, otherwise MEMBER
    let role = isOrgAdmin ? adminRole : await this.prisma.role.findFirst({
      where: { organizationId: organization.id, key: 'MEMBER' },
    });

    // Fallback: create MEMBER role if missing
    if (!role) {
      role = await this.prisma.role.create({
        data: {
          organizationId: organization.id,
          name: 'Member',
          key: 'MEMBER',
          description: 'Standard member access',
          permissions: [],
        },
      });
    }

    const passwordHash = await this.hashPassword(password);

    const user = await this.prisma.user.create({
      data: {
        email,
        passwordHash,
        firstName,
        lastName,
        organizationId: organization.id,
        roleId: role.id,
        isActive: true,
      },
      include: {
        role: true,
        organization: true,
      },
    });

    const roleKey = user.role?.key ?? 'MEMBER';
    const tokens = this.generateTokens(user.id, user.email, roleKey);

    this.logger.log(`New user registered: ${user.email} (org: ${organization.slug})`);

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role.key,
        organization: {
          id: organization.id,
          name: organization.name,
          slug: organization.slug,
        },
      },
      tokens,
    };
  }

  /**
   * Authenticate a user with email + password.
   */
  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { role: true, organization: true, team: true },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordValid = await this.comparePassword(
      password,
      user.passwordHash,
    );
    if (!passwordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Update last login
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const roleKey = user.role?.key ?? 'MEMBER';
    const tokens = this.generateTokens(user.id, user.email, roleKey);

    this.logger.log(`User logged in: ${user.email}`);

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role.key,
        team: user.team ? { id: user.team.id, name: user.team.name } : null,
        organization: {
          id: user.organization.id,
          name: user.organization.name,
          slug: user.organization.slug,
          plan: user.organization.plan,
        },
      },
      tokens,
    };
  }

  /**
   * Refresh an access token using a valid refresh token.
   */
  async refresh(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        include: { role: true, organization: true },
      });

      if (!user || !user.isActive) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const roleKey = user.role?.key ?? 'MEMBER';
      return this.generateTokens(user.id, user.email, roleKey);
    } catch (err) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  /**
   * Initiate a password reset (send reset token via email).
   * In production this triggers an email; here we return the token for dev.
   */
  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const { email } = forgotPasswordDto;

    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Do not reveal whether the email exists
      return { message: 'If an account exists, a reset link has been sent.' };
    }

    const resetToken = this.jwtService.sign(
      { sub: user.id, type: 'password_reset' },
      {
        secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
        expiresIn: '1h',
      },
    );

    this.logger.log(
      `Password reset requested for: ${email} (token: ${resetToken})`,
    );

    // TODO: Send reset email via email provider integration
    return {
      message: 'If an account exists, a reset link has been sent.',
      resetToken: process.env.NODE_ENV === 'development' ? resetToken : undefined,
    };
  }

  /**
   * Reset password using a valid reset token.
   */
  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const { token, password } = resetPasswordDto;

    let payload: any;
    try {
      payload = this.jwtService.verify(token, {
        secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
      });
    } catch {
      throw new BadRequestException('Invalid or expired reset token');
    }

    if (payload.type !== 'password_reset') {
      throw new BadRequestException('Invalid reset token');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });
    if (!user) {
      throw new BadRequestException('Invalid reset token');
    }

    const passwordHash = await this.hashPassword(password);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    this.logger.log(`Password reset completed for user: ${user.id}`);

    return { message: 'Password has been reset successfully.' };
  }

  /**
   * Get the current authenticated user's profile.
   */
  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: true,
        organization: true,
        team: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const { passwordHash, ...result } = user;
    return result;
  }

  /**
   * Change the authenticated user's password.
   */
  async changePassword(userId: string, oldPassword: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const valid = await this.comparePassword(oldPassword, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    const passwordHash = await this.hashPassword(newPassword);

    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    this.logger.log(`Password changed for user: ${userId}`);

    return { message: 'Password changed successfully.' };
  }
}
