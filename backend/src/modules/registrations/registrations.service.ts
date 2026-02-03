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
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
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
      // 返回完整的 competition 对象（包括 deadline 等字段）
      competition: reg.competition ? {
        id: reg.competition.id,
        title: reg.competition.title,
        category: reg.competition.category,
        deadline: reg.competition.deadline,
        fee: reg.competition.fee,
        status: reg.competition.status,
      } : null,
      status: reg.status,
      registrationTime: reg.registrationTime,
      payment: reg.payments?.[0],
      paperSubmission: reg.paperSubmission,
    }));
  }

  /**
   * 更新报名记录的发票信息（缴费前填写）
   */
  async updateInvoice(id: number, userId: string, dto: UpdateInvoiceDto) {
    const registration = await this.registrationsRepository.findOne({
      where: { id, userId },
    });

    if (!registration) {
      throw new NotFoundException('报名记录不存在');
    }

    if (registration.status !== RegistrationStatus.PENDING_PAYMENT) {
      throw new BadRequestException('仅待支付状态可更新发票信息');
    }

    registration.needInvoice = dto.needInvoice ? 1 : 0;
    if (dto.needInvoice) {
      registration.invoiceTitle = dto.invoiceTitle ?? null;
      registration.invoiceTaxNo = dto.invoiceTaxNo ?? null;
      registration.invoiceAddress = dto.invoiceAddress ?? null;
      registration.invoicePhone = dto.invoicePhone ?? null;
      registration.invoiceEmail = dto.invoiceEmail ?? null;
    } else {
      registration.invoiceTitle = null;
      registration.invoiceTaxNo = null;
      registration.invoiceAddress = null;
      registration.invoicePhone = null;
      registration.invoiceEmail = null;
    }

    await this.registrationsRepository.save(registration);
    this.logger.log(`报名记录 ${id} 发票信息已更新`);
    return registration;
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

  /**
   * 管理员：获取某个竞赛的所有报名记录
   */
  async findByCompetitionId(competitionId: string) {
    const registrations = await this.registrationsRepository.find({
      where: { competitionId },
      relations: ['user', 'competition', 'payments', 'paperSubmission'],
      order: { registrationTime: 'DESC' },
    });

    // 返回格式化数据（含发票字段供管理端与导出使用）
    return registrations.map((reg) => ({
      id: reg.id,
      userId: reg.userId,
      user: {
        id: reg.user?.id || reg.userId,
        name: reg.user?.name || '未知用户',
        email: reg.user?.email || '',
        institution: reg.user?.institution || '',
        title: reg.user?.title || '',
      },
      competitionId: reg.competitionId,
      competition: reg.competition,
      status: reg.status,
      registrationTime: reg.registrationTime,
      payment: reg.payments?.[0],
      paperSubmission: reg.paperSubmission,
      notes: reg.notes,
      needInvoice: reg.needInvoice,
      invoiceTitle: reg.invoiceTitle,
      invoiceTaxNo: reg.invoiceTaxNo,
      invoiceAddress: reg.invoiceAddress,
      invoicePhone: reg.invoicePhone,
      invoiceEmail: reg.invoiceEmail,
    }));
  }

  /**
   * 导出竞赛报名列表为 Excel（管理员）
   */
  async exportByCompetitionId(competitionId: string): Promise<{ buffer: Buffer; filename: string }> {
    const ExcelJS = await import('exceljs');
    const registrations = await this.registrationsRepository.find({
      where: { competitionId },
      relations: ['user', 'competition', 'payments', 'paperSubmission'],
      order: { registrationTime: 'DESC' },
    });

    const competition = registrations[0]?.competition;
    const title = competition?.title || competitionId;
    const safeTitle = title.replace(/[/\\*?:\[\]]/g, '-').slice(0, 50);

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('报名列表', { headerFooter: { firstHeader: '竞赛报名信息' } });

    const statusText: Record<string, string> = {
      PENDING_PAYMENT: '待支付',
      PAID: '已支付',
      SUBMITTED: '已提交',
    };

    sheet.columns = [
      { header: '序号', key: 'index', width: 6 },
      { header: '姓名', key: 'name', width: 12 },
      { header: '邮箱', key: 'email', width: 22 },
      { header: '单位/学校', key: 'institution', width: 18 },
      { header: '职称/职务', key: 'title', width: 12 },
      { header: '报名时间', key: 'registrationTime', width: 20 },
      { header: '报名状态', key: 'status', width: 10 },
      { header: '支付状态', key: 'paymentStatus', width: 10 },
      { header: '支付时间', key: 'paymentTime', width: 20 },
      { header: '支付金额', key: 'paymentAmount', width: 10 },
      { header: '是否需要发票', key: 'needInvoice', width: 12 },
      { header: '发票抬头', key: 'invoiceTitle', width: 20 },
      { header: '税号', key: 'invoiceTaxNo', width: 18 },
      { header: '发票地址', key: 'invoiceAddress', width: 22 },
      { header: '发票电话', key: 'invoicePhone', width: 14 },
      { header: '发票邮箱', key: 'invoiceEmail', width: 20 },
      { header: '提交文件数', key: 'fileCount', width: 10 },
      { header: '提交文件1', key: 'file1', width: 24 },
      { header: '提交文件1地址', key: 'file1Url', width: 36 },
      { header: '提交文件2', key: 'file2', width: 24 },
      { header: '提交文件2地址', key: 'file2Url', width: 36 },
      { header: '提交文件3', key: 'file3', width: 24 },
      { header: '提交文件3地址', key: 'file3Url', width: 36 },
      { header: '提交文件4', key: 'file4', width: 24 },
      { header: '提交文件4地址', key: 'file4Url', width: 36 },
      { header: '备注', key: 'notes', width: 16 },
    ];

    sheet.getRow(1).font = { bold: true };
    sheet.getRow(1).alignment = { wrapText: true };

    registrations.forEach((reg, index) => {
      const payment = reg.payments?.[0];
      const ps = reg.paperSubmission;
      const files = ps?.submissionFiles && Array.isArray(ps.submissionFiles) ? ps.submissionFiles : null;
      const fileList = files ?? (ps?.submissionFileName && ps?.submissionFileUrl ? [{ fileName: ps.submissionFileName, fileUrl: ps.submissionFileUrl }] : []);

      sheet.addRow({
        index: index + 1,
        name: reg.user?.name ?? '未知用户',
        email: reg.user?.email ?? '',
        institution: reg.user?.institution ?? '',
        title: reg.user?.title ?? '',
        registrationTime: reg.registrationTime ? new Date(reg.registrationTime).toLocaleString('zh-CN') : '',
        status: statusText[reg.status] ?? reg.status,
        paymentStatus: payment?.paymentStatus === 'success' ? '已支付' : payment ? '待支付' : '-',
        paymentTime: payment?.paymentTime ? new Date(payment.paymentTime).toLocaleString('zh-CN') : '',
        paymentAmount: payment?.paymentAmount ?? '',
        needInvoice: reg.needInvoice ? '是' : '否',
        invoiceTitle: reg.invoiceTitle ?? '',
        invoiceTaxNo: reg.invoiceTaxNo ?? '',
        invoiceAddress: reg.invoiceAddress ?? '',
        invoicePhone: reg.invoicePhone ?? '',
        invoiceEmail: reg.invoiceEmail ?? '',
        fileCount: fileList.length,
        file1: fileList[0]?.fileName ?? '',
        file1Url: fileList[0]?.fileUrl ?? '',
        file2: fileList[1]?.fileName ?? '',
        file2Url: fileList[1]?.fileUrl ?? '',
        file3: fileList[2]?.fileName ?? '',
        file3Url: fileList[2]?.fileUrl ?? '',
        file4: fileList[3]?.fileName ?? '',
        file4Url: fileList[3]?.fileUrl ?? '',
        notes: reg.notes ?? '',
      });
    });

    const buf = await workbook.xlsx.writeBuffer();
    const buffer = Buffer.isBuffer(buf) ? buf : Buffer.from(buf as ArrayBuffer);
    const filename = `报名列表_${safeTitle}_${Date.now()}.xlsx`;
    return { buffer, filename };
  }
}
