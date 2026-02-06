import { Injectable, NotFoundException, Logger, BadRequestException, forwardRef, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UserStatus } from '@/common/enums/user-status.enum';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async findOne(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { id },
      relations: ['registrations'],
    });

    if (!user) {
      throw new NotFoundException(`用户不存在: ${id}`);
    }

    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  /**
   * 管理员功能：获取所有用户列表（带分页）
   */
  async findAll(page = 1, limit = 10, search?: string) {
    const queryBuilder = this.usersRepository.createQueryBuilder('user');

    // 搜索功能
    if (search) {
      queryBuilder.where(
        'user.name LIKE :search OR user.email LIKE :search OR user.institution LIKE :search',
        { search: `%${search}%` },
      );
    }

    // 分页
    queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('user.createdAt', 'DESC');

    const [users, total] = await queryBuilder.getManyAndCount();

    return {
      data: users,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * 管理员功能：更新用户信息
   */
  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);

    Object.assign(user, updateUserDto);
    const updatedUser = await this.usersRepository.save(user);

    this.logger.log(`用户信息已更新: ${id}`);

    return updatedUser;
  }

  /**
   * 管理员功能：删除用户
   */
  async remove(id: string): Promise<void> {
    const user = await this.findOne(id);
    await this.usersRepository.remove(user);
    this.logger.log(`用户已删除: ${id}`);
  }

  /**
   * 管理员功能：获取用户统计信息
   */
  async getStatistics() {
    const total = await this.usersRepository.count();
    const activeUsers = await this.usersRepository.count({
      where: { status: UserStatus.ACTIVE },
    });
    const suspendedUsers = await this.usersRepository.count({
      where: { status: UserStatus.SUSPENDED },
    });

    return {
      total,
      active: activeUsers,
      suspended: suspendedUsers,
    };
  }

  /**
   * 用户自己更新个人信息（不包括邮箱和密码）
   */
  async updateProfile(userId: string, updateProfileDto: UpdateProfileDto): Promise<User> {
    const user = await this.findOne(userId);

    // 更新允许修改的字段
    if (updateProfileDto.name) user.name = updateProfileDto.name;
    if (updateProfileDto.institution) user.institution = updateProfileDto.institution;
    if (updateProfileDto.title) user.title = updateProfileDto.title;
    if (updateProfileDto.phone) user.phone = updateProfileDto.phone;

    const updatedUser = await this.usersRepository.save(user);
    this.logger.log(`用户更新个人信息: ${userId}`);

    return updatedUser;
  }

  /**
   * 修改密码（需要邮箱验证码）
   */
  async changePassword(userId: string, changePasswordDto: ChangePasswordDto): Promise<{ message: string }> {
    const user = await this.findOne(userId);

    // 验证邮箱是否匹配
    if (user.email !== changePasswordDto.email) {
      throw new BadRequestException('邮箱不匹配');
    }

    // 注意：这里需要验证验证码，但为了避免循环依赖，我们在controller中先验证
    // 或者在这里调用一个独立的验证码服务

    // 加密新密码
    const hashedPassword = await bcrypt.hash(changePasswordDto.newPassword, 10);
    user.passwordHash = hashedPassword;

    await this.usersRepository.save(user);
    this.logger.log(`用户修改密码: ${userId}`);

    return { message: '密码修改成功' };
  }
}
