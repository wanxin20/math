import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsEmail, Length, Matches } from 'class-validator';

export class UpdateProfileDto {
  @ApiProperty({ description: '教师姓名', required: false })
  @IsOptional()
  @IsString()
  @Length(2, 100, { message: '姓名长度在2-100个字符之间' })
  name?: string;

  @ApiProperty({ description: '任教单位/学校', required: false })
  @IsOptional()
  @IsString()
  institution?: string;

  @ApiProperty({ description: '职称/职务', required: false })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({ description: '手机号码', required: false })
  @IsOptional()
  @IsString()
  @Matches(/^1[3-9]\d{9}$/, { message: '手机号格式不正确' })
  phone?: string;
}
