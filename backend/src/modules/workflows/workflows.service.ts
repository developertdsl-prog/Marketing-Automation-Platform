import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateWorkflowDto } from './dto/create-workflow.dto';
import { UpdateWorkflowDto } from './dto/update-workflow.dto';
import { QueryWorkflowDto } from './dto/query-workflow.dto';
import { Prisma } from '@prisma/client';

type InputJsonValue = Prisma.InputJsonValue;

@Injectable()
export class WorkflowsService {
  private readonly logger = new Logger(WorkflowsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new automation workflow.
   */
  async create(createWorkflowDto: CreateWorkflowDto, organizationId: string) {
    const { name, description, triggerType, triggerConfig, nodes, isActive } =
      createWorkflowDto;

    // Validate that there is at least one trigger node
    const hasTrigger = nodes?.some((n) => n.type === 'trigger');
    if (!hasTrigger) {
      throw new BadRequestException('Workflow must have at least one trigger node');
    }

    const workflow = await this.prisma.automationWorkflow.create({
      data: {
        name,
        description,
        organizationId,
        triggerType,
        triggerConfig: (triggerConfig || {}) as unknown as InputJsonValue,
        isActive: isActive ?? false,
        createdById: createWorkflowDto.createdById,
        nodes: {
          create: nodes?.map((node, index) => ({
            type: node.type,
            nodeType: node.nodeType,
            config: (node.config || {}) as unknown as InputJsonValue,
            positionX: node.positionX ?? 0,
            positionY: node.positionY ?? 0,
            order: index,
          })) || [],
        },
      },
      include: {
        nodes: { orderBy: { order: 'asc' } },
      },
    });

    this.logger.log(
      `Workflow created: ${workflow.id} (org: ${organizationId})`,
    );
    return workflow;
  }

  /**
   * List workflows for an organization with filtering and pagination.
   */
  async findAll(organizationId: string, query: QueryWorkflowDto) {
    const { page = 1, limit = 20, search, status, isActive } = query;
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

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    const [workflows, total] = await this.prisma.$transaction([
      this.prisma.automationWorkflow.findMany({
        where,
        skip,
        take,
        orderBy: { updatedAt: 'desc' },
        include: {
          nodes: { orderBy: { order: 'asc' } },
          _count: { select: { executions: true } },
          createdBy: { select: { id: true, email: true, firstName: true, lastName: true } },
        },
      }),
      this.prisma.automationWorkflow.count({ where }),
    ]);

    return {
      data: workflows,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get a single workflow by ID (scoped to organization).
   */
  async findOne(id: string, organizationId: string) {
    const workflow = await this.prisma.automationWorkflow.findUnique({
      where: { id },
      include: {
        nodes: { orderBy: { order: 'asc' } },
        executions: {
          orderBy: { startedAt: 'desc' },
          take: 50,
          include: { contact: { select: { id: true, email: true, firstName: true, lastName: true } } },
        },
        createdBy: { select: { id: true, email: true } },
      },
    });

    if (!workflow || workflow.organizationId !== organizationId) {
      throw new NotFoundException('Workflow not found');
    }

    return workflow;
  }

  /**
   * Update a workflow (scoped to organization).
   */
  async update(
    id: string,
    updateWorkflowDto: UpdateWorkflowDto,
    organizationId: string,
  ) {
    const { nodes, isActive, ...rest } = updateWorkflowDto;

    const workflow = await this.prisma.automationWorkflow.findUnique({
      where: { id },
    });
    if (!workflow || workflow.organizationId !== organizationId) {
      throw new NotFoundException('Workflow not found');
    }

    // Cannot edit active workflows — must deactivate first
    if (workflow.isActive && isActive !== false) {
      throw new BadRequestException(
        'Cannot edit an active workflow. Deactivate it first.',
      );
    }

    // Handle node replacement
    if (nodes !== undefined) {
      await this.prisma.workflowNode.deleteMany({
        where: { workflowId: id },
      });
    }

    const updated = await this.prisma.automationWorkflow.update({
      where: { id },
      data: {
        ...rest,
        isActive: isActive ?? workflow.isActive,
        triggerConfig: (rest.triggerConfig || {}) as unknown as InputJsonValue,
        nodes: nodes
          ? {
              create: nodes.map((node, index) => ({
                type: node.type,
                nodeType: node.nodeType,
                config: (node.config || {}) as unknown as InputJsonValue,
                positionX: node.positionX ?? 0,
                positionY: node.positionY ?? 0,
                order: index,
              })),
            }
          : undefined,
      },
      include: {
        nodes: { orderBy: { order: 'asc' } },
      },
    });

    this.logger.log(`Workflow updated: ${id} (org: ${organizationId})`);
    return updated;
  }

  /**
   * Delete a workflow (scoped to organization).
   */
  async remove(id: string, organizationId: string) {
    const workflow = await this.prisma.automationWorkflow.findUnique({
      where: { id },
    });
    if (!workflow || workflow.organizationId !== organizationId) {
      throw new NotFoundException('Workflow not found');
    }

    if (workflow.isActive) {
      throw new BadRequestException(
        'Cannot delete an active workflow. Deactivate it first.',
      );
    }

    await this.prisma.automationWorkflow.delete({ where: { id } });
    this.logger.log(`Workflow deleted: ${id} (org: ${organizationId})`);
    return { message: 'Workflow deleted successfully' };
  }

  /**
   * Activate a workflow.
   */
  async activate(id: string, organizationId: string) {
    const workflow = await this.prisma.automationWorkflow.findUnique({
      where: { id },
    });
    if (!workflow || workflow.organizationId !== organizationId) {
      throw new NotFoundException('Workflow not found');
    }

    const hasTrigger = await this.prisma.workflowNode.findFirst({
      where: { workflowId: id, type: 'trigger' },
    });
    if (!hasTrigger) {
      throw new BadRequestException('Cannot activate workflow without a trigger node');
    }

    const updated = await this.prisma.automationWorkflow.update({
      where: { id },
      data: { isActive: true, status: 'active' },
    });

    this.logger.log(`Workflow activated: ${id} (org: ${organizationId})`);
    return updated;
  }

  /**
   * Deactivate a workflow.
   */
  async deactivate(id: string, organizationId: string) {
    const workflow = await this.prisma.automationWorkflow.findUnique({
      where: { id },
    });
    if (!workflow || workflow.organizationId !== organizationId) {
      throw new NotFoundException('Workflow not found');
    }

    const updated = await this.prisma.automationWorkflow.update({
      where: { id },
      data: { isActive: false, status: 'paused' },
    });

    this.logger.log(`Workflow deactivated: ${id} (org: ${organizationId})`);
    return updated;
  }

  /**
   * Get workflow execution history.
   */
  async getExecutions(id: string, organizationId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [executions, total] = await this.prisma.$transaction([
      this.prisma.workflowExecution.findMany({
        where: { workflowId: id },
        skip,
        take: limit,
        orderBy: { startedAt: 'desc' },
        include: { contact: { select: { id: true, email: true } } },
      }),
      this.prisma.workflowExecution.count({ where: { workflowId: id } }),
    ]);

    return {
      data: executions,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get available trigger types for the workflow builder.
   */
  getTriggerTypes() {
    return [
      { key: 'contact_created', label: 'New Contact Created', description: 'Triggers when a new contact is added' },
      { key: 'form_submission', label: 'Form Submission', description: 'Triggers when a form is submitted' },
      { key: 'tag_added', label: 'Tag Added', description: 'Triggers when a tag is added to a contact' },
      { key: 'lead_status_changed', label: 'Lead Status Changed', description: 'Triggers when a lead status changes' },
      { key: 'campaign_event', label: 'Campaign Event', description: 'Triggers on campaign engagement events' },
    ];
  }

  /**
   * Get available action types for the workflow builder.
   */
  getActionTypes() {
    return [
      { key: 'send_email', label: 'Send Email', description: 'Send an email to the contact' },
      { key: 'add_tag', label: 'Add Tag', description: 'Add a tag to the contact' },
      { key: 'update_contact', label: 'Update Contact', description: 'Update contact attributes' },
      { key: 'assign_lead', label: 'Assign Lead', description: 'Assign the lead to a user/team' },
      { key: 'wait', label: 'Wait / Delay', description: 'Wait for a specified duration' },
      { key: 'webhook', label: 'Trigger Webhook', description: 'Send a webhook to an external URL' },
      { key: 'update_lead_status', label: 'Update Lead Status', description: 'Change the lead status' },
    ];
  }

  /**
   * Get available condition types for the workflow builder.
   */
  getConditionTypes() {
    return [
      { key: 'contact_attribute', label: 'Contact Attribute', description: 'Branch based on contact field values' },
      { key: 'tag', label: 'Tag', description: 'Branch based on contact tags' },
      { key: 'lead_score', label: 'Lead Score', description: 'Branch based on lead score' },
      { key: 'campaign_engagement', label: 'Campaign Engagement', description: 'Branch based on email engagement' },
    ];
  }
}
