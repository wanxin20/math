import { IsNumber, IsNotEmpty, IsOptional, IsString, IsArray, ValidateNested, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CriteriaScoreDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumber()
  @Min(0)
  score: number;

  @IsNumber()
  @Min(0)
  maxScore: number;
}

export class SubmitScoreDto {
  @IsNumber()
  @IsNotEmpty({ message: '报名记录ID不能为空' })
  registrationId: number;

  @IsString()
  @IsNotEmpty({ message: '竞赛ID不能为空' })
  competitionId: string;

  @IsNumber()
  @Min(0, { message: '总分不能为负数' })
  totalScore: number;

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CriteriaScoreDto)
  criteriaScores?: CriteriaScoreDto[];

  @IsString()
  @IsOptional()
  comments?: string;
}
