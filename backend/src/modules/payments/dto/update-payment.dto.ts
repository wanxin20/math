import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString, IsOptional } from 'class-validator';
import { PaymentStatus } from '@/common/enums/payment-status.enum';

export class UpdatePaymentDto {
  @ApiProperty({ description: '支付状态', enum: PaymentStatus })
  @IsEnum(PaymentStatus)
  paymentStatus: PaymentStatus;

  @ApiProperty({ description: '支付方式', example: '微信支付' })
  @IsString()
  @IsOptional()
  paymentMethod?: string;

  @ApiProperty({ description: '支付流水号' })
  @IsString()
  @IsOptional()
  paymentTransactionId?: string;
}
