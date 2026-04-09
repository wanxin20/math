import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsEnum, IsDateString, IsArray, ValidateNested, Allow } from 'class-validator';
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

  @ApiPropertyOptional({ description: '论文类型' })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiPropertyOptional({ description: '报名费用' })
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

  @ApiPropertyOptional({ description: '赛题附件URL（Word/PDF等）' })
  @IsString()
  @IsOptional()
  problemAttachmentUrl?: string;

  @ApiPropertyOptional({ description: '赛题附件原始文件名' })
  @IsString()
  @IsOptional()
  problemAttachmentName?: string;

  @ApiPropertyOptional({ description: '竞赛组最少成员数' })
  @IsNumber()
  @IsOptional()
  minTeamSize?: number | null;

  @ApiPropertyOptional({ description: '竞赛组最多成员数' })
  @IsNumber()
  @IsOptional()
  maxTeamSize?: number | null;

  @ApiPropertyOptional({ description: '评分标准 JSON' })
  @IsOptional()
  @Allow()
  scoringCriteria?: Array<{ name: string; maxScore: number; description?: string; weight?: number }> | null;
}
