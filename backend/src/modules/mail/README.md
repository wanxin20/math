# 邮箱验证码功能说明

## 📧 功能概述

本模块实现了完整的邮箱验证码功能,用于用户登录和注册时的邮箱验证。

## 🏗️ 架构设计

### 1. MailService (mail.service.ts)
负责实际的邮件发送功能:
- 使用 Nodemailer 发送邮件
- 支持 HTML 模板邮件
- 发送验证码邮件
- 发送欢迎邮件

### 2. VerificationCodeService (verification-code.service.ts)
管理验证码的生命周期:
- 生成6位随机验证码
- 存储验证码(内存存储,生产环境建议使用Redis)
- 验证码有效期: 5分钟
- 发送频率限制: 60秒/次
- 验证失败次数限制: 3次
- 自动清理过期验证码

## ⚙️ 配置说明

### 环境变量 (.env)

```env
# 邮箱服务配置
MAIL_HOST=smtp.qq.com          # SMTP服务器地址
MAIL_PORT=587                   # SMTP端口(587用于STARTTLS)
MAIL_USER=   # 发件人邮箱
MAIL_PASSWORD=# SMTP授权码(非邮箱登录密码)
```

### QQ邮箱配置步骤

1. 登录QQ邮箱 (https://mail.qq.com)
2. 点击"设置" -> "账户"
3. 找到"POP3/IMAP/SMTP/Exchange/CardDAV/CalDAV服务"
4. 开启"POP3/SMTP服务"或"IMAP/SMTP服务"
5. 按照提示发送短信验证
6. 保存生成的授权码(16位字符)

**重要**: 授权码不是邮箱登录密码,是用于第三方客户端登录的专用密码。

### 163 邮箱配置

```env
MAIL_HOST=smtp.163.com
MAIL_PORT=587
MAIL_USER=你的邮箱@163.com
MAIL_PASSWORD=SMTP授权码
```

### 服务器部署（云主机 / VPS）常见问题

在云服务器上发信时，常出现：

| 端口 | 现象 | 原因 |
|------|------|------|
| **25** | `Connection timeout` | 多数云厂商**封禁出站 25**（防垃圾邮件），无法连上 163 的 25。 |
| **465** | `Greeting never received` | 部分网络/代理对 SSL 直连不友好，或 163 对机房 IP 限制。 |
| **587** | 推荐 | STARTTLS，云上一般**未封 587**，163 支持，优先使用。 |

**建议**：在服务器 `.env` 里使用 **587**：

```env
MAIL_HOST=smtp.163.com
MAIL_PORT=587
MAIL_USER=你的163邮箱@163.com
MAIL_PASSWORD=SMTP授权码
```

若 587 仍超时，可适当放宽 TLS 校验（仅作排查用，不建议长期开启）：

```env
MAIL_TLS_INSECURE=true
```

## 🔌 API 接口

### 1. 发送验证码
```http
POST /api/v1/auth/send-verification-code
Content-Type: application/json

{
  "email": "user@example.com"
}
```

响应:
```json
{
  "message": "验证码已发送,请查收邮件"
}
```

### 2. 验证验证码
```http
POST /api/v1/auth/verify-code
Content-Type: application/json

{
  "email": "user@example.com",
  "code": "123456"
}
```

响应:
```json
{
  "valid": true,
  "message": "验证成功"
}
```

## 🎨 前端使用示例

### 发送验证码
```typescript
const handleSendCode = async () => {
  try {
    const response = await api.auth.sendVerificationCode(email);
    if (response.success) {
      // 开始倒计时
      setCountdown(60);
    }
  } catch (error) {
    console.error('发送失败', error);
  }
};
```

### 验证验证码
```typescript
const handleVerify = async () => {
  try {
    const response = await api.auth.verifyCode(email, code);
    if (response.success) {
      // 验证成功,继续登录/注册流程
    }
  } catch (error) {
    console.error('验证失败', error);
  }
};
```

## 🔒 安全特性

1. **频率限制**: 同一邮箱60秒内只能发送一次验证码
2. **有效期限制**: 验证码5分钟后自动过期
3. **尝试次数限制**: 同一验证码最多验证3次
4. **自动清理**: 定时清理过期验证码,避免内存泄漏

## 📝 验证码邮件模板

邮件采用精美的HTML模板,包含:
- 品牌头部(渐变背景)
- 验证码展示区(突出显示6位数字)
- 有效期提示
- 安全警告
- 页脚信息

## 🚀 生产环境优化建议

### 1. 使用 Redis 存储验证码
```typescript
// 替换 Map 为 Redis
import { InjectRedis } from '@nestjs-modules/ioredis';
import { Redis } from 'ioredis';

@Injectable()
export class VerificationCodeService {
  constructor(@InjectRedis() private readonly redis: Redis) {}
  
  async sendCode(email: string): Promise<void> {
    const code = this.generateCode();
    // 存储到 Redis,5分钟过期
    await this.redis.setex(`verify:${email}`, 300, code);
  }
}
```

### 2. 使用消息队列
对于高并发场景,建议使用消息队列(如RabbitMQ、Redis Queue)异步发送邮件:
```typescript
await this.mailQueue.add('send-verification-code', {
  email,
  code,
});
```

### 3. 监控和日志
- 记录发送成功/失败的邮件数量
- 监控发送耗时
- 设置告警规则

### 4. 邮件服务商选择
生产环境可考虑使用专业的邮件服务:
- SendGrid
- Amazon SES
- 阿里云邮件推送
- 腾讯云邮件服务

## 📊 测试建议

### 单元测试
```typescript
describe('VerificationCodeService', () => {
  it('should generate 6-digit code', () => {
    const code = service['generateCode']();
    expect(code).toMatch(/^\d{6}$/);
  });
  
  it('should enforce rate limit', async () => {
    await service.sendCode('test@example.com');
    await expect(service.sendCode('test@example.com'))
      .rejects.toThrow('请等待');
  });
});
```

### 集成测试
- 测试实际邮件发送
- 测试验证码验证流程
- 测试各种错误场景

## 🐛 常见问题

### 1. 邮件发送失败
- 检查SMTP配置是否正确
- 确认授权码是否有效
- 检查网络连接
- 查看邮箱服务商是否有发送限制

### 2. 验证码收不到
- 检查垃圾邮件箱
- 确认邮箱地址正确
- 检查邮件服务器日志

### 3. 验证总是失败
- 确认验证码未过期
- 检查尝试次数是否超限
- 验证邮箱地址匹配

## 📚 相关文档

- [Nodemailer 官方文档](https://nodemailer.com/)
- [QQ邮箱SMTP设置](https://service.mail.qq.com/cgi-bin/help?subtype=1&&id=28&&no=1001256)
- [NestJS 配置模块](https://docs.nestjs.com/techniques/configuration)

## 👥 维护者

如有问题,请联系开发团队。
