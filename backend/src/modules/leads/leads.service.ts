import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { QueryLeadDto } from './dto/query-lead.dto';

@Injectable()
export class LeadsService {
  private readonly logger = new Logger(LeadsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new lead linked to a contact within the organization.
   */
  async create(createLeadDto: CreateLeadDto, organizationId: string) {
    const { contactId, ...rest } = createLeadDto;

    // Verify contact exists and belongs to organization
    const contact = await this.prisma.contact.findUnique({
      where: { id: contactId },
    });
    if (!contact || contact.organizationId !== organizationId) {
      throw new NotFoundException('Contact not found');
    }

    // Check for existing lead on this contact
    const existing = await this.prisma.lead.findFirst({
      where: { contactId },
    });
    if (existing) {
      throw new BadRequestException('A lead already exists for this contact');
    }

    const lead = await this.prisma.lead.create({
      data: {
        ...rest,
        contactId,
        organizationId,
      },
      include: {
        contact: true,
        team: true,
        owner: true,
      },
    });

    this.logger.log(`Lead created: ${lead.id} (contact: ${contactId})`);
    return lead;
  }

  /**
   * List leads for an organization with filtering and pagination.
   */
  async findAll(organizationId: string, query: QueryLeadDto) {
    const { page = 1, limit = 20, search, status, ownerId, teamId } = query;
    const skip = (page - 1) * limit;
    const take = limit;

    const where: any = {
      organizationId,
    };

    if (search) {
      where.OR = [
        { contact: { email: { contains: search, mode: 'insensitive' } } },
        { contact: { firstName: { contains: search, mode: 'insensitive' } } },
        { contact: { lastName: { contains: search, mode: 'insensitive' } } },
        { source: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status) {
      where.status = status;
    }

    if (ownerId) {
      where.ownerId = ownerId;
    }

    if (teamId) {
      where.teamId = teamId;
    }

    const [leads, total] = await this.prisma.$transaction([
      this.prisma.lead.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          contact: true,
          team: true,
          owner: true,
        },
      }),
      this.prisma.lead.count({ where }),
    ]);

    return {
      data: leads,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get a single lead by ID (scoped to organization).
   */
  async findOne(id: string, organizationId: string) {
    const lead = await this.prisma.lead.findUnique({
      where: { id },
      include: {
        contact: true,
        team: true,
        owner: true,
      },
    });

    if (!lead || lead.organizationId !== organizationId) {
      throw new NotFoundException('Lead not found');
    }

    return lead;
  }

  /**
   * Update a lead (scoped to organization).
   */
  async update(
    id: string,
    updateLeadDto: UpdateLeadDto,
    organizationId: string,
  ) {
    const lead = await this.prisma.lead.findUnique({
      where: { id },
    });
    if (!lead || lead.organizationId !== organizationId) {
      throw new NotFoundException('Lead not found');
    }

    const updated = await this.prisma.lead.update({
      where: { id },
      data: updateLeadDto,
      include: {
        contact: true,
        team: true,
        owner: true,
      },
    });

    this.logger.log(`Lead updated: ${id} (org: ${organizationId})`);
    return updated;
  }

  /**
   * Delete a lead (scoped to organization).
   */
  async remove(id: string, organizationId: string) {
    const lead = await this.prisma.lead.findUnique({
      where: { id },
    });
    if (!lead || lead.organizationId !== organizationId) {
      throw new NotFoundException('Lead not found');
    }

    await this.prisma.lead.delete({ where: { id } });
    this.logger.log(`Lead deleted: ${id} (org: ${organizationId})`);
    return { message: 'Lead deleted successfully' };
  }

  /**
   * Assign a lead to a team or owner.
   */
  async assign(id: string, organizationId: string, teamId?: string, ownerId?: string) {
    const lead = await this.prisma.lead.findUnique({
      where: { id },
    });
    if (!lead || lead.organizationId !== organizationId) {
      throw new NotFoundException('Lead not found');
    }

    const updated = await this.prisma.lead.update({
      where: { id },
      data: {
        teamId: teamId ?? null,
        ownerId: ownerId ?? null,
      },
      include: {
        contact: true,
        team: true,
        owner: true,
      },
    });

    this.logger.log(`Lead assigned: ${id} (team: ${teamId}, owner: ${ownerId})`);
    return updated;
  }
}
