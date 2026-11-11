import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../prisma/prisma.service';
import { EmailTemplatesService } from './email-templates.service';

const mockPrismaService = {
  emailTemplate: {
    create: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    updateMany: jest.fn(),
  },
  campaign: {
    findFirst: jest.fn(),
  },
};

describe('EmailTemplatesService', () => {
  let service: EmailTemplatesService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailTemplatesService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<EmailTemplatesService>(EmailTemplatesService);
  });

  describe('create', () => {
    const createDto = {
      name: 'Welcome Email',
      subject: 'Welcome to our platform',
      htmlContent: '<h1>Hello {{firstName}}</h1>',
      isDefault: true,
    };

    it('should create a template and unset other defaults', async () => {
      mockPrismaService.emailTemplate.updateMany.mockResolvedValue({ count: 1 });
      mockPrismaService.emailTemplate.create.mockResolvedValue({
        id: 'template-1',
        name: 'Welcome Email',
        organizationId: 'org-1',
        isDefault: true,
      });

      const result = await service.create(createDto, 'org-1');

      expect(mockPrismaService.emailTemplate.updateMany).toHaveBeenCalledWith({
        where: { organizationId: 'org-1', isDefault: true },
        data: { isDefault: false },
      });
      expect(mockPrismaService.emailTemplate.create).toHaveBeenCalledWith({
        data: {
          name: 'Welcome Email',
          subject: 'Welcome to our platform',
          htmlContent: '<h1>Hello {{firstName}}</h1>',
          textContent: undefined,
          variables: {},
          isDefault: true,
          organizationId: 'org-1',
        },
      });
      expect(result.id).toBe('template-1');
    });
  });

  describe('remove', () => {
    it('should throw BadRequestException if template is used by a campaign', async () => {
      mockPrismaService.emailTemplate.findUnique.mockResolvedValue({
        id: 'template-1',
        organizationId: 'org-1',
      });
      mockPrismaService.campaign.findFirst.mockResolvedValue({
        id: 'campaign-1',
        emailTemplateId: 'template-1',
      });

      await expect(service.remove('template-1', 'org-1')).rejects.toThrow(
        'Cannot delete template: it is used by an existing campaign',
      );
    });

    it('should delete a template not used by any campaign', async () => {
      mockPrismaService.emailTemplate.findUnique.mockResolvedValue({
        id: 'template-1',
        organizationId: 'org-1',
      });
      mockPrismaService.campaign.findFirst.mockResolvedValue(null);
      mockPrismaService.emailTemplate.delete.mockResolvedValue({ id: 'template-1' });

      const result = await service.remove('template-1', 'org-1');

      expect(mockPrismaService.emailTemplate.delete).toHaveBeenCalledWith({
        where: { id: 'template-1' },
      });
      expect(result.message).toBe('Email template deleted successfully');
    });
  });
});
