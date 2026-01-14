import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Competition } from './entities/competition.entity';
import { CreateCompetitionDto } from './dto/create-competition.dto';
import { UpdateCompetitionDto } from './dto/update-competition.dto';
import { CompetitionStatus } from '@/common/enums/competition-status.enum';
import { PaginationDto, PaginatedResponseDto } from '@/common/dto/pagination.dto';

@Injectable()
export class CompetitionsService {
  constructor(
    @InjectRepository(Competition)
    private competitionsRepository: Repository<Competition>,
  ) {}

  async create(createCompetitionDto: CreateCompetitionDto): Promise<Competition> {
    const competition = this.competitionsRepository.create({
      ...createCompetitionDto,
      id: this.generateId(createCompetitionDto.title),
    });

    return this.competitionsRepository.save(competition);
  }

  async findAll(
    paginationDto: PaginationDto,
    status?: CompetitionStatus,
    category?: string,
    search?: string,
  ): Promise<PaginatedResponseDto<Competition>> {
    const { page = 1, pageSize = 10 } = paginationDto;

    const queryBuilder = this.competitionsRepository.createQueryBuilder('competition');

    // 筛选条件
    if (status) {
      queryBuilder.andWhere('competition.status = :status', { status });
    }

    if (category) {
      queryBuilder.andWhere('competition.category = :category', { category });
    }

    if (search) {
      queryBuilder.andWhere(
        '(competition.title LIKE :search OR competition.description LIKE :search)',
        { search: `%${search}%` },
      );
    }

    // 分页
    queryBuilder.skip((page - 1) * pageSize).take(pageSize);

    // 排序
    queryBuilder.orderBy('competition.deadline', 'DESC');

    const [items, total] = await queryBuilder.getManyAndCount();

    return new PaginatedResponseDto(items, total, page, pageSize);
  }

  async findOne(id: string): Promise<Competition> {
    const competition = await this.competitionsRepository.findOne({
      where: { id },
    });

    if (!competition) {
      throw new NotFoundException(`竞赛不存在: ${id}`);
    }

    return competition;
  }

  async findOpenCompetitions(): Promise<Competition[]> {
    return this.competitionsRepository.find({
      where: { status: CompetitionStatus.OPEN },
      order: { deadline: 'ASC' },
    });
  }

  async update(id: string, updateCompetitionDto: UpdateCompetitionDto): Promise<Competition> {
    const competition = await this.findOne(id);

    Object.assign(competition, updateCompetitionDto);

    return this.competitionsRepository.save(competition);
  }

  async remove(id: string): Promise<void> {
    const competition = await this.findOne(id);
    await this.competitionsRepository.remove(competition);
  }

  private generateId(title: string): string {
    const timestamp = Date.now();
    const slug = title
      .toLowerCase()
      .replace(/\s+/g, '-')
      .substring(0, 20);
    return `${slug}-${timestamp}`;
  }
}
