import { AppCustomData, Contact, Transaction } from '../types';

export const INITIAL_CONTACTS: Contact[] = [];

export const INITIAL_TRANSACTIONS: Transaction[] = [];

export const DEFAULT_APP_DATA: AppCustomData = {
  userName: '',
  userInitials: '',
  agency: '',
  accountNumber: '',
  companyName: '',
  cnpj: '',
  accountTitle: 'Conta Nu Empresas',

  // Senha de acesso definida inicialmente vazia até ser configurada pelo usuário
  accessPin: '',

  balance: 0,
  creditCardLimit: 'R$ 0,00',
  loanLimit: 'R$ 0',

  showReminder: false,
  reminderTitle: '',
  reminderSubtitle: '',
  bannerTitle: '',
  bannerSubtitle: '',

  defaultRecipientName: '',
  defaultRecipientInitials: '',
  defaultRecipientDoc: '',
  defaultRecipientInstitution: '',
  defaultRecipientAccountType: '',
  defaultTransferAmount: 0,

  loginTitle: 'Queremos deixar seu roxinho ainda mais protegido. Por isso, sempre vamos pedir uma senha para acessar o aplicativo.',
  loginButtonText: 'Criar senha de acesso',
  loginHelperText: 'Essa senha será usada sempre que você abrir o app.',
  skipIntroText: 'Pular esta explicação da próxima vez...',

  // Configuração da Simulação Pix
  simulatedPixSender: '',
  simulatedPixAmount: 0,
  simulatedPixBank: '',
  simulatedPixMessage: '',
  pixNotificationSound: true,
  pixAutoCreditBalance: true,

  contacts: INITIAL_CONTACTS,
  transactions: INITIAL_TRANSACTIONS,
};


