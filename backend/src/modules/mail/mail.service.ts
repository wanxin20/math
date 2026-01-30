import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: Transporter;
  private readonly from: string;

  constructor(private configService: ConfigService) {
    // 初始化邮件发送器
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('MAIL_HOST'),
      port: this.configService.get<number>('MAIL_PORT'),
      secure: false, // 使用STARTTLS
      auth: {
        user: this.configService.get<string>('MAIL_USER'),
        pass: this.configService.get<string>('MAIL_PASSWORD'),
      },
    });

    this.from = `"深圳数学学会数学竞赛平台" <${this.configService.get<string>('MAIL_USER')}>`;
  }

  /**
   * 发送验证码邮件
   */
  async sendVerificationCode(email: string, code: string): Promise<boolean> {
    try {
      const info = await this.transporter.sendMail({
        from: this.from,
        to: email,
        subject: '【深圳数学学会数学竞赛平台】邮箱验证码',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
              .code-box { background: white; border: 2px dashed #667eea; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center; }
              .code { font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 5px; }
              .footer { text-align: center; padding: 20px; color: #999; font-size: 12px; }
              .warning { color: #e74c3c; margin-top: 15px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🔐 邮箱验证码</h1>
              </div>
              <div class="content">
                <p>您好!</p>
                <p>您正在进行邮箱验证,您的验证码是:</p>
                <div class="code-box">
                  <div class="code">${code}</div>
                </div>
                <p><strong>验证码有效期为5分钟</strong>,请尽快完成验证。</p>
                <p class="warning">⚠️ 如果这不是您本人的操作,请忽略此邮件。</p>
              </div>
              <div class="footer">
                <p>此邮件由系统自动发送,请勿直接回复。</p>
                <p>&copy; 深圳数学学会数学竞赛平台 All Rights Reserved.</p>
              </div>
            </div>
          </body>
          </html>
        `,
      });

      this.logger.log(`验证码邮件已发送至 ${email}, MessageID: ${info.messageId}`);
      return true;
    } catch (error) {
      this.logger.error(`发送验证码邮件失败: ${error.message}`, error.stack);
      return false;
    }
  }

  /**
   * 发送欢迎邮件
   */
  async sendWelcomeEmail(email: string, name: string): Promise<boolean> {
    try {
      const info = await this.transporter.sendMail({
        from: this.from,
        to: email,
        subject: '欢迎加入深圳数学学会数学竞赛平台',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
              .footer { text-align: center; padding: 20px; color: #999; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🎉 欢迎加入!</h1>
              </div>
              <div class="content">
                <p>亲爱的 ${name},</p>
                <p>欢迎加入深圳数学学会数学竞赛平台!您已成功注册账号。</p>
                <p>您现在可以:</p>
                <ul>
                  <li>浏览和报名各类数学竞赛</li>
                  <li>提交您的研究论文</li>
                  <li>查看竞赛资源和获奖信息</li>
                </ul>
                <p>祝您在平台上有愉快的体验!</p>
              </div>
              <div class="footer">
                <p>&copy; 2026 深圳数学学会数学竞赛平台 All Rights Reserved.</p>
              </div>
            </div>
          </body>
          </html>
        `,
      });

      this.logger.log(`欢迎邮件已发送至 ${email}, MessageID: ${info.messageId}`);
      return true;
    } catch (error) {
      this.logger.error(`发送欢迎邮件失败: ${error.message}`, error.stack);
      return false;
    }
  }
}
