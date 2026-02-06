import { Controller, Get, Post, Patch, Body, Param, UseGuards, ParseIntPipe, StreamableFile } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { RegistrationsService } from './registrations.service';
import { CreateRegistrationDto } from './dto/create-registration.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { AdminGuard } from '@/common/guards/admin.guard';
import { CurrentUser } from '@/common/decorators/user.decorator';

@ApiTags('Registrations')
@Controller('registrations')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class RegistrationsController {
  constructor(private readonly registrationsService: RegistrationsService) {}

  @Post()
  @ApiOperation({ summary: '创建报名记录' })
  @ApiResponse({ status: 201, description: '报名成功' })
  @ApiResponse({ status: 409, description: '已经报名过该竞赛' })
  async create(
    @CurrentUser('userId') userId: string,
    @Body() createRegistrationDto: CreateRegistrationDto,
  ) {
    return this.registrationsService.create(userId, createRegistrationDto);
  }

  @Get()
  @ApiOperation({ summary: '获取当前用户的所有报名记录' })
  async findUserRegistrations(@CurrentUser('userId') userId: string) {
    return this.registrationsService.findUserRegistrations(userId);
  }

  @Post(':id/confirm-submission')
  @ApiOperation({ summary: '确认提交（上传文件后，点击提交按钮，进入待支付状态）' })
  async confirmSubmission(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('userId') userId: string,
  ) {
    return this.registrationsService.confirmSubmission(id, userId);
  }

  @Patch(':id/invoice')
  @ApiOperation({ summary: '更新报名发票信息（缴费前）' })
  async updateInvoice(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('userId') userId: string,
    @Body() updateInvoiceDto: UpdateInvoiceDto,
  ) {
    return this.registrationsService.updateInvoice(id, userId, updateInvoiceDto);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取报名记录详情' })
  async findOne(@Param('id', ParseIntPipe) id: number, @CurrentUser('userId') userId: string) {
    return this.registrationsService.findOne(id, userId);
  }

  @Get('check/:competitionId')
  @ApiOperation({ summary: '检查是否已报名某竞赛' })
  async checkRegistration(
    @Param('competitionId') competitionId: string,
    @CurrentUser('userId') userId: string,
  ) {
    const hasRegistered = await this.registrationsService.hasRegistered(userId, competitionId);
    return { hasRegistered };
  }

  @Get('competition/:competitionId/export')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: '管理员：导出竞赛报名列表为 Excel' })
  async exportByCompetitionId(@Param('competitionId') competitionId: string) {
    const { buffer, filename } = await this.registrationsService.exportByCompetitionId(competitionId);
    return new StreamableFile(buffer, {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      disposition: `attachment; filename="${encodeURIComponent(filename)}"`,
    });
  }

  @Get('competition/:competitionId')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: '管理员：获取某个竞赛的所有报名记录' })
  async findByCompetitionId(@Param('competitionId') competitionId: string) {
    return this.registrationsService.findByCompetitionId(competitionId);
  }
}
