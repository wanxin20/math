import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class RejectSubmissionDto {
  @ApiPropertyOptional({ description: '退回原因（选填）', example: '论文格式不符合要求，请按照模板重新排版后上传' })
  @IsString()
  @IsOptional()
  reason?: string;
}
