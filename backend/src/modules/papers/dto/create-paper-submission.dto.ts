import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsNumber, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class SubmissionFileItemDto {
  @ApiProperty({ description: '文件名' })
  @IsString()
  fileName: string;

  @ApiProperty({ description: '文件URL' })
  @IsString()
  fileUrl: string;

  @ApiPropertyOptional({ description: '文件大小（字节）' })
  @IsNumber()
  @IsOptional()
  size?: number;

  @ApiPropertyOptional({ description: 'MIME 类型' })
  @IsString()
  @IsOptional()
  mimetype?: string;
}

export class CreatePaperSubmissionDto {
  @ApiProperty({ description: '报名记录ID', example: 1 })
  @IsNumber()
  registrationId: number;

  @ApiProperty({ description: '论文标题', example: '基于AI的教学方法创新研究' })
  @IsString()
  @IsNotEmpty()
  paperTitle: string;

  @ApiPropertyOptional({ description: '论文摘要' })
  @IsString()
  @IsOptional()
  paperAbstract?: string;

  @ApiPropertyOptional({ description: '关键词', example: 'AI,教学,创新' })
  @IsString()
  @IsOptional()
  paperKeywords?: string;

  /** 单文件（兼容旧版）：与 submissionFiles 二选一 */
  @ApiPropertyOptional({ description: '文件名（单文件时使用）', example: 'paper.pdf' })
  @IsString()
  @IsOptional()
  submissionFileName?: string;

  @ApiPropertyOptional({ description: '文件URL（单文件时使用）', example: '/uploads/papers/paper.pdf' })
  @IsString()
  @IsOptional()
  submissionFileUrl?: string;

  @ApiPropertyOptional({ description: '文件大小（字节）' })
  @IsNumber()
  @IsOptional()
  submissionFileSize?: number;

  @ApiPropertyOptional({ description: '文件类型', example: 'pdf' })
  @IsString()
  @IsOptional()
  submissionFileType?: string;

  /** 多文件：优先使用；每项包含 fileName, fileUrl, size?, mimetype? */
  @ApiPropertyOptional({ description: '多文件列表', type: [SubmissionFileItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SubmissionFileItemDto)
  @IsOptional()
  submissionFiles?: SubmissionFileItemDto[];

  @ApiPropertyOptional({ description: '研究领域', example: '教学方法' })
  @IsString()
  @IsOptional()
  researchField?: string;
}
