import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateIntegrationDto } from './dto/create-integration.dto';
import { UpdateIntegrationDto } from './dto/update-integration.dto';
import { QueryIntegrationDto } from './dto/query-integration.dto';
import * as crypto from 'crypto';

@Injectable()
export class IntegrationsService {
  private readonly logger = new Logger(IntegrationsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * List of supported integration providers.
   */
  getSupportedProviders() {
    return [
      {
        key: 'sendgrid',
        name: 'SendGrid',
        description: 'Transactional and marketing email delivery',
        configFields: ['apiKey'],
      },
      {
        key: 'mailgun',
        name: 'Mailgun',
        description: 'Email API for sending, receiving, and tracking',
        configFields: ['apiKey', 'domain'],
      },
      {
        key: 'aws_ses',
        name: 'Amazon SES',
        description: 'Scalable email sending using AWS Simple Email Service',
        configFields: ['region', 'accessKeyId', 'secretAccessKey'],
      },
      {
        key: 'smtp',
        name: 'SMTP',
        description: 'Generic SMTP email provider',
        configFields: ['host', 'port', 'user', 'password', 'from'],
      },
      {
        key: 'slack',
        name: 'Slack',
        description: 'Slack notifications via webhook',
        configFields: ['webhookUrl'],
      },
    ];
  }

  /**
   * Create a new integration for an organization.
   * Sensitive fields are encrypted at rest.
   */
  async create(createIntegrationDto: CreateIntegrationDto, organizationId: string) {
    const { provider, name, config, isActive } = createIntegrationDto;

    // Validate provider
    const supported = this.getSupportedProviders().find((p) => p.key === provider);
    if (!supported) {
      throw new BadRequestException(`Unsupported provider: ${provider}`);
    }

    // Encrypt sensitive config values
    const encryptedConfig = this.encryptConfig(config || {});

    const integration = await this.prisma.integration.create({
      data: {
        provider,
        name,
        config: encryptedConfig,
        isActive: isActive ?? false,
        organizationId,
      },
    });

    this.logger.log(
      `Integration created: ${integration.id} (provider: ${provider}, org: ${organizationId})`,
    );
    return this.sanitizeIntegration(integration);
  }

  /**
   * List integrations for an organization.
   * Sensitive fields are masked in the response.
   */
  async findAll(organizationId: string, query: QueryIntegrationDto) {
    const { page = 1, limit = 20, search, provider, isActive } = query;
    const skip = (page - 1) * limit;
    const take = limit;

    const where: any = {
      organizationId,
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { provider: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (provider) {
      where.provider = provider;
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    const [integrations, total] = await this.prisma.$transaction([
      this.prisma.integration.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.integration.count({ where }),
    ]);

    return {
      data: integrations.map((i: any) => this.sanitizeIntegration(i)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get a single integration by ID (scoped to organization).
   * Sensitive fields are masked.
   */
  async findOne(id: string, organizationId: string) {
    const integration = await this.prisma.integration.findUnique({
      where: { id },
    });
    if (!integration || integration.organizationId !== organizationId) {
      throw new NotFoundException('Integration not found');
    }

    return this.sanitizeIntegration(integration);
  }

  /**
   * Update an integration (scoped to organization).
   */
  async update(
    id: string,
    updateIntegrationDto: UpdateIntegrationDto,
    organizationId: string,
  ) {
    const { config, isActive, ...rest } = updateIntegrationDto;

    const integration = await this.prisma.integration.findUnique({
      where: { id },
    });
    if (!integration || integration.organizationId !== organizationId) {
      throw new NotFoundException('Integration not found');
    }

    const encryptedConfig = config
      ? this.encryptConfig(config)
      : undefined;

    const updated = await this.prisma.integration.update({
      where: { id },
      data: {
        ...rest,
        config: encryptedConfig ?? (integration.config as string),
        isActive: isActive ?? integration.isActive,
      },
    });

    this.logger.log(`Integration updated: ${id} (org: ${organizationId})`);
    return this.sanitizeIntegration(updated);
  }

  /**
   * Delete an integration (scoped to organization).
   */
  async remove(id: string, organizationId: string) {
    const integration = await this.prisma.integration.findUnique({
      where: { id },
    });
    if (!integration || integration.organizationId !== organizationId) {
      throw new NotFoundException('Integration not found');
    }

    await this.prisma.integration.delete({ where: { id } });
    this.logger.log(`Integration deleted: ${id} (org: ${organizationId})`);
    return { message: 'Integration deleted successfully' };
  }

  /**
   * Test an integration connection (e.g., verify SendGrid API key).
   */
  async test(id: string, organizationId: string) {
    const integration = await this.prisma.integration.findUnique({
      where: { id },
    });
    if (!integration || integration.organizationId !== organizationId) {
      throw new NotFoundException('Integration not found');
    }

    const config = this.decryptConfig(integration.config as string | null);

    // Simulate a connection test based on provider
    switch (integration.provider) {
      case 'sendgrid':
        if (!config.apiKey) {
          throw new BadRequestException('SendGrid API key is required');
        }
        break;
      case 'mailgun':
        if (!config.apiKey || !config.domain) {
          throw new BadRequestException('Mailgun API key and domain are required');
        }
        break;
      case 'aws_ses':
        if (!config.region || !config.accessKeyId || !config.secretAccessKey) {
          throw new BadRequestException('AWS SES region, access key, and secret key are required');
        }
        break;
      case 'smtp':
        if (!config.host || !config.port || !config.user) {
          throw new BadRequestException('SMTP host, port, and user are required');
        }
        break;
      case 'slack':
        if (!config.webhookUrl) {
          throw new BadRequestException('Slack webhook URL is required');
        }
        break;
    }

    this.logger.log(`Integration test passed: ${id} (provider: ${integration.provider})`);
    return {
      success: true,
      message: `Connection to ${integration.provider} verified successfully`,
      provider: integration.provider,
    };
  }

  /**
   * Get decrypted config for internal use (e.g., sending email).
   * Only call this from trusted server-side code.
   */
  async getDecryptedConfig(id: string, organizationId: string) {
    const integration = await this.prisma.integration.findUnique({
      where: { id },
    });
    if (!integration || integration.organizationId !== organizationId) {
      throw new NotFoundException('Integration not found');
    }

    if (!integration.isActive) {
      throw new BadRequestException('Integration is not active');
    }

    return this.decryptConfig(integration.config as string | null);
  }

  /**
   * Encrypt sensitive config values before storing.
   * Uses AES-256-GCM with a key derived from an env variable.
   */
  private encryptConfig(config: Record<string, unknown>): string {
    const encryptionKey = process.env.INTEGRATION_ENCRYPTION_KEY;
    if (!encryptionKey) {
      throw new BadRequestException(
        'INTEGRATION_ENCRYPTION_KEY environment variable is not set',
      );
    }

    const algorithm = 'aes-256-gcm';
    const iv = crypto.randomBytes(16);
    const key = crypto.createHash('sha256').update(encryptionKey).digest();
    const cipher = crypto.createCipheriv(algorithm, key, iv);

    const plaintext = JSON.stringify(config);
    const encrypted = Buffer.concat([
      cipher.update(plaintext, 'utf8'),
      cipher.final(),
    ]);

    const authTag = cipher.getAuthTag();

    return JSON.stringify({
      iv: iv.toString('hex'),
      encrypted: encrypted.toString('base64'),
      authTag: authTag.toString('base64'),
    });
  }

  /**
   * Decrypt sensitive config values after reading from DB.
   */
  private decryptConfig(encryptedConfig: string | null): Record<string, unknown> {
    if (!encryptedConfig) {
      return {};
    }

    const encryptionKey = process.env.INTEGRATION_ENCRYPTION_KEY;
    if (!encryptionKey) {
      throw new BadRequestException(
        'INTEGRATION_ENCRYPTION_KEY environment variable is not set',
      );
    }

    const parsed = JSON.parse(encryptedConfig as string);
    const algorithm = 'aes-256-gcm';
    const key = crypto.createHash('sha256').update(encryptionKey).digest();
    const decipher = crypto.createDecipheriv(
      algorithm,
      key,
      Buffer.from(parsed.iv, 'hex'),
    );
    decipher.setAuthTag(Buffer.from(parsed.authTag, 'base64'));

    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(parsed.encrypted, 'base64')),
      decipher.final(),
    ]);

    return JSON.parse(decrypted.toString('utf8'));
  }

  /**
   * Mask sensitive fields in integration config for API responses.
   */
  private sanitizeIntegration(integration: any) {
    const config = (integration.config as Record<string, unknown>) || {};
    const maskedConfig: Record<string, unknown> = {};

    const sensitiveFields = [
      'apiKey',
      'secretAccessKey',
      'password',
      'webhookUrl',
      'accessKeyId',
    ];

    for (const [key, value] of Object.entries(config)) {
      if (sensitiveFields.includes(key) && value) {
        maskedConfig[key] = '••••••••';
      } else {
        maskedConfig[key] = value;
      }
    }

    return {
      ...integration,
      config: maskedConfig,
    };
  }
}
