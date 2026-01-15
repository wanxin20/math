import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsEnum } from 'class-validator';
import { NewsType, NewsPriority } from '../entities/news-announcement.entity';

export class CreateNewsDto {
  @ApiProperty({ description: '公告标题', example: '2024年度教师竞赛活动正式启动' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ description: '公告内容' })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiPropertyOptional({ description: '摘要' })
  @IsString()
  @IsOptional()
  summary?: string;

  @ApiPropertyOptional({ description: '公告类型', enum: NewsType })
  @IsEnum(NewsType)
  @IsOptional()
  type?: NewsType;

  @ApiPropertyOptional({ description: '优先级', enum: NewsPriority })
  @IsEnum(NewsPriority)
  @IsOptional()
  priority?: NewsPriority;

  @ApiPropertyOptional({ description: '是否发布' })
  @IsBoolean()
  @IsOptional()
  isPublished?: boolean;

  @ApiPropertyOptional({ description: '发布日期' })
  @IsString()
  @IsOptional()
  publishDate?: string;
}
