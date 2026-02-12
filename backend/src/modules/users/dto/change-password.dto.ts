import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MinLength, IsEmail } from 'class-validator';
import { IsStrongPassword } from '@/common/validators/password.validator';

export class ChangePasswordDto {
  @ApiProperty({ description: '电子邮箱', example: 'user@example.com' })
  @IsEmail({}, { message: '邮箱格式不正确' })
  @IsNotEmpty({ message: '邮箱不能为空' })
  email: string;

  @ApiProperty({ description: '邮箱验证码', example: '123456' })
  @IsString({ message: '验证码必须是字符串' })
  @IsNotEmpty({ message: '验证码不能为空' })
  code: string;

  @ApiProperty({ description: '新密码', minLength: 6 })
  @IsString()
  @IsNotEmpty({ message: '新密码不能为空' })
  @IsStrongPassword({ message: '密码必须至少6位，且包含大写字母、小写字母、特殊字符中的至少两种' })
  newPassword: string;
}
