import {
  IsString,
  IsOptional,
  IsEnum,
  IsDateString,
  IsUUID,
} from 'class-validator';

export class CreateCampaignDto {
  @IsString()
  name: string;

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
