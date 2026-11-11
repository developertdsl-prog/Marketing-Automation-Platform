import {
  IsString,
  IsOptional,
  IsDateString,
  IsUUID,
} from 'class-validator';

export class UpdateCampaignDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  type?: string;

  @IsUUID()
  @IsOptional()
  emailTemplateId?: string;

  @IsUUID()
  @IsOptional()
  segmentId?: string;

  @IsDateString()
  @IsOptional()
  scheduleAt?: string;
}
