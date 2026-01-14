import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaperSubmission } from './entities/paper-submission.entity';
import { UserRegistration } from '../registrations/entities/user-registration.entity';
import { CreatePaperSubmissionDto } from './dto/create-paper-submission.dto';
import { RegistrationStatus } from '@/common/enums/registration-status.enum';

@Injectable()
export class PapersService {
  private readonly logger = new Logger(PapersService.name);

  constructor(
    @InjectRepository(PaperSubmission)
    private papersRepository: Repository<PaperSubmission>,
    @InjectRepository(UserRegistration)
    private registrationsRepository: Repository<UserRegistration>,
  ) {}

  /**
   * 提交论文
   */
  async create(userId: string, createPaperSubmissionDto: CreatePaperSubmissionDto) {
    const { registrationId, ...paperData } = createPaperSubmissionDto;

    // 1. 验证报名记录
    const registration = await this.registrationsRepository.findOne({
      where: { id: registrationId, userId },
    });

    if (!registration) {
      throw new NotFoundException('报名记录不存在');
    }

    if (registration.status !== RegistrationStatus.PAID) {
      throw new BadRequestException('请先完成支付');
    }

    // 2. 检查是否已提交论文
    const existingSubmission = await this.papersRepository.findOne({
      where: { registrationId },
    });

    if (existingSubmission) {
      throw new ConflictException('该报名记录已提交论文');
    }

    // 3. 创建论文提交记录
    const paperSubmission = this.papersRepository.create({
      registrationId,
      ...paperData,
    });

    const savedPaper = await this.papersRepository.save(paperSubmission);

    // 4. 更新报名状态为已提交
    await this.registrationsRepository.update(registrationId, {
      status: RegistrationStatus.SUBMITTED,
    });

    this.logger.log(`用户 ${userId} 提交论文成功: ${paperData.paperTitle}`);

    return savedPaper;
  }

  /**
   * 获取论文详情
   */
  async findByRegistrationId(registrationId: number, userId: string) {
    const registration = await this.registrationsRepository.findOne({
      where: { id: registrationId, userId },
    });

    if (!registration) {
      throw new NotFoundException('报名记录不存在');
    }

    const paper = await this.papersRepository.findOne({
      where: { registrationId },
      relations: ['registration'],
    });

    if (!paper) {
      throw new NotFoundException('论文提交记录不存在');
    }

    return paper;
  }
}
