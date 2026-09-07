import { AppCustomData, Contact, Transaction } from '../types';

export const INITIAL_CONTACTS: Contact[] = [
  {
    id: '1',
    name: 'V Mendes Ribeiro Comercio Ltda',
    initials: 'VM',
    document: '42.189.204/0001-90',
    institution: 'BCO DO BRASIL S.A.',
    accountType: 'Conta Corrente PJ',
    agency: '0001',
    account: '279399852-7',
    pixKey: 'financeiro@vmendes.com.br'
  },
  {
    id: '2',
    name: 'José Miguel Ospino Pinto',
    initials: 'JP',
    document: '***.451.890-**',
    institution: 'NU PAGAMENTOS - IP',
    accountType: 'Conta de pagamentos',
    agency: '0001',
    account: '279399852-7',
    pixKey: 'jose.pinto@email.com'
  },
  {
    id: '3',
    name: '61.557.754 Williams Caleb Ramos Rodrigues',
    initials: 'WC',
    document: '61.557.754/0001-30',
    institution: 'NU PAGAMENTOS - IP',
    accountType: 'Conta de pagamentos',
    agency: '0001',
    account: '18492048-2',
    pixKey: '61557754000130'
  },
  {
    id: '5',
    name: '29 048 207 Octavio Augusto Dantas da Silva',
    initials: 'OA',
    document: '29.048.207/0001-14',
    institution: 'BANCO BRADESCO S.A.',
    accountType: 'Conta Corrente PJ',
    agency: '0001',
    account: '39485721-0',
    pixKey: '29048207000114'
  },
  {
    id: '6',
    name: '49.181.668 Tiago Pinheiro Rodrigues',
    initials: 'TP',
    document: '49.181.668/0001-85',
    institution: 'BANCO ITAÚ UNIBANCO S.A.',
    accountType: 'Conta Jurídica PJ',
    agency: '0001',
    account: '58473920-1',
    pixKey: '49181668000185'
  }
];

export const INITIAL_TRANSACTIONS: Transaction[] = [];

export const DEFAULT_APP_DATA: AppCustomData = {
  userName: '',
  userInitials: '',
  agency: '',
  accountNumber: '',
  companyName: '',
  cnpj: '',
  accountTitle: 'Conta Nu Empresas',

  // Vazio até o usuário definir uma senha de acesso no primeiro uso do app
  accessPin: '',

  balance: 0,
  creditCardLimit: 'R$ 0,00',
  loanLimit: 'R$ 0',

  showReminder: true,
  reminderTitle: 'Lembrete: Realize o Pagamento',
  reminderSubtitle: 'Boleto de fornecedor vence hoje',
  bannerTitle: 'Capital de Giro Nu',
  bannerSubtitle: 'Crédito pré-aprovado de até R$ 25.000',

  defaultRecipientName: 'V Mendes Ribeiro Comercio Ltda',
  defaultRecipientInitials: 'VM',
  defaultRecipientDoc: '42.189.204/0001-90',
  defaultRecipientInstitution: 'Nu Pagamentos S.A.',
  defaultRecipientAccountType: 'Conta Corrente PJ',
  defaultTransferAmount: 0.00,

  loginTitle: 'Queremos deixar seu roxinho ainda mais protegido. Por isso, sempre vamos pedir uma senha para acessar o aplicativo.',
  loginButtonText: 'Criar senha de acesso',
  loginHelperText: 'Essa senha será usada sempre que você abrir o app.',
  skipIntroText: 'Pular esta explicação da próxima vez...',

  // Configuração padrão da Simulação Pix
  simulatedPixSender: 'MARCOS ANTONIO DE SOUZA',
  simulatedPixAmount: 350.00,
  simulatedPixBank: 'Banco Santander (Brasil) S.A.',
  simulatedPixMessage: 'Pagamento referente aos serviços prestados',
  pixNotificationSound: true,
  pixAutoCreditBalance: true,

  contacts: INITIAL_CONTACTS,
  transactions: INITIAL_TRANSACTIONS,
};
