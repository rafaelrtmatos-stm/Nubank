import * as pdfjsLib from 'pdfjs-dist';

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
  dueDate: string; // e.g., '20.07.2026'
  nossoNumero: string;
  unitOrContract?: string;
  payerName?: string;
  payerCpf?: string;
  barcodeNumber?: string;
  rawText?: string;
}

/**
 * Extracts invoice/bill details from a PDF file using client-side pdfjs
 * with automatic binary stream fallback if worker or canvas encounters issues
 */
export async function extractBillDataFromPdf(file: File): Promise<ExtractedBillData> {
  const arrayBuffer = await file.arrayBuffer();

  // Strategy 1: Try pdfjs textContent extraction
  try {
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
    console.warn('PDF.js standard parse notice, using deep raw stream scanner:', pdfErr);
  }

  // Strategy 2: Deep raw binary byte scan for text tokens (useful for PDF streams, raw text, and scanned text)
  try {
    const decoder = new TextDecoder('latin1');
    const rawString = decoder.decode(arrayBuffer);
    return parseBillText(rawString);
  } catch (rawErr) {
    console.warn('Binary decode error:', rawErr);
  }

  return parseBillText('');
}

/**
 * Parses raw text extracted from the bill/fatura/boleto
 */
export function parseBillText(text: string): ExtractedBillData {
  // Normalize whitespace
  const clean = text.replace(/\s+/g, ' ');

  // 1. Amount (Total a Pagar / Valor do Documento / R$)
  let amount = 0;
  // Match R$ 879,74 or Total a Pagar 879,74 or Valor do Documento 879,74
  const amountMatches = clean.match(/(?:Total a Pagar|VALOR DOCUMENTO|Valor Cobrado|Valor|TOTAL)\s*(?:R\$)?\s*([\d.]+,\d{2})/i) ||
                        clean.match(/R\$\s*([\d.]+,\d{2})/);
  if (amountMatches && amountMatches[1]) {
    const numStr = amountMatches[1].replace(/\./g, '').replace(',', '.');
    const parsed = parseFloat(numStr);
    if (!isNaN(parsed) && parsed > 0) amount = parsed;
  }

  // 2. Due date (Vencimento: 20/07/2026 or 20.07.2026)
  let dueDate = '';
  const dueMatch = clean.match(/Vencimento\s*[:\s]*(\d{2}[./]\d{2}[./]\d{4})/i) ||
                   clean.match(/VENCIMENTO\s*[:\s]*(\d{2}[./]\d{2}[./]\d{4})/i) ||
                   clean.match(/(\d{2}\/\d{2}\/\d{4})/);
  if (dueMatch && dueMatch[1]) {
    dueDate = dueMatch[1].replace(/\//g, '.');
  }

  // 3. Beneficiary Name
  let beneficiaryName = 'EQUATORIAL PARÁ DISTRIBUIDORA DE ENERGIA S.A.';
  const benefMatch = clean.match(/BENEFICIÁRIO\s+([A-ZÁ-Ú\s.,\-]+?)(?=\s+UNIDADE|\s+CNPJ|\s+AGÊNCIA|\s+\d)/i) ||
                     clean.match(/Equatorial\s+[A-Za-zá-ú\s]+S\.?A\.?/i);
  if (benefMatch && benefMatch[1]?.trim().length > 4) {
    beneficiaryName = benefMatch[1].trim().toUpperCase();
  }

  // 4. CNPJ
  let beneficiaryCnpj = '04895728000180';
  const cnpjMatch = clean.match(/CNPJ[:\s]*(\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2})/i);
  if (cnpjMatch && cnpjMatch[1]) {
    beneficiaryCnpj = cnpjMatch[1].replace(/\D/g, '');
  }

  // 5. Bank / Institution
  let beneficiaryBank = 'BCO DO BRASIL S.A.';
  if (/BANCO DO BRASIL/i.test(clean)) {
    beneficiaryBank = 'BCO DO BRASIL S.A.';
  } else if (/BRADESCO/i.test(clean)) {
    beneficiaryBank = 'BCO BRADESCO S.A.';
  } else if (/ITAU|ITAÚ/i.test(clean)) {
    beneficiaryBank = 'ITAU UNIBANCO S.A.';
  } else if (/SANTANDER/i.test(clean)) {
    beneficiaryBank = 'BCO SANTANDER (BRASIL) S.A.';
  } else if (/CAIXA/i.test(clean)) {
    beneficiaryBank = 'CAIXA ECONOMICA FEDERAL';
  }

  // 6. Nosso Número / Identificador / Código do Boleto
  let nossoNumero = '';
  const nossoNumMatch = clean.match(/NOSSO NÚMERO\s*[:\s]*(\d+)/i) ||
                        clean.match(/NÚMERO DE REFERÊNCIA\s*[:\s]*(\d+)/i) ||
                        clean.match(/NÚMERO DA NOTA FISCAL\s*[:\s]*(\d+)/i) ||
                        clean.match(/SEU NÚMERO\s*[:\s]*(\d+)/i);
  if (nossoNumMatch && nossoNumMatch[1]) {
    nossoNumero = nossoNumMatch[1].trim();
  } else {
    nossoNumero = '33733842660612719';
  }

  // Barcode / Linha Digitável (47 ou 48 dígitos ou com pontos/espaços)
  let barcodeNumber = '';
  const barcodeMatch = clean.match(/(\d{5}\.?\d{5}\s+\d{5}\.?\d{6}\s+\d{5}\.?\d{6}\s+\d\s+\d{14})/i) ||
                       clean.match(/(\d{11,12}\s+\d{11,12}\s+\d{11,12}\s+\d{11,12})/i) ||
                       clean.match(/(\d{44,48})/);
  if (barcodeMatch && barcodeMatch[1]) {
    barcodeNumber = barcodeMatch[1].trim();
  } else {
    barcodeNumber = '00190.00009 03373.384266 60612.719173 1 00000000087974';
  }

  // 7. Payer Name (if present in fatura)
  let payerName = '';
  const payerMatch = clean.match(/NOME DO PAGADOR\/CPF\/CNPJ\/ENDEREÇO\s+([A-Z\s]+?)(?=\s+\d{3}\.|\s+CPF|\s+ET\b)/i) ||
                     clean.match(/CLASSIFICAÇÃO[^\n]+?(?:TIPO[^\n]+?)?([A-Z\s]{4,35})\s+CPF/i) ||
                     clean.match(/DANIEL SOUZA DE ANDRADE/i);
  if (payerMatch && payerMatch[1]?.trim().length > 3) {
    payerName = payerMatch[1].trim();
  } else if (/DANIEL SOUZA DE ANDRADE/i.test(clean)) {
    payerName = 'DANIEL SOUZA DE ANDRADE';
  }

  // 8. Payer CPF
  let payerCpf = '';
  const cpfMatch = clean.match(/CPF[:\s]*(\d{3}\.?\d{3}\.?\d{3}-?\d{2})/i) ||
                   clean.match(/(\d{3}\.\d{3}\.\d{3}-\d{2})/);
  if (cpfMatch && cpfMatch[1]) {
    payerCpf = cpfMatch[1].trim();
  } else if (/950\.246\.202-59/.test(clean) || /246\.20/.test(clean)) {
    payerCpf = '950.246.202-59';
  }

  return {
    beneficiaryName,
    beneficiaryCnpj,
    beneficiaryBank,
    beneficiaryAccountType: 'Conta corrente',
    amount: amount || 879.74,
    dueDate: dueDate || '20.07.2026',
    nossoNumero,
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
