import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { In, Like } from 'typeorm';
import { NewsService } from './news.service';
import { NewsAnnouncement, NewsType } from './entities/news-announcement.entity';

const createMockRepo = () => ({
  findAndCount: jest.fn().mockResolvedValue([[], 0]),
  findOne: jest.fn(),
  find: jest.fn().mockResolvedValue([]),
  increment: jest.fn().mockResolvedValue(undefined),
  create: jest.fn(),
  save: jest.fn(),
  remove: jest.fn(),
});

describe('NewsService 门户公开接口', () => {
  let service: NewsService;
  let repo: ReturnType<typeof createMockRepo>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        NewsService,
        { provide: getRepositoryToken(NewsAnnouncement), useFactory: createMockRepo },
      ],
    }).compile();
    service = module.get(NewsService);
    repo = module.get(getRepositoryToken(NewsAnnouncement));
  });

  describe('findPublished', () => {
    it('默认只查已发布，不带 type 过滤', async () => {
      await service.findPublished({ page: 1, pageSize: 10 });
      expect(repo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({ where: { isPublished: true } }),
      );
    });

    it('type=news 单值过滤', async () => {
      await service.findPublished({ page: 1, pageSize: 10, type: 'news' });
      expect(repo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({ where: { isPublished: true, type: NewsType.NEWS } }),
      );
    });

    it('type 多值（逗号分隔）用 In 过滤', async () => {
      await service.findPublished({ page: 1, pageSize: 10, type: 'notice,announcement,update' });
      expect(repo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            isPublished: true,
            type: In([NewsType.NOTICE, NewsType.ANNOUNCEMENT, NewsType.UPDATE]),
          },
        }),
      );
    });

    it('type 全为非法值时返回空页且不查库', async () => {
      const result = await service.findPublished({ page: 1, pageSize: 10, type: 'bogus' });
      expect(repo.findAndCount).not.toHaveBeenCalled();
      expect(result.items).toEqual([]);
      expect(result.total).toBe(0);
    });

    it('search 用标题 Like 过滤', async () => {
      await service.findPublished({ page: 1, pageSize: 10, search: '基金' });
      expect(repo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({ where: { isPublished: true, title: Like('%基金%') } }),
      );
    });
  });

  describe('findOnePublic', () => {
    const published = (id: number, title = `新闻${id}`) =>
      ({ id, title, isPublished: true, viewCount: 0 }) as unknown as NewsAnnouncement;

    it('未发布或不存在返回 null 且不自增浏览量', async () => {
      repo.findOne.mockResolvedValue(null);
      const result = await service.findOnePublic(99);
      expect(repo.findOne).toHaveBeenCalledWith({ where: { id: 99, isPublished: true } });
      expect(result).toBeNull();
      expect(repo.increment).not.toHaveBeenCalled();
    });

    it('已发布返回详情并自增浏览量', async () => {
      repo.findOne.mockResolvedValue(published(2));
      repo.find.mockResolvedValue([published(3), published(2), published(1)]);
      const result = await service.findOnePublic(2);
      expect(repo.increment).toHaveBeenCalledWith({ id: 2 }, 'viewCount', 1);
      expect(result!.viewCount).toBe(1);
    });

    it('中间一条：prev=更新的一条，next=更旧的一条', async () => {
      repo.findOne.mockResolvedValue(published(2));
      repo.find.mockResolvedValue([published(3), published(2), published(1)]);
      const result = await service.findOnePublic(2);
      expect(result!.prev).toEqual({ id: 3, title: '新闻3' });
      expect(result!.next).toEqual({ id: 1, title: '新闻1' });
    });

    it('最新一条 prev=null；最旧一条 next=null；仅一条两者皆 null', async () => {
      repo.findOne.mockResolvedValue(published(3));
      repo.find.mockResolvedValue([published(3), published(2)]);
      let result = await service.findOnePublic(3);
      expect(result!.prev).toBeNull();
      expect(result!.next).toEqual({ id: 2, title: '新闻2' });

      repo.findOne.mockResolvedValue(published(2));
      result = await service.findOnePublic(2);
      expect(result!.prev).toEqual({ id: 3, title: '新闻3' });
      expect(result!.next).toBeNull();

      repo.findOne.mockResolvedValue(published(1));
      repo.find.mockResolvedValue([published(1)]);
      result = await service.findOnePublic(1);
      expect(result!.prev).toBeNull();
      expect(result!.next).toBeNull();
    });
  });
});
