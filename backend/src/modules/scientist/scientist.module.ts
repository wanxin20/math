import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScientistController } from './scientist.controller';
import { ScientistService } from './scientist.service';
import { ScientistApplication } from './entities/scientist-application.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ScientistApplication])],
  controllers: [ScientistController],
  providers: [ScientistService],
})
export class ScientistModule {}
