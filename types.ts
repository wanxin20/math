
export enum RegistrationStatus {
  NOT_STARTED = 'NOT_STARTED',
  PENDING_SUBMISSION = 'PENDING_SUBMISSION', // 待提交（可上传文件暂存）
  PENDING_PAYMENT = 'PENDING_PAYMENT', // 待支付（点击提交后）
  SUBMITTED = 'SUBMITTED', // 已提交（支付成功）
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
}

export interface User {
  id: string;
  name: string;
  email: string;
  institution: string;
  title: string;
  phone: string;
  role?: 'user' | 'admin';
}

export interface UserRegistration {
  competitionId: string;
  status: RegistrationStatus;
  paymentTime?: string;
  submissionFile?: string;
  submissionTime?: string;
}

export interface AppState {
  user: User | null;
  registrations: UserRegistration[];
}