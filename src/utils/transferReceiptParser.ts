import * as pdfjsLib from 'pdfjs-dist';
import jsQR from 'jsqr';
import { Contact } from '../types';

// Configure pdfjs worker
try {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version || '6.3.289'}/build/pdf.worker.min.mjs`;
} catch (e) {
  console.warn('Worker configuration notice:', e);
}

export interface ExtractedRecipientData {
  name: string;
  initials: string;
  document: string; // CPF or CNPJ
  institution: string; // Bank name
  accountType?: string;
  agency?: string;
  account?: string;
  pixKey?: string;
  amount?: number;
  date?: string;
  rawText?: string;
}

/**
 * Normalizes and extracts recipient details from an uploaded receipt file (PDF or Image)
 */
export async function extractRecipientFromReceipt(file: File): Promise<ExtractedRecipientData> {
  const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');

  if (isPdf) {
    return extractFromPdfReceipt(file);
  } else {
    return extractFromImageReceipt(file);
  }
}

/**
 * Extracts recipient from PDF bank receipt
 */
async function extractFromPdfReceipt(file: File): Promise<ExtractedRecipientData> {
  const arrayBuffer = await file.arrayBuffer();

  let fullText = '';
  try {
    const loadingTask = pdfjsLib.getDocument({
      data: arrayBuffer,
      useWorkerFetch: false,
      useSystemFonts: true,
    } as any);
    const pdf = await loadingTask.promise;

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageStrings = textContent.items
        .map((item: any) => item.str || '')
        .join(' ');
      fullText += ' ' + pageStrings;
    }
  } catch (err) {
    console.warn('PDF.js text parse warning, fallback to binary decode:', err);
  }

  // Fallback if textContent is empty or minimal (scanned or non-standard font)
  if (fullText.trim().length < 20) {
    try {
      const decoder = new TextDecoder('latin1');
      fullText = decoder.decode(arrayBuffer);
    } catch (e) {
      console.warn('Binary decode error:', e);
    }
  }

  return parseTransferReceiptText(fullText);
}

/**
 * Extracts recipient from Image file (looks for QR code or canvas raster)
 */
async function extractFromImageReceipt(file: File): Promise<ExtractedRecipientData> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });

        if (ctx) {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

          // Try jsQR
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: 'dontInvert',
          });

          if (code && code.data) {
            URL.revokeObjectURL(url);
            const qrParsed = parsePixQrCodeString(code.data);
            if (qrParsed.name || qrParsed.pixKey) {
              resolve(qrParsed);
              return;
            }
          }
        }
      } catch (err) {
        console.warn('Image QR parse error:', err);
      }

      URL.revokeObjectURL(url);
      // If no QR code was readable from the image, return generic recipient
      resolve({
        name: 'Destinatário Comprovante',
        initials: 'DC',
        document: '***.000.000-**',
        institution: 'Nu Pagamentos S.A.',
        accountType: 'Conta Corrente PJ',
        pixKey: '',
        amount: 0,
      });
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve({
        name: 'Destinatário Comprovante',
        initials: 'DC',
        document: '***.000.000-**',
        institution: 'Nu Pagamentos S.A.',
        accountType: 'Conta Corrente PJ',
        pixKey: '',
        amount: 0,
      });
    };

    img.src = url;
  });
}

/**
 * Parses Brazilian Pix EMV BR Code string (payload format 000201...)
 */
export function parsePixQrCodeString(payload: string): ExtractedRecipientData {
  let name = '';
  let pixKey = '';
  let amount = 0;
  let city = '';

  // Extract Tag 59 (Merchant Name)
  const nameMatch = payload.match(/59(\d{2})([A-Za-z0-9\s.,-]+)/);
  if (nameMatch) {
    const len = parseInt(nameMatch[1], 10);
    if (!isNaN(len) && len > 0) {
      name = nameMatch[2].substring(0, len).trim();
    }
  }

  // Extract Tag 54 (Transaction Amount)
  const amountMatch = payload.match(/54(\d{2})([0-9.]+)/);
  if (amountMatch) {
    const len = parseInt(amountMatch[1], 10);
    if (!isNaN(len) && len > 0) {
      const numStr = amountMatch[2].substring(0, len).trim();
      const parsed = parseFloat(numStr);
      if (!isNaN(parsed)) amount = parsed;
    }
  }

  // Extract Pix Key from Tag 26
  const tag26Match = payload.match(/26\d{2}.*?01(\d{2})([^\s]+)/);
  if (tag26Match) {
    const len = parseInt(tag26Match[1], 10);
    if (!isNaN(len) && len > 0) {
      pixKey = tag26Match[2].substring(0, len).trim();
    }
  }

  // Extract Tag 60 (City)
  const cityMatch = payload.match(/60(\d{2})([A-Za-z\s]+)/);
  if (cityMatch) {
    const len = parseInt(cityMatch[1], 10);
    if (!isNaN(len) && len > 0) {
      city = cityMatch[2].substring(0, len).trim();
    }
  }

  const finalName = name || 'Destinatário Pix QR Code';
  const initials = finalName
    .split(' ')
    .filter(Boolean)
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'PX';

  return {
    name: finalName,
    initials,
    document: '***.***.***-**',
    institution: 'Nu Pagamentos S.A.',
    accountType: 'Conta de pagamentos',
    pixKey,
    amount,
    rawText: payload,
  };
}

/**
 * Intelligent text parser for Brazilian Bank Pix / Transfer Receipts
 * Isolates the Receiver (Destinatário / Favorecido / Quem recebeu / Para)
 */
export function parseTransferReceiptText(text: string): ExtractedRecipientData {
  const clean = text.replace(/\s+/g, ' ');

  // 1. Isolate the recipient section if possible to avoid capturing the payer's name
  let targetSection = clean;
  const splitKeywords = [
    /DADOS DO RECEBEDOR/i,
    /DADOS DE QUEM RECEBEU/i,
    /DESTINATÁRIO/i,
    /DESTINO/i,
    /FAVORECIDO/i,
    /QUEM RECEBEU/i,
    /BENEFICIÁRIO/i,
    /\bPARA\b/i,
  ];

  for (const regex of splitKeywords) {
    const match = clean.search(regex);
    if (match !== -1) {
      // Look forward from the match, cutting off when payer/origem appears
      const candidate = clean.substring(match);
      const payerCutoff = candidate.search(/(?:DADOS DO PAGADOR|DADOS DE QUEM PAGOU|ORIGEM|QUEM PAGOU|\bDE\b\s+(?:Nome|CPF)|AUTENTICAÇÃO)/i);
      if (payerCutoff > 30) {
        targetSection = candidate.substring(0, payerCutoff);
      } else {
        targetSection = candidate;
      }
      break;
    }
  }

  // 2. Extract Recipient Name
  let name = '';
  const namePatterns = [
    /(?:Nome do recebedor|Nome do favorecido|Nome do destinatário|Nome da pessoa que recebeu)[:\s]+([A-ZÁ-Úa-zá-ú\s.,&'-]{3,50}?)(?=\s+(?:CPF|CNPJ|Documento|Instituição|Banco|Chave|Agência|Conta|Valor|$))/i,
    /(?:DADOS DO RECEBEDOR|DESTINATÁRIO|FAVORECIDO|QUEM RECEBEU|PARA)[:\s]+(?:Nome[:\s]*)?([A-ZÁ-Úa-zá-ú\s.,&'-]{3,50}?)(?=\s+(?:CPF|CNPJ|Documento|Instituição|Banco|Chave|Agência|Conta|Valor|$))/i,
    /Nome[:\s]+([A-ZÁ-Úa-zá-ú\s.,&'-]{3,50}?)(?=\s+(?:CPF|CNPJ|Documento|Instituição|Banco|Chave|Agência|Conta|Valor|$))/i,
  ];

  for (const pat of namePatterns) {
    const m = targetSection.match(pat);
    if (m && m[1] && m[1].trim().length > 2 && !/^(do|da|de|pix|comprovante|pagamento)$/i.test(m[1].trim())) {
      name = m[1].trim();
      break;
    }
  }

  // Fallback in full text if targetSection didn't yield a name
  if (!name) {
    const fullMatch = clean.match(/(?:Favorecido|Recebedor)[:\s]+([A-ZÁ-Úa-zá-ú\s.,&'-]{3,45})/i);
    if (fullMatch && fullMatch[1]) {
      name = fullMatch[1].trim();
    }
  }

  if (!name) {
    name = 'Destinatário Pix';
  }

  // Format initials
  const initials = name
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'DP';

  // 3. Extract CPF or CNPJ
  let document = '';
  // Try CNPJ formatted: 00.000.000/0000-00 or masked
  const cnpjMatch = targetSection.match(/(\d{2}\.[\d*]{3}\.[\d*]{3}\/[\d*]{4}-[\d*]{2})/i) ||
                    clean.match(/(\d{2}\.[\d*]{3}\.[\d*]{3}\/[\d*]{4}-[\d*]{2})/i);
  if (cnpjMatch && cnpjMatch[1]) {
    document = cnpjMatch[1];
  } else {
    // Try CPF formatted: 000.000.000-00 or masked (***.123.456-** or ...123.456-..)
    const cpfMatch = targetSection.match(/([\d*.]{3}\.[\d*]{3}\.[\d*]{3}-[\d*]{2})/i) ||
                     clean.match(/([\d*.]{3}\.[\d*]{3}\.[\d*]{3}-[\d*]{2})/i);
    if (cpfMatch && cpfMatch[1]) {
      document = cpfMatch[1];
    } else {
      // Try raw digits
      const digitsMatch = targetSection.match(/CPF\/CNPJ[:\s]*([\d*.-]+)/i) ||
                          targetSection.match(/CPF[:\s]*([\d*.-]+)/i) ||
                          targetSection.match(/CNPJ[:\s]*([\d*./-]+)/i);
      if (digitsMatch && digitsMatch[1]) {
        document = digitsMatch[1].trim();
      }
    }
  }

  if (!document) {
    document = '***.***.***-**';
  }

  // 4. Extract Bank / Institution
  let institution = '';
  const bankPatterns = [
    /(?:Instituição[:\s]+|Instituição financeira[:\s]+|Banco[:\s]+|Banco recebedor[:\s]+)([A-ZÁ-Úa-zá-ú\s.,&'()-]{3,45}?)(?=\s+(?:Chave|Agência|Conta|Tipo|ISPB|Código|Valor|$))/i,
    /NU PAGAMENTOS/i,
    /NUBANK/i,
    /BANCO DO BRASIL/i,
    /ITAÚ|ITAU/i,
    /BRADESCO/i,
    /SANTANDER/i,
    /CAIXA ECONÔMICA/i,
    /BANCO INTER|INTER/i,
    /C6 BANK|BANCO C6/i,
    /MERCADO PAGO/i,
    /PICPAY/i,
  ];

  const instTextMatch = targetSection.match(bankPatterns[0]);
  if (instTextMatch && instTextMatch[1] && instTextMatch[1].trim().length > 2) {
    institution = instTextMatch[1].trim();
  }

  // Normalize standard Brazilian banks
  const upperSection = (targetSection + ' ' + clean).toUpperCase();
  if (/NU PAGAMENTOS|NUBANK/.test(upperSection)) {
    institution = 'Nu Pagamentos S.A.';
  } else if (/BANCO DO BRASIL|BCO DO BRASIL/.test(upperSection)) {
    institution = 'BANCO DO BRASIL S.A.';
  } else if (/ITAU|ITAÚ/.test(upperSection)) {
    institution = 'BANCO ITAÚ UNIBANCO S.A.';
  } else if (/BRADESCO/.test(upperSection)) {
    institution = 'BANCO BRADESCO S.A.';
  } else if (/SANTANDER/.test(upperSection)) {
    institution = 'BANCO SANTANDER (BRASIL) S.A.';
  } else if (/CAIXA ECONÔMICA|CEF\b/.test(upperSection)) {
    institution = 'CAIXA ECONÔMICA FEDERAL';
  } else if (/\bINTER\b|BANCO INTER/.test(upperSection)) {
    institution = 'BANCO INTER S.A.';
  } else if (/C6 BANK|BANCO C6/.test(upperSection)) {
    institution = 'BANCO C6 S.A.';
  } else if (/MERCADO PAGO/.test(upperSection)) {
    institution = 'MERCADO PAGO IP LTDA';
  } else if (/PICPAY/.test(upperSection)) {
    institution = 'PICPAY IP S.A.';
  }

  if (!institution) {
    institution = 'Nu Pagamentos S.A.';
  }

  // 5. Extract Pix Key
  let pixKey = '';
  const keyMatch = targetSection.match(/Chave(?: Pix)?[:\s]+([^\s,;]+)/i);
  if (keyMatch && keyMatch[1]) {
    pixKey = keyMatch[1].trim();
  }

  // 6. Extract Account Type & Agency / Account
  let accountType = 'Conta de pagamentos';
  if (/Conta corrente/i.test(targetSection)) {
    accountType = 'Conta Corrente';
  } else if (/Conta poupança/i.test(targetSection)) {
    accountType = 'Conta Poupança';
  } else if (/Conta de pagamentos/i.test(targetSection)) {
    accountType = 'Conta de pagamentos';
  }

  let agency = '';
  const agMatch = targetSection.match(/Agência[:\s]*(\d+)/i);
  if (agMatch && agMatch[1]) agency = agMatch[1];

  let account = '';
  const accMatch = targetSection.match(/Conta[:\s]*([\d-]+)/i);
  if (accMatch && accMatch[1]) account = accMatch[1];

  // 7. Extract Amount
  let amount = 0;
  const amountMatch = clean.match(/(?:Valor(?: da transferência| transferido| pago)?|R\$)[:\s]*(?:R\$)?\s*([\d.]+,\d{2})/i) ||
                      clean.match(/R\$\s*([\d.]+,\d{2})/);
  if (amountMatch && amountMatch[1]) {
    const numStr = amountMatch[1].replace(/\./g, '').replace(',', '.');
    const parsed = parseFloat(numStr);
    if (!isNaN(parsed) && parsed > 0) amount = parsed;
  }

  return {
    name,
    initials,
    document,
    institution,
    accountType,
    agency,
    account,
    pixKey,
    amount,
    rawText: clean,
  };
}

/**
 * Converts ExtractedRecipientData to a Contact object
 */
export function convertExtractedToContact(data: ExtractedRecipientData): Contact {
  return {
    id: 'contact-' + Date.now(),
    name: data.name,
    initials: data.initials || (data.name ? data.name.slice(0, 2).toUpperCase() : 'PX'),
    document: data.document || '***.***.***-**',
    institution: data.institution || 'Nu Pagamentos S.A.',
    accountType: data.accountType || 'Conta Corrente PJ',
    agency: data.agency || '0001',
    account: data.account || '',
    pixKey: data.pixKey || '',
  };
}
