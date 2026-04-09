
export enum RegistrationStatus {
  NOT_STARTED = 'NOT_STARTED',
  PENDING_SUBMISSION = 'PENDING_SUBMISSION', // 待提交（可上传文件暂存）
  PENDING_PAYMENT = 'PENDING_PAYMENT', // 待支付（点击提交后）
  SUBMITTED = 'SUBMITTED', // 已提交（支付成功）
  REVISION_REQUIRED = 'REVISION_REQUIRED', // 需要修改（管理员退回，已支付，重新提交无需再次支付）
  UNDER_REVIEW = 'UNDER_REVIEW',
  REVIEWED = 'REVIEWED',
  AWARDED = 'AWARDED',
  REJECTED = 'REJECTED'
}

export interface Competition {
  id: string;
  title: string;
  description: string;
  fee: number;
  deadline: string;
  category: string;
  coverImageUrl?: string;
  problemAttachmentUrl?: string;
  problemAttachmentName?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  institution: string;
  title: string;
  grade?: string;
  phone: string;
  role?: 'user' | 'admin' | 'judge';
}

export interface TeamMember {
  id?: number;
  name: string;
  institution: string;
  title?: string;
  phone?: string;
  email?: string;
  sortOrder?: number;
}

export interface Advisor {
  id?: number;
  name: string;
  institution: string;
  title?: string;
  phone: string;
  email?: string;
  sortOrder?: number;
}

export interface UserRegistration {
  competitionId: string;
  status: RegistrationStatus;
  paymentTime?: string;
  submissionFile?: string;
  submissionTime?: string;
}

export interface ScoringCriteria {
  name: string;
  maxScore: number;
  description?: string;
  weight?: number;
}

export interface CriteriaScore {
  name: string;
  score: number;
  maxScore: number;
}

export interface JudgeAssignedCompetition {
  assignmentId: number;
  competition: {
    id: string;
    title: string;
    category: string;
    status: string;
    deadline: string;
    scoringCriteria: ScoringCriteria[] | null;
  };
  totalSubmissions: number;
  scoredCount: number;
  assignedAt: string;
}

export interface JudgeSubmission {
  registrationId: number;
  status: string;
  registrationTime: string;
  user: { id: string; name: string; institution: string; title: string };
  paperSubmission: {
    id: number;
    paperTitle: string;
    paperAbstract?: string;
    paperKeywords?: string;
    submissionFileName: string;
    submissionFileUrl: string;
    submissionFiles?: Array<{ fileName: string; fileUrl: string; size?: number; mimetype?: string }>;
    submissionTime: string;
    researchField?: string;
  } | null;
  teamMembers: TeamMember[];
  myScore: {
    id: number;
    totalScore: number;
    criteriaScores: CriteriaScore[] | null;
    comments: string | null;
    scoredAt: string;
  } | null;
}

export interface ScoreSummaryItem {
  registrationId: number;
  user: { id: string; name: string; institution: string };
  paperTitle: string;
  status: string;
  scores: Array<{
    id: number;
    judgeName: string;
    judgeId: string;
    totalScore: number;
    criteriaScores: CriteriaScore[] | null;
    comments: string | null;
    scoredAt: string;
  }>;
  judgeCount: number;
  avgScore: number | null;
}

export interface AppState {
  user: User | null;
  registrations: UserRegistration[];
}