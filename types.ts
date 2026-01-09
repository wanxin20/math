
export enum RegistrationStatus {
  NOT_STARTED = 'NOT_STARTED',
  PENDING_PAYMENT = 'PENDING_PAYMENT',
  PAID = 'PAID',
  SUBMITTED = 'SUBMITTED'
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
