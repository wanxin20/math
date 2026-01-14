import { Controller, Get, Post, Param, UseGuards, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { CurrentUser } from '@/common/decorators/user.decorator';

@ApiTags('Payments')
@Controller('payments')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get('registration/:registrationId')
  @ApiOperation({ summary: '获取报名的支付记录' })
  async findByRegistrationId(@Param('registrationId', ParseIntPipe) registrationId: number) {
    return this.paymentsService.findByRegistrationId(registrationId);
  }

  @Post('mock/:registrationId')
  @ApiOperation({ summary: '模拟支付（开发测试用）' })
  async mockPayment(
    @Param('registrationId', ParseIntPipe) registrationId: number,
    @CurrentUser('userId') userId: string,
  ) {
    return this.paymentsService.mockPayment(registrationId, userId);
  }
}
