import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JudgeAssignment } from './entities/judge-assignment.entity';
import { JudgeScore } from './entities/judge-score.entity';
import { Competition } from '../competitions/entities/competition.entity';
import { UserRegistration } from '../registrations/entities/user-registration.entity';
import { User } from '../users/entities/user.entity';
import { UserRole } from '@/common/enums/user-role.enum';
import { RegistrationStatus } from '@/common/enums/registration-status.enum';
import { AssignJudgeDto } from './dto/assign-judge.dto';
import { SubmitScoreDto } from './dto/submit-score.dto';

const REVIEWABLE_STATUSES = [
  RegistrationStatus.SUBMITTED,
  RegistrationStatus.UNDER_REVIEW,
  RegistrationStatus.REVIEWED,
  RegistrationStatus.AWARDED,
  RegistrationStatus.REJECTED,
];

@Injectable()
export class ReviewsService {
  private readonly logger = new Logger(ReviewsService.name);

  constructor(
    @InjectRepository(JudgeAssignment)
    private assignmentRepo: Repository<JudgeAssignment>,
    @InjectRepository(JudgeScore)
    private scoreRepo: Repository<JudgeScore>,
    @InjectRepository(Competition)
    private competitionRepo: Repository<Competition>,
    @InjectRepository(UserRegistration)
    private registrationRepo: Repository<UserRegistration>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {}

  // ==================== 评委端 ====================

  async getAssignedCompetitions(judgeUserId: string) {
    const assignments = await this.assignmentRepo.find({
      where: { judgeUserId },
      relations: ['competition'],
      order: { assignedAt: 'DESC' },
    });

    if (assignments.length === 0) return [];

    const competitionIds = assignments.map(a => a.competition.id);

    // Batch: submission counts per competition
    const submissionCounts = await this.registrationRepo
      .createQueryBuilder('r')
      .select('r.competitionId', 'cid')
      .addSelect('COUNT(*)', 'cnt')
      .where('r.competitionId IN (:...cids)', { cids: competitionIds })
      .andWhere('r.status IN (:...statuses)', { statuses: REVIEWABLE_STATUSES })
      .groupBy('r.competitionId')
      .getRawMany();
    const subCountMap = new Map(submissionCounts.map((r: any) => [r.cid, Number(r.cnt)]));

    // Batch: scored counts per competition for this judge
    const scoredCounts = await this.scoreRepo
      .createQueryBuilder('s')
      .select('s.competitionId', 'cid')
      .addSelect('COUNT(*)', 'cnt')
      .where('s.judgeUserId = :judgeUserId', { judgeUserId })
      .andWhere('s.competitionId IN (:...cids)', { cids: competitionIds })
      .groupBy('s.competitionId')
      .getRawMany();
    const scoredCountMap = new Map(scoredCounts.map((r: any) => [r.cid, Number(r.cnt)]));

    return assignments.map(assignment => {
      const comp = assignment.competition;
      return {
        assignmentId: assignment.id,
        competition: {
          id: comp.id,
          title: comp.title,
          category: comp.category,
          status: comp.status,
          deadline: comp.deadline,
          scoringCriteria: comp.scoringCriteria,
        },
        totalSubmissions: subCountMap.get(comp.id) || 0,
        scoredCount: scoredCountMap.get(comp.id) || 0,
        assignedAt: assignment.assignedAt,
      };
    });
  }

  async getSubmissionsForJudge(judgeUserId: string, competitionId: string) {
    const assignment = await this.assignmentRepo.findOne({
      where: { judgeUserId, competitionId },
      relations: ['competition'],
    });
    if (!assignment) {
      throw new ForbiddenException('您未被分配到该竞赛的评审任务');
    }

    const registrations = await this.registrationRepo
      .createQueryBuilder('r')
      .leftJoinAndSelect('r.user', 'user')
      .leftJoinAndSelect('r.paperSubmission', 'paper')
      .leftJoinAndSelect('r.teamMembers', 'team')
      .leftJoinAndSelect('r.advisors', 'advisor')
      .where('r.competitionId = :cid', { cid: competitionId })
      .andWhere('r.status IN (:...statuses)', { statuses: REVIEWABLE_STATUSES })
      .orderBy('r.registrationTime', 'ASC')
      .getMany();

    const scores = await this.scoreRepo.find({
      where: { judgeUserId, competitionId },
    });
    const scoreMap = new Map(scores.map((s) => [s.registrationId, s]));

    const comp = assignment.competition;

    return {
      competition: {
        id: comp.id,
        title: comp.title,
        scoringCriteria: comp.scoringCriteria,
      },
      submissions: registrations.map((reg) => {
        const score = scoreMap.get(reg.id);
        return {
          registrationId: reg.id,
          status: reg.status,
          registrationTime: reg.registrationTime,
          user: {
            id: reg.user.id,
            name: reg.user.name,
            institution: reg.user.institution,
            title: reg.user.title,
          },
          paperSubmission: reg.paperSubmission
            ? {
                id: reg.paperSubmission.id,
                paperTitle: reg.paperSubmission.paperTitle,
                paperAbstract: reg.paperSubmission.paperAbstract,
                paperKeywords: reg.paperSubmission.paperKeywords,
                submissionFileName: reg.paperSubmission.submissionFileName,
                submissionFileUrl: reg.paperSubmission.submissionFileUrl,
                submissionFiles: reg.paperSubmission.submissionFiles,
                submissionTime: reg.paperSubmission.submissionTime,
                researchField: reg.paperSubmission.researchField,
              }
            : null,
          teamMembers: reg.teamMembers || [],
          advisors: reg.advisors || [],
          myScore: score
            ? {
                id: score.id,
                totalScore: score.totalScore,
                criteriaScores: score.criteriaScores,
                comments: score.comments,
                scoredAt: score.scoredAt,
              }
            : null,
        };
      }),
    };
  }

  async submitScore(judgeUserId: string, dto: SubmitScoreDto) {
    // Parallel validation: assignment, registration, competition
    const [assignment, registration, competition] = await Promise.all([
      this.assignmentRepo.findOne({
        where: { judgeUserId, competitionId: dto.competitionId },
      }),
      this.registrationRepo.findOne({
        where: { id: dto.registrationId, competitionId: dto.competitionId },
      }),
      this.competitionRepo.findOne({
        where: { id: dto.competitionId },
      }),
    ]);

    if (!assignment) {
      throw new ForbiddenException('您未被分配到该竞赛的评审任务');
    }
    if (!registration) {
      throw new NotFoundException('报名记录不存在');
    }

    if (competition?.scoringCriteria && dto.criteriaScores) {
      for (const cs of dto.criteriaScores) {
        if (cs.score > cs.maxScore) {
          throw new BadRequestException(`"${cs.name}" 评分 ${cs.score} 超过上限 ${cs.maxScore}`);
        }
      }
    }

    let score = await this.scoreRepo.findOne({
      where: { judgeUserId, registrationId: dto.registrationId },
    });

    if (score) {
      score.totalScore = dto.totalScore;
      score.criteriaScores = dto.criteriaScores || null;
      score.comments = dto.comments ?? null;
      score.scoredAt = new Date();
    } else {
      score = this.scoreRepo.create({
        judgeUserId,
        registrationId: dto.registrationId,
        competitionId: dto.competitionId,
        totalScore: dto.totalScore,
        criteriaScores: dto.criteriaScores || null,
        comments: dto.comments ?? null,
      });
    }

    const saved = await this.scoreRepo.save(score);
    this.logger.log(`评委 ${judgeUserId} 对报名 ${dto.registrationId} 评分: ${dto.totalScore}`);
    return saved;
  }

  // ==================== 管理员端 ====================

  async assignJudge(dto: AssignJudgeDto) {
    const judge = await this.userRepo.findOne({ where: { id: dto.judgeUserId } });
    if (!judge) {
      throw new NotFoundException('用户不存在');
    }
    if (judge.role !== UserRole.JUDGE) {
      throw new BadRequestException('该用户不是评委角色，请先将其设为评委');
    }

    const competition = await this.competitionRepo.findOne({ where: { id: dto.competitionId } });
    if (!competition) {
      throw new NotFoundException('竞赛不存在');
    }

    const existing = await this.assignmentRepo.findOne({
      where: { judgeUserId: dto.judgeUserId, competitionId: dto.competitionId },
    });
    if (existing) {
      throw new ConflictException('该评委已被分配到此竞赛');
    }

    const assignment = this.assignmentRepo.create({
      judgeUserId: dto.judgeUserId,
      competitionId: dto.competitionId,
    });
    return this.assignmentRepo.save(assignment);
  }

  async removeAssignment(assignmentId: number) {
    const assignment = await this.assignmentRepo.findOne({ where: { id: assignmentId } });
    if (!assignment) {
      throw new NotFoundException('分配记录不存在');
    }
    await this.assignmentRepo.remove(assignment);
    return { message: '已移除评委分配' };
  }

  async getJudgesForCompetition(competitionId: string) {
    const assignments = await this.assignmentRepo.find({
      where: { competitionId },
      relations: ['judge'],
      order: { assignedAt: 'ASC' },
    });

    if (assignments.length === 0) return [];

    // Batch: scored counts per judge
    const judgeUserIds = assignments.map(a => a.judgeUserId);
    const scoredCounts = await this.scoreRepo
      .createQueryBuilder('s')
      .select('s.judgeUserId', 'uid')
      .addSelect('COUNT(*)', 'cnt')
      .where('s.competitionId = :competitionId', { competitionId })
      .andWhere('s.judgeUserId IN (:...uids)', { uids: judgeUserIds })
      .groupBy('s.judgeUserId')
      .getRawMany();
    const scoredMap = new Map(scoredCounts.map((r: any) => [r.uid, Number(r.cnt)]));

    return assignments.map(a => ({
      assignmentId: a.id,
      judge: {
        id: a.judge.id,
        name: a.judge.name,
        email: a.judge.email,
        institution: a.judge.institution,
      },
      scoredCount: scoredMap.get(a.judgeUserId) || 0,
      assignedAt: a.assignedAt,
    }));
  }

  async getScoresForCompetition(competitionId: string) {
    const registrations = await this.registrationRepo
      .createQueryBuilder('r')
      .leftJoinAndSelect('r.user', 'user')
      .leftJoinAndSelect('r.paperSubmission', 'paper')
      .where('r.competitionId = :cid', { cid: competitionId })
      .andWhere('r.status IN (:...statuses)', { statuses: REVIEWABLE_STATUSES })
      .orderBy('r.registrationTime', 'ASC')
      .getMany();

    const scores = await this.scoreRepo.find({
      where: { competitionId },
      relations: ['judge'],
      order: { scoredAt: 'DESC' },
    });

    const scoresByReg = new Map<number, typeof scores>();
    for (const s of scores) {
      const arr = scoresByReg.get(s.registrationId) || [];
      arr.push(s);
      scoresByReg.set(s.registrationId, arr);
    }

    return registrations.map((reg) => {
      const regScores = scoresByReg.get(reg.id) || [];
      const avgScore =
        regScores.length > 0
          ? regScores.reduce((sum, s) => sum + Number(s.totalScore), 0) / regScores.length
          : null;

      return {
        registrationId: reg.id,
        user: {
          id: reg.user.id,
          name: reg.user.name,
          institution: reg.user.institution,
        },
        paperTitle: reg.paperSubmission?.paperTitle || '(未提交)',
        status: reg.status,
        scores: regScores.map((s) => ({
          id: s.id,
          judgeName: s.judge.name,
          judgeId: s.judgeUserId,
          totalScore: s.totalScore,
          criteriaScores: s.criteriaScores,
          comments: s.comments,
          scoredAt: s.scoredAt,
        })),
        judgeCount: regScores.length,
        avgScore: avgScore !== null ? Math.round(avgScore * 100) / 100 : null,
      };
    });
  }

  async getAllJudges() {
    return this.userRepo.find({
      where: { role: UserRole.JUDGE },
      select: ['id', 'name', 'email', 'institution'],
      order: { name: 'ASC' },
    });
  }

  async updateScoringCriteria(
    competitionId: string,
    criteria: Array<{ name: string; maxScore: number; description?: string; weight?: number }>,
  ) {
    const competition = await this.competitionRepo.findOne({ where: { id: competitionId } });
    if (!competition) {
      throw new NotFoundException('竞赛不存在');
    }
    competition.scoringCriteria = criteria;
    return this.competitionRepo.save(competition);
  }
}
