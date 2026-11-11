import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { QueryContactDto } from './dto/query-contact.dto';
import { AddTagDto } from './dto/add-tag.dto';

@Injectable()
export class ContactsService {
  private readonly logger = new Logger(ContactsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new contact within the organization.
   */
  async create(createContactDto: CreateContactDto, organizationId: string) {
    const { email, tags, ...rest } = createContactDto;

    // Check for duplicate email within organization
    const existing = await this.prisma.contact.findUnique({
      where: { email },
    });
    if (existing && existing.organizationId === organizationId) {
      throw new BadRequestException('Contact with this email already exists');
    }

    const contact = await this.prisma.contact.create({
      data: {
        ...rest,
        email,
        organizationId,
        tags: tags
          ? {
              create: tags.map((tag) => ({ tag, organizationId })),
            }
          : undefined,
      },
      include: {
        tags: true,
        segments: true,
      },
    });

    this.logger.log(`Contact created: ${contact.email} (org: ${organizationId})`);
    return contact;
  }

  /**
   * List contacts for an organization with filtering, search, and pagination.
   */
  async findAll(organizationId: string, query: QueryContactDto) {
    const { page = 1, limit = 20, search, tag, isUnsubscribed } = query;
    const skip = (page - 1) * limit;
    const take = limit;

    const where: any = {
      organizationId,
    };

    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { company: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (tag) {
      where.tags = { some: { tag } };
    }

    if (isUnsubscribed !== undefined) {
      where.isUnsubscribed = isUnsubscribed;
    }

    const [contacts, total] = await this.prisma.$transaction([
      this.prisma.contact.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          tags: true,
          _count: { select: { campaignRecipients: true } },
        },
      }),
      this.prisma.contact.count({ where }),
    ]);

    return {
      data: contacts,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get a single contact by ID (scoped to organization).
   */
  async findOne(id: string, organizationId: string) {
    const contact = await this.prisma.contact.findUnique({
      where: { id },
      include: {
        tags: true,
        segments: true,
        leads: { include: { team: true, owner: true } },
        campaignRecipients: {
          include: { campaign: true },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        emailEvents: {
          orderBy: { occurredAt: 'desc' },
          take: 20,
        },
      },
    });

    if (!contact || contact.organizationId !== organizationId) {
      throw new NotFoundException('Contact not found');
    }

    return contact;
  }

  /**
   * Update a contact (scoped to organization).
   */
  async update(id: string, updateContactDto: UpdateContactDto, organizationId: string) {
    const { tags, ...rest } = updateContactDto;

    const contact = await this.prisma.contact.findUnique({
      where: { id },
    });
    if (!contact || contact.organizationId !== organizationId) {
      throw new NotFoundException('Contact not found');
    }

    // Handle tag replacement
    if (tags !== undefined) {
      await this.prisma.contactTag.deleteMany({
        where: { contactId: id },
      });
      if (tags.length > 0) {
        await this.prisma.contactTag.createMany({
          data: tags.map((tag) => ({ contactId: id, tag, organizationId })),
        });
      }
    }

    const updated = await this.prisma.contact.update({
      where: { id },
      data: rest,
      include: { tags: true },
    });

    this.logger.log(`Contact updated: ${id} (org: ${organizationId})`);
    return updated;
  }

  /**
   * Delete a contact (scoped to organization).
   */
  async remove(id: string, organizationId: string) {
    const contact = await this.prisma.contact.findUnique({
      where: { id },
    });
    if (!contact || contact.organizationId !== organizationId) {
      throw new NotFoundException('Contact not found');
    }

    await this.prisma.contact.delete({ where: { id } });
    this.logger.log(`Contact deleted: ${id} (org: ${organizationId})`);
    return { message: 'Contact deleted successfully' };
  }

  /**
   * Add a tag to a contact.
   */
  async addTag(id: string, addTagDto: AddTagDto, organizationId: string) {
    const contact = await this.prisma.contact.findUnique({
      where: { id },
    });
    if (!contact || contact.organizationId !== organizationId) {
      throw new NotFoundException('Contact not found');
    }

    // Avoid duplicate tag
    const exists = await this.prisma.contactTag.findFirst({
      where: { contactId: id, tag: addTagDto.tag },
    });
    if (exists) {
      throw new BadRequestException('Tag already exists on this contact');
    }

    const contactTag = await this.prisma.contactTag.create({
      data: { contactId: id, tag: addTagDto.tag, organizationId },
    });

    return contactTag;
  }

  /**
   * Remove a tag from a contact.
   */
  async removeTag(id: string, tag: string, organizationId: string) {
    const contact = await this.prisma.contact.findUnique({
      where: { id },
    });
    if (!contact || contact.organizationId !== organizationId) {
      throw new NotFoundException('Contact not found');
    }

    await this.prisma.contactTag.deleteMany({
      where: { contactId: id, tag },
    });

    return { message: 'Tag removed successfully' };
  }

  /**
   * Get all tags used within an organization.
   */
  async getTags(organizationId: string) {
    const tags = await this.prisma.contactTag.findMany({
      where: { organizationId },
      select: { tag: true },
      distinct: ['tag'],
      orderBy: { tag: 'asc' },
    });
    return tags.map((t) => t.tag);
  }
}
