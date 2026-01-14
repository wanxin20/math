import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsEnum, IsDateString } from 'class-validator';
import { CompetitionStatus } from '@/common/enums/competition-status.enum';

export class UpdateCompetitionDto {
  @ApiPropertyOptional({ description: '评选标题' })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({ description: '评选描述' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: '评选类别' })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiPropertyOptional({ description: '评审费用' })
  @IsNumber()
  @IsOptional()
  fee?: number;

  @ApiPropertyOptional({ description: '截止日期' })
  @IsDateString()
  @IsOptional()
  deadline?: string;

  @ApiPropertyOptional({ description: '开始日期' })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({ description: '项目状态', enum: CompetitionStatus })
  @IsEnum(CompetitionStatus)
  @IsOptional()
  status?: CompetitionStatus;

  @ApiPropertyOptional({ description: '封面图片URL' })
  @IsString()
  @IsOptional()
  coverImageUrl?: string;

  @ApiPropertyOptional({ description: '申报指南/竞赛规则' })
  @IsString()
  @IsOptional()
  guidelines?: string;

  @ApiPropertyOptional({ description: '奖项设置说明' })
  @IsString()
  @IsOptional()
  awardInfo?: string;
}
