import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  UseGuards,
  ParseIntPipe,
  StreamableFile,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ScientistService } from './scientist.service';
import {
  CreateScientistApplicationDto,
  UpdateScientistApplicationDto,
} from './dto/scientist-application.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { AdminGuard } from '@/common/guards/admin.guard';
import { CurrentUser } from '@/common/decorators/user.decorator';

@ApiTags('Scientist')
@Controller('scientist')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class ScientistController {
  constructor(private readonly scientistService: ScientistService) {}

  @Post('application')
  @ApiOperation({ summary: '提交青年科学家奖申报（已存在则覆盖）' })
  create(
    @CurrentUser('userId') userId: string,
    @Body() dto: CreateScientistApplicationDto,
  ) {
    return this.scientistService.upsertForUser(userId, dto);
  }

  @Put('application/mine')
  @ApiOperation({ summary: '修改/补交本人申报' })
  update(
    @CurrentUser('userId') userId: string,
    @Body() dto: UpdateScientistApplicationDto,
  ) {
    return this.scientistService.upsertForUser(userId, dto);
  }

  @Get('application/mine')
  @ApiOperation({ summary: '获取本人申报' })
  mine(@CurrentUser('userId') userId: string) {
    return this.scientistService.findMine(userId);
  }

  // 注意：export 路由必须在 :id 之前声明，避免被当作 id 捕获
  @Get('applications/export')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: '管理员：导出申报名单 Excel' })
  async export() {
    const { buffer, filename } = await this.scientistService.exportExcel();
    return new StreamableFile(buffer, {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      disposition: `attachment; filename="${encodeURIComponent(filename)}"`,
    });
  }

  @Get('applications')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: '管理员：全部申报列表' })
  list() {
    return this.scientistService.findAll();
  }

  @Get('applications/:id')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: '管理员：申报明细' })
  detail(@Param('id', ParseIntPipe) id: number) {
    return this.scientistService.findOne(id);
  }
}
