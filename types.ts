
export enum RegistrationStatus {
  NOT_STARTED = 'NOT_STARTED',
  PENDING_PAYMENT = 'PENDING_PAYMENT',
  PAID = 'PAID',
  SUBMITTED = 'SUBMITTED',
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