import {
  IsString,
  IsOptional,
  IsArray,
  ValidateNested,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';

export class WorkflowNodeDto {
  @IsString()
  type: string; // trigger, action, condition, delay, webhook

  @IsString()
  nodeType: string; // send_email, add_tag, update_contact, assign_lead, wait, condition_if, etc.

  @IsOptional()
  @Type(() => Object)
  config?: Record<string, unknown>;

  @IsOptional()
  positionX?: number;

  @IsOptional()
  positionY?: number;
}

export class CreateWorkflowDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  triggerType: string;

  @IsOptional()
  @Type(() => Object)
  triggerConfig?: Record<string, unknown>;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkflowNodeDto)
  nodes: WorkflowNodeDto[];

  @IsOptional()
  isActive?: boolean;

  @IsUUID()
  createdById: string;
}
