import { User, UserRegistration, RegistrationStatus } from '../../types';
import { Language } from '../../i18n';

export interface DashboardProps {
  user: User;
  registrations: UserRegistration[];
  onPay: (compId: string) => void;
  onSubmit: (compId: string, fileNameOrLabel: string) => void;
  onUpdateUser?: (user: User) => void;
  lang: Language;
}

export interface NotificationState {
  show: boolean;
  title: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
}

export interface ConfirmDialogState {
  show: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  confirmText?: string;
  cancelText?: string;
}

export interface PaymentModalState {
  show: boolean;
  qrCodeUrl: string;
  registrationId: number;
  amount: number;
  description: string;
}

export interface InvoiceFlowState {
  step: 'ask' | 'form';
  compId: string;
  registrationId: number;
}

export interface InvoiceFormData {
  invoiceTitle: string;
  invoiceTaxNo: string;
  invoiceAddress: string;
  invoicePhone: string;
  invoiceEmail: string;
}
