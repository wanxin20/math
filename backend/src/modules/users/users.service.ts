import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { UpdateUserDto } from './dto/update-user.dto';

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
      where: { status: 'active' },
    });
    const suspendedUsers = await this.usersRepository.count({
      where: { status: 'suspended' },
    });

    return {
      total,
      active: activeUsers,
      suspended: suspendedUsers,
    };
  }
}
