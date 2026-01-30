import { Injectable, ConflictException, UnauthorizedException, Logger, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuid } from 'uuid';
import { User } from '../users/entities/user.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { BcryptUtil } from '@/common/utils/bcrypt.util';
import { UserStatus } from '@/common/enums/user-status.enum';
import { VerificationCodeService } from '../mail/verification-code.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private jwtService: JwtService,
    private verificationCodeService: VerificationCodeService,
  ) {}

  /**
   * 用户注册
   */
  async register(registerDto: RegisterDto) {
    // 1. 检查邮箱是否已存在
    const existingUser = await this.usersRepository.findOne({
      where: { email: registerDto.email },
    });

    if (existingUser) {
      throw new ConflictException('该邮箱已被注册');
    }

    // 2. 检查手机号是否已存在
    const existingPhone = await this.usersRepository.findOne({
      where: { phone: registerDto.phone },
    });

    if (existingPhone) {
      throw new ConflictException('该手机号已被注册');
    }

    // 3. 加密密码
    const passwordHash = await BcryptUtil.hashPassword(registerDto.password);

    // 4. 创建用户
    const user = this.usersRepository.create({
      id: uuid(),
      name: registerDto.name,
      email: registerDto.email,
      passwordHash,
      institution: registerDto.institution,
      title: registerDto.title,
      phone: registerDto.phone,
      status: UserStatus.ACTIVE,
    });

    // 5. 保存用户
    const savedUser = await this.usersRepository.save(user);

    this.logger.log(`新用户注册成功: ${savedUser.email}`);

    // 6. 生成JWT token
    const token = await this.generateToken(savedUser);

    // 7. 返回用户信息和token（不返回密码）
    const { passwordHash: _, ...userWithoutPassword } = savedUser;
    return {
      user: userWithoutPassword,
      accessToken: token,
    };
  }

  /**
   * 用户登录
   */
  async login(loginDto: LoginDto) {
    // 1. 验证用户
    const user = await this.validateUser(loginDto.email, loginDto.password);

    if (!user) {
      throw new UnauthorizedException('邮箱或密码错误');
    }

    // 2. 更新最后登录时间
    await this.usersRepository.update(user.id, {
      lastLoginAt: new Date(),
    });

    // 3. 生成JWT token
    const token = await this.generateToken(user);

    this.logger.log(`用户登录成功: ${user.email}`);

    // 4. 返回用户信息和token
    const { passwordHash: _, ...userWithoutPassword } = user;
    return {
      user: userWithoutPassword,
      accessToken: token,
    };
  }

  /**
   * 验证用户凭证
   */
  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.usersRepository
      .createQueryBuilder('user')
      .where('user.email = :email', { email })
      .addSelect('user.passwordHash')
      .getOne();

    if (!user) {
      return null;
    }

    // 检查账户状态
    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('账户已被停用');
    }

    // 验证密码
    const isPasswordValid = await BcryptUtil.comparePassword(password, user.passwordHash);

    if (!isPasswordValid) {
      return null;
    }

    return user;
  }

  /**
   * 生成JWT token
   */
  private async generateToken(user: User): Promise<string> {
    const payload = {
      sub: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };

    return this.jwtService.sign(payload);
  }

  /**
   * 获取当前用户信息
   */
  async getProfile(userId: string) {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('用户不存在');
    }

    const { passwordHash: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  /**
   * 发送邮箱验证码
   */
  async sendVerificationCode(email: string): Promise<void> {
    await this.verificationCodeService.sendCode(email);
  }

  /**
   * 验证邮箱验证码
   */
  async verifyCode(email: string, code: string): Promise<boolean> {
    return await this.verificationCodeService.verifyCode(email, code);
  }

  /**
   * 重置密码
   */
  async resetPassword(email: string, code: string, newPassword: string): Promise<void> {
    // 1. 验证验证码
    const isValid = await this.verificationCodeService.verifyCode(email, code);
    if (!isValid) {
      throw new BadRequestException('验证码错误或已过期');
    }

    // 2. 查找用户
    const user = await this.usersRepository.findOne({
      where: { email },
    });

    if (!user) {
      throw new BadRequestException('该邮箱未注册');
    }

    // 3. 加密新密码
    const passwordHash = await BcryptUtil.hashPassword(newPassword);

    // 4. 更新密码
    await this.usersRepository.update(user.id, {
      passwordHash,
    });

    this.logger.log(`用户 ${email} 重置密码成功`);
  }
}
