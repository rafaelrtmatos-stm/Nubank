import { AppCustomData, Contact, Transaction } from '../types';

// Diverse pool of modern Brazilian names (excluding previous static names)
const FIRST_NAMES = [
  'Gabriel', 'Matheus', 'Lucas', 'Felipe', 'Rodrigo', 'Bruno', 'Thiago', 'Guilherme',
  'Leonardo', 'Gustavo', 'Rafael', 'Vinicius', 'Eduardo', 'André', 'Caio', 'Renan',
  'Daniel', 'Marcelo', 'Fernando', 'Juliana', 'Camila', 'Beatriz', 'Larissa', 'Mariana',
  'Amanda', 'Fernanda', 'Bruna', 'Carolina', 'Letícia', 'Natália', 'Jéssica', 'Patrícia',
  'Vanessa', 'Renata', 'Tatiane', 'Aline', 'Priscila', 'Bianca', 'Luana', 'Lorena',
  'Henrique', 'Vitor', 'Diego', 'Murilo', 'Samuel', 'Isabela', 'Helena', 'Clara'
];

const LAST_NAMES = [
  'Silva', 'Santos', 'Oliveira', 'Souza', 'Rodrigues', 'Ferreira', 'Alves', 'Pereira',
  'Lima', 'Gomes', 'Costa', 'Ribeiro', 'Martins', 'Carvalho', 'Almeida', 'Lopes',
  'Soares', 'Fernandes', 'Vieira', 'Barbosa', 'Rocha', 'Dias', 'Nascimento', 'Andrade',
  'Moreira', 'Nunes', 'Marques', 'Machado', 'Mendes', 'Freitas', 'Cardoso', 'Ramos',
  'Gonçalves', 'Santana', 'Teixeira', 'Moraes', 'Cavalcanti', 'Pinto', 'Castro', 'Azevedo'
];

const COMPANY_PREFIXES = [
  'Aurora', 'Inovare', 'Vanguard', 'Aliança', 'Nexus', 'Ponto Certo', 'Triângulo',
  'Delta', 'Conecta', 'BioTech', 'Terra Viva', 'Lumina', 'Global Log', 'Realize',
  'Sinergia', 'Ápice', 'Valle', 'Prime Sul', 'Alfa', 'Nova Era', 'Horizonte', 'Omni'
];

const COMPANY_SECTORS = [
  'Alimentos e Bebidas', 'Soluções Digitais', 'Consultoria Empresarial', 'Peças e Acessórios',
  'Engenharia e Projetos', 'Comunicação Visual', 'Transportes e Logística', 'Clínica e Diagnósticos',
  'Contabilidade e Finanças', 'Comércio Atacadista', 'Farmácia e Drogaria', 'Restaurante e Gastronomia',
  'Materiais de Construção', 'Assessoria Jurídica', 'Distribuidora', 'Serviços Médicos'
];

const COMPANY_SUFFIXES = ['Ltda', 'S.A.', 'ME', 'EPP'];

const INSTITUTIONS = [
  'Nu Pagamentos S.A.',
  'Nu Pagamentos - IP',
  'Banco Itaú Unibanco S.A.',
  'Banco Bradesco S.A.',
  'Banco do Brasil S.A.',
  'Banco Santander (Brasil) S.A.',
  'Banco Inter S.A.',
  'Banco C6 S.A.',
  'Caixa Econômica Federal',
  'Mercado Pago IP Ltda',
  'Banco Cooperativo Sicredi S.A.',
  'PicPay Serviços S.A.',
  'Banco BTG Pactual S.A.',
  'Banco PagBank S.A.'
];

const UTILITY_COMPANIES = [
  'Enel Distribuição de Energia',
  'Sabesp Saneamento Básico',
  'Comgás Companhia de Gás',
  'Claro Brasil Telecomunicações',
  'Vivo Telefônica Brasil S.A.',
  'CPFL Energia Paulista',
  'Light Serviços de Eletricidade',
  'Copel Distribuição Paraná',
  'Cemig Distribuição S.A.',
  'DAS Simples Nacional da Receita',
  'Condomínio Empresarial Corporate Tower',
  'Localiza Gestão de Frotas'
];

