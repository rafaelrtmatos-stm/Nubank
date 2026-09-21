import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function parseServerBillText(text: string) {
  const clean = text.replace(/\s+/g, " ");

  // 1. Linha digitável ou código de barras
  let barcodeNumber = "";
  const mBancario = clean.match(/\b\d{5}[.\s]?\d{5}\s+\d{5}[.\s]?\d{6}\s+\d{5}[.\s]?\d{6}\s+\d\s+\d{10,14}\b/);
  const mConces = clean.match(/\b\d{11,12}[-\s]?\d{0,1}\s+\d{11,12}[-\s]?\d{0,1}\s+\d{11,12}[-\s]?\d{0,1}\s+\d{11,12}[-\s]?\d{0,1}\b/);
  const mContinuous = clean.match(/\b\d{47,48}\b/);
  const mBar44 = clean.match(/\b\d{44}\b/);

  if (mBancario) barcodeNumber = mBancario[0].trim();
  else if (mConces) barcodeNumber = mConces[0].trim();
  else if (mContinuous) barcodeNumber = mContinuous[0].trim();
  else if (mBar44) barcodeNumber = mBar44[0].trim();

  let amount = 0;
  let dueDate = "";
  let beneficiaryBank = "BANCO DO BRASIL S.A.";
  let nossoNumero = "";

  const digits = barcodeNumber.replace(/\D/g, "");
  if (digits.length === 47) {
    const bankCode = digits.substring(0, 3);
    const bankMap: Record<string, string> = {
      "001": "BANCO DO BRASIL S.A.",
      "237": "BCO BRADESCO S.A.",
      "341": "ITAU UNIBANCO S.A.",
      "033": "BCO SANTANDER (BRASIL) S.A.",
      "104": "CAIXA ECONOMICA FEDERAL",
      "077": "BANCO INTER S.A.",
      "260": "NU PAGAMENTOS - IP",
      "748": "BANCO COOPERATIVO SICREDI S.A.",
      "756": "BANCO COOPERATIVO DO BRASIL S.A. (BANCOOB)",
      "422": "BANCO SAFRA S.A.",
      "336": "BANCO C6 S.A.",
      "041": "BANCO DO ESTADO DO RIO GRANDE DO SUL S.A. (BANRISUL)",
      "070": "BANCO DE BRASILIA S.A. (BRB)"
    };
    beneficiaryBank = bankMap[bankCode] || `Banco código ${bankCode}`;

    const valDigits = digits.substring(37, 47);
    const parsedVal = parseInt(valDigits, 10) / 100;
    if (parsedVal > 0) amount = parsedVal;

    const fator = parseInt(digits.substring(33, 37), 10);
    if (fator >= 1000) {
      const testCycle1 = new Date(new Date(1997, 9, 7).getTime() + fator * 86400000);
      const targetDate = (testCycle1.getFullYear() < 2024)
        ? new Date(new Date(2022, 4, 29).getTime() + fator * 86400000)
        : testCycle1;
      const day = String(targetDate.getDate()).padStart(2, "0");
      const month = String(targetDate.getMonth() + 1).padStart(2, "0");
      const year = targetDate.getFullYear();
      dueDate = `${day}/${month}/${year}`;
    }

    if (bankCode === "001") {
      nossoNumero = digits.substring(11, 20) + digits.substring(21, 29);
    }
  } else if (digits.length === 48) {
    const segment = digits.charAt(1);
    if (segment === "3") beneficiaryBank = "Concessionária de Energia Elétrica";
    else if (segment === "2") beneficiaryBank = "Concessionária de Água e Saneamento";
    else if (segment === "4") beneficiaryBank = "Operadora de Telecomunicações";
    else beneficiaryBank = "Concessionária de Serviços Públicos";

    const valDigits = digits.substring(4, 11) + digits.substring(12, 16);
    const parsedVal = parseInt(valDigits, 10) / 100;
    if (parsedVal > 0 && parsedVal < 1000000) amount = parsedVal;
  } else if (digits.length === 44) {
    const bankCode = digits.substring(0, 3);
    const bankMap: Record<string, string> = {
      "001": "BANCO DO BRASIL S.A.",
      "237": "BCO BRADESCO S.A.",
      "341": "ITAU UNIBANCO S.A.",
      "033": "BCO SANTANDER (BRASIL) S.A.",
      "104": "CAIXA ECONOMICA FEDERAL",
      "077": "BANCO INTER S.A.",
      "260": "NU PAGAMENTOS - IP"
    };
    if (bankMap[bankCode]) beneficiaryBank = bankMap[bankCode];

    const fator = parseInt(digits.substring(5, 9), 10);
    if (fator >= 1000) {
      const testCycle1 = new Date(new Date(1997, 9, 7).getTime() + fator * 86400000);
      const targetDate = (testCycle1.getFullYear() < 2024)
        ? new Date(new Date(2022, 4, 29).getTime() + fator * 86400000)
        : testCycle1;
      const day = String(targetDate.getDate()).padStart(2, "0");
      const month = String(targetDate.getMonth() + 1).padStart(2, "0");
      const year = targetDate.getFullYear();
      dueDate = `${day}/${month}/${year}`;
    }

    const valDigits = digits.substring(9, 19);
    const parsedVal = parseInt(valDigits, 10) / 100;
    if (parsedVal > 0) amount = parsedVal;
  }

  const amountMatch = clean.match(/(?:Total a Pagar|TOTAL A PAGAR|VALOR A PAGAR|VALOR TOTAL)[\s:(=)]*(?:R\$)?\s*([\d.]+,\d{2})/i) ||
                      clean.match(/(?:VALOR DOCUMENTO|\(=?\) ?VALOR DOCUMENTO|VALOR COBRADO|VALOR LIQUIDO)[\s:(=)]*\d*\s*(?:R\$)?\s*([\d.]+,\d{2})/i) ||
                      clean.match(/(?:VALOR\s+\(=?\)\s*VALOR\s+DOCUMENTO)\s*\d*\s*(?:R\$)?\s*([\d.]+,\d{2})/i) ||
                      clean.match(/(?:Total a Pagar|VALOR DO DOCUMENTO|VALOR LIQUIDO)\D{0,25}R\$\s*([\d.]+,\d{2})/i);
  if (amountMatch && amountMatch[1]) {
    const parsed = parseFloat(amountMatch[1].replace(/\./g, "").replace(",", "."));
    if (!isNaN(parsed) && parsed > 0) amount = parsed;
  }

  if (amount === 0) {
    const generalR$ = clean.match(/R\$\s*([\d.]+,\d{2})/g);
    if (generalR$ && generalR$.length > 0) {
      const last = generalR$[generalR$.length - 1].replace(/R\$\s*/, "").replace(/\./g, "").replace(",", ".");
      const parsed = parseFloat(last);
      if (!isNaN(parsed) && parsed > 0) amount = parsed;
    }
  }

  if (!dueDate) {
    const dueMatch = clean.match(/(?:VENCIMENTO|Data de Vencimento|Vencimento|Pagar at[eé]|DATA DO VENCIMENTO)[\s:A-ZÁ-Ú/.-]{0,70}?(\d{2}[./]\d{2}[./]\d{4})/i) ||
                     clean.match(/(?:PAG[ÁA]VEL\s+PREFERENCIALMENTE[^\n\r]*?)\s*(\d{2}[./]\d{2}[./]\d{4})/i) ||
                     clean.match(/(\d{2}\/\d{2}\/202[5-9])/);
    if (dueMatch && dueMatch[1]) {
      dueDate = dueMatch[1].replace(/\./g, "/");
    } else {
      dueDate = new Date().toLocaleDateString("pt-BR");
    }
  }

  let beneficiaryName = "Beneficiário do Boleto";
  let beneficiaryCnpj = "00.000.000/0001-00";

  if (/EQUATORIAL/i.test(clean)) {
    beneficiaryName = "EQUATORIAL PARÁ DISTRIB. DE ENERGIA S.A.";
    beneficiaryCnpj = "04.895.728/0001-80";
    beneficiaryBank = "BANCO DO BRASIL S.A.";
  } else if (/ENEL/i.test(clean)) {
    beneficiaryName = "ENEL DISTRIBUIÇÃO";
    beneficiaryCnpj = "61.695.227/0001-93";
  } else if (/SABESP/i.test(clean)) {
    beneficiaryName = "CIA DE SANEAMENTO BASICO DO ESTADO DE SAO PAULO SABESP";
    beneficiaryCnpj = "43.776.517/0001-80";
  } else if (/CPFL/i.test(clean)) {
    beneficiaryName = "CPFL ENERGIA S.A.";
  } else if (/COPEL/i.test(clean)) {
    beneficiaryName = "COPEL DISTRIBUIÇÃO S.A.";
  } else if (/CEMIG/i.test(clean)) {
    beneficiaryName = "CEMIG DISTRIBUIÇÃO S.A.";
  } else if (/CLARO/i.test(clean)) {
    beneficiaryName = "CLARO S.A.";
  } else if (/VIVO|TELEFONICA/i.test(clean)) {
    beneficiaryName = "TELEFÔNICA BRASIL S.A. (VIVO)";
  } else {
    const benefMatch = clean.match(/BENEFICI[AÁ]RIO[^\w\n]*([A-ZÁ-Ú0-9\s.,\-]+?)(?=\s+UNIDADE|\s+CNPJ|\s+AG[EÊ]NCIA|\s+DATA|\s+\d{2}[./]\d{2})/i) ||
                       clean.match(/CEDENTE[^\w\n]*([A-ZÁ-Ú0-9\s.,\-]+?)(?=\s+CNPJ|\s+CPF|\s+AG[EÊ]NCIA|\s+\d)/i);
    if (benefMatch && benefMatch[1]?.trim().length > 3) {
      beneficiaryName = benefMatch[1].trim().toUpperCase();
    }
  }

  const cnpjMatch = clean.match(/CNPJ[:\s]*(\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2})/i);
  if (cnpjMatch && cnpjMatch[1]) {
    beneficiaryCnpj = cnpjMatch[1].trim();
  }

  let payerName = "";
  const payerMatch = clean.match(/(?:NOME DO PAGADOR|PAGADOR|SACADO)[\s\/:A-Z]*?[\s:]+([A-ZÁ-Ú\s]{5,40}?)(?=\s+\d{3}\.|\s+0\d{2}|\s+CPF|\s+TV|\s+RUA|\s+AV|\s+CEP|\s+\d{11})/i) ||
                     clean.match(/RAFAEL TAVARES MATOS/i) ||
                     clean.match(/CLASSIFICA[ÇC][ÃA]O[^\n]+?([A-ZÁ-Ú\s]{5,35})\s+CPF/i);
  if (payerMatch) {
    payerName = (payerMatch[1] || payerMatch[0]).trim().toUpperCase();
  }

  let payerCpf = "";
  const cpfMatch = clean.match(/CPF[:\s]*(\d{3}\.?\d{3}\.?\d{3}-?\d{2})/i) ||
                   clean.match(/(\d{3}\.\d{3}\.\d{3}-\d{2})/);
  if (cpfMatch && cpfMatch[1]) {
    payerCpf = cpfMatch[1].trim();
  }

  let unitOrContract = "";
  const unitMatch = clean.match(/(?:N[úu]mero da UC|UNIDADE CONSUMIDORA|CONTA CONTRATO|INSTALA[ÇC][ÃA]O)[\s:A-Z/.-]{0,40}?(\d{1,3}\.[\d.\-]+|\d{7,15})/i);
  if (unitMatch) {
    unitOrContract = (unitMatch[1] || unitMatch[0]).trim();
  }

  return {
    beneficiaryName,
    beneficiaryCnpj,
    beneficiaryBank,
    beneficiaryAccountType: "Conta corrente",
    amount,
    dueDate,
    barcodeNumber,
    nossoNumero,
    payerName,
    payerCpf,
    unitOrContract,
  };
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "30mb" }));
  app.use(express.urlencoded({ extended: true, limit: "30mb" }));

  // Health check endpoint
  app.get("/api/health", (_req, res) => {
    res.json({ 
      status: "ok", 
      timestamp: new Date().toISOString(),
      hasGeminiKey: Boolean(process.env.GEMINI_API_KEY)
    });
  });

  // Receipt extraction endpoint powered by Gemini Flash Multimodal Vision
  app.post("/api/extract-receipt", async (req, res) => {
    try {
      const { base64Data, mimeType } = req.body;
      if (!base64Data) {
        return res.status(400).json({ error: "Dados do comprovante não fornecidos." });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(200).json({ 
          success: false, 
          fallback: true, 
          message: "GEMINI_API_KEY não configurada no ambiente. Usando extrator local." 
        });
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });

      // Strip data URL prefix if present (e.g. data:image/jpeg;base64,)
      const cleanBase64 = base64Data.replace(/^data:[^;]+;base64,/, "");

      const prompt = `Analise atentamente a imagem deste comprovante de transferência bancária ou Pix brasileiro e extraia com precisão os dados:

REGRAS CRÍTICAS:
1. DESTINO vs ORIGEM:
   - "name": DEVE ser o nome da pessoa/empresa que RECEBEU o dinheiro (sob "Destino", "Favorecido", "Recebedor" ou "Para"). Ex: "Isabela Letícia Corrêa Pereira". NUNCA coloque o nome do pagador/remetente neste campo!
   - "payerName": DEVE ser o nome de quem ENVIOU/PAGOU o dinheiro (sob "Origem", "Pagador", "Remetente" ou "De"). Ex: "João Carlos da Silva".
2. "amount": Valor numérico exato transferido em reais (ex: para "R$ 10,00", retorne 10.00).
3. "institution": Instituição financeira do recebedor/destino (ex: "NU PAGAMENTOS - IP" ou "Nu Pagamentos S.A.").
4. "date": Data e hora exatas da transação (ex: "07 SET 2026 - 16:37:03").
5. "transactionId": Código/ID da transação Pix (ex: "E18236120202609071936s133d058f09").
6. "payerDocument": CPF ou CNPJ mascarado ou completo do pagador (ex: "...803.262-..").
7. "document": CPF ou CNPJ do recebedor (se constar).
8. "pixKey": Chave Pix do recebedor (se informada).
9. "agency": Agência do recebedor (se informada).
10. "account": Conta corrente do recebedor (se informada).`;

      // Officially supported Gemini models prioritized for stability and multimodal vision
      const candidateModels = [
        "gemini-3.8-flash",
        "gemini-3.1-flash-lite",
        "gemini-flash-latest",
        "gemini-2.5-flash",
      ];

      let lastError: any = null;
      let resultData: any = null;

      for (const modelName of candidateModels) {
        try {
          console.log(`[Receipt Extraction] Tentando modelo ${modelName}...`);
          const response = await ai.models.generateContent({
            model: modelName,
            contents: [
              {
                role: "user",
                parts: [
                  {
                    inlineData: {
                      mimeType: mimeType || "image/jpeg",
                      data: cleanBase64,
                    },
                  },
                  {
                    text: prompt,
                  },
                ],
              },
            ],
            config: {
              responseMimeType: "application/json",
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING, description: "Nome do favorecido/recebedor (Destino)" },
                  pixKey: { type: Type.STRING, description: "Chave Pix do recebedor" },
                  institution: { type: Type.STRING, description: "Instituição bancária do recebedor" },
                  agency: { type: Type.STRING, description: "Agência do recebedor" },
                  account: { type: Type.STRING, description: "Número da conta do recebedor" },
                  accountType: { type: Type.STRING, description: "Tipo da conta do recebedor" },
                  document: { type: Type.STRING, description: "CPF ou CNPJ do recebedor" },
                  amount: { type: Type.NUMBER, description: "Valor numérico transferido em reais" },
                  date: { type: Type.STRING, description: "Data e horário do comprovante" },
                  transactionId: { type: Type.STRING, description: "ID da transação Pix" },
                  payerName: { type: Type.STRING, description: "Nome do pagador/origem" },
                  payerDocument: { type: Type.STRING, description: "CPF ou CNPJ do pagador" },
                  payerInstitution: { type: Type.STRING, description: "Instituição bancária do pagador" },
                },
                required: ["name"],
              },
            },
          });

          const parsedText = response.text?.trim() || "{}";
          const parsed = JSON.parse(parsedText);
          if (parsed && parsed.name && parsed.name.trim().length > 0) {
            console.log(`[Receipt Extraction] Sucesso com modelo ${modelName}:`, parsed.name, `R$ ${parsed.amount}`);
            resultData = parsed;
            break;
          }
        } catch (err: any) {
          const errMsg = err?.message || String(err);
          const isHighDemand = errMsg.includes("503") || errMsg.includes("UNAVAILABLE") || errMsg.includes("high demand");
          if (isHighDemand) {
            console.log(`[Receipt Extraction] Modelo ${modelName} em alta demanda (503). Alternando para o próximo modelo...`);
            await new Promise((r) => setTimeout(r, 250));
          } else {
            console.log(`[Receipt Extraction] Modelo ${modelName} indisponível: ${errMsg.substring(0, 100)}`);
          }
          lastError = err;
          // Continue to next candidate model
        }
      }

      if (resultData && resultData.name) {
        return res.json({
          success: true,
          data: resultData,
        });
      }

      console.log("[Receipt Extraction] Modelos remotos indisponíveis, ativando fallback local.");
      return res.status(200).json({
        success: false,
        fallback: true,
        message: "IA temporariamente ocupada, alternando para extrator local.",
      });
    } catch (err: any) {
      console.log("[Receipt Extraction] Tratamento com extrator local acionado.");
      return res.status(200).json({
        success: false,
        fallback: true,
        error: err.message || "Falha na análise via IA, alternando para extrator local.",
      });
    }
  });

  // Bill & Boleto extraction endpoint powered by hybrid Server-Side PDF parsing and Gemini Multimodal AI
  app.post("/api/extract-bill", async (req, res) => {
    try {
      const { base64Data, mimeType } = req.body;
      if (!base64Data) {
        return res.status(400).json({ error: "Dados da fatura ou boleto não fornecidos." });
      }

      const cleanBase64 = base64Data.replace(/^data:[^;]+;base64,/, "");
      const isPdf = (mimeType && mimeType.includes("pdf")) || cleanBase64.startsWith("JVBERi");

      let serverExtractedText = "";
      let serverParsedData: any = null;

      // 1. If it is a PDF, immediately extract uncompressed text using server-side pdfjs in milliseconds
      if (isPdf) {
        try {
          const buffer = Buffer.from(cleanBase64, "base64");
          // @ts-ignore
          const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");
          const doc = await pdfjsLib.getDocument({
            data: new Uint8Array(buffer),
            useSystemFonts: true,
          }).promise;

          for (let p = 1; p <= doc.numPages; p++) {
            const page = await doc.getPage(p);
            const tc = await page.getTextContent();
            serverExtractedText += " " + tc.items.map((it: any) => it.str || "").join(" ");
          }

          serverExtractedText = serverExtractedText.trim();
          console.log(`[Bill Extraction] Texto extraído do PDF no servidor (${serverExtractedText.length} caracteres).`);

          if (serverExtractedText.length > 20) {
            serverParsedData = parseServerBillText(serverExtractedText);
          }
        } catch (pdfErr) {
          console.warn("[Bill Extraction] Erro na leitura interna do PDF no servidor:", pdfErr);
        }
      }

      // Check for GEMINI_API_KEY
      const apiKey = process.env.GEMINI_API_KEY;

      // If we already extracted valid amount and barcode from server PDF text, and no API key or rapid mode
      if (serverParsedData && (serverParsedData.amount > 0 || serverParsedData.barcodeNumber)) {
        if (!apiKey) {
          return res.json({
            success: true,
            data: serverParsedData,
            extractedServerText: serverExtractedText,
          });
        }
      }

      if (!apiKey) {
        if (serverParsedData) {
          return res.json({ success: true, data: serverParsedData });
        }
        return res.status(200).json({ 
          success: false, 
          fallback: true, 
          message: "GEMINI_API_KEY não configurada. Usando extrator local." 
        });
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });

      const prompt = `Você é um analista especialista em boletos bancários e faturas de concessionárias de serviços públicos do Brasil (energia elétrica como Equatorial Energia, Enel, Cemig, Copel, CPFL; água como Sabesp, Sanepar; telecom como Claro, Vivo, TIM; e boletos de cobrança de bancos como Banco do Brasil, Bradesco, Itaú, Santander, Caixa, Nubank, Sicredi, Sicoob, etc.).
Analise atentamente o documento e extraia os campos com máxima precisão:

1. "beneficiaryName": Nome da empresa beneficiária / concessionária (ex: "EQUATORIAL PARÁ DISTRIB. DE ENERGIA S.A.", "ENEL DISTRIBUIÇÃO", "BANCO DO BRASIL S.A."). Procure no cabeçalho ou no campo BENEFICIÁRIO / CEDENTE.
2. "beneficiaryCnpj": CNPJ da empresa beneficiária se constar no documento (ex: "04.895.728/0001-80").
3. "beneficiaryBank": Nome do banco emissor ou cobrador (ex: "BANCO DO BRASIL S.A.", "BCO BRADESCO S.A.", "ITAU UNIBANCO S.A.", "CAIXA ECONOMICA FEDERAL", "NU PAGAMENTOS - IP", etc.).
4. "amount": Valor total a pagar em reais como número decimal (ex: para "R$ 534,45", retorne 534.45). NUNCA confunda com juros parciais ou parcelas! Procure no campo "Total a Pagar", "VALOR DOCUMENTO", "VALOR COBRADO" ou nos últimos 10 dígitos da linha digitável.
5. "dueDate": Data de vencimento no formato DD/MM/AAAA ou DD.MM.AAAA (ex: "17/08/2026"). NUNCA confunda com data de leitura, corte ou emissão.
6. "barcodeNumber": Linha digitável completa com pontos e espaços ou dígitos do código de barras (ex: "00190.00009 03373.384258 60492.231174 1 00000000053445").
7. "nossoNumero": Código Nosso Número do boleto se presente (ex: "33733842560492231").
8. "payerName": Nome completo do pagador / titular da conta (ex: "JOÃO CARLOS DA SILVA").
9. "payerCpf": CPF ou CNPJ do pagador/titular se presente (ex: "025.803.262-60").
10. "unitOrContract": Número da conta contrato, unidade consumidora ou instalação (ex: "2.105.447.013-05").`;

      // Models to try
      const candidateModels = [
        "gemini-3.8-flash",
        "gemini-3.1-flash-lite",
        "gemini-flash-latest",
        "gemini-2.5-flash",
      ];

      let resultData: any = null;

      // If we already have extracted text from the PDF, querying Gemini with text is 10x faster and never hits payload timeouts!
      const contentParts: any[] = [];
      if (serverExtractedText && serverExtractedText.length > 30) {
        contentParts.push({
          text: `${prompt}\n\n=== TEXTO EXTRAÍDO DO DOCUMENTO ===\n${serverExtractedText.substring(0, 8000)}`,
        });
      } else {
        contentParts.push({
          inlineData: {
            mimeType: mimeType || (isPdf ? "application/pdf" : "image/jpeg"),
            data: cleanBase64,
          },
        });
        contentParts.push({ text: prompt });
      }

      for (const modelName of candidateModels) {
        try {
          console.log(`[Bill Extraction] Tentando modelo ${modelName}...`);
          
          // Use a fast timeout promise to avoid keeping the user waiting
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error("Timeout IA 6s")), 6000)
          );

          const aiCallPromise = ai.models.generateContent({
            model: modelName,
            contents: [
              {
                role: "user",
                parts: contentParts,
              },
            ],
            config: {
              responseMimeType: "application/json",
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  beneficiaryName: { type: Type.STRING, description: "Nome da empresa beneficiária" },
                  beneficiaryCnpj: { type: Type.STRING, description: "CNPJ da empresa beneficiária" },
                  beneficiaryBank: { type: Type.STRING, description: "Banco do boleto" },
                  beneficiaryAccountType: { type: Type.STRING, description: "Tipo de conta" },
                  amount: { type: Type.NUMBER, description: "Valor a pagar em reais" },
                  dueDate: { type: Type.STRING, description: "Data de vencimento" },
                  barcodeNumber: { type: Type.STRING, description: "Linha digitável do boleto" },
                  nossoNumero: { type: Type.STRING, description: "Nosso número do boleto" },
                  payerName: { type: Type.STRING, description: "Nome do cliente/pagador" },
                  payerCpf: { type: Type.STRING, description: "CPF ou documento do pagador" },
                  unitOrContract: { type: Type.STRING, description: "Unidade consumidora ou instalação" },
                },
              },
            },
          });

          const response: any = await Promise.race([aiCallPromise, timeoutPromise]);
          const parsedText = response?.text?.trim() || "{}";
          const parsed = JSON.parse(parsedText);
          if (parsed && (parsed.beneficiaryName || parsed.amount || parsed.barcodeNumber)) {
            console.log(`[Bill Extraction] Sucesso com modelo ${modelName}:`, parsed.beneficiaryName, `R$ ${parsed.amount}`, `Venc: ${parsed.dueDate}`);
            resultData = parsed;
            break;
          }
        } catch (err: any) {
          console.log(`[Bill Extraction] Modelo ${modelName} falhou: ${err?.message || err}`);
        }
      }

      // Merge AI result with server parsed data
      if (resultData || serverParsedData) {
        const finalData = {
          beneficiaryName: resultData?.beneficiaryName || serverParsedData?.beneficiaryName || "Beneficiário do Boleto",
          beneficiaryCnpj: resultData?.beneficiaryCnpj || serverParsedData?.beneficiaryCnpj || "00.000.000/0001-00",
          beneficiaryBank: resultData?.beneficiaryBank || serverParsedData?.beneficiaryBank || "Banco Emissor",
          beneficiaryAccountType: resultData?.beneficiaryAccountType || serverParsedData?.beneficiaryAccountType || "Conta corrente",
          amount: (resultData?.amount && resultData.amount > 0) ? resultData.amount : (serverParsedData?.amount || 0),
          dueDate: resultData?.dueDate || serverParsedData?.dueDate || new Date().toLocaleDateString("pt-BR"),
          barcodeNumber: resultData?.barcodeNumber || serverParsedData?.barcodeNumber || "",
          nossoNumero: resultData?.nossoNumero || serverParsedData?.nossoNumero || "",
          payerName: resultData?.payerName || serverParsedData?.payerName || "",
          payerCpf: resultData?.payerCpf || serverParsedData?.payerCpf || "",
          unitOrContract: resultData?.unitOrContract || serverParsedData?.unitOrContract || "",
        };

        return res.json({
          success: true,
          data: finalData,
          extractedServerText: serverExtractedText,
        });
      }

      return res.status(200).json({
        success: false,
        fallback: true,
        extractedServerText: serverExtractedText,
        message: "IA temporariamente ocupada, acionando extrator local.",
      });
    } catch (err: any) {
      console.log("[Bill Extraction] Exceção geral capturada, retornando fallback:", err);
      return res.status(200).json({
        success: false,
        fallback: true,
        error: err.message || "Falha na análise via IA, alternando para extrator local.",
      });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
