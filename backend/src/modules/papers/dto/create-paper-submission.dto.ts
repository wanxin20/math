import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsNumber } from 'class-validator';

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

  @ApiProperty({ description: '文件名', example: 'paper.pdf' })
  @IsString()
  @IsNotEmpty()
  submissionFileName: string;

  @ApiProperty({ description: '文件URL', example: '/uploads/papers/paper.pdf' })
  @IsString()
  @IsNotEmpty()
  submissionFileUrl: string;

  @ApiPropertyOptional({ description: '文件大小（字节）' })
  @IsNumber()
  @IsOptional()
  submissionFileSize?: number;

  @ApiPropertyOptional({ description: '文件类型', example: 'pdf' })
  @IsString()
  @IsOptional()
  submissionFileType?: string;

  @ApiPropertyOptional({ description: '研究领域', example: '教学方法' })
  @IsString()
  @IsOptional()
  researchField?: string;
}
