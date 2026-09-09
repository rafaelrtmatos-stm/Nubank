import React, { useRef, useState } from 'react';
import { motion } from 'motion/react';
import { 
  X, 
  LayoutGrid, 
  Barcode, 
  Landmark, 
  RefreshCw, 
  ChevronRight, 
  Sparkles, 
  UploadCloud, 
  Loader2, 
  FileText,
  Receipt
} from 'lucide-react';
import { ScreenName, TransferData } from '../types';
import { 
  extractBillDataFromPdf, 
  ExtractedBillData,
  generateNubankTransactionId, 
  formatNubankReceiptDate 
} from '../utils/pdfReceiptParser';
import { BillConfirmationModal } from '../components/BillConfirmationModal';

interface PaymentOptionsScreenProps {
  onGoBack: () => void;
  onNavigate: (screen: ScreenName) => void;
  onGenerateReceiptFromPdf?: (transferData: TransferData) => void;
}

export const PaymentOptionsScreen: React.FC<PaymentOptionsScreenProps> = ({
  onGoBack,
  onNavigate,
  onGenerateReceiptFromPdf,
}) => {
  const [isProcessingPdf, setIsProcessingPdf] = useState(false);
  const [uploadedBillData, setUploadedBillData] = useState<ExtractedBillData | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string>('');
  const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingPdf(true);
    setUploadedFileName(file.name);
    try {
      const extracted = await extractBillDataFromPdf(file);
      setUploadedBillData(extracted);
      setIsConfirmationModalOpen(true);
    } catch (err) {
      console.warn('Fallback parsing error:', err);
      // Fallback com dados genéricos caso não seja possível ler o PDF
      const fallbackData: ExtractedBillData = {
        beneficiaryName: 'Beneficiário do Boleto',
        beneficiaryCnpj: '00.000.000/0001-00',
        beneficiaryBank: 'Banco Emissor',
        beneficiaryAccountType: 'Conta corrente',
        amount: 0,
        dueDate: new Date().toLocaleDateString('pt-BR'),
        nossoNumero: '',
        barcodeNumber: '',
        payerName: '',
        payerCpf: '',
      };
      setUploadedBillData(fallbackData);
      setIsConfirmationModalOpen(true);
    } finally {
      setIsProcessingPdf(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleConfirmBillPayment = (transferData: TransferData) => {
    setIsConfirmationModalOpen(false);
    if (onGenerateReceiptFromPdf) {
      onGenerateReceiptFromPdf(transferData);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white select-none font-sans">
      {/* Hidden File Input */}
      <input 
        ref={fileInputRef}
        type="file"
        accept="application/pdf,image/*"
        onChange={handleFileUpload}
        className="hidden"
        id="payment-upload-pdf-input"
      />

      {/* Top Close Bar with Safe Area */}
      <div 
        className="px-5 pb-3 shrink-0"
        style={{ paddingTop: 'max(env(safe-area-inset-top, 0px), 3rem)' }}
      >
        <button
          id="btn-close-payment-options"
          onClick={onGoBack}
          className="w-11 h-11 -ml-2 rounded-full hover:bg-neutral-100 active:scale-95 flex items-center justify-center transition-all cursor-pointer text-neutral-800"
          aria-label="Fechar opções de pagamento"
        >
          <X className="w-7 h-7 stroke-[2.2]" />
        </button>
      </div>

      {/* Main Content */}
      <div className="px-6 pt-2 flex-1 overflow-y-auto pb-10">
        <motion.h1
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-2xl sm:text-[26px] font-bold text-neutral-900 leading-tight tracking-tight mb-4"
        >
          Estas são suas opções de pagamento
        </motion.h1>

        {/* Card Destaque: Subir fatura / boleto PDF */}
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.05 }}
          onClick={() => fileInputRef.current?.click()}
          className="mb-6 bg-gradient-to-r from-purple-900 via-[#820AD1] to-purple-800 text-white rounded-2xl p-5 shadow-md cursor-pointer active:scale-[0.98] transition-all border border-purple-500/20"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center text-white shrink-0 shadow-inner">
                {isProcessingPdf ? (
                  <Loader2 className="w-6 h-6 animate-spin text-white" />
                ) : (
                  <UploadCloud className="w-6 h-6 text-white" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-[15px] text-white">
                    {isProcessingPdf ? 'Processando fatura...' : 'Subir fatura ou boleto PDF'}
                  </span>
                  <span className="bg-amber-400 text-neutral-900 text-[10px] font-black px-1.5 py-0.5 rounded">
                    NOVO
                  </span>
                </div>
                <p className="text-xs text-purple-100 mt-1 leading-snug">
                  Suba sua conta de luz, telefone ou boleto para gerar o comprovante oficial na hora
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-white/20 flex items-center justify-between">
            <span className="text-[11px] font-semibold text-purple-200">
              Formatos aceitos: PDF ou Imagem
            </span>
            <button 
              type="button" 
              className="px-4 py-1.5 bg-white text-[#820AD1] text-xs font-bold rounded-xl shadow-sm hover:bg-neutral-100 transition-colors"
            >
              {isProcessingPdf ? 'Carregando...' : 'Selecionar arquivo'}
            </button>
          </div>
        </motion.div>

        <div className="divide-y divide-neutral-100">
          {/* Pagar Boleto / Fatura */}
          <motion.button
            id="btn-pay-boleto"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            onClick={() => fileInputRef.current?.click()}
            className="w-full py-5 flex items-center justify-between text-left group cursor-pointer hover:bg-neutral-50/80 -mx-3 px-3 rounded-2xl transition-colors"
          >
            <div className="flex items-center gap-4 flex-1">
              <div className="w-11 h-11 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-800">
                <Barcode className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <span className="font-bold text-neutral-900 text-[15px]">Pagar boleto ou fatura</span>
                <p className="text-xs text-neutral-500 mt-0.5">Suba o PDF da conta ou digite a linha digitável</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-neutral-300 group-hover:text-neutral-500 group-hover:translate-x-0.5 transition-all" />
          </motion.button>

          {/* Pagar com Pix */}
          <motion.button
            id="btn-pay-pix"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 }}
            onClick={() => onNavigate('AreaPix')}
            className="w-full py-5 flex items-center justify-between text-left group cursor-pointer hover:bg-neutral-50/80 -mx-3 px-3 rounded-2xl transition-colors"
          >
            <div className="flex items-center gap-4 flex-1">
              <div className="w-11 h-11 rounded-full bg-purple-50 flex items-center justify-center text-[#820AD1]">
                <LayoutGrid className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-neutral-900 text-[15px]">Pagar com Pix</span>
                  <span className="bg-[#820AD1] text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Sparkles className="w-2.5 h-2.5" /> Instantâneo
                  </span>
                </div>
                <p className="text-xs text-neutral-500 mt-0.5">Use QR code ou Pix Copia e Cola</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-neutral-300 group-hover:text-neutral-500 group-hover:translate-x-0.5 transition-all" />
          </motion.button>

          {/* Débito Automático */}
          <motion.button
            id="btn-pay-autopay"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            onClick={() => alert("Gerenciar contas cadastradas em débito automático")}
            className="w-full py-5 flex items-center justify-between text-left group cursor-pointer hover:bg-neutral-50/80 -mx-3 px-3 rounded-2xl transition-colors"
          >
            <div className="flex items-center gap-4 flex-1">
              <div className="w-11 h-11 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-800">
                <RefreshCw className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <span className="font-bold text-neutral-900 text-[15px]">Débito automático</span>
                <p className="text-xs text-neutral-500 mt-0.5">Pague suas contas sem se preocupar com o vencimento</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-neutral-300 group-hover:text-neutral-500 group-hover:translate-x-0.5 transition-all" />
          </motion.button>

          {/* Tributos Federais e Estaduais (PJ) */}
          <motion.button
            id="btn-pay-taxes"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            onClick={() => alert("Pagamento de DAS, DARF, GPS e tributos PJ")}
            className="w-full py-5 flex items-center justify-between text-left group cursor-pointer hover:bg-neutral-50/80 -mx-3 px-3 rounded-2xl transition-colors"
          >
            <div className="flex items-center gap-4 flex-1">
              <div className="w-11 h-11 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-800">
                <Landmark className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <span className="font-bold text-neutral-900 text-[15px]">Impostos e Tributos (DAS/DARF)</span>
                <p className="text-xs text-neutral-500 mt-0.5">Guia DAS do MEI e Simples Nacional</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-neutral-300 group-hover:text-neutral-500 group-hover:translate-x-0.5 transition-all" />
          </motion.button>
        </div>
      </div>

      {/* Modal de Confirmação e Edição dos Dados do Boleto */}
      {isConfirmationModalOpen && uploadedBillData && (
        <BillConfirmationModal
          key={`${uploadedFileName}-${uploadedBillData.amount}-${Date.now()}`}
          isOpen={isConfirmationModalOpen}
          extractedData={uploadedBillData}
          fileName={uploadedFileName}
          onClose={() => setIsConfirmationModalOpen(false)}
          onConfirm={handleConfirmBillPayment}
        />
      )}
    </div>
  );
};
