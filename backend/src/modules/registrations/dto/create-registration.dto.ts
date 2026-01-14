import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateRegistrationDto {
  @ApiProperty({ description: '竞赛ID', example: 'pedagogy-2024' })
  @IsString()
  @IsNotEmpty()
  competitionId: string;

  @ApiPropertyOptional({ description: '备注信息' })
  @IsString()
  @IsOptional()
  notes?: string;
}