const CARD_MERCHANTS = [
  'Posto Shell Combustíveis',
  'Posto Ipiranga Auto Posto',
  'Google Workspace GSuite',
  'Amazon Web Services AWS',
  'Mercado Livre Marketplace',
  'Drogaria São Paulo Farmácia',
  'Kalunga Papelaria e Suprimentos',
  'Leroy Merlin Materiais',
  'Supermercados Pão de Açúcar',
  'Microsoft Cloud Subscriptions'
];

function pickRandom<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'NU';
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function generateRandomCpfMasked(): string {
  const n1 = randomInt(100, 999);
  const n2 = randomInt(100, 999);
  return `***.${n1}.${n2}-**`;
}

function generateRandomCnpj(): string {
  const n1 = randomInt(10, 99);
  const n2 = randomInt(100, 999);
  const n3 = randomInt(100, 999);
  const n4 = randomInt(10, 99);
  return `${n1}.${n2}.${n3}/0001-${n4}`;
}

function generateRandomPhone(): string {
  const ddd = pickRandom([11, 19, 21, 27, 31, 41, 47, 51, 61, 71, 81, 85, 91, 92, 98]);
  const part1 = randomInt(91000, 99999);
  const part2 = randomInt(1000, 9999);
  return `(${ddd}) ${part1}-${part2}`;
}

function generateRandomPersonName(): string {
  const first = pickRandom(FIRST_NAMES);
  const mid = pickRandom(LAST_NAMES);
  const last = pickRandom(LAST_NAMES);
  return `${first} ${mid} ${last}`;
}

function generateRandomCompanyName(): string {
  const prefix = pickRandom(COMPANY_PREFIXES);
  const sector = pickRandom(COMPANY_SECTORS);
  const suffix = pickRandom(COMPANY_SUFFIXES);
  return `${prefix} ${sector} ${suffix}`;
}

/**
 * Gera dinamicamente contatos brasileiros aleatórios e realistas.
 * Nenhum contato é fixo, garantindo que cada usuário / primeiro acesso tenha contatos exclusivos.
 */
export function generateRandomContacts(count = 12): Contact[] {
  const contacts: Contact[] = [];
  const usedNames = new Set<string>();

  for (let i = 0; i < count; i++) {
    const isCompany = Math.random() > 0.45;
    let name = '';
    let attempts = 0;
    do {
      name = isCompany ? generateRandomCompanyName() : generateRandomPersonName();
      attempts++;
    } while (usedNames.has(name) && attempts < 10);
    usedNames.add(name);

    const institution = pickRandom(INSTITUTIONS);
    const isNu = institution.toLowerCase().includes('nu');
    const agency = isNu ? '0001' : `${randomInt(1000, 4500)}`;
    const account = isNu
      ? `${randomInt(10000000, 99999999)}-${randomInt(0, 9)}`
      : `${randomInt(10000, 99999)}-${randomInt(0, 9)}`;

    const keyType = randomInt(1, 4);
    let pixKey = '';
    if (keyType === 1) {
      pixKey = generateRandomPhone();
    } else if (keyType === 2) {
      const cleanName = name.split(' ')[0].toLowerCase();
      pixKey = `${cleanName}.${randomInt(10, 99)}@gmail.com`;
    } else if (keyType === 3) {
      pixKey = isCompany ? generateRandomCnpj() : generateRandomCpfMasked().replace(/\*/g, `${randomInt(1, 9)}`);
    } else {
      pixKey = `${Math.random().toString(36).substring(2, 10)}-${Math.random().toString(36).substring(2, 6)}-4${Math.random().toString(36).substring(2, 5)}`;
    }

    contacts.push({
      id: `contact-dynamic-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 7)}`,
      name,
      initials: getInitials(name),
      document: isCompany ? generateRandomCnpj() : generateRandomCpfMasked(),
      institution,
      accountType: isCompany ? 'Conta Corrente PJ' : pickRandom(['Conta Corrente', 'Conta de pagamentos', 'Conta Poupança']),
      pixKey,
      agency,
      account,
    });
  }

  return contacts;
}

/**
 * Gera datas relativas realistas para o extrato (Hoje, Ontem, ou DD MMM).
 */
