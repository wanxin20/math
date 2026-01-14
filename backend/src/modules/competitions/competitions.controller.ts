import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { CompetitionsService } from './competitions.service';
import { CreateCompetitionDto } from './dto/create-competition.dto';
import { UpdateCompetitionDto } from './dto/update-competition.dto';
import { Public } from '@/common/decorators/public.decorator';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { PaginationDto } from '@/common/dto/pagination.dto';
import { CompetitionStatus } from '@/common/enums/competition-status.enum';

@ApiTags('Competitions')
@Controller('competitions')
export class CompetitionsController {
  constructor(private readonly competitionsService: CompetitionsService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: '获取竞赛列表（支持分页和筛选）' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, enum: CompetitionStatus })
  @ApiQuery({ name: 'category', required: false })
  @ApiQuery({ name: 'search', required: false })
  async findAll(
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
    @Query('status') status?: CompetitionStatus,
    @Query('category') category?: string,
    @Query('search') search?: string,
  ) {
    const paginationDto: PaginationDto = {
      page: page || 1,
      pageSize: pageSize || 10,
    };
    return this.competitionsService.findAll(paginationDto, status, category, search);
  }

  @Get('open')
  @Public()
  @ApiOperation({ summary: '获取所有开放报名的竞赛' })
  async findOpenCompetitions() {
    return this.competitionsService.findOpenCompetitions();
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: '获取竞赛详情' })
  async findOne(@Param('id') id: string) {
    return this.competitionsService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '创建竞赛（管理员）' })
  async create(@Body() createCompetitionDto: CreateCompetitionDto) {
    return this.competitionsService.create(createCompetitionDto);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '更新竞赛（管理员）' })
  async update(
    @Param('id') id: string,
    @Body() updateCompetitionDto: UpdateCompetitionDto,
  ) {
    return this.competitionsService.update(id, updateCompetitionDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '删除竞赛（管理员）' })
  async remove(@Param('id') id: string) {
    return this.competitionsService.remove(id);
  }
}
