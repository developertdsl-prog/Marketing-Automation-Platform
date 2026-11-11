import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../prisma/prisma.service';
import { CampaignsService } from './campaigns.service';

const mockPrismaService = {
  emailTemplate: {
    findUnique: jest.fn(),
  },
  contactSegment: {
    findUnique: jest.fn(),
  },
  campaign: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
};

describe('CampaignsService', () => {
  let service: CampaignsService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CampaignsService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<CampaignsService>(CampaignsService);
  });

  describe('create', () => {
    const createDto = {
      name: 'Summer Campaign',
      type: 'email',
      emailTemplateId: 'template-1',
      scheduleAt: '2026-12-01T10:00:00Z',
    };

    it('should create a campaign with template and schedule', async () => {
      mockPrismaService.emailTemplate.findUnique.mockResolvedValue({
        id: 'template-1',
        organizationId: 'org-1',
      });
      mockPrismaService.campaign.create.mockResolvedValue({
        id: 'campaign-1',
        name: 'Summer Campaign',
        organizationId: 'org-1',
        status: 'scheduled',
      });

      const result = await service.create(
        createDto,
        'org-1',
        'user-1',
      );

      expect(mockPrismaService.campaign.create).toHaveBeenCalledWith({
        data: {
          name: 'Summer Campaign',
          type: 'email',
          organizationId: 'org-1',
          emailTemplateId: 'template-1',
          createdById: 'user-1',
          scheduleAt: new Date('2026-12-01T10:00:00Z'),
          status: 'scheduled',
        },
        include: { emailTemplate: true, segment: true, _count: { select: { recipients: true, emailEvents: true } } },
      });
      expect(result.id).toBe('campaign-1');
    });

    it('should throw NotFoundException if template not found', async () => {
      mockPrismaService.emailTemplate.findUnique.mockResolvedValue(null);

      await expect(
        service.create(createDto, 'org-1', 'user-1'),
      ).rejects.toThrow('Email template not found');
    });
  });

  describe('launch', () => {
    it('should launch a draft campaign', async () => {
      mockPrismaService.campaign.findUnique.mockResolvedValue({
        id: 'campaign-1',
        organizationId: 'org-1',
        status: 'draft',
        emailTemplate: { id: 'template-1', name: 'Welcome' },
      });
      mockPrismaService.campaign.update.mockResolvedValue({
        id: 'campaign-1',
        status: 'active',
        startedAt: new Date(),
      });

      const result = await service.launch('campaign-1', 'org-1', 'user-1');

      expect(mockPrismaService.campaign.update).toHaveBeenCalledWith({
        where: { id: 'campaign-1' },
        data: { status: 'active', startedAt: expect.any(Date) },
      });
      expect(result.campaign.status).toBe('active');
    });

    it('should throw BadRequestException if campaign has no template', async () => {
      mockPrismaService.campaign.findUnique.mockResolvedValue({
        id: 'campaign-1',
        organizationId: 'org-1',
        status: 'draft',
        emailTemplate: null,
      });

      await expect(
        service.launch('campaign-1', 'org-1', 'user-1'),
      ).rejects.toThrow('Campaign must have an email template');
    });
  });

  describe('pause', () => {
    it('should pause an active campaign', async () => {
      mockPrismaService.campaign.findUnique.mockResolvedValue({
        id: 'campaign-1',
        organizationId: 'org-1',
        status: 'active',
      });
      mockPrismaService.campaign.update.mockResolvedValue({
        id: 'campaign-1',
        status: 'paused',
      });

      const result = await service.pause('campaign-1', 'org-1');

      expect(result.status).toBe('paused');
    });

    it('should throw BadRequestException if campaign is not active', async () => {
      mockPrismaService.campaign.findUnique.mockResolvedValue({
        id: 'campaign-1',
        organizationId: 'org-1',
        status: 'draft',
      });

      await expect(service.pause('campaign-1', 'org-1')).rejects.toThrow(
        'Only active campaigns can be paused',
      );
    });
  });
});
