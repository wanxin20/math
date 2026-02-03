import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateInvoiceDto {
  @ApiProperty({ description: '是否需要发票' })
  @IsBoolean()
  needInvoice: boolean;

  @ApiPropertyOptional({ description: '发票抬头', maxLength: 200 })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  invoiceTitle?: string;

  @ApiPropertyOptional({ description: '纳税人识别号/税号', maxLength: 50 })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  invoiceTaxNo?: string;

  @ApiPropertyOptional({ description: '发票地址', maxLength: 500 })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  invoiceAddress?: string;

  @ApiPropertyOptional({ description: '发票联系电话', maxLength: 30 })
  @IsString()
  @IsOptional()
  @MaxLength(30)
  invoicePhone?: string;

  @ApiPropertyOptional({ description: '发票邮箱（接收电子发票）', maxLength: 100 })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  invoiceEmail?: string;
}
