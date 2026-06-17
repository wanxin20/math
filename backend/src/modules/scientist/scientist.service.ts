import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as ExcelJS from 'exceljs';
import {
  ScientistApplication,
  ScientistApplicationStatus,
} from './entities/scientist-application.entity';
import { CreateScientistApplicationDto } from './dto/scientist-application.dto';

const CATEGORY_LABEL: Record<string, string> = {
  form: '申报表',
  certificate: '证件',
  papers: '代表性论文',
  attachment: '其他附件',
  memberForm: '会员申请表',
};

@Injectable()
export class ScientistService {
  constructor(
    @InjectRepository(ScientistApplication)
    private readonly repo: Repository<ScientistApplication>,
  ) {}

  /** 提交或更新本人申报（一人一份，整体覆盖） */
  async upsertForUser(userId: string, dto: CreateScientistApplicationDto) {
    let app = await this.repo.findOne({ where: { userId } });
    if (!app) {
      app = this.repo.create({ userId });
    }
    Object.assign(app, dto, {
      userId,
      materials: dto.materials ?? [],
      status: ScientistApplicationStatus.SUBMITTED,
    });
    return this.repo.save(app);
  }

  /** 本人申报（无则返回 null） */
  async findMine(userId: string) {
    return this.repo.findOne({ where: { userId } });
  }

  /** 管理员：全部申报 */
  async findAll() {
    return this.repo.find({ order: { createdAt: 'DESC' } });
  }

  /** 管理员：单条 */
  async findOne(id: number) {
    const app = await this.repo.findOne({ where: { id } });
    if (!app) {
      throw new NotFoundException('申报记录不存在');
    }
    return app;
  }

  /** 管理员：导出名单 Excel */
  async exportExcel(): Promise<{ buffer: Buffer; filename: string }> {
    const list = await this.repo.find({ order: { createdAt: 'DESC' } });

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('青年科学家奖申报');
    sheet.columns = [
      { header: '序号', key: 'idx', width: 6 },
      { header: '姓名', key: 'name', width: 14 },
      { header: '性别', key: 'gender', width: 6 },
      { header: '出生年月', key: 'birthDate', width: 14 },
      { header: '工作单位', key: 'institution', width: 28 },
      { header: '职称/职务', key: 'title', width: 14 },
      { header: '手机', key: 'phone', width: 16 },
      { header: '邮箱', key: 'email', width: 24 },
      { header: '研究方向', key: 'researchField', width: 24 },
      { header: '学会会员', key: 'isSocietyMember', width: 10 },
      { header: '愿意赞助/协办会议', key: 'willing', width: 16 },
      { header: '材料', key: 'materials', width: 50 },
      { header: '备注', key: 'notes', width: 24 },
      { header: '提交时间', key: 'createdAt', width: 20 },
    ];

    list.forEach((a, i) => {
      const materials = (a.materials || [])
        .map((m) => `[${CATEGORY_LABEL[m.category] || m.category}]${m.fileName}`)
        .join('；');
      sheet.addRow({
        idx: i + 1,
        name: a.name,
        gender: a.gender || '',
        birthDate: a.birthDate || '',
        institution: a.institution,
        title: a.title || '',
        phone: a.phone,
        email: a.email,
        researchField: a.researchField || '',
        isSocietyMember: a.isSocietyMember ? '是' : '否',
        willing: a.willingSponsorConference ? '是' : '否',
        materials,
        notes: a.notes || '',
        createdAt: a.createdAt
          ? new Date(a.createdAt).toLocaleString('zh-CN', { hour12: false })
          : '',
      });
    });
    sheet.getRow(1).font = { bold: true };

    const buf = await workbook.xlsx.writeBuffer();
    const filename = `青年科学家奖申报名单_${Date.now()}.xlsx`;
    return { buffer: Buffer.from(buf), filename };
  }
}
