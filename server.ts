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

      const prompt = `Extraia dados deste comprovante de transferência bancária/Pix brasileiro:
- name: Nome completo do favorecido/recebedor (remova sufixos de números de CPF de MEI no final do nome, ex: "FULANO SILVA 12345678901" -> "FULANO SILVA")
- pixKey: Chave Pix do recebedor (telefone, e-mail, CPF ou chave aleatória)
- institution: Nome da instituição financeira do destino (ex: Nu Pagamentos S.A., Banco do Brasil, etc.)
- agency: Agência bancária do recebedor (ex: 0001)
- account: Número da conta do recebedor com dígito (ex: 93991375-4)
- accountType: Tipo de conta (ex: Conta de pagamentos, Conta Corrente)
- document: CPF ou CNPJ do recebedor
- amount: Valor transferido numérico em reais (ex: 80.00)
- date: Data e hora da transferência
- transactionId: ID da transação Pix
- payerName: Nome do pagador`;

      // Call Gemini 2.5 Flash for ultra-fast latency (<1.5s)
      const generatePromise = ai.models.generateContent({
        model: "gemini-2.5-flash",
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
              name: { type: Type.STRING, description: "Nome do favorecido/recebedor" },
              pixKey: { type: Type.STRING, description: "Chave Pix do recebedor" },
              institution: { type: Type.STRING, description: "Instituição bancária do recebedor" },
              agency: { type: Type.STRING, description: "Agência do recebedor" },
              account: { type: Type.STRING, description: "Número da conta do recebedor" },
              accountType: { type: Type.STRING, description: "Tipo da conta do recebedor" },
              document: { type: Type.STRING, description: "CPF ou CNPJ do recebedor" },
              amount: { type: Type.NUMBER, description: "Valor numérico transferido em reais" },
              date: { type: Type.STRING, description: "Data e horário do comprovante" },
              transactionId: { type: Type.STRING, description: "ID da transação Pix" },
              payerName: { type: Type.STRING, description: "Nome do pagador" },
              payerDocument: { type: Type.STRING, description: "CPF ou CNPJ do pagador" },
              payerInstitution: { type: Type.STRING, description: "Instituição bancária do pagador" },
            },
            required: ["name"],
          },
        },
      });

      // Strict timeout of 3.8 seconds so user is never kept waiting
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Timeout limite excedido")), 3800)
      );

      const response = await Promise.race([generatePromise, timeoutPromise]) as any;

      const parsedText = response.text?.trim() || "{}";
      const resultData = JSON.parse(parsedText);

      return res.json({
        success: true,
        data: resultData,
      });
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
