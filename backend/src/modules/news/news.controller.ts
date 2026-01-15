import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { NewsService } from './news.service';
import { Public } from '@/common/decorators/public.decorator';
import { PaginationDto } from '@/common/dto/pagination.dto';
import { CreateNewsDto } from './dto/create-news.dto';
import { UpdateNewsDto } from './dto/update-news.dto';
import { AdminGuard } from '@/common/guards/admin.guard';
import { CurrentUser } from '@/common/decorators/user.decorator';

@ApiTags('News')
@Controller('news')
export class NewsController {
  constructor(private readonly newsService: NewsService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: '获取已发布的新闻列表（公开）' })
  async findPublished(@Query() paginationDto: PaginationDto) {
    return this.newsService.findPublished(paginationDto);
  }

  @Get('admin/all')
  @UseGuards(AdminGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '管理员：获取所有新闻列表' })
  async adminFindAll(@Query() paginationDto: PaginationDto & { search?: string }) {
    return this.newsService.adminFindAll(paginationDto);
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: '获取新闻详情（公开）' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.newsService.findOne(id);
  }

  @Post()
  @UseGuards(AdminGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '管理员：创建新闻' })
  async create(
    @Body() createNewsDto: CreateNewsDto,
    @CurrentUser('userId') userId: string,
  ) {
    return this.newsService.create(createNewsDto, userId);
  }

  @Put(':id')
  @UseGuards(AdminGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '管理员：更新新闻' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateNewsDto: UpdateNewsDto,
  ) {
    return this.newsService.update(id, updateNewsDto);
  }

  @Delete(':id')
  @UseGuards(AdminGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '管理员：删除新闻' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.newsService.remove(id);
    return { message: '删除成功' };
  }

  @Post(':id/toggle-publish')
  @UseGuards(AdminGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '管理员：切换发布状态' })
  async togglePublish(@Param('id', ParseIntPipe) id: number) {
    return this.newsService.togglePublish(id);
  }
}
