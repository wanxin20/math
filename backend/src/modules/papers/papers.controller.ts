import { Controller, Get, Post, Body, Param, UseGuards, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PapersService } from './papers.service';
import { CreatePaperSubmissionDto } from './dto/create-paper-submission.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { CurrentUser } from '@/common/decorators/user.decorator';

@ApiTags('Papers')
@Controller('papers')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class PapersController {
  constructor(private readonly papersService: PapersService) {}

  @Post()
  @ApiOperation({ summary: '提交论文' })
  async create(
    @CurrentUser('userId') userId: string,
    @Body() createPaperSubmissionDto: CreatePaperSubmissionDto,
  ) {
    return this.papersService.create(userId, createPaperSubmissionDto);
  }

  @Get('registration/:registrationId')
  @ApiOperation({ summary: '获取报名的论文提交记录' })
  async findByRegistrationId(
    @Param('registrationId', ParseIntPipe) registrationId: number,
    @CurrentUser('userId') userId: string,
  ) {
    return this.papersService.findByRegistrationId(registrationId, userId);
  }
}
