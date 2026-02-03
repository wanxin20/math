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
   * 提交论文（支持首次提交和重新提交；支持单文件或多文件）
   */
  async create(userId: string, createPaperSubmissionDto: CreatePaperSubmissionDto) {
    const { registrationId, submissionFiles, ...rest } = createPaperSubmissionDto;

    // 归一化：多文件时用第一个填充单文件字段（兼容旧接口与列表展示）
    const paperData = { ...rest };
    if (submissionFiles && submissionFiles.length > 0) {
      const first = submissionFiles[0];
      paperData.submissionFileName = first.fileName;
      paperData.submissionFileUrl = first.fileUrl;
      paperData.submissionFileSize = first.size ?? rest.submissionFileSize;
      paperData.submissionFileType = first.mimetype ?? rest.submissionFileType;
      (paperData as any).submissionFiles = submissionFiles.map((f) => ({
        fileName: f.fileName,
        fileUrl: f.fileUrl,
        size: f.size,
        mimetype: f.mimetype,
      }));
    } else if (!rest.submissionFileName || !rest.submissionFileUrl) {
      throw new BadRequestException('请提供文件：submissionFiles 或 submissionFileName + submissionFileUrl');
    }

    // 1. 验证报名记录
    const registration = await this.registrationsRepository.findOne({
      where: { id: registrationId, userId },
    });

    if (!registration) {
      throw new NotFoundException('报名记录不存在');
    }

    // 允许 PAID（已支付）或 SUBMITTED（已提交，重新提交）状态提交论文
    if (registration.status !== RegistrationStatus.PAID && 
        registration.status !== RegistrationStatus.SUBMITTED) {
      throw new BadRequestException('请先完成支付');
    }

    // 2. 检查是否已提交论文（支持重新提交）
    const existingSubmission = await this.papersRepository.findOne({
      where: { registrationId },
    });

    let savedPaper;

    if (existingSubmission) {
      // 已存在论文记录，执行更新（重新提交）
      Object.assign(existingSubmission, paperData);
      existingSubmission.submissionTime = new Date();
      savedPaper = await this.papersRepository.save(existingSubmission);
      this.logger.log(`用户 ${userId} 重新提交论文: ${paperData.paperTitle}`);
    } else {
      // 首次提交，创建新记录
      const paperSubmission = this.papersRepository.create({
        registrationId,
        ...paperData,
      });
      savedPaper = await this.papersRepository.save(paperSubmission);
      this.logger.log(`用户 ${userId} 首次提交论文: ${paperData.paperTitle}`);
    }

    // 3. 确保报名状态为已提交
    if (registration.status !== RegistrationStatus.SUBMITTED) {
      await this.registrationsRepository.update(registrationId, {
        status: RegistrationStatus.SUBMITTED,
      });
    }

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
