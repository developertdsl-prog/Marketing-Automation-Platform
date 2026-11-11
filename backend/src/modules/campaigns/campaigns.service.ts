import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { UpdateCampaignDto } from './dto/update-campaign.dto';
import { QueryCampaignDto } from './dto/query-campaign.dto';

@Injectable()
export class CampaignsService {
  private readonly logger = new Logger(CampaignsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(
    createCampaignDto: CreateCampaignDto,
    organizationId: string,
    createdById: string,
  ) {
    const { emailTemplateId, segmentId, scheduleAt, ...rest } = createCampaignDto;

    // Verify email template exists and belongs to org
    if (emailTemplateId) {
      const template = await this.prisma.emailTemplate.findUnique({
        where: { id: emailTemplateId },
      });
      if (!template || template.organizationId !== organizationId) {
        throw new NotFoundException('Email template not found');
      }
    }

    // Verify segment exists and belongs to org
    if (segmentId) {
      const segment = await this.prisma.contactSegment.findUnique({
        where: { id: segmentId },
      });
      if (!segment || segment.organizationId !== organizationId) {
        throw new NotFoundException('Contact segment not found');
      }
    }

    const campaign = await this.prisma.campaign.create({
      data: {
        ...rest,
        organizationId,
        emailTemplateId,
        segmentId,
        createdById,
        scheduleAt: scheduleAt ? new Date(scheduleAt) : undefined,
        status: scheduleAt ? 'scheduled' : 'draft',
      },
      include: {
        emailTemplate: true,
        segment: true,
        _count: { select: { recipients: true, emailEvents: true } },
      },
    });

    this.logger.log(
      `Campaign created: ${campaign.id} (org: ${organizationId})`,
    );
    return campaign;
  }

  async findAll(organizationId: string, query: QueryCampaignDto) {
    const { page = 1, limit = 20, search, status, type } = query;
    const skip = (page - 1) * limit;
    const take = limit;

    const where: any = {
      organizationId,
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status) {
      where.status = status;
    }

    if (type) {
      where.type = type;
    }

    const [campaigns, total] = await this.prisma.$transaction([
      this.prisma.campaign.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          emailTemplate: { select: { id: true, name: true, subject: true } },
          segment: { select: { id: true, name: true } },
          _count: { select: { recipients: true, emailEvents: true } },
        },
      }),
      this.prisma.campaign.count({ where }),
    ]);

    return {
      data: campaigns,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string, organizationId: string) {
    const campaign = await this.prisma.campaign.findUnique({
      where: { id },
      include: {
        emailTemplate: true,
        segment: true,
        recipients: {
          include: { contact: true },
          take: 50,
        },
        emailEvents: {
          orderBy: { occurredAt: 'desc' },
          take: 50,
        },
        createdBy: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
    });

    if (!campaign || campaign.organizationId !== organizationId) {
      throw new NotFoundException('Campaign not found');
    }

    return campaign;
  }

  async update(
    id: string,
    updateCampaignDto: UpdateCampaignDto,
    organizationId: string,
  ) {
    const { emailTemplateId, segmentId, scheduleAt, ...rest } = updateCampaignDto;

    const campaign = await this.prisma.campaign.findUnique({
      where: { id },
    });
    if (!campaign || campaign.organizationId !== organizationId) {
      throw new NotFoundException('Campaign not found');
    }

    // Cannot edit completed/cancelled campaigns
    if (['completed', 'cancelled'].includes(campaign.status)) {
      throw new BadRequestException(
        `Cannot edit a ${campaign.status} campaign`,
      );
    }

    // Verify email template
    if (emailTemplateId) {
      const template = await this.prisma.emailTemplate.findUnique({
        where: { id: emailTemplateId },
      });
      if (!template || template.organizationId !== organizationId) {
        throw new NotFoundException('Email template not found');
      }
    }

    // Verify segment
    if (segmentId) {
      const segment = await this.prisma.contactSegment.findUnique({
        where: { id: segmentId },
      });
      if (!segment || segment.organizationId !== organizationId) {
        throw new NotFoundException('Contact segment not found');
      }
    }

    const updated = await this.prisma.campaign.update({
      where: { id },
      data: {
        ...rest,
        emailTemplateId,
        segmentId,
        scheduleAt: scheduleAt ? new Date(scheduleAt) : undefined,
        status: scheduleAt && campaign.status === 'draft' ? 'scheduled' : campaign.status,
      },
      include: {
        emailTemplate: true,
        segment: true,
        _count: { select: { recipients: true, emailEvents: true } },
      },
    });

    this.logger.log(`Campaign updated: ${id} (org: ${organizationId})`);
    return updated;
  }

  async remove(id: string, organizationId: string) {
    const campaign = await this.prisma.campaign.findUnique({
      where: { id },
    });
    if (!campaign || campaign.organizationId !== organizationId) {
      throw new NotFoundException('Campaign not found');
    }

    if (campaign.status === 'active') {
      throw new BadRequestException(
        'Cannot delete an active campaign. Pause it first.',
      );
    }

    await this.prisma.campaign.delete({ where: { id } });
    this.logger.log(`Campaign deleted: ${id} (org: ${organizationId})`);
    return { message: 'Campaign deleted successfully' };
  }

  async launch(id: string, organizationId: string, createdById: string) {
    const campaign = await this.prisma.campaign.findUnique({
      where: { id },
      include: { emailTemplate: true, segment: true },
    });
    if (!campaign || campaign.organizationId !== organizationId) {
      throw new NotFoundException('Campaign not found');
    }

    if (campaign.status !== 'draft' && campaign.status !== 'scheduled') {
      throw new BadRequestException(
        `Cannot launch a ${campaign.status} campaign`,
      );
    }

    if (!campaign.emailTemplate) {
      throw new BadRequestException('Campaign must have an email template');
    }

    // Update campaign status
    const updated = await this.prisma.campaign.update({
      where: { id },
      data: {
        status: 'active',
        startedAt: new Date(),
      },
    });

    this.logger.log(
      `Campaign launched: ${id} (org: ${organizationId}) by user ${createdById}`,
    );

    return {
      campaign: updated,
      message: 'Campaign launched successfully',
    };
  }

  async pause(id: string, organizationId: string) {
    const campaign = await this.prisma.campaign.findUnique({
      where: { id },
    });
    if (!campaign || campaign.organizationId !== organizationId) {
      throw new NotFoundException('Campaign not found');
    }

    if (campaign.status !== 'active') {
      throw new BadRequestException('Only active campaigns can be paused');
    }

    const updated = await this.prisma.campaign.update({
      where: { id },
      data: { status: 'paused' },
    });

    this.logger.log(`Campaign paused: ${id} (org: ${organizationId})`);
    return updated;
  }

  async getStats(id: string, organizationId: string) {
    const campaign = await this.prisma.campaign.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            recipients: true,
            emailEvents: true,
          },
        },
        emailEvents: {
          select: { type: true },
          orderBy: { occurredAt: 'desc' },
        },
      },
    });

    if (!campaign || campaign.organizationId !== organizationId) {
      throw new NotFoundException('Campaign not found');
    }

    const eventsByType = campaign.emailEvents.reduce(
      (acc: Record<string, number>, event: { type: string }) => {
        acc[event.type] = (acc[event.type] || 0) + 1;
        return acc;
      },
      {},
    );

    const totalSent = eventsByType['sent'] || 0;
    const totalOpened = eventsByType['opened'] || 0;
    const totalClicked = eventsByType['clicked'] || 0;
    const totalBounced = eventsByType['bounced'] || 0;

    return {
      campaignId: id,
      campaignName: campaign.name,
      status: campaign.status,
      totalRecipients: campaign._count.recipients,
      totalSent,
      totalOpened,
      totalClicked,
      totalBounced,
      openRate: totalSent > 0 ? ((totalOpened / totalSent) * 100).toFixed(2) : '0.00',
      clickRate: totalSent > 0 ? ((totalClicked / totalSent) * 100).toFixed(2) : '0.00',
      bounceRate: totalSent > 0 ? ((totalBounced / totalSent) * 100).toFixed(2) : '0.00',
      eventsByType,
    };
  }
}
