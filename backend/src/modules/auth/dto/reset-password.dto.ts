import { IsEmail, IsNotEmpty, IsString, Length, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { IsStrongPassword } from '@/common/validators/password.validator';

export class ResetPasswordDto {
  @ApiProperty({ description: '邮箱地址', example: 'user@example.com' })
  @IsEmail({}, { message: '请输入有效的邮箱地址' })
  @IsNotEmpty({ message: '邮箱不能为空' })
  email: string;

  @ApiProperty({ description: '验证码', example: '123456' })
  @IsString({ message: '验证码必须是字符串' })
  @Length(6, 6, { message: '验证码必须是6位数字' })
  @IsNotEmpty({ message: '验证码不能为空' })
  code: string;

  @ApiProperty({ description: '新密码', example: 'newPassword123!' })
  @IsString({ message: '密码必须是字符串' })
  @IsStrongPassword({ message: '密码必须至少6位，且包含大写字母、小写字母、特殊字符中的至少两种' })
  @IsNotEmpty({ message: '密码不能为空' })
  newPassword: string;
}
