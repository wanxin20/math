import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsInt, Min, IsEmail, MaxLength, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class AdvisorDto {
  @ApiProperty({ description: '姓名' })
  @IsString()
  @IsNotEmpty({ message: '指导老师姓名不能为空' })
  @MaxLength(100)
  name: string;

  @ApiProperty({ description: '学校/单位' })
  @IsString()
  @IsNotEmpty({ message: '学校/单位不能为空' })
  @MaxLength(200)
  institution: string;

  @ApiPropertyOptional({ description: '职称' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  title?: string;

  @ApiProperty({ description: '手机号（必填）' })
  @IsString()
  @IsNotEmpty({ message: '指导老师手机号不能为空' })
  @MaxLength(20)
  phone: string;

  @ApiPropertyOptional({ description: '邮箱' })
  @IsOptional()
  @IsEmail({}, { message: '邮箱格式不正确' })
  email?: string;

  @ApiPropertyOptional({ description: '排序', default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  sortOrder?: number;
}

export class UpdateAdvisorsDto {
  @ApiProperty({ description: '指导老师列表（覆盖式更新，最多2位）', type: [AdvisorDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AdvisorDto)
  advisors: AdvisorDto[];
}
