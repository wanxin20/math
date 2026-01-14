import { Controller, Get, Param, Query, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { NewsService } from './news.service';
import { Public } from '@/common/decorators/public.decorator';
import { PaginationDto } from '@/common/dto/pagination.dto';

@ApiTags('News')
@Controller('news')
export class NewsController {
  constructor(private readonly newsService: NewsService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: '获取已发布的新闻列表' })
  async findPublished(@Query() paginationDto: PaginationDto) {
    return this.newsService.findPublished(paginationDto);
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: '获取新闻详情' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.newsService.findOne(id);
  }
}
