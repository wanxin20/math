import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NewsAnnouncement } from './entities/news-announcement.entity';
import { PaginationDto, PaginatedResponseDto } from '@/common/dto/pagination.dto';

@Injectable()
export class NewsService {
  constructor(
    @InjectRepository(NewsAnnouncement)
    private newsRepository: Repository<NewsAnnouncement>,
  ) {}

  /**
   * 获取已发布的新闻列表
   */
  async findPublished(paginationDto: PaginationDto) {
    const { page = 1, pageSize = 10 } = paginationDto;

    const [items, total] = await this.newsRepository.findAndCount({
      where: { isPublished: true },
      order: { publishDate: 'DESC', createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return new PaginatedResponseDto(items, total, page, pageSize);
  }

  /**
   * 获取新闻详情并增加浏览次数
   */
  async findOne(id: number) {
    const news = await this.newsRepository.findOne({ where: { id } });

    if (news) {
      await this.newsRepository.increment({ id }, 'viewCount', 1);
    }

    return news;
  }
}
