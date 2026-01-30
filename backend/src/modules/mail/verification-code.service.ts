import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { MailService } from './mail.service';

interface VerificationRecord {
  code: string;
  email: string;
  expiresAt: Date;
  attempts: number;
}

@Injectable()
export class VerificationCodeService {
  private readonly logger = new Logger(VerificationCodeService.name);
  // 使用Map临时存储验证码，生产环境建议使用Redis
  private verificationCodes = new Map<string, VerificationRecord>();
  // 发送频率限制：每个邮箱60秒内只能发送一次
  private sendLimits = new Map<string, Date>();

  constructor(private mailService: MailService) {
    // 定时清理过期验证码（每分钟执行一次）
    setInterval(() => this.cleanExpiredCodes(), 60000);
  }

  /**
   * 生成6位随机验证码
   */
  private generateCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * 发送验证码
   */
  async sendCode(email: string): Promise<void> {
    // 1. 检查发送频率限制
    const lastSentTime = this.sendLimits.get(email);
    if (lastSentTime) {
      const timeDiff = Date.now() - lastSentTime.getTime();
      if (timeDiff < 60000) {
        const remainingSeconds = Math.ceil((60000 - timeDiff) / 1000);
        throw new BadRequestException(`请等待 ${remainingSeconds} 秒后再试`);
      }
    }

    // 2. 生成验证码
    const code = this.generateCode();
    
    // 3. 发送邮件
    const sent = await this.mailService.sendVerificationCode(email, code);
    
    if (!sent) {
      throw new BadRequestException('验证码发送失败，请稍后重试');
    }

    // 4. 存储验证码（5分钟有效期）
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
    this.verificationCodes.set(email, {
      code,
      email,
      expiresAt,
      attempts: 0,
    });

    // 5. 记录发送时间
    this.sendLimits.set(email, new Date());

    this.logger.log(`验证码已发送至 ${email}`);
  }

  /**
   * 验证验证码
   */
  async verifyCode(email: string, code: string): Promise<boolean> {
    const record = this.verificationCodes.get(email);

    if (!record) {
      throw new BadRequestException('验证码不存在或已过期');
    }

    // 检查是否过期
    if (new Date() > record.expiresAt) {
      this.verificationCodes.delete(email);
      throw new BadRequestException('验证码已过期，请重新获取');
    }

    // 检查尝试次数（最多3次）
    if (record.attempts >= 3) {
      this.verificationCodes.delete(email);
      throw new BadRequestException('验证失败次数过多，请重新获取验证码');
    }

    // 验证码不匹配
    if (record.code !== code) {
      record.attempts++;
      throw new BadRequestException(
        `验证码错误，还剩 ${3 - record.attempts} 次机会`
      );
    }

    // 验证成功，删除验证码
    this.verificationCodes.delete(email);
    this.logger.log(`邮箱 ${email} 验证成功`);
    return true;
  }

  /**
   * 清理过期的验证码
   */
  private cleanExpiredCodes(): void {
    const now = new Date();
    let cleaned = 0;

    for (const [email, record] of this.verificationCodes.entries()) {
      if (now > record.expiresAt) {
        this.verificationCodes.delete(email);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      this.logger.debug(`清理了 ${cleaned} 个过期验证码`);
    }
  }

  /**
   * 检查验证码是否存在
   */
  hasCode(email: string): boolean {
    return this.verificationCodes.has(email);
  }
}
