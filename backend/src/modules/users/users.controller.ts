import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { AdminGuard } from '@/common/guards/admin.guard';
import { CurrentUser } from '@/common/decorators/user.decorator';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { VerificationCodeService } from '../mail/verification-code.service';

@ApiTags('Users')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly verificationCodeService: VerificationCodeService,
  ) {}

  @Get('me')
  @ApiOperation({ summary: '获取当前用户详细信息' })
  async getCurrentUser(@CurrentUser('userId') userId: string) {
    return this.usersService.findOne(userId);
  }

  @Patch('me')
  @ApiOperation({ summary: '更新当前用户个人信息' })
  async updateProfile(
    @CurrentUser('userId') userId: string,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(userId, updateProfileDto);
  }

  @Post('change-password')
  @ApiOperation({ summary: '修改密码（需要邮箱验证码）' })
  async changePassword(
    @CurrentUser('userId') userId: string,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    // 先验证验证码
    const isCodeValid = await this.verificationCodeService.verifyCode(
      changePasswordDto.email,
      changePasswordDto.code,
    );
    
    if (!isCodeValid) {
      return {
        success: false,
        message: '验证码错误或已过期',
      };
    }

    // 验证码正确，修改密码
    return this.usersService.changePassword(userId, changePasswordDto);
  }

  // 以下是管理员专用接口
  @Get('admin/list')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: '管理员：获取所有用户列表' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  async getAllUsers(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('search') search?: string,
  ) {
    return this.usersService.findAll(page, limit, search);
  }

  @Get('admin/statistics')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: '管理员：获取用户统计信息' })
  async getUserStatistics() {
    return this.usersService.getStatistics();
  }

  @Get('admin/:id')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: '管理员：获取指定用户详情' })
  async getUser(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch('admin/:id')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: '管理员：更新用户信息' })
  async updateUser(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete('admin/:id')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: '管理员：删除用户' })
  async deleteUser(@Param('id') id: string) {
    await this.usersService.remove(id);
    return { message: '用户已删除' };
  }
}
