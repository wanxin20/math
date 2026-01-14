import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
  UseGuards,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { ResourcesService } from './resources.service';
import { Public } from '@/common/decorators/public.decorator';
import { PaginationDto } from '@/common/dto/pagination.dto';
import { CreateResourceDto } from './dto/create-resource.dto';
import { UpdateResourceDto } from './dto/update-resource.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { AdminGuard } from '@/common/guards/admin.guard';

@ApiTags('Resources')
@Controller('resources')
export class ResourcesController {
  constructor(private readonly resourcesService: ResourcesService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: '获取资源列表' })
  @ApiQuery({ name: 'category', required: false, description: '资源分类' })
  async findAll(@Query() paginationDto: PaginationDto, @Query('category') category?: string) {
    return this.resourcesService.findAll(paginationDto, category);
  }

  @Get(':id/download')
  @Public()
  @ApiOperation({ summary: '下载资源文件' })
  async downloadFile(
    @Param('id', ParseIntPipe) id: number,
    @Res() res: Response,
  ) {
    const resource = await this.resourcesService.findOne(id);
    
    // 增加下载次数（异步执行，不阻塞下载）
    this.resourcesService.incrementDownloadCount(id).catch(err => 
      console.error('Failed to increment download count:', err)
    );
    
    // 重定向到实际的文件URL
    // 如果fileUrl是相对路径（如 /uploads/files/xxx.pdf），浏览器会自动拼接当前域名
    // 如果是完整URL（http://...），则直接重定向
    res.redirect(resource.fileUrl);
  }

  @Post(':id/download')
  @Public()
  @ApiOperation({ summary: '记录资源下载（增加下载次数）' })
  async incrementDownload(@Param('id', ParseIntPipe) id: number) {
    await this.resourcesService.incrementDownloadCount(id);
    return { success: true, message: '下载次数已增加' };
  }

  // 以下是管理员专用接口
  @Get('admin/list')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '管理员：获取所有资源列表' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  async getAllResources(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('search') search?: string,
  ) {
    return this.resourcesService.findAllForAdmin(page, limit, search);
  }

  @Get('admin/:id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '管理员：获取资源详情' })
  async getResource(@Param('id', ParseIntPipe) id: number) {
    return this.resourcesService.findOne(id);
  }

  @Post('admin')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '管理员：创建资源' })
  async createResource(@Body() createResourceDto: CreateResourceDto) {
    return this.resourcesService.create(createResourceDto);
  }

  @Patch('admin/:id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '管理员：更新资源' })
  async updateResource(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateResourceDto: UpdateResourceDto,
  ) {
    return this.resourcesService.update(id, updateResourceDto);
  }

  @Delete('admin/:id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '管理员：删除资源' })
  async deleteResource(@Param('id', ParseIntPipe) id: number) {
    await this.resourcesService.remove(id);
    return { message: '资源已删除' };
  }
}
