import { IsString, IsOptional, IsInt, IsDecimal, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateLeadDto {
  @IsString()
  @IsOptional()
  status?: string;

  @IsInt()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  score?: number;

  @IsString()
  @IsOptional()
  source?: string;

  @IsDecimal()
  @IsOptional()
  @Type(() => Number)
  value?: number;
}
