import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';

type InputJsonValue = Prisma.InputJsonValue;
import { PrismaService } from '../../prisma/prisma.service';
import { CreateEmailTemplateDto } from './dto/create-email-template.dto';
import { UpdateEmailTemplateDto } from './dto/update-email-template.dto';
import { QueryEmailTemplateDto } from './dto/query-email-template.dto';

@Injectable()
export class EmailTemplatesService {
  private readonly logger = new Logger(EmailTemplatesService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(
    createEmailTemplateDto: CreateEmailTemplateDto,
    organizationId: string,
  ) {
    const { name, subject, htmlContent, textContent, variables, isDefault } =
      createEmailTemplateDto;

    // If this is set as default, unset other defaults in the org
    if (isDefault) {
      await this.prisma.emailTemplate.updateMany({
        where: { organizationId, isDefault: true },
        data: { isDefault: false },
      });
    }

    const template = await this.prisma.emailTemplate.create({
      data: {
        name,
        subject,
        htmlContent,
        textContent,
        variables: (variables || {}) as unknown as InputJsonValue,
        isDefault: isDefault ?? false,
        organizationId,
      },
    });

    this.logger.log(
      `Email template created: ${template.id} (org: ${organizationId})`,
    );
    return template;
  }

  async findAll(organizationId: string, query: QueryEmailTemplateDto) {
    const { page = 1, limit = 20, search } = query;
    const skip = (page - 1) * limit;
    const take = limit;

    const where: any = {
      organizationId,
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { subject: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [templates, total] = await this.prisma.$transaction([
      this.prisma.emailTemplate.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: { select: { campaigns: true } },
        },
      }),
      this.prisma.emailTemplate.count({ where }),
    ]);

    return {
      data: templates,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string, organizationId: string) {
    const template = await this.prisma.emailTemplate.findUnique({
      where: { id },
      include: {
        campaigns: {
          select: { id: true, name: true, status: true },
        },
      },
    });

    if (!template || template.organizationId !== organizationId) {
      throw new NotFoundException('Email template not found');
    }

    return template;
  }

  async update(
    id: string,
    updateEmailTemplateDto: UpdateEmailTemplateDto,
    organizationId: string,
  ) {
    const { isDefault, ...rest } = updateEmailTemplateDto;

    const template = await this.prisma.emailTemplate.findUnique({
      where: { id },
    });
    if (!template || template.organizationId !== organizationId) {
      throw new NotFoundException('Email template not found');
    }

    // If setting as default, unset others
    if (isDefault) {
      await this.prisma.emailTemplate.updateMany({
        where: { organizationId, isDefault: true },
        data: { isDefault: false },
      });
    }

    const updated = await this.prisma.emailTemplate.update({
      where: { id },
      data: {
        ...rest,
        isDefault: isDefault ?? template.isDefault,
        variables: (rest.variables || template.variables || {}) as unknown as InputJsonValue,
      },
    });

    this.logger.log(`Email template updated: ${id} (org: ${organizationId})`);
    return updated;
  }

  async remove(id: string, organizationId: string) {
    const template = await this.prisma.emailTemplate.findUnique({
      where: { id },
    });
    if (!template || template.organizationId !== organizationId) {
      throw new NotFoundException('Email template not found');
    }

    // Check if template is used by any campaign
    const usedBy = await this.prisma.campaign.findFirst({
      where: { emailTemplateId: id },
    });
    if (usedBy) {
      throw new BadRequestException(
        'Cannot delete template: it is used by an existing campaign',
      );
    }

    await this.prisma.emailTemplate.delete({ where: { id } });
    this.logger.log(`Email template deleted: ${id} (org: ${organizationId})`);
    return { message: 'Email template deleted successfully' };
  }
}
