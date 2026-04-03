import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsInt, Min, IsEmail, Matches, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';

export class TeamMemberDto {
  @ApiProperty({ description: '成员姓名', example: '张三' })
  @IsString()
  @IsNotEmpty({ message: '成员姓名不能为空' })
  @MaxLength(100)
  name: string;

  @ApiProperty({ description: '学校/单位', example: 'XX中学' })
  @IsString()
  @IsNotEmpty({ message: '学校/单位不能为空' })
  @MaxLength(200)
  institution: string;

  @ApiPropertyOptional({ description: '职称/年级', example: '高二' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  title?: string;

  @ApiPropertyOptional({ description: '手机号' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

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
