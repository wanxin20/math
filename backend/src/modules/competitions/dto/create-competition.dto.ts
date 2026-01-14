import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsNumber, IsOptional, IsEnum, IsDateString } from 'class-validator';
import { CompetitionStatus } from '@/common/enums/competition-status.enum';

export class CreateCompetitionDto {
  @ApiProperty({ description: '评选标题', example: '2024年度基础教育论文评选' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({ description: '评选描述' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: '评选类别', example: '基础教育' })
  @IsString()
  @IsNotEmpty()
  category: string;

  @ApiProperty({ description: '评审费用', example: 200 })
  @IsNumber()
  fee: number;

  @ApiProperty({ description: '截止日期', example: '2024-12-31' })
  @IsDateString()
  deadline: string;

  @ApiPropertyOptional({ description: '开始日期', example: '2024-06-01' })
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
