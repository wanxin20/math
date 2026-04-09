import { IsArray, ValidateNested, IsString, IsNotEmpty, IsNumber, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class ScoringCriteriaItemDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumber()
  @Min(1)
  maxScore: number;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @IsOptional()
  weight?: number;
}

export class UpdateScoringCriteriaDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ScoringCriteriaItemDto)
  criteria: ScoringCriteriaItemDto[];
}
