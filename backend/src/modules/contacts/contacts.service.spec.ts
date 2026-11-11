import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../prisma/prisma.service';
import { ContactsService } from './contacts.service';

const mockPrismaService = {
  contact: {
    findUnique: jest.fn(),
    create: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  contactTag: {
    findFirst: jest.fn(),
    deleteMany: jest.fn(),
    createMany: jest.fn(),
    create: jest.fn(),
    findMany: jest.fn(),
  },
  $transaction: jest.fn(([call1, call2]) => Promise.all([call1, call2])),
};

describe('ContactsService', () => {
  let service: ContactsService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContactsService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<ContactsService>(ContactsService);
  });

  describe('create', () => {
    const createDto = {
      email: 'contact@example.com',
      firstName: 'Jane',
      lastName: 'Smith',
      tags: ['vip', 'newsletter'],
    };

    it('should create a contact with tags', async () => {
      mockPrismaService.contact.findUnique.mockResolvedValue(null);
      mockPrismaService.contact.create.mockResolvedValue({
        id: 'contact-1',
        email: 'contact@example.com',
        firstName: 'Jane',
        lastName: 'Smith',
        organizationId: 'org-1',
        tags: [{ id: 'tag-1', tag: 'vip' }, { id: 'tag-2', tag: 'newsletter' }],
      });

      const result = await service.create(createDto, 'org-1');

      expect(mockPrismaService.contact.create).toHaveBeenCalledWith({
        data: {
          email: 'contact@example.com',
          firstName: 'Jane',
          lastName: 'Smith',
          organizationId: 'org-1',
          tags: {
            create: [
              { tag: 'vip', organizationId: 'org-1' },
              { tag: 'newsletter', organizationId: 'org-1' },
            ],
          },
        },
        include: { tags: true, segments: true },
      });
      expect(result.email).toBe('contact@example.com');
    });

    it('should throw BadRequestException for duplicate email', async () => {
      mockPrismaService.contact.findUnique.mockResolvedValue({
        id: 'existing',
        email: 'contact@example.com',
        organizationId: 'org-1',
      });

      await expect(service.create(createDto, 'org-1')).rejects.toThrow(
        'Contact with this email already exists',
      );
    });
  });

  describe('findAll', () => {
    it('should return paginated contacts', async () => {
      mockPrismaService.contact.findMany.mockResolvedValue([
        { id: 'c1', email: 'a@test.com', organizationId: 'org-1' },
      ]);
      mockPrismaService.contact.count.mockResolvedValue(1);

      const result = await service.findAll('org-1', { page: 1, limit: 20 });

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
      expect(result.totalPages).toBe(1);
    });
  });

  describe('addTag', () => {
    it('should add a tag to a contact', async () => {
      mockPrismaService.contact.findUnique.mockResolvedValue({
        id: 'contact-1',
        organizationId: 'org-1',
      });
      mockPrismaService.contactTag.findFirst.mockResolvedValue(null);
      mockPrismaService.contactTag.create.mockResolvedValue({
        id: 'tag-1',
        contactId: 'contact-1',
        tag: 'new-tag',
        organizationId: 'org-1',
      });

      const result = await service.addTag(
        'contact-1',
        { tag: 'new-tag' },
        'org-1',
      );

      expect(mockPrismaService.contactTag.create).toHaveBeenCalledWith({
        data: { contactId: 'contact-1', tag: 'new-tag', organizationId: 'org-1' },
      });
      expect(result.tag).toBe('new-tag');
    });

    it('should throw BadRequestException for duplicate tag', async () => {
      mockPrismaService.contact.findUnique.mockResolvedValue({
        id: 'contact-1',
        organizationId: 'org-1',
      });
      mockPrismaService.contactTag.findFirst.mockResolvedValue({
        id: 'tag-1',
        contactId: 'contact-1',
        tag: 'existing-tag',
      });

      await expect(
        service.addTag('contact-1', { tag: 'existing-tag' }, 'org-1'),
      ).rejects.toThrow('Tag already exists on this contact');
    });
  });

  describe('remove', () => {
    it('should delete a contact', async () => {
      mockPrismaService.contact.findUnique.mockResolvedValue({
        id: 'contact-1',
        organizationId: 'org-1',
      });
      mockPrismaService.contact.delete.mockResolvedValue({ id: 'contact-1' });

      const result = await service.remove('contact-1', 'org-1');

      expect(mockPrismaService.contact.delete).toHaveBeenCalledWith({
        where: { id: 'contact-1' },
      });
      expect(result.message).toBe('Contact deleted successfully');
    });

    it('should throw NotFoundException for non-existent contact', async () => {
      mockPrismaService.contact.findUnique.mockResolvedValue(null);

      await expect(service.remove('contact-1', 'org-1')).rejects.toThrow(
        'Contact not found',
      );
    });
  });
});
