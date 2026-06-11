import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { PaginationDto } from '@/common/dto/pagination.dto';

/**
 * 新闻列表查询参数（公开列表与管理员列表共用）。
 * 全局 ValidationPipe 开启了 forbidNonWhitelisted，
 * 额外的 query 参数必须在 DTO 中声明，否则会被 400 拒绝。
 */
export class NewsListQueryDto extends PaginationDto {
  @ApiPropertyOptional({
    description: '类型过滤，逗号分隔（如 news 或 notice,announcement,update）',
  })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional({ description: '标题模糊搜索' })
  @IsOptional()
  @IsString()
  search?: string;
}
