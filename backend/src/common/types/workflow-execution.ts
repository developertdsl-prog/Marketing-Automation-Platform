export type WorkflowExecutionStatus =
  | 'running'
  | 'completed'
  | 'failed'
  | 'cancelled';

export type WorkflowNodeType =
  | 'trigger'
  | 'action'
  | 'condition'
  | 'delay'
  | 'webhook';

export type WorkflowTriggerType =
  | 'contact_created'
  | 'form_submission'
  | 'tag_added'
  | 'lead_status_changed'
  | 'campaign_event';

export type WorkflowActionType =
  | 'send_email'
  | 'add_tag'
  | 'update_contact'
  | 'assign_lead'
  | 'wait'
  | 'webhook'
  | 'update_lead_status';

export type WorkflowConditionType =
  | 'contact_attribute'
  | 'tag'
  | 'lead_score'
  | 'campaign_engagement';
