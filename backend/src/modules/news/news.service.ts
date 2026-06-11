import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, In, FindOptionsWhere } from 'typeorm';
import { NewsAnnouncement, NewsType } from './entities/news-announcement.entity';
import { PaginationDto, PaginatedResponseDto } from '@/common/dto/pagination.dto';
import { CreateNewsDto } from './dto/create-news.dto';
import { UpdateNewsDto } from './dto/update-news.dto';

@Injectable()
export class NewsService {
  private readonly logger = new Logger(NewsService.name);

  constructor(
    @InjectRepository(NewsAnnouncement)
    private newsRepository: Repository<NewsAnnouncement>,
  ) {}

  /**
   * 获取已发布的新闻列表（公开）
   * @param type 逗号分隔的 NewsType 过滤（如 "news" 或 "notice,announcement,update"）
   * @param search 标题模糊匹配
   */
  async findPublished(
    paginationDto: PaginationDto & { type?: string; search?: string },
  ) {
    const { page = 1, pageSize = 10, type, search } = paginationDto;

    const where: FindOptionsWhere<NewsAnnouncement> = { isPublished: true };

    if (type) {
      const validTypes = Object.values(NewsType) as string[];
      const types = type
        .split(',')
        .map((t) => t.trim())
        .filter((t): t is NewsType => validTypes.includes(t));
      if (types.length === 0) {
        return new PaginatedResponseDto<NewsAnnouncement>([], 0, page, pageSize);
      }
      where.type = types.length === 1 ? types[0] : In(types);
    }

    if (search) {
      where.title = Like(`%${search}%`);
    }

    const [items, total] = await this.newsRepository.findAndCount({
      where,
      order: { publishDate: 'DESC', createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return new PaginatedResponseDto(items, total, page, pageSize);
  }

  /**
   * 获取新闻详情并增加浏览次数（公开）
   */
  async findOne(id: number) {
    const news = await this.newsRepository.findOne({ where: { id } });

    if (news) {
      await this.newsRepository.increment({ id }, 'viewCount', 1);
    }

    return news;
  }

  /**
   * 门户公开详情：仅已发布；自增浏览量；附带上一条/下一条
   *（按公开列表排序 publishDate DESC, createdAt DESC，上一条=更新的一条）
   */
  async findOnePublic(id: number) {
    const news = await this.newsRepository.findOne({
      where: { id, isPublished: true },
    });
    if (!news) return null;

    await this.newsRepository.increment({ id }, 'viewCount', 1);
    news.viewCount += 1;

    const ordered = await this.newsRepository.find({
      where: { isPublished: true },
      order: { publishDate: 'DESC', createdAt: 'DESC' },
      select: ['id', 'title'],
    });
    const idx = ordered.findIndex((n) => n.id === id);
    const prev = idx > 0 ? { id: ordered[idx - 1].id, title: ordered[idx - 1].title } : null;
    const next =
      idx >= 0 && idx < ordered.length - 1
        ? { id: ordered[idx + 1].id, title: ordered[idx + 1].title }
        : null;

    return { ...news, prev, next };
  }

  /**
   * 管理员：获取所有新闻列表
   */
  async adminFindAll(paginationDto: PaginationDto & { search?: string }) {
    const { page = 1, pageSize = 10, search } = paginationDto;

    const whereCondition = search
      ? [
          { title: Like(`%${search}%`) },
          { content: Like(`%${search}%`) },
        ]
      : {};

    const [items, total] = await this.newsRepository.findAndCount({
      where: whereCondition,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return new PaginatedResponseDto(items, total, page, pageSize);
  }

  /**
   * 管理员：创建新闻
   */
  async create(createNewsDto: CreateNewsDto, userId: string) {
    const news = this.newsRepository.create({
      ...createNewsDto,
      authorId: userId,
    });

    const saved = await this.newsRepository.save(news);
    this.logger.log(`新闻创建成功: ${saved.title}`);
    return saved;
  }

  /**
   * 管理员：更新新闻
   */
  async update(id: number, updateNewsDto: UpdateNewsDto) {
    const news = await this.newsRepository.findOne({ where: { id } });

    if (!news) {
      throw new NotFoundException('新闻不存在');
    }

    Object.assign(news, updateNewsDto);
    const updated = await this.newsRepository.save(news);
    this.logger.log(`新闻更新成功: ${updated.title}`);
    return updated;
  }

  /**
   * 管理员：删除新闻
   */
  async remove(id: number) {
    const news = await this.newsRepository.findOne({ where: { id } });

    if (!news) {
      throw new NotFoundException('新闻不存在');
    }

    await this.newsRepository.remove(news);
    this.logger.log(`新闻删除成功: ${news.title}`);
  }

  /**
   * 管理员：切换发布状态
   */
  async togglePublish(id: number) {
    const news = await this.newsRepository.findOne({ where: { id } });

    if (!news) {
      throw new NotFoundException('新闻不存在');
    }

    news.isPublished = !news.isPublished;
    if (news.isPublished && !news.publishDate) {
      news.publishDate = new Date();
    }

    const updated = await this.newsRepository.save(news);
    this.logger.log(`新闻发布状态切换: ${updated.title} - ${updated.isPublished}`);
    return updated;
  }
}
