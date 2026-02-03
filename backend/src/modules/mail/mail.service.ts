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
    const host = this.configService.get<string>('MAIL_HOST');
    const port = this.configService.get<number>('MAIL_PORT') ?? 587;
    // 465 端口用 SSL 直连，587/25 用 STARTTLS（服务器上 25 常被云商封禁，465 易出现 Greeting never received，建议优先用 587）
    const secure = port === 465;
    const tlsInsecure = this.configService.get<string>('MAIL_TLS_INSECURE') === 'true';
    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      connectionTimeout: 30000,
      greetingTimeout: 25000,
      socketTimeout: 45000,
      tls: {
        servername: host,
        rejectUnauthorized: !tlsInsecure,
      },
      auth: {
        user: this.configService.get<string>('MAIL_USER'),
        pass: this.configService.get<string>('MAIL_PASSWORD'),
      },
    });

    this.from = `"深圳数学学会论文评选平台" <${this.configService.get<string>('MAIL_USER')}>`;
  }

  /**
   * 发送验证码邮件
   */
  async sendVerificationCode(email: string, code: string): Promise<boolean> {
    try {
      const info = await this.transporter.sendMail({
        from: this.from,
        to: email,
        subject: '【深圳数学学会论文评选平台】邮箱验证码',
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
                <p>&copy; 深圳数学学会论文评选平台 All Rights Reserved.</p>
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
   * 发送欢迎邮件（已关闭，不实际发送）
   */
  async sendWelcomeEmail(_email: string, _name: string): Promise<boolean> {
    return true;
  }
}
