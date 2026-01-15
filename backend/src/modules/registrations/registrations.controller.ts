import { Controller, Get, Post, Body, Param, UseGuards, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { RegistrationsService } from './registrations.service';
import { CreateRegistrationDto } from './dto/create-registration.dto';
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

  @Get('competition/:competitionId')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: '管理员：获取某个竞赛的所有报名记录' })
  async findByCompetitionId(@Param('competitionId') competitionId: string) {
    return this.registrationsService.findByCompetitionId(competitionId);
  }
}
