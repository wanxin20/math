import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScientistController } from './scientist.controller';
import { ScientistService } from './scientist.service';
import { ScientistApplication } from './entities/scientist-application.entity';
import { ScientistRegistrant } from './entities/scientist-registrant.entity';
import { User } from '../users/entities/user.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ScientistApplication, ScientistRegistrant, User]),
    AuthModule, // 复用已导出的 AuthService 完成注册
  ],
  controllers: [ScientistController],
  providers: [ScientistService],
})
export class ScientistModule {}
