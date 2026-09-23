import * as pdfjsLib from 'pdfjs-dist';
import { prepareImageForFastUpload } from './transferReceiptParser';

// Configure pdfjs worker using unpkg or fallback to avoid cdnjs version mismatch issues
try {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version || '6.3.289'}/build/pdf.worker.min.mjs`;
} catch (e) {
  console.warn('Worker configuration notice:', e);
}

export interface ExtractedBillData {
  beneficiaryName: string;
  beneficiaryCnpj: string;
  beneficiaryBank: string;
  beneficiaryAccountType: string;
  amount: number;
  dueDate: string; // e.g., '20.07.2026' ou '20/07/2026'
  nossoNumero: string;
  unitOrContract?: string;
  payerName?: string;
  payerCpf?: string;
  barcodeNumber?: string;
  rawText?: string;
}

/**
 * Decodes standard Brazilian linha digitável (47 dígitos de boleto bancário, 48 dígitos de concessionária ou 44 dígitos de código de barras)
 */
export function parseLinhaDigitavel(raw: string): Partial<ExtractedBillData> | null {
  const digits = raw.replace(/\D/g, '');
  
  if (digits.length === 47) {
    // Boleto bancário (47 dígitos)
    const bankCode = digits.substring(0, 3);
    const bankMap: Record<string, string> = {
      '001': 'BANCO DO BRASIL S.A.',
      '237': 'BCO BRADESCO S.A.',
      '341': 'ITAU UNIBANCO S.A.',
      '033': 'BCO SANTANDER (BRASIL) S.A.',
      '104': 'CAIXA ECONOMICA FEDERAL',
      '077': 'BANCO INTER S.A.',
      '260': 'NU PAGAMENTOS - IP',
      '748': 'BANCO COOPERATIVO SICREDI S.A.',
      '756': 'BANCO COOPERATIVO DO BRASIL S.A. (BANCOOB)',
      '422': 'BANCO SAFRA S.A.',
      '336': 'BANCO C6 S.A.',
      '041': 'BANCO DO ESTADO DO RIO GRANDE DO SUL S.A. (BANRISUL)',
      '070': 'BANCO DE BRASILIA S.A. (BRB)',
    };
    const bankName = bankMap[bankCode] || `Banco código ${bankCode}`;

    // Valor: últimos 10 dígitos (pos 37 a 47)
    const valDigits = digits.substring(37, 47);
    const amountVal = parseInt(valDigits, 10) / 100;

    // Fator de vencimento (pos 33 a 37 - 4 dígitos)
    let calculatedDueDate = '';
    const fator = parseInt(digits.substring(33, 37), 10);
    if (fator >= 1000) {
      const testCycle1 = new Date(new Date(1997, 9, 7).getTime() + fator * 86400000);
      const targetDate = (testCycle1.getFullYear() < 2024)
        ? new Date(new Date(2022, 4, 29).getTime() + fator * 86400000)
        : testCycle1;
      const day = String(targetDate.getDate()).padStart(2, '0');
      const month = String(targetDate.getMonth() + 1).padStart(2, '0');
      const year = targetDate.getFullYear();
      calculatedDueDate = `${day}/${month}/${year}`;
    }

    const formatted = `${digits.slice(0, 5)}.${digits.slice(5, 10)} ${digits.slice(10, 15)}.${digits.slice(15, 21)} ${digits.slice(21, 26)}.${digits.slice(26, 32)} ${digits.slice(32, 33)} ${digits.slice(33)}`;

    // Banco do Brasil: extrai Nosso Número do campo livre (posições 11 a 20 e 21 a 29)
    let bbNossoNumero = '';
    if (bankCode === '001') {
      const p2 = digits.substring(11, 20);
      const p3 = digits.substring(21, 29);
      bbNossoNumero = p2 + p3;
    }

    return {
      beneficiaryBank: bankName,
      amount: amountVal > 0 ? amountVal : undefined,
      dueDate: calculatedDueDate || undefined,
      barcodeNumber: formatted,
      nossoNumero: bbNossoNumero || undefined,
    };
  } else if (digits.length === 48) {
    // Boleto de arrecadação / concessionária (48 dígitos)
    const segment = digits.charAt(1);
    let bankName = 'Concessionária de Serviços Públicos';
    if (segment === '3') bankName = 'Concessionária de Energia Elétrica';
    if (segment === '2') bankName = 'Concessionária de Água e Saneamento';
    if (segment === '4') bankName = 'Operadora de Telecomunicações';

    // Valor: posições 4 a 15
    const valDigits = digits.substring(4, 11) + digits.substring(12, 16);
    const amountVal = parseInt(valDigits, 10) / 100;

    const formatted = `${digits.slice(0, 12)} ${digits.slice(12, 24)} ${digits.slice(24, 36)} ${digits.slice(36, 48)}`;

    return {
      beneficiaryBank: bankName,
      amount: amountVal > 0 && amountVal < 1000000 ? amountVal : undefined,
      barcodeNumber: formatted,
    };
  } else if (digits.length === 44) {
    // Código de barras FEBRABAN de 44 dígitos
    const bankCode = digits.substring(0, 3);
    const bankMap: Record<string, string> = {
      '001': 'BANCO DO BRASIL S.A.',
      '237': 'BCO BRADESCO S.A.',
      '341': 'ITAU UNIBANCO S.A.',
      '033': 'BCO SANTANDER (BRASIL) S.A.',
      '104': 'CAIXA ECONOMICA FEDERAL',
      '077': 'BANCO INTER S.A.',
      '260': 'NU PAGAMENTOS - IP',
    };
    const bankName = bankMap[bankCode] || 'Banco Emissor';

    let calculatedDueDate = '';
    const fator = parseInt(digits.substring(5, 9), 10);
    if (fator >= 1000) {
      const testCycle1 = new Date(new Date(1997, 9, 7).getTime() + fator * 86400000);
      const targetDate = (testCycle1.getFullYear() < 2024)
        ? new Date(new Date(2022, 4, 29).getTime() + fator * 86400000)
        : testCycle1;
      const day = String(targetDate.getDate()).padStart(2, '0');
      const month = String(targetDate.getMonth() + 1).padStart(2, '0');
      const year = targetDate.getFullYear();
      calculatedDueDate = `${day}/${month}/${year}`;
    }

    const valDigits = digits.substring(9, 19);
    const amountVal = parseInt(valDigits, 10) / 100;

    return {
      beneficiaryBank: bankName,
      amount: amountVal > 0 ? amountVal : undefined,
      dueDate: calculatedDueDate || undefined,
      barcodeNumber: digits,
    };
  }

  return null;
}

/**
 * Extracts invoice/bill details from a PDF file or Image
 * First leverages Gemini Flash Multimodal AI on the backend, with server-side and client-side fallback.
 */
export async function extractBillDataFromPdf(file: File): Promise<ExtractedBillData> {
  // 1. Try Gemini Vision AI & Server-side extraction via /api/extract-bill
  try {
    const { base64Data, mimeType } = await prepareImageForFastUpload(file);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 24000);

    const response = await fetch('/api/extract-bill', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ base64Data, mimeType }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      const json = await response.json();

      if (json.data && (json.data.amount > 0 || json.data.barcodeNumber || json.data.beneficiaryName)) {
        const d = json.data;
        console.log('[Bill Extraction] Dados extraídos recebidos do servidor:', d);

        let barcodeNumber = d.barcodeNumber || '';
        let amount = typeof d.amount === 'number' ? d.amount : parseFloat(String(d.amount).replace(',', '.')) || 0;
        let dueDate = d.dueDate ? d.dueDate.replace(/\//g, '.') : '';
        let nossoNumero = d.nossoNumero || '';
        let beneficiaryBank = d.beneficiaryBank || 'BANCO DO BRASIL S.A.';

        if (barcodeNumber) {
          const barcodeDecoded = parseLinhaDigitavel(barcodeNumber);
          if (barcodeDecoded) {
            if (!amount && barcodeDecoded.amount) amount = barcodeDecoded.amount;
            if (!dueDate && barcodeDecoded.dueDate) dueDate = barcodeDecoded.dueDate;
            if (!nossoNumero && barcodeDecoded.nossoNumero) nossoNumero = barcodeDecoded.nossoNumero;
            if (barcodeDecoded.beneficiaryBank) beneficiaryBank = barcodeDecoded.beneficiaryBank;
          }
        }

        return {
          beneficiaryName: d.beneficiaryName || 'Beneficiário do Boleto',
          beneficiaryCnpj: d.beneficiaryCnpj || '00.000.000/0001-00',
          beneficiaryBank: beneficiaryBank,
          beneficiaryAccountType: d.beneficiaryAccountType || 'Conta corrente',
          amount: amount || 0,
          dueDate: dueDate || new Date().toLocaleDateString('pt-BR').replace(/\//g, '.'),
          nossoNumero: nossoNumero,
          unitOrContract: d.unitOrContract || '',
          payerName: d.payerName || '',
          payerCpf: d.payerCpf || '',
          barcodeNumber: barcodeNumber,
          rawText: `Extrator: ${d.beneficiaryName} - R$ ${amount}`,
        };
      }

      if (json.extractedServerText) {
        console.log('[Bill Extraction] Processando texto extraído do PDF no servidor...');
        const parsed = parseBillText(json.extractedServerText);
        if (parsed.amount > 0 || parsed.barcodeNumber) {
          return parsed;
        }
      }
    }
  } catch (aiErr) {
    console.warn('[Bill Extraction] Tentativa de análise remota falhou ou timeout, usando motor local:', aiErr);
  }

  // 2. Local fallback using PDF.js textContent extraction
  try {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ 
      data: arrayBuffer,
      useWorkerFetch: false,
      useSystemFonts: true,
    } as any);
    const pdf = await loadingTask.promise;

    let fullText = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageStrings = textContent.items
        .map((item: any) => item.str || '')
        .join(' ');
      fullText += ' ' + pageStrings;
    }

    if (fullText.trim().length > 30) {
      return parseBillText(fullText);
    }
  } catch (pdfErr) {
    console.warn('PDF.js textContent notice, attempting binary string fallback:', pdfErr);
  }

  // 3. Raw binary byte scan fallback
  try {
    const arrayBuffer = await file.arrayBuffer();
    const decoder = new TextDecoder('latin1');
    const rawString = decoder.decode(arrayBuffer);
    if (rawString.length > 50) {
      return parseBillText(rawString);
    }
  } catch (rawErr) {
    console.warn('Binary decode error:', rawErr);
  }

  return parseBillText('');
}

/**
 * Parses raw text extracted from the bill/fatura/boleto
 * Optimized for Brazilian utility bills (Equatorial Energia, Enel, Sabesp, CPFL, Copel, etc.) and Boletos Bancários.
 */
export function parseBillText(text: string): ExtractedBillData {
  const clean = text.replace(/\s+/g, ' ');

  // 1. Linha Digitável / Barcode Detection com múltiplos padrões e escaneamento de blocos
  let barcodeNumber = '';
  const barcodePatterns = [
    /\b\d{5}[.\s-]?\d{5}\s+\d{5}[.\s-]?\d{6}\s+\d{5}[.\s-]?\d{6}\s+\d\s+\d{10,14}\b/,
    /\b\d{11,12}[-\s]?\d{0,1}\s+\d{11,12}[-\s]?\d{0,1}\s+\d{11,12}[-\s]?\d{0,1}\s+\d{11,12}[-\s]?\d{0,1}\b/,
    /\b0019\d[\d.\s]{40,55}\d\b/,
    /\b\d{47,48}\b/,
    /\b\d{44}\b/
  ];

  for (const pat of barcodePatterns) {
    const match = clean.match(pat);
    if (match) {
      barcodeNumber = match[0].trim();
      break;
    }
  }

  // Fallback: varredura por sequência de dígitos típica de boleto
  if (!barcodeNumber) {
    const chunks = clean.match(/[\d.\-\s]{35,70}/g) || [];
    for (const chunk of chunks) {
      const d = chunk.replace(/\D/g, '');
      if (d.length === 47 || d.length === 48 || d.length === 44) {
        barcodeNumber = chunk.trim();
        break;
      }
    }
  }

  // Decode linha digitável if available to extract bank and amount
  let decodedFromBarcode: Partial<ExtractedBillData> | null = null;
  if (barcodeNumber) {
    decodedFromBarcode = parseLinhaDigitavel(barcodeNumber);
  }

  // 2. Beneficiary Name & CNPJ
  let beneficiaryName = 'Beneficiário do Boleto';
  let beneficiaryCnpj = '00.000.000/0001-00';
  let beneficiaryBank = decodedFromBarcode?.beneficiaryBank || 'BANCO DO BRASIL S.A.';

  if (/EQUATORIAL/i.test(clean)) {
    beneficiaryName = 'EQUATORIAL PARÁ DISTRIB. DE ENERGIA S.A.';
    beneficiaryCnpj = '04.895.728/0001-80';
    beneficiaryBank = 'BANCO DO BRASIL S.A.';
  } else if (/ENEL/i.test(clean)) {
    beneficiaryName = 'ENEL DISTRIBUIÇÃO';
    beneficiaryCnpj = '61.695.227/0001-93';
  } else if (/SABESP/i.test(clean)) {
    beneficiaryName = 'CIA DE SANEAMENTO BASICO DO ESTADO DE SAO PAULO SABESP';
    beneficiaryCnpj = '43.776.517/0001-80';
  } else if (/CPFL/i.test(clean)) {
    beneficiaryName = 'CPFL ENERGIA S.A.';
  } else if (/COPEL/i.test(clean)) {
    beneficiaryName = 'COPEL DISTRIBUIÇÃO S.A.';
  } else if (/CEMIG/i.test(clean)) {
    beneficiaryName = 'CEMIG DISTRIBUIÇÃO S.A.';
  } else if (/CLARO/i.test(clean)) {
    beneficiaryName = 'CLARO S.A.';
  } else if (/VIVO|TELEFONICA/i.test(clean)) {
    beneficiaryName = 'TELEFÔNICA BRASIL S.A. (VIVO)';
  } else {
    // Generic beneficiary match
    const benefMatch = clean.match(/BENEFICI[AÁ]RIO[^\w\n]*([A-ZÁ-Ú0-9\s.,\-]+?)(?=\s+UNIDADE|\s+CNPJ|\s+AG[EÊ]NCIA|\s+DATA|\s+\d{2}[./]\d{2})/i) ||
                       clean.match(/CEDENTE[^\w\n]*([A-ZÁ-Ú0-9\s.,\-]+?)(?=\s+CNPJ|\s+CPF|\s+AG[EÊ]NCIA|\s+\d)/i);
    if (benefMatch && benefMatch[1]?.trim().length > 3) {
      beneficiaryName = benefMatch[1].trim().toUpperCase();
    }
  }

  // Check CNPJ from text
  const cnpjMatch = clean.match(/CNPJ[:\s]*(\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2})/i);
  if (cnpjMatch && cnpjMatch[1]) {
    beneficiaryCnpj = cnpjMatch[1].trim();
  }

  // 3. Amount (Total a Pagar / Valor do Documento)
  let amount = decodedFromBarcode?.amount || 0;

  // Prioritize "Total a Pagar R$ 534,45" or "(=) VALOR DOCUMENTO 534,45" or "VALOR COBRADO"
  const amountMatch = clean.match(/(?:Total a Pagar|TOTAL A PAGAR|VALOR A PAGAR|VALOR TOTAL|VALOR DO DOCUMENTO|VALOR DOCUMENTO|\(=?\)\s*VALOR DOCUMENTO|VALOR COBRADO|VALOR LIQUIDO|VALOR A SER PAGO|VALOR DA FATURA|TOTAL DA FATURA|VALOR TOTAL A PAGAR)[\s:(=)]*(?:R\$)?\s*([\d.]+,\d{2})/i) ||
                      clean.match(/(?:Total a Pagar|VALOR DO DOCUMENTO|VALOR LIQUIDO|VALOR TOTAL|VALOR A PAGAR)\D{0,35}R\$\s*([\d.]+,\d{2})/i) ||
                      clean.match(/(?:VALOR\s+\(=?\)\s*VALOR\s+DOCUMENTO)\s*\d*\s*(?:R\$)?\s*([\d.]+,\d{2})/i);

  if (amountMatch && amountMatch[1]) {
    const numStr = amountMatch[1].replace(/\./g, '').replace(',', '.');
    const parsed = parseFloat(numStr);
    if (!isNaN(parsed) && parsed > 0) amount = parsed;
  }

  if (amount === 0) {
    // Look for general R$ followed by value
    const generalR$ = clean.match(/R\$\s*([\d.]+,\d{2})/g);
    if (generalR$ && generalR$.length > 0) {
      const last = generalR$[generalR$.length - 1].replace(/R\$\s*/, '').replace(/\./g, '').replace(',', '.');
      const parsed = parseFloat(last);
      if (!isNaN(parsed) && parsed > 0) amount = parsed;
    }
  }

  // 4. Due Date (Vencimento)
  let dueDate = decodedFromBarcode?.dueDate || '';

  // Look for date specifically linked to Vencimento: e.g. "Vencimento 17/08/2026" or table cell after VENCIMENTO
  const dueMatch = clean.match(/(?:VENCIMENTO|Vencimento|Data de Vencimento|Pagar at[eé]|DATA DO VENCIMENTO|Vence em|DATA LIMITE)[\s:A-ZÁ-Ú/.-]{0,70}?(\d{2}[./]\d{2}[./]\d{4})/i) ||
                   clean.match(/(?:PAG[ÁA]VEL\s+PREFERENCIALMENTE[^\n\r]*?)\s*(\d{2}[./]\d{2}[./]\d{4})/i) ||
                   clean.match(/(\d{2}\/\d{2}\/202[4-9])/);

  if (dueMatch && dueMatch[1]) {
    dueDate = dueMatch[1].replace(/\//g, '.');
  } else if (!dueDate) {
    dueDate = new Date().toLocaleDateString('pt-BR').replace(/\//g, '.');
  }

  // 5. Nosso Número
  let nossoNumero = decodedFromBarcode?.nossoNumero || '';
  if (!nossoNumero) {
    const nossoNumMatch = clean.match(/(?:NOSSO N[ÚU]MERO|N[ÚU]MERO DE REFER[ÊE]NCIA)[\s:A-Z/.-]*?(\d{8,20})/i) ||
                          clean.match(/NOSSO N[ÚU]MERO\s*[:\s]*(\d+)/i);
    if (nossoNumMatch) {
      nossoNumero = (nossoNumMatch[1] || nossoNumMatch[0]).trim();
    }
  }

  // 6. Unidade Consumidora / Contrato
  let unitOrContract = '';
  const unitMatch = clean.match(/(?:N[úu]mero da UC|UNIDADE CONSUMIDORA|CONTA CONTRATO|INSTALA[ÇC][ÃA]O)[\s:A-Z/.-]{0,40}?(\d{1,3}\.[\d.\-]+|\d{7,15})/i) ||
                    clean.match(/(\d{1,3}\.\d{3}\.\d{3}\.\d{3}-\d{2})/);
  if (unitMatch) {
    unitOrContract = (unitMatch[1] || unitMatch[0]).trim();
  }

  // 7. Payer Name & CPF
  let payerName = '';
  const payerMatch = clean.match(/(?:NOME DO PAGADOR|PAGADOR|SACADO)[\s\/:A-Z]*?[\s:]+([A-ZÁ-Ú\s]{5,40}?)(?=\s+\d{3}\.|\s+0\d{2}|\s+CPF|\s+TV|\s+RUA|\s+AV|\s+CEP|\s+\d{11})/i) ||
                     clean.match(/RAFAEL TAVARES MATOS/i) ||
                     clean.match(/CLASSIFICA[ÇC][ÃA]O[^\n]+?([A-ZÁ-Ú\s]{5,35})\s+CPF/i);
  if (payerMatch) {
    payerName = (payerMatch[1] || payerMatch[0]).trim().toUpperCase();
  }

  let payerCpf = '';
  const cpfNearName = clean.match(/(?:RAFAEL TAVARES MATOS|[A-ZÁ-Ú]{4,30}\s+[A-ZÁ-Ú]{4,30})\s+(\d{3}\.\d{3}\.\d{3}-\d{2})/i);
  if (cpfNearName) {
    payerCpf = cpfNearName[1];
  } else {
    const cpfExplicit = clean.match(/CPF[:\s]*(\d{3}\.?\d{3}\.?\d{3}-?\d{2}|\*{3}\.\d{3}\.\d{2}\*-\*\*)/i);
    if (cpfExplicit) {
      payerCpf = cpfExplicit[1].trim();
    }
  }

  return {
    beneficiaryName,
    beneficiaryCnpj,
    beneficiaryBank,
    beneficiaryAccountType: 'Conta corrente',
    amount: amount || 0,
    dueDate: dueDate.replace(/\//g, '.'),
    nossoNumero,
    unitOrContract,
    barcodeNumber,
    payerName,
    payerCpf,
    rawText: clean.substring(0, 300),
  };
}

/**
 * Generate standard Nubank transaction ID: E + 31 chars alphanumeric
 */
export function generateNubankTransactionId(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hour = String(now.getHours()).padStart(2, '0');
  const min = String(now.getMinutes()).padStart(2, '0');
  
  const randChars = Math.random().toString(36).substring(2, 8) + Math.random().toString(36).substring(2, 7);
  return `E18236120${year}${month}${day}${hour}${min}s${randChars}`.substring(0, 35);
}

/**
 * Formats current date and time in the exact Nubank receipt style:
 * e.g., "31 AGO 2026 - 05:10:29"
 */
export function formatNubankReceiptDate(date: Date = new Date()): string {
  const months = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
  const day = String(date.getDate()).padStart(2, '0');
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  return `${day} ${month} ${year} - ${hours}:${minutes}:${seconds}`;
}

/**
 * Mask CPF in the exact Nubank style: "...803.262-.."
 */
export function maskNubankCpf(document: string): string {
  const numbers = document.replace(/\D/g, '');
  if (numbers.length === 11) {
    return `...${numbers.slice(3, 6)}.${numbers.slice(6, 9)}-..`;
  }
  return document.length > 8 ? `...${document.slice(3, -2)}..` : document;
}
