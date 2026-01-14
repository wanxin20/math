import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserRegistration } from './entities/user-registration.entity';
import { Competition } from '../competitions/entities/competition.entity';
import { RegistrationPayment } from '../payments/entities/registration-payment.entity';
import { CreateRegistrationDto } from './dto/create-registration.dto';
import { RegistrationStatus } from '@/common/enums/registration-status.enum';
import { PaymentStatus } from '@/common/enums/payment-status.enum';
import { CompetitionStatus } from '@/common/enums/competition-status.enum';

@Injectable()
export class RegistrationsService {
  private readonly logger = new Logger(RegistrationsService.name);

  constructor(
    @InjectRepository(UserRegistration)
    private registrationsRepository: Repository<UserRegistration>,
    @InjectRepository(Competition)
    private competitionsRepository: Repository<Competition>,
    @InjectRepository(RegistrationPayment)
    private paymentsRepository: Repository<RegistrationPayment>,
  ) {}

  /**
   * 创建报名记录
   */
  async create(userId: string, createRegistrationDto: CreateRegistrationDto) {
    const { competitionId, notes } = createRegistrationDto;

    // 1. 检查竞赛是否存在且开放报名
    const competition = await this.competitionsRepository.findOne({
      where: { id: competitionId },
    });

    if (!competition) {
      throw new NotFoundException('竞赛不存在');
    }

    if (competition.status !== CompetitionStatus.OPEN) {
      throw new BadRequestException('该竞赛未开放报名');
    }

    // 2. 检查是否已经报名
    const existingRegistration = await this.registrationsRepository.findOne({
      where: { userId, competitionId },
    });

    if (existingRegistration) {
      throw new ConflictException('您已经报名过该竞赛');
    }

    // 3. 创建报名记录
    const registration = this.registrationsRepository.create({
      userId,
      competitionId,
      status: RegistrationStatus.PENDING_PAYMENT,
      notes,
    });

    const savedRegistration = await this.registrationsRepository.save(registration);

    // 4. 创建支付记录
    const payment = this.paymentsRepository.create({
      registrationId: savedRegistration.id,
      paymentAmount: competition.fee,
      paymentStatus: PaymentStatus.PENDING,
    });

    await this.paymentsRepository.save(payment);

    // 5. 更新竞赛参与人数
    await this.competitionsRepository.increment({ id: competitionId }, 'currentParticipants', 1);

    this.logger.log(`用户 ${userId} 报名竞赛 ${competitionId} 成功`);

    // 返回完整信息
    return this.findOne(savedRegistration.id, userId);
  }

  /**
   * 获取用户的所有报名记录
   */
  async findUserRegistrations(userId: string) {
    const registrations = await this.registrationsRepository.find({
      where: { userId },
      relations: ['competition', 'payments', 'paperSubmission'],
      order: { registrationTime: 'DESC' },
    });

    return registrations.map((reg) => ({
      id: reg.id,
      competitionId: reg.competitionId,
      competitionTitle: reg.competition?.title,
      status: reg.status,
      registrationTime: reg.registrationTime,
      payment: reg.payments?.[0],
      paperSubmission: reg.paperSubmission,
    }));
  }

  /**
   * 获取单个报名记录详情
   */
  async findOne(id: number, userId: string) {
    const registration = await this.registrationsRepository.findOne({
      where: { id, userId },
      relations: ['competition', 'payments', 'paperSubmission', 'awardRecord'],
    });

    if (!registration) {
      throw new NotFoundException('报名记录不存在');
    }

    return registration;
  }

  /**
   * 检查用户是否已报名某竞赛
   */
  async hasRegistered(userId: string, competitionId: string): Promise<boolean> {
    const count = await this.registrationsRepository.count({
      where: { userId, competitionId },
    });

    return count > 0;
  }

  /**
   * 更新报名状态
   */
  async updateStatus(id: number, status: RegistrationStatus) {
    const result = await this.registrationsRepository.update(id, { status });

    if (result.affected === 0) {
      throw new NotFoundException('报名记录不存在');
    }

    this.logger.log(`报名记录 ${id} 状态更新为 ${status}`);
  }
}
