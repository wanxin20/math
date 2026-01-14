import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import compression from 'compression';
import { join } from 'path';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // 获取配置服务
  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3000);
  const apiPrefix = configService.get<string>('API_PREFIX', 'api/v1');
  const corsOrigin = configService.get<string>('CORS_ORIGIN', '*');

  // 静态文件服务 - 提供上传文件访问
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/',
  });

  // 安全相关
  app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }, // 允许跨域访问静态资源
  }));
  app.use(compression());

  // 启用CORS
  app.enableCors({
    origin: corsOrigin,
    credentials: true,
  });

  // 全局路由前缀
  app.setGlobalPrefix(apiPrefix);

  // 全局验证管道
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // 自动移除非白名单属性
      forbidNonWhitelisted: true, // 禁止非白名单属性
      transform: true, // 自动转换类型
      transformOptions: {
        enableImplicitConversion: true, // 启用隐式转换
      },
    }),
  );

  // 全局过滤器
  app.useGlobalFilters(new HttpExceptionFilter());

  // 全局拦截器
  app.useGlobalInterceptors(new TransformInterceptor(), new LoggingInterceptor());

  // Swagger文档配置
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('教师教研论文评选平台 API')
      .setDescription('Teacher Research Paper Selection Platform API Documentation')
      .setVersion('1.0')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          name: 'JWT',
          description: 'Enter JWT token',
          in: 'header',
        },
        'JWT-auth',
      )
      .addTag('Auth', '认证相关')
      .addTag('Users', '用户管理')
      .addTag('Competitions', '竞赛管理')
      .addTag('Registrations', '报名管理')
      .addTag('Payments', '支付管理')
      .addTag('Papers', '论文管理')
      .addTag('Reviews', '评审管理')
      .addTag('Awards', '获奖管理')
      .addTag('Resources', '资源管理')
      .addTag('AI-Chat', 'AI聊天')
      .addTag('News', '新闻公告')
      .addTag('System', '系统配置')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api-docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
      },
    });
  }

  await app.listen(port);
  console.log(`
  ╔═══════════════════════════════════════════════════════════════╗
  ║                                                               ║
  ║   🚀 教师教研论文评选平台后端服务已启动                        ║
  ║                                                               ║
  ║   📝 应用运行在: http://localhost:${port}                        ║
  ║   📖 API文档地址: http://localhost:${port}/api-docs             ║
  ║   🌍 环境: ${process.env.NODE_ENV}                              ║
  ║                                                               ║
  ╚═══════════════════════════════════════════════════════════════╝
  `);
}

bootstrap();
