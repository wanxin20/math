import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Resource } from './entities/resource.entity';
import { PaginationDto, PaginatedResponseDto } from '@/common/dto/pagination.dto';
import { CreateResourceDto } from './dto/create-resource.dto';
import { UpdateResourceDto } from './dto/update-resource.dto';

@Injectable()
export class ResourcesService {
  private readonly logger = new Logger(ResourcesService.name);

  constructor(
    @InjectRepository(Resource)
    private resourcesRepository: Repository<Resource>,
  ) {}

  /**
   * 获取所有公开资源
   */
  async findAll(paginationDto: PaginationDto, category?: string) {
    const { page = 1, pageSize = 10 } = paginationDto;

    const queryBuilder = this.resourcesRepository
      .createQueryBuilder('resource')
      .where('resource.isPublic = :isPublic', { isPublic: true });

    if (category) {
      queryBuilder.andWhere('resource.category = :category', { category });
    }

    queryBuilder
      .orderBy('resource.sortOrder', 'ASC')
      .addOrderBy('resource.createdAt', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize);

    const [items, total] = await queryBuilder.getManyAndCount();

    return new PaginatedResponseDto(items, total, page, pageSize);
  }

  /**
   * 增加下载次数
   */
  async incrementDownloadCount(id: number) {
    await this.resourcesRepository.increment({ id }, 'downloadCount', 1);
  }

  /**
   * 管理员功能：获取所有资源（包括非公开）
   */
  async findAllForAdmin(page = 1, limit = 10, search?: string) {
    const queryBuilder = this.resourcesRepository.createQueryBuilder('resource');

    // 搜索功能
    if (search) {
      queryBuilder.where('resource.name LIKE :search OR resource.description LIKE :search', {
        search: `%${search}%`,
      });
    }

    queryBuilder
      .orderBy('resource.sortOrder', 'ASC')
      .addOrderBy('resource.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [items, total] = await queryBuilder.getManyAndCount();

    return {
      data: items,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * 管理员功能：创建资源
   */
  async create(createResourceDto: CreateResourceDto): Promise<Resource> {
    const resource = this.resourcesRepository.create(createResourceDto);
    const savedResource = await this.resourcesRepository.save(resource);
    this.logger.log(`资源已创建: ${savedResource.id}`);
    return savedResource;
  }

  /**
   * 管理员功能：更新资源
   */
  async update(id: number, updateResourceDto: UpdateResourceDto): Promise<Resource> {
    const resource = await this.resourcesRepository.findOne({ where: { id } });
    
    if (!resource) {
      throw new NotFoundException(`资源不存在: ${id}`);
    }

    Object.assign(resource, updateResourceDto);
    const updatedResource = await this.resourcesRepository.save(resource);
    this.logger.log(`资源已更新: ${id}`);
    return updatedResource;
  }

  /**
   * 管理员功能：删除资源
   */
  async remove(id: number): Promise<void> {
    const resource = await this.resourcesRepository.findOne({ where: { id } });
    
    if (!resource) {
      throw new NotFoundException(`资源不存在: ${id}`);
    }

    await this.resourcesRepository.remove(resource);
    this.logger.log(`资源已删除: ${id}`);
  }

  /**
   * 获取资源详情
   */
  async findOne(id: number): Promise<Resource> {
    const resource = await this.resourcesRepository.findOne({ where: { id } });
    
    if (!resource) {
      throw new NotFoundException(`资源不存在: ${id}`);
    }

    return resource;
  }
}