function getRelativeDateStr(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  const months = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
  const day = String(d.getDate()).padStart(2, '0');
  const month = months[d.getMonth()];
  const hh = String(randomInt(8, 20)).padStart(2, '0');
  const mm = String(randomInt(10, 58)).padStart(2, '0');
  if (daysAgo === 0) return `Hoje, ${hh}:${mm}`;
  if (daysAgo === 1) return `Ontem, ${hh}:${mm}`;
  return `${day} ${month}`;
}

/**
 * Gera dinamicamente um histórico de extrato bancário realista, 100% fictício e diversificado.
 * Nenhum valor ou nome é fixo, garantindo extrato único a cada novo acesso.
 */
export function generateRandomTransactions(count = 14): Transaction[] {
  const transactions: Transaction[] = [];
  const now = new Date();
  const ymd = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;

  for (let i = 0; i < count; i++) {
    const roll = Math.random();
    const daysAgo = Math.floor(i / 1.7);
    const date = getRelativeDateStr(daysAgo);
    const uniqueId = `E${randomInt(100000, 999999)}${ymd}${randomInt(100000, 999999)}s${Math.random().toString(36).substring(2, 10)}`;

    if (roll < 0.45) {
      // Pix Recebido (Entrada positiva)
      const sender = Math.random() > 0.4 ? generateRandomCompanyName() : generateRandomPersonName();
      const amount = parseFloat((randomInt(80, 4500) + Math.random()).toFixed(2));
      transactions.push({
        id: uniqueId,
        type: 'pix_receive',
        title: 'Transferência recebida',
        subtitle: `${sender} - Pix`,
        amount,
        date,
        category: pickRandom(['Vendas', 'Serviços', 'Recebimentos Comerciais', 'Honorários']),
      });
    } else if (roll < 0.75) {
      // Pix Enviado (Saída negativa)
      const recipient = Math.random() > 0.5 ? generateRandomCompanyName() : generateRandomPersonName();
      const amount = -parseFloat((randomInt(45, 2200) + Math.random()).toFixed(2));
      transactions.push({
        id: uniqueId,
        type: 'pix_send',
        title: 'Transferência enviada',
        subtitle: `${recipient} - Pix`,
        amount,
        date,
        category: pickRandom(['Fornecedores', 'Pagamentos', 'Serviços Terceirizados', 'Operacional']),
      });
    } else if (roll < 0.90) {
      // Pagamento de Boleto
      const utility = pickRandom(UTILITY_COMPANIES);
      const amount = -parseFloat((randomInt(85, 950) + Math.random()).toFixed(2));
      transactions.push({
        id: uniqueId,
        type: 'bill_payment',
        title: 'Pagamento de boleto',
        subtitle: utility,
        amount,
        date,
        category: pickRandom(['Contas e Serviços', 'Tributos', 'Infraestrutura']),
      });
    } else {
      // Compra Cartão Corporativo
      const merchant = pickRandom(CARD_MERCHANTS);
      const amount = -parseFloat((randomInt(30, 480) + Math.random()).toFixed(2));
      transactions.push({
        id: uniqueId,
        type: 'card_expense',
        title: 'Compra no cartão corporativo',
        subtitle: merchant,
        amount,
        date,
        category: pickRandom(['Transporte', 'Alimentação', 'Materiais de Escritório', 'Tecnologia']),
      });
    }
  }

  return transactions;
}

/**
 * Cria um conjunto inicial fresco de dados do aplicativo.
 * Chamado dinamicamente para cada novo visitante ou quando resetado.
 */
export function generateFreshAppData(): AppCustomData {
  return {
    userName: '',
    userInitials: '',
    agency: '0001',
    accountNumber: '',
    companyName: '',
    cnpj: '',
    accountTitle: 'Conta Nu Empresas',

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

    simulatedPixSender: '',
    simulatedPixAmount: 0,
    simulatedPixBank: '',
    simulatedPixMessage: '',
    pixNotificationSound: true,
    pixAutoCreditBalance: true,

    contacts: [],
    transactions: generateRandomTransactions(14),
  };
}

// Retrocompatibilidade para referências existentes
export const INITIAL_CONTACTS: Contact[] = [];
export const INITIAL_TRANSACTIONS: Transaction[] = generateRandomTransactions(14);
export const DEFAULT_APP_DATA: AppCustomData = generateFreshAppData();
