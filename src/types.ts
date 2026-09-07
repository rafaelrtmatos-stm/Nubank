export type ScreenName = 
  | 'Splash'
  | 'Login' 
  | 'Home' 
  | 'PaymentOptions' 
  | 'AreaPix' 
  | 'SelectRecipient'
  | 'Transfer' 
  | 'ConfirmTransfer' 
  | 'Receipt'
  | 'ScanQrCode';

export interface Contact {
  id: string;
  name: string;
  initials: string;
  document: string;
  institution: string;
  accountType: string;
  pixKey?: string;
  agency?: string;
  account?: string;
}

export interface Transaction {
  id: string;
  type: 'pix_send' | 'pix_receive' | 'bill_payment' | 'card_expense';
  title: string;
  subtitle: string;
  amount: number;
  date: string;
  category?: string;
  recipient?: Contact;
}

export interface TransferData {
  recipient: Contact;
  amount: number;
  message?: string;
  date: string;
  isBillPayment?: boolean;
  dueDate?: string;
  identifierCode?: string;
  nossoNumero?: string;
  barcodeNumber?: string;
  originalDescription?: string;
  transactionId?: string;
  receiptDateFormatted?: string;
}

export interface AppCustomData {
  // Usuário e Empresa
  userName: string;
  userInitials: string;
  agency: string;
  accountNumber: string;
  companyName: string;
  cnpj: string;
  accountTitle: string;

  // Senha de acesso escolhida pelo usuário no primeiro uso (vazio = ainda não configurada)
  accessPin: string;

  // Saldos e Limites
  balance: number;
  creditCardLimit: string;
  loanLimit: string;

  // Lembrete e Banners
  showReminder: boolean;
  reminderTitle: string;
  reminderSubtitle: string;
  bannerTitle: string;
  bannerSubtitle: string;

  // Destinatário padrão
  defaultRecipientName: string;
  defaultRecipientInitials: string;
  defaultRecipientDoc: string;
  defaultRecipientInstitution: string;
  defaultRecipientAccountType: string;
  defaultTransferAmount: number;

  // Textos Login
  loginTitle: string;
  loginButtonText: string;
  loginHelperText: string;
  skipIntroText: string;

  // Configuração da Simulação de Notificação Pix
  simulatedPixSender: string;
  simulatedPixAmount: number;
  simulatedPixBank: string;
  simulatedPixMessage: string;
  pixNotificationSound: boolean;
  pixAutoCreditBalance: boolean;

  // Contatos e Transações
  contacts: Contact[];
  transactions: Transaction[];
}

export interface ActivePixNotification {
  id: string;
  senderName: string;
  amount: number;
  bankName: string;
  message?: string;
  timestamp: string;
}

