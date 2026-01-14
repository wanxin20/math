import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';

// 业务模块
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { CompetitionsModule } from './modules/competitions/competitions.module';
import { RegistrationsModule } from './modules/registrations/registrations.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { PapersModule } from './modules/papers/papers.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { AwardsModule } from './modules/awards/awards.module';
import { ResourcesModule } from './modules/resources/resources.module';
import { AiChatModule } from './modules/ai-chat/ai-chat.module';
import { NewsModule } from './modules/news/news.module';
import { SystemModule } from './modules/system/system.module';
import { UploadModule } from './modules/upload/upload.module';

// 导入所有实体
import { User } from './modules/users/entities/user.entity';
import { Competition } from './modules/competitions/entities/competition.entity';
import { UserRegistration } from './modules/registrations/entities/user-registration.entity';
import { RegistrationPayment } from './modules/payments/entities/registration-payment.entity';
import { PaperSubmission } from './modules/papers/entities/paper-submission.entity';
import { AwardRecord } from './modules/awards/entities/award-record.entity';
import { Resource } from './modules/resources/entities/resource.entity';
import { NewsAnnouncement } from './modules/news/entities/news-announcement.entity';

// 配置模块
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';

@Module({
  imports: [
    // 配置模块
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // 数据库模块
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get('DB_USERNAME'),
        password: configService.get('DB_PASSWORD'),
        database: configService.get('DB_DATABASE'),
        entities: [
          User,
          Competition,
          UserRegistration,
          RegistrationPayment,
          PaperSubmission,
          AwardRecord,
          Resource,
          NewsAnnouncement,
        ],
        synchronize: false, // 生产环境必须为false，使用migration管理
        logging: configService.get('NODE_ENV') === 'development',
        timezone: '+08:00',
        charset: 'utf8mb4',
        extra: {
          connectionLimit: 10,
        },
      }),
      inject: [ConfigService],
    }),

    // 定时任务模块
    ScheduleModule.forRoot(),

    // 业务模块
    AuthModule,
    UsersModule,
    CompetitionsModule,
    RegistrationsModule,
    PaymentsModule,
    PapersModule,
    ReviewsModule,
    AwardsModule,
    ResourcesModule,
    AiChatModule,
    NewsModule,
    SystemModule,
    UploadModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // 全局启用JWT守卫
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
