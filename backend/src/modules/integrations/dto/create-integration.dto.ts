import {
  IsString,
  IsOptional,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateIntegrationDto {
  @IsString()
  provider: string;

  @IsString()
  name: string;

  @IsOptional()
  @Type(() => Object)
  config?: Record<string, unknown>;

  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  isActive?: boolean;
}
