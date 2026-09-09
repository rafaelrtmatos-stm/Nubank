import { AppCustomData, Contact, Transaction } from '../types';

export const INITIAL_CONTACTS: Contact[] = [];

export const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: 'tx-mock-1',
    type: 'pix_receive',
    title: 'Transferência recebida',
    subtitle: 'Mercado & Conveniência Silva Ltda - Pix',
    amount: 1250.00,
    date: 'Hoje, 14:32',
    category: 'Vendas',
  },
  {
    id: 'tx-mock-2',
    type: 'pix_send',
    title: 'Transferência enviada',
    subtitle: 'Distribuidora de Bebidas Brasil - Pix',
    amount: -480.50,
    date: 'Hoje, 11:15',
    category: 'Fornecedores',
  },
  {
    id: 'tx-mock-3',
    type: 'pix_receive',
    title: 'Transferência recebida',
    subtitle: 'Mariana Souza Costa - Pix',
    amount: 320.00,
    date: 'Hoje, 09:40',
    category: 'Recebimentos',
  },
  {
    id: 'tx-mock-4',
    type: 'bill_payment',
    title: 'Pagamento de boleto',
    subtitle: 'Enel Distribuição São Paulo',
    amount: -285.90,
    date: 'Ontem',
    category: 'Contas e Serviços',
  },
  {
    id: 'tx-mock-5',
    type: 'pix_receive',
    title: 'Transferência recebida',
    subtitle: 'Carlos Eduardo Mendes - Pix',
    amount: 850.00,
    date: 'Ontem',
    category: 'Serviços',
  },
  {
    id: 'tx-mock-6',
    type: 'card_expense',
    title: 'Compra no cartão corporativo',
    subtitle: 'Posto Ipiranga Combustíveis',
    amount: -195.40,
    date: '07 SET',
    category: 'Transporte',
  },
  {
    id: 'tx-mock-7',
    type: 'pix_receive',
    title: 'Transferência recebida',
    subtitle: 'Studio Criativo Design Ltda - Pix',
    amount: 2400.00,
    date: '06 SET',
    category: 'Consultoria',
  },
  {
    id: 'tx-mock-8',
    type: 'bill_payment',
    title: 'Pagamento de boleto',
    subtitle: 'Claro Brasil Telecomunicações',
    amount: -149.90,
    date: '05 SET',
    category: 'Internet e Telefonia',
  },
  {
    id: 'tx-mock-9',
    type: 'pix_send',
    title: 'Transferência enviada',
    subtitle: 'Lucas Ferreira Consultoria - Pix',
    amount: -750.00,
    date: '04 SET',
    category: 'Honorários',
  },
  {
    id: 'tx-mock-10',
    type: 'pix_receive',
    title: 'Transferência recebida',
    subtitle: 'Ana Beatriz Nogueira - Pix',
    amount: 540.00,
    date: '03 SET',
    category: 'Vendas',
  },
  {
    id: 'tx-mock-11',
    type: 'card_expense',
    title: 'Compra no cartão corporativo',
    subtitle: 'Kalunga Papelaria e Informática',
    amount: -329.80,
    date: '02 SET',
    category: 'Materiais de Escritório',
  },
  {
    id: 'tx-mock-12',
    type: 'pix_receive',
    title: 'Transferência recebida',
    subtitle: 'Restaurante Sabor Caseiro - Pix',
    amount: 1180.00,
    date: '01 SET',
    category: 'Alimentação / Eventos',
  },
];

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


