import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEmail, IsNotEmpty, MinLength, Matches, Length } from 'class-validator';
import { IsStrongPassword } from '@/common/validators/password.validator';

export class RegisterDto {
  @ApiProperty({ description: '教师姓名', example: '张老师' })
  @IsString()
  @IsNotEmpty({ message: '姓名不能为空' })
  @Length(2, 100, { message: '姓名长度在2-100个字符之间' })
  name: string;

  @ApiProperty({ description: '电子邮箱', example: 'zhang@example.com' })
  @IsEmail({}, { message: '邮箱格式不正确' })
  @IsNotEmpty({ message: '邮箱不能为空' })
  email: string;

  @ApiProperty({ description: '密码', minLength: 6, example: 'Password123!' })
  @IsString()
  @IsStrongPassword({ message: '密码必须至少6位，且包含大写字母、小写字母、特殊字符中的至少两种' })
  password: string;

  @ApiProperty({ description: '任教单位/学校', example: 'XX小学' })
  @IsString()
  @IsNotEmpty({ message: '任教单位不能为空' })
  institution: string;

  @ApiProperty({ description: '职称/职务', example: '高级教师' })
  @IsString()
  @IsNotEmpty({ message: '职称不能为空' })
  title: string;

  @ApiProperty({ description: '手机号码', example: '13800138000' })
  @IsString()
  @Matches(/^1[3-9]\d{9}$/, { message: '手机号格式不正确' })
  phone: string;
}
