import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
   - "payerName": DEVE ser o nome de quem ENVIOU/PAGOU o dinheiro (sob "Origem", "Pagador", "Remetente" ou "De"). Ex: "Rafael Tavares Matos".
2. "amount": Valor numérico exato transferido em reais (ex: para "R$ 10,00", retorne 10.00).
3. "institution": Instituição financeira do recebedor/destino (ex: "NU PAGAMENTOS - IP" ou "Nu Pagamentos S.A.").
4. "date": Data e hora exatas da transação (ex: "07 SET 2026 - 16:37:03").
5. "transactionId": Código/ID da transação Pix (ex: "E18236120202609071936s133d058f09").
6. "payerDocument": CPF ou CNPJ mascarado ou completo do pagador (ex: "...803.262-..").
7. "document": CPF ou CNPJ do recebedor (se constar).
8. "pixKey": Chave Pix do recebedor (se informada).
9. "agency": Agência do recebedor (se informada).
10. "account": Conta corrente do recebedor (se informada).`;

      // Candidate models in order of priority (starting with ultra-fast gemini-3.1-flash-lite)
      const candidateModels = [
        "gemini-3.1-flash-lite",
        "gemini-3.8-flash",
        "gemini-flash-latest",
        "gemini-3.1-pro-preview"
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
          console.warn(`[Receipt Extraction] Modelo ${modelName} falhou:`, err.message || err);
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

      throw lastError || new Error("Não foi possível extrair os dados do comprovante com os modelos disponíveis.");
    } catch (err: any) {
      console.error("Erro no Gemini ao processar comprovante:", err);
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
