import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
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
  Receipt,
  Keyboard,
  ArrowRight
} from 'lucide-react';
import { ScreenName, TransferData } from '../types';
import { 
  extractBillDataFromPdf, 
  ExtractedBillData,
  parseLinhaDigitavel,
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
  const [isManualBarcodeOpen, setIsManualBarcodeOpen] = useState(false);
  const [manualBarcode, setManualBarcode] = useState('');
  const [barcodeError, setBarcodeError] = useState('');
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

  const handleProcessManualBarcode = () => {
    const raw = manualBarcode.trim();
    if (!raw) {
      setBarcodeError('Por favor, digite ou cole a linha digitável.');
      return;
    }

    const digits = raw.replace(/\D/g, '');
    if (digits.length < 20) {
      setBarcodeError('Código de barras muito curto. Verifique e tente novamente.');
      return;
    }

    const decoded = parseLinhaDigitavel(digits);
    const billData: ExtractedBillData = {
      beneficiaryName: decoded?.beneficiaryBank ? `Concessionária / ${decoded.beneficiaryBank}` : 'Beneficiário do Boleto',
      beneficiaryCnpj: '00.000.000/0001-00',
      beneficiaryBank: decoded?.beneficiaryBank || 'Banco Emissor',
      beneficiaryAccountType: 'Conta corrente',
      amount: decoded?.amount || 0,
      dueDate: decoded?.dueDate || new Date().toLocaleDateString('pt-BR'),
      nossoNumero: '',
      barcodeNumber: decoded?.barcodeNumber || raw,
      payerName: '',
      payerCpf: '',
    };

    setUploadedFileName('Linha digitável manual');
    setUploadedBillData(billData);
    setIsManualBarcodeOpen(false);
    setManualBarcode('');
    setBarcodeError('');
    setIsConfirmationModalOpen(true);
  };

  return (
    <div className="flex flex-col h-full bg-white select-none font-sans relative">
      {/* Hidden File Input */}
      <input 
        ref={fileInputRef}
        type="file"
        accept="application/pdf,image/*,.pdf"
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

        {/* Card Destaque: Subir fatura / boleto PDF ou Foto */}
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
                    {isProcessingPdf ? 'Processando fatura...' : 'Subir fatura ou boleto'}
                  </span>
                  <span className="bg-amber-400 text-neutral-900 text-[10px] font-black px-1.5 py-0.5 rounded">
                    IA NUBANK
                  </span>
                </div>
                <p className="text-xs text-purple-100 mt-1 leading-snug">
                  Suba sua conta de luz, água, internet ou boleto bancário (PDF ou foto) para gerar o comprovante oficial
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-white/20 flex items-center justify-between">
            <span className="text-[11px] font-semibold text-purple-200">
              Formatos: PDF, JPG, PNG
            </span>
            <button 
              type="button" 
              className="px-4 py-1.5 bg-white text-[#820AD1] text-xs font-bold rounded-xl shadow-sm hover:bg-neutral-100 transition-colors cursor-pointer"
            >
              {isProcessingPdf ? 'Carregando...' : 'Selecionar arquivo'}
            </button>
          </div>
        </motion.div>

        <div className="divide-y divide-neutral-100">
          {/* Pagar Boleto / Fatura via PDF ou Foto */}
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
                <p className="text-xs text-neutral-500 mt-0.5">Suba o PDF ou foto da sua conta de energia, água ou boleto</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-neutral-300 group-hover:text-neutral-500 group-hover:translate-x-0.5 transition-all" />
          </motion.button>

          {/* Digitar Linha Digitável */}
          <motion.button
            id="btn-pay-manual-barcode"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.11 }}
            onClick={() => {
              setBarcodeError('');
              setIsManualBarcodeOpen(true);
            }}
            className="w-full py-5 flex items-center justify-between text-left group cursor-pointer hover:bg-neutral-50/80 -mx-3 px-3 rounded-2xl transition-colors"
          >
            <div className="flex items-center gap-4 flex-1">
              <div className="w-11 h-11 rounded-full bg-purple-50 flex items-center justify-center text-[#820AD1]">
                <Keyboard className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <span className="font-bold text-neutral-900 text-[15px]">Digitar código de barras</span>
                <p className="text-xs text-neutral-500 mt-0.5">Cole ou digite a linha digitável do boleto</p>
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

      {/* Modal / Sheet: Digitar Código de Barras */}
      <AnimatePresence>
        {isManualBarcodeOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4">
            <motion.div
              initial={{ opacity: 0, y: '100%' }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 280 }}
              className="w-full max-w-md bg-white rounded-t-[28px] sm:rounded-3xl shadow-2xl overflow-hidden p-6"
            >
              <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center text-[#820AD1]">
                    <Barcode className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-neutral-900">
                    Digitar código de barras
                  </h3>
                </div>
                <button
                  onClick={() => setIsManualBarcodeOpen(false)}
                  className="w-9 h-9 rounded-full bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center text-neutral-600 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="py-5 space-y-3">
                <label className="block text-xs font-semibold text-neutral-600">
                  Linha digitável (47 ou 48 dígitos)
                </label>
                <textarea
                  rows={3}
                  value={manualBarcode}
                  onChange={(e) => {
                    setManualBarcode(e.target.value);
                    if (barcodeError) setBarcodeError('');
                  }}
                  placeholder="Ex: 00190.00009 03373.384266 60612.719173 1 00000000087974"
                  className="w-full p-3.5 bg-neutral-50 focus:bg-white border border-neutral-200 focus:border-[#820AD1] rounded-xl font-mono text-sm text-neutral-900 outline-hidden transition-colors resize-none"
                />

                {barcodeError && (
                  <p className="text-xs text-red-600 font-medium">
                    {barcodeError}
                  </p>
                )}

                <p className="text-xs text-neutral-500 leading-relaxed">
                  Dica: Você pode copiar e colar a linha digitável diretamente do aplicativo ou internet banking de onde recebeu o boleto.
                </p>
              </div>

              <div className="pt-3 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsManualBarcodeOpen(false)}
                  className="flex-1 py-3 text-xs font-bold text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-2xl transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleProcessManualBarcode}
                  className="flex-1 py-3 px-4 text-xs font-bold text-white bg-[#820AD1] hover:bg-[#7209b7] rounded-2xl transition-all shadow-md shadow-purple-600/20 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>Continuar</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Loading Overlay with AI status feedback */}
      <AnimatePresence>
        {isProcessingPdf && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-6 max-w-xs w-full shadow-2xl flex flex-col items-center text-center"
            >
              <div className="w-14 h-14 rounded-full bg-purple-50 flex items-center justify-center text-[#820AD1] mb-3.5">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>
              <h3 className="text-base font-bold text-neutral-900">Analisando fatura / boleto</h3>
              <p className="text-xs text-neutral-500 mt-1.5 leading-relaxed">
                Lendo código de barras, valores, vencimento e beneficiário com inteligência artificial...
              </p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal de Confirmação e Edição dos Dados do Boleto */}
      {isConfirmationModalOpen && uploadedBillData && (
        <BillConfirmationModal
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
