import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../prisma/prisma.service';
import { LeadsService } from './leads.service';

const mockPrismaService = {
  contact: {
    findUnique: jest.fn(),
  },
  lead: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
};

describe('LeadsService', () => {
  let service: LeadsService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LeadsService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<LeadsService>(LeadsService);
  });

  describe('create', () => {
    const createDto = {
      contactId: 'contact-1',
      status: 'new',
      score: 50,
      source: 'website',
      value: 1000,
    };

    it('should create a lead linked to a contact', async () => {
      mockPrismaService.contact.findUnique.mockResolvedValue({
        id: 'contact-1',
        organizationId: 'org-1',
      });
      mockPrismaService.lead.findFirst.mockResolvedValue(null);
      mockPrismaService.lead.create.mockResolvedValue({
        id: 'lead-1',
        contactId: 'contact-1',
        organizationId: 'org-1',
        status: 'new',
        score: 50,
      });

      const result = await service.create(createDto, 'org-1');

      expect(mockPrismaService.lead.create).toHaveBeenCalledWith({
        data: {
          contactId: 'contact-1',
          organizationId: 'org-1',
          status: 'new',
          score: 50,
          source: 'website',
          value: 1000,
        },
        include: { contact: true, team: true, owner: true },
      });
      expect(result.id).toBe('lead-1');
    });

    it('should throw BadRequestException if lead already exists for contact', async () => {
      mockPrismaService.contact.findUnique.mockResolvedValue({
        id: 'contact-1',
        organizationId: 'org-1',
      });
      mockPrismaService.lead.findFirst.mockResolvedValue({
        id: 'existing-lead',
        contactId: 'contact-1',
      });

      await expect(service.create(createDto, 'org-1')).rejects.toThrow(
        'A lead already exists for this contact',
      );
    });
  });

  describe('assign', () => {
    it('should assign a lead to a team and owner', async () => {
      mockPrismaService.lead.findUnique.mockResolvedValue({
        id: 'lead-1',
        organizationId: 'org-1',
      });
      mockPrismaService.lead.update.mockResolvedValue({
        id: 'lead-1',
        teamId: 'team-1',
        ownerId: 'user-1',
      });

      const result = await service.assign('lead-1', 'org-1', 'team-1', 'user-1');

      expect(mockPrismaService.lead.update).toHaveBeenCalledWith({
        where: { id: 'lead-1' },
        data: { teamId: 'team-1', ownerId: 'user-1' },
        include: { contact: true, team: true, owner: true },
      });
    });
  });
});
