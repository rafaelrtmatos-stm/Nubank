import { AppCustomData, Contact, Transaction } from '../types';

export const INITIAL_CONTACTS: Contact[] = [
  {
    id: '1',
    name: 'Papelaria & Suprimentos Modelo Ltda',
    initials: 'PM',
    document: '00.123.456/0001-00',
    institution: 'Nu Pagamentos S.A.',
    accountType: 'Conta Corrente PJ',
    agency: '0001',
    account: '10928374-5',
    pixKey: 'financeiro@papelariamodelo.exemplo.com'
  },
  {
    id: '2',
    name: 'Tech Inovação Serviços Digitais Ltda',
    initials: 'TI',
    document: '11.222.333/0001-44',
    institution: 'Nu Pagamentos S.A.',
    accountType: 'Conta de pagamentos PJ',
    agency: '0001',
    account: '98472019-3',
    pixKey: 'contato@techinovacao.exemplo.com'
  },
  {
    id: '3',
    name: 'Distribuidora Exemplo de Alimentos ME',
    initials: 'DA',
    document: '22.333.444/0001-55',
    institution: 'BANCO BRADESCO S.A.',
    accountType: 'Conta Jurídica PJ',
    agency: '0001',
    account: '55432198-0',
    pixKey: '22333444000155'
  },
  {
    id: '4',
    name: 'Lucas Silva (Cliente Exemplo)',
    initials: 'LS',
    document: '***.123.456-**',
    institution: 'BANCO ITAÚ UNIBANCO S.A.',
    accountType: 'Conta Corrente',
    agency: '0001',
    account: '33495810-7',
    pixKey: 'lucas.exemplo@emailficticio.com'
  },
  {
    id: '5',
    name: 'Marina Oliveira (Consultoria Fictícia)',
    initials: 'MO',
    document: '***.987.654-**',
    institution: 'Nu Pagamentos S.A.',
    accountType: 'Conta Pessoa Física',
    agency: '0001',
    account: '77651092-4',
    pixKey: 'marina.consultoria@emailficticio.com'
  }
];

export const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: 'tx-1',
    title: 'Transferência enviada',
    subtitle: 'Papelaria & Suprimentos Modelo Ltda',
    amount: -340.50,
    date: 'Hoje, 14:22',
    category: 'Suprimentos',
    type: 'pix_send'
  },
  {
    id: 'tx-2',
    title: 'Transferência recebida',
    subtitle: 'Tech Inovação Serviços Digitais Ltda',
    amount: 1850.00,
    date: 'Hoje, 10:15',
    category: 'Vendas',
    type: 'pix_receive'
  },
  {
    id: 'tx-3',
    title: 'Pagamento de boleto',
    subtitle: 'Energia Elétrica Comercial Demo',
    amount: -428.90,
    date: 'Ontem',
    category: 'Contas de consumo',
    type: 'bill_payment'
  },
  {
    id: 'tx-4',
    title: 'Transferência recebida',
    subtitle: 'Distribuidora Exemplo de Alimentos ME',
    amount: 620.00,
    date: 'Ontem',
    category: 'Recebimentos',
    type: 'pix_receive'
  },
  {
    id: 'tx-5',
    title: 'Transferência enviada',
    subtitle: 'Manutenção Predial Modelo Ltda',
    amount: -180.00,
    date: '04 mar',
    category: 'Manutenção',
    type: 'pix_send'
  },
  {
    id: 'tx-6',
    title: 'Transferência recebida',
    subtitle: 'Marina Oliveira (Consultoria Fictícia)',
    amount: 950.00,
    date: '02 mar',
    category: 'Consultoria',
    type: 'pix_receive'
  },
  {
    id: 'tx-7',
    title: 'Pagamento de fatura',
    subtitle: 'Internet Corporativa Fibra Demo',
    amount: -199.90,
    date: '01 mar',
    category: 'Telecom',
    type: 'bill_payment'
  }
];

export const DEFAULT_APP_DATA: AppCustomData = {
  userName: 'João Silva (Exemplo)',
  userInitials: 'JS',
  agency: '0001',
  accountNumber: '1234567-8',
  companyName: 'Empresa Exemplo Soluções Ltda',
  cnpj: '00.123.456/0001-00',
  accountTitle: 'Conta Nu Empresas',

  // Senha de acesso definida inicialmente vazia até ser configurada
  accessPin: '',

  balance: 14580.42,
  creditCardLimit: 'R$ 15.000,00',
  loanLimit: 'R$ 35.000',

  showReminder: true,
  reminderTitle: 'Lembrete: Realize o Pagamento',
  reminderSubtitle: 'Boleto de fornecedor vence hoje',
  bannerTitle: 'Capital de Giro Nu',
  bannerSubtitle: 'Crédito pré-aprovado de até R$ 25.000',

  defaultRecipientName: 'Papelaria & Suprimentos Modelo Ltda',
  defaultRecipientInitials: 'PM',
  defaultRecipientDoc: '00.123.456/0001-00',
  defaultRecipientInstitution: 'Nu Pagamentos S.A.',
  defaultRecipientAccountType: 'Conta Corrente PJ',
  defaultTransferAmount: 340.50,

  loginTitle: 'Queremos deixar seu roxinho ainda mais protegido. Por isso, sempre vamos pedir uma senha para acessar o aplicativo.',
  loginButtonText: 'Criar senha de acesso',
  loginHelperText: 'Essa senha será usada sempre que você abrir o app.',
  skipIntroText: 'Pular esta explicação da próxima vez...',

  // Configuração fictícia da Simulação Pix
  simulatedPixSender: 'CLIENTE EXEMPLO SERVIÇOS LTDA',
  simulatedPixAmount: 450.00,
  simulatedPixBank: 'Nu Pagamentos S.A.',
  simulatedPixMessage: 'Pagamento de serviços fictícios prestados',
  pixNotificationSound: true,
  pixAutoCreditBalance: true,

  contacts: INITIAL_CONTACTS,
  transactions: INITIAL_TRANSACTIONS,
};

