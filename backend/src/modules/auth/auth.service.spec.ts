import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import * as bcrypt from 'bcrypt';

// Mock bcrypt module to avoid spyOn issues
jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

const mockPrismaService = {
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  organization: {
    findUnique: jest.fn(),
    create: jest.fn(),
  },
  role: {
    findFirst: jest.fn(),
    create: jest.fn(),
  },
};

const mockJwtService = {
  sign: jest.fn(),
  verify: jest.fn(),
};

const mockConfigService = {
  get: jest.fn((key: string) => {
    const config: Record<string, string> = {
      JWT_ACCESS_SECRET: 'test-access-secret-min-32-chars',
      JWT_REFRESH_SECRET: 'test-refresh-secret-min-32-chars',
      JWT_ACCESS_EXPIRATION: '15m',
      JWT_REFRESH_EXPIRATION: '7d',
    };
    return config[key];
  }),
};

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('hashPassword', () => {
    it('should hash a password using bcrypt', async () => {
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');

      const result = await service.hashPassword('password123');

      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 12);
      expect(result).toBe('hashed-password');
    });
  });

  describe('comparePassword', () => {
    it('should return true when passwords match', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.comparePassword('password123', 'hash');
      expect(result).toBe(true);
    });

    it('should return false when passwords do not match', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await service.comparePassword('wrong', 'hash');
      expect(result).toBe(false);
    });
  });

  describe('register', () => {
    const registerDto = {
      email: 'newuser@example.com',
      password: 'password123',
      firstName: 'John',
      lastName: 'Doe',
      organizationSlug: 'test-org',
    };

    it('should create a new user and organization', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      mockPrismaService.organization.findUnique.mockResolvedValue(null);
      mockPrismaService.organization.create.mockResolvedValue({
        id: 'org-1',
        name: 'test-org',
        slug: 'test-org',
        plan: 'starter',
      });
      mockPrismaService.role.findFirst.mockResolvedValue(null);
      mockPrismaService.role.create.mockResolvedValue({
        id: 'role-1',
        key: 'ORG_ADMIN',
        permissions: ['*'],
      });
      mockPrismaService.user.create.mockResolvedValue({
        id: 'user-1',
        email: 'newuser@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: { key: 'ORG_ADMIN' },
        organization: { id: 'org-1', name: 'test-org', slug: 'test-org' },
      });
      mockJwtService.sign.mockReturnValue('access-token');

      const result = await service.register(registerDto);

      expect(mockPrismaService.user.create).toHaveBeenCalledWith({
        data: {
          email: 'newuser@example.com',
          passwordHash: expect.any(String),
          firstName: 'John',
          lastName: 'Doe',
          organizationId: 'org-1',
          roleId: 'role-1',
          isActive: true,
        },
        include: { role: true, organization: true },
      });
      expect(result.user.email).toBe('newuser@example.com');
      expect(result.tokens.accessToken).toBe('access-token');
    });

    it('should throw ConflictException if email already exists', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'existing',
        email: 'newuser@example.com',
      });

      await expect(service.register(registerDto)).rejects.toThrow(
        'User with this email already exists',
      );
    });
  });

  describe('login', () => {
    const loginDto = { email: 'user@example.com', password: 'password123' };

    it('should authenticate a valid user', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'user@example.com',
        passwordHash: 'hash',
        isActive: true,
        role: { key: 'MEMBER' },
        organization: { id: 'org-1', name: 'Test Org', slug: 'test-org', plan: 'starter' },
        team: null,
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockPrismaService.user.update.mockResolvedValue({});
      mockJwtService.sign.mockReturnValue('access-token');

      const result = await service.login(loginDto);

      expect(result.user.email).toBe('user@example.com');
      expect(result.tokens.accessToken).toBe('access-token');
    });

    it('should throw UnauthorizedException for invalid credentials', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(
        'Invalid credentials',
      );
    });
  });

  describe('generateTokens', () => {
    it('should generate access and refresh tokens', () => {
      const tokens = service.generateTokens('user-1', 'user@example.com', 'MEMBER');

      expect(tokens.accessToken).toBeDefined();
      expect(tokens.refreshToken).toBeDefined();
      expect(mockJwtService.sign).toHaveBeenCalledTimes(2);
    });
  });
});
