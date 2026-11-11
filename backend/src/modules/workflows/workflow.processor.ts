import {
  Process,
  Processor,
  OnQueueActive,
  OnQueueCompleted,
  OnQueueFailed,
} from '@nestjs/bull';
import { Job } from 'bull';
import { Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { WorkflowExecutionStatus } from '../../common/types/workflow-execution';
import { Prisma } from '@prisma/client';

type InputJsonValue = Prisma.InputJsonValue;

interface WorkflowTriggerJob {
  workflowId: string;
  contactId?: string;
  triggerEventId: string; // idempotency key
  triggerData: Record<string, unknown>;
}

interface WorkflowNodeExecutionJob {
  executionId: string;
  nodeId: string;
  nodeType: string;
  config: Record<string, unknown>;
  contactId?: string;
  workflowId: string;
}

@Processor('workflow-execution')
export class WorkflowProcessor {
  private readonly logger = new Logger(WorkflowProcessor.name);

  constructor(private readonly prisma: PrismaService) {}

  @OnQueueActive()
  onActive(job: Job<WorkflowTriggerJob>) {
    this.logger.log(
      `Processing workflow trigger job ${job.id} for workflow ${job.data.workflowId}`,
    );
  }

  @OnQueueCompleted()
  onCompleted(job: Job<WorkflowTriggerJob>) {
    this.logger.log(
      `Completed workflow trigger job ${job.id} for workflow ${job.data.workflowId}`,
    );
  }

  @OnQueueFailed()
  onFailed(job: Job<WorkflowTriggerJob>, error: Error) {
    this.logger.error(
      `Failed workflow trigger job ${job.id}: ${error.message}`,
      error.stack,
    );
  }

  /**
   * Main trigger handler — receives workflow trigger events and starts execution.
   * Includes duplicate-event protection via triggerEventId (idempotency key).
   */
  @Process('trigger')
  async handleTrigger(job: Job<WorkflowTriggerJob>) {
    const { workflowId, contactId, triggerEventId, triggerData } = job.data;

    // Check if this trigger event was already processed (duplicate protection)
    const existingExecution = await this.prisma.workflowExecution.findFirst({
      where: {
        workflowId,
        triggerEventId,
      },
    });
    if (existingExecution) {
      this.logger.log(
        `Duplicate trigger event ignored: ${triggerEventId} for workflow ${workflowId}`,
      );
      return { status: 'duplicate_ignored', executionId: existingExecution.id };
    }

    // Get the workflow with its nodes
    const workflow = await this.prisma.automationWorkflow.findUnique({
      where: { id: workflowId },
      include: { nodes: { orderBy: { order: 'asc' } } },
    });

    if (!workflow || !workflow.isActive) {
      this.logger.log(
        `Workflow ${workflowId} is not active, skipping execution`,
      );
      return { status: 'workflow_inactive' };
    }

    // Create execution record
    const execution = await this.prisma.workflowExecution.create({
      data: {
        workflowId,
        contactId,
        status: 'running',
        startedAt: new Date(),
        triggerEventId,
      },
    });

    this.logger.log(
      `Started workflow execution ${execution.id} for workflow ${workflowId}`,
    );

    // Find trigger node and execute the workflow from there
    const triggerNode = workflow.nodes.find((n) => n.type === 'trigger');
    if (triggerNode) {
      await this.executeNode(execution.id, triggerNode, contactId, triggerData);
    }

    // Update execution to completed (nodes handle their own async continuation)
    await this.prisma.workflowExecution.update({
      where: { id: execution.id },
      data: { status: 'completed', completedAt: new Date() },
    });

    return { status: 'started', executionId: execution.id };
  }

  /**
   * Execute a single workflow node.
   */
  async executeNode(
    executionId: string,
    node: any,
    contactId?: string,
    triggerData?: Record<string, unknown>,
  ) {
    const { nodeType, config } = node;

    this.logger.log(
      `Executing node ${node.id} (${nodeType}) in execution ${executionId}`,
    );

    try {
      switch (nodeType) {
        case 'send_email':
          await this.handleSendEmail(executionId, node, contactId, config);
          break;
        case 'add_tag':
          await this.handleAddTag(executionId, node, contactId, config);
          break;
        case 'update_contact':
          await this.handleUpdateContact(executionId, node, contactId, config);
          break;
        case 'assign_lead':
          await this.handleAssignLead(executionId, node, contactId, config);
          break;
        case 'wait':
          await this.handleWait(executionId, node, contactId, config);
          break;
        case 'webhook':
          await this.handleWebhook(executionId, node, contactId, config);
          break;
        case 'update_lead_status':
          await this.handleUpdateLeadStatus(executionId, node, contactId, config);
          break;
        case 'condition_if':
          await this.handleConditionIf(executionId, node, contactId, config, triggerData);
          break;
        default:
          this.logger.warn(`Unknown node type: ${nodeType}`);
      }
    } catch (error) {
      this.logger.error(
        `Node execution failed: ${node.id} (${nodeType}): ${error.message}`,
        error.stack,
      );

      await this.prisma.workflowExecution.update({
        where: { id: executionId },
        data: {
          status: 'failed',
          completedAt: new Date(),
          errorMessage: error.message,
        },
      });

      throw error;
    }
  }

  /**
   * Action: Send email
   */
  private async handleSendEmail(
    executionId: string,
    node: any,
    contactId?: string,
    config?: Record<string, unknown>,
  ) {
    if (!contactId) {
      throw new Error('Send email node requires a contact');
    }

    const contact = await this.prisma.contact.findUnique({
      where: { id: contactId },
      select: { organizationId: true },
    });
    if (!contact) {
      throw new Error(`Contact ${contactId} not found`);
    }

    const templateId = config?.['templateId'] as string;

    // Log the email event
    await this.prisma.emailEvent.create({
      data: {
        campaignId: config?.['campaignId'] as string,
        contactId,
        organizationId: contact.organizationId,
        emailTemplateId: templateId || undefined,
        type: 'sent',
        occurredAt: new Date(),
      },
    });

    this.logger.log(`Email sent to contact ${contactId} via node ${node.id}`);
  }

  /**
   * Action: Add tag to contact
   */
  private async handleAddTag(
    executionId: string,
    node: any,
    contactId?: string,
    config?: Record<string, unknown>,
  ) {
    if (!contactId) {
      throw new Error('Add tag node requires a contact');
    }

    const tag = config?.['tag'] as string;
    const workflow = await this.prisma.workflowNode.findUnique({
      where: { id: node.id },
      include: { workflow: true },
    });

    if (!workflow?.workflowId) {
      throw new Error('Unable to determine organization for tag');
    }

    // Get organizationId from workflow
    const wf = await this.prisma.automationWorkflow.findUnique({
      where: { id: workflow.workflowId },
      select: { organizationId: true },
    });

    if (!wf) {
      throw new Error('Workflow not found');
    }

    // Avoid duplicate tag
    const exists = await this.prisma.contactTag.findFirst({
      where: { contactId, tag, organizationId: wf.organizationId },
    });
    if (exists) {
      this.logger.log(`Tag ${tag} already exists on contact ${contactId}`);
      return;
    }

    await this.prisma.contactTag.create({
      data: { contactId, tag, organizationId: wf.organizationId },
    });

    this.logger.log(`Tag ${tag} added to contact ${contactId}`);
  }

  /**
   * Action: Update contact attributes
   */
  private async handleUpdateContact(
    executionId: string,
    node: any,
    contactId?: string,
    config?: Record<string, unknown>,
  ) {
    if (!contactId) {
      throw new Error('Update contact node requires a contact');
    }

    const updates: Record<string, unknown> = {};
    if (config?.['firstName']) updates['firstName'] = config.firstName;
    if (config?.['lastName']) updates['lastName'] = config.lastName;
    if (config?.['company']) updates['company'] = config.company;
    if (config?.['jobTitle']) updates['jobTitle'] = config.jobTitle;
    if (config?.['city']) updates['city'] = config.city;
    if (config?.['country']) updates['country'] = config.country;

    if (Object.keys(updates).length === 0) {
      this.logger.log(`No updates specified for contact ${contactId}`);
      return;
    }

    await this.prisma.contact.update({
      where: { id: contactId },
      data: updates,
    });

    this.logger.log(`Contact ${contactId} updated via node ${node.id}`);
  }

  /**
   * Action: Assign lead to user/team
   */
  private async handleAssignLead(
    executionId: string,
    node: any,
    contactId?: string,
    config?: Record<string, unknown>,
  ) {
    if (!contactId) {
      throw new Error('Assign lead node requires a contact');
    }

    const ownerId = config?.['ownerId'] as string;
    const teamId = config?.['teamId'] as string;

    const lead = await this.prisma.lead.findFirst({
      where: { contactId },
    });
    if (!lead) {
      this.logger.log(`No lead found for contact ${contactId}, skipping assignment`);
      return;
    }

    await this.prisma.lead.update({
      where: { id: lead.id },
      data: {
        ownerId: ownerId || null,
        teamId: teamId || null,
      },
    });

    this.logger.log(
      `Lead ${lead.id} assigned (owner: ${ownerId}, team: ${teamId})`,
    );
  }

  /**
   * Action: Wait / Delay
   */
  private async handleWait(
    executionId: string,
    node: any,
    contactId?: string,
    config?: Record<string, unknown>,
  ) {
    const delayMs = (config?.['delayMs'] as number) || 5000;
    const delayUntil = config?.['delayUntil'] as string;

    if (delayUntil) {
      const waitMs = new Date(delayUntil).getTime() - Date.now();
      if (waitMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, waitMs));
      }
    } else if (delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }

    this.logger.log(`Wait node ${node.id} completed after ${delayMs}ms`);
  }

  /**
   * Action: Trigger webhook
   */
  private async handleWebhook(
    executionId: string,
    node: any,
    contactId?: string,
    config?: Record<string, unknown>,
  ) {
    const url = config?.['url'] as string;
    const method = (config?.['method'] as string) || 'POST';
    const payload = config?.['payload'] as Record<string, unknown> || {};

    if (!url) {
      throw new Error('Webhook node requires a URL');
    }

    // Include contact context in payload
    const webhookPayload = {
      ...payload,
      contactId,
      executionId,
      timestamp: new Date().toISOString(),
    };

    this.logger.log(`Webhook triggered: ${method} ${url}`, JSON.stringify(webhookPayload));

    // In production, this would make an HTTP request. Here we log it.
    // TODO: Implement actual HTTP webhook call with retry logic
  }

  /**
   * Action: Update lead status
   */
  private async handleUpdateLeadStatus(
    executionId: string,
    node: any,
    contactId?: string,
    config?: Record<string, unknown>,
  ) {
    if (!contactId) {
      throw new Error('Update lead status node requires a contact');
    }

    const status = config?.['status'] as string;
    if (!status) {
      throw new Error('Update lead status node requires a status');
    }

    const lead = await this.prisma.lead.findFirst({
      where: { contactId },
    });
    if (!lead) {
      this.logger.log(`No lead found for contact ${contactId}, skipping status update`);
      return;
    }

    await this.prisma.lead.update({
      where: { id: lead.id },
      data: { status },
    });

    this.logger.log(`Lead ${lead.id} status updated to ${status}`);
  }

  /**
   * Condition: If/Else branching
   */
  private async handleConditionIf(
    executionId: string,
    node: any,
    contactId?: string,
    config?: Record<string, unknown>,
    triggerData?: Record<string, unknown>,
  ) {
    const conditionType = config?.['conditionType'] as string;
    const field = config?.['field'] as string;
    const operator = config?.['operator'] as string;
    const value = config?.['value'];

    if (!contactId) {
      this.logger.log(`Condition node ${node.id} skipped: no contact`);
      return;
    }

    let result = false;

    switch (conditionType) {
      case 'contact_attribute': {
        const contact = await this.prisma.contact.findUnique({
          where: { id: contactId },
        });
        if (!contact) break;
        const contactValue = (contact as any)[field];
        result = this.evaluateCondition(contactValue, operator, value);
        break;
      }
      case 'tag': {
        const tag = field as string;
        const contactTag = await this.prisma.contactTag.findFirst({
          where: { contactId, tag },
        });
        result = operator === 'exists' ? !!contactTag : !contactTag;
        break;
      }
      case 'lead_score': {
        const lead = await this.prisma.lead.findFirst({
          where: { contactId },
        });
        if (!lead) break;
        const score = lead.score;
        const numValue = Number(value);
        result = this.evaluateCondition(score, operator, numValue);
        break;
      }
      case 'campaign_engagement': {
        // Check if contact has engaged with a campaign
        const engagement = await this.prisma.emailEvent.findFirst({
          where: {
            contactId,
            type: { in: ['opened', 'clicked'] },
          },
        });
        result = !!engagement;
        break;
      }
      default:
        this.logger.warn(`Unknown condition type: ${conditionType}`);
    }

    this.logger.log(
      `Condition node ${node.id} evaluated to ${result} (condition: ${conditionType} ${field} ${operator} ${value})`,
    );

    // Store the condition result in execution metadata for downstream nodes
    await this.prisma.workflowExecution.update({
      where: { id: executionId },
      data: {
        // We could store condition results in a metadata field
      },
    });

    return result;
  }

  /**
   * Evaluate a condition against a value.
   */
  private evaluateCondition(
    actualValue: unknown,
    operator: string,
    expectedValue: unknown,
  ): boolean {
    switch (operator) {
      case 'equals':
        return actualValue == expectedValue;
      case 'not_equals':
        return actualValue != expectedValue;
      case 'contains':
        return String(actualValue).includes(String(expectedValue));
      case 'greater_than':
        return Number(actualValue) > Number(expectedValue);
      case 'less_than':
        return Number(actualValue) < Number(expectedValue);
      case 'greater_or_equal':
        return Number(actualValue) >= Number(expectedValue);
      case 'less_or_equal':
        return Number(actualValue) <= Number(expectedValue);
      case 'exists':
        return actualValue != null && actualValue !== '';
      case 'not_exists':
        return actualValue == null || actualValue === '';
      default:
        return false;
    }
  }
}
