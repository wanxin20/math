import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NewsService } from './news.service';
import { NewsController } from './news.controller';
import { NewsAnnouncement } from './entities/news-announcement.entity';

@Module({
  imports: [TypeOrmModule.forFeature([NewsAnnouncement])],
  controllers: [NewsController],
  providers: [NewsService],
  exports: [NewsService],
})
export class NewsModule {}
