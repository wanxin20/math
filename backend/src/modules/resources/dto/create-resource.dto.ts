import { IsString, IsOptional, IsBoolean, IsInt, IsUrl } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateResourceDto {
  @ApiProperty({ description: '资源名称' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: '资源描述' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: '资源类型' })
  @IsString()
  type: string;

  @ApiPropertyOptional({ description: '资源分类' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiProperty({ description: '文件URL' })
  @IsUrl({ 
    require_protocol: true,
    require_valid_protocol: true,
    protocols: ['http', 'https'],
    require_host: true,
    require_tld: false,  // 允许localhost等不带顶级域名的主机
  }, { message: 'fileUrl必须是有效的URL地址' })
  fileUrl: string;

  @ApiPropertyOptional({ description: '文件大小（字节）' })
  @IsOptional()
  @IsInt()
  fileSize?: number;

  @ApiPropertyOptional({ description: '是否公开', default: true })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @ApiPropertyOptional({ description: '排序顺序', default: 0 })
  @IsOptional()
  @IsInt()
  sortOrder?: number;
}
