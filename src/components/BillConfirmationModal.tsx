import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  FileText, 
  Calendar, 
  DollarSign, 
  Barcode, 
  Hash, 
  Building2, 
  User, 
  CheckCircle2, 
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { ExtractedBillData } from '../utils/pdfReceiptParser';
import { TransferData } from '../types';
import { generateNubankTransactionId, formatNubankReceiptDate } from '../utils/pdfReceiptParser';

interface BillConfirmationModalProps {
  isOpen: boolean;
  extractedData: ExtractedBillData | null;
  fileName?: string;
  onClose: () => void;
  onConfirm: (transferData: TransferData) => void;
}

export const BillConfirmationModal: React.FC<BillConfirmationModalProps> = ({
  isOpen,
  extractedData,
  fileName,
  onClose,
  onConfirm,
}) => {
  // Editable form state initialized from extracted PDF
  const [amount, setAmount] = useState<string>(() =>
    extractedData?.amount ? extractedData.amount.toFixed(2).replace('.', ',') : '879,74'
  );
  const [dueDate, setDueDate] = useState<string>(() => extractedData?.dueDate || '20.07.2026');
  const [barcodeNumber, setBarcodeNumber] = useState<string>(
    () => extractedData?.barcodeNumber || '00190.00009 03373.384266 60612.719173 1 00000000087974'
  );
  const [nossoNumero, setNossoNumero] = useState<string>(
    () => extractedData?.nossoNumero || '33733842660612719'
  );
  const [beneficiaryName, setBeneficiaryName] = useState<string>(
    () => extractedData?.beneficiaryName || 'EQUATORIAL PARÁ DISTRIBUIDORA DE ENERGIA S.A.'
  );
  const [beneficiaryCnpj, setBeneficiaryCnpj] = useState<string>(
    () => extractedData?.beneficiaryCnpj || '04895728000180'
  );

  // Whenever extractedData changes or modal opens, update the form fields with newly extracted data
  React.useEffect(() => {
    if (extractedData) {
      setAmount(
        extractedData.amount ? extractedData.amount.toFixed(2).replace('.', ',') : '879,74'
      );
      setDueDate(extractedData.dueDate || '20.07.2026');
      setBarcodeNumber(extractedData.barcodeNumber || '00190.00009 03373.384266 60612.719173 1 00000000087974');
      setNossoNumero(extractedData.nossoNumero || '33733842660612719');
      setBeneficiaryName(extractedData.beneficiaryName || 'EQUATORIAL PARÁ DISTRIBUIDORA DE ENERGIA S.A.');
      setBeneficiaryCnpj(extractedData.beneficiaryCnpj || '04895728000180');
    }
  }, [extractedData, isOpen]);

  if (!isOpen || !extractedData) return null;

  const handleConfirm = () => {
    const parsedAmount = parseFloat(amount.replace(/\./g, '').replace(',', '.')) || 0;
    const now = new Date();
    const currentFormattedDate = formatNubankReceiptDate(now);
    const newTransactionId = generateNubankTransactionId();

    const transferData: TransferData = {
      recipient: {
        id: 'beneficiary-bill',
        name: beneficiaryName,
        initials: beneficiaryName.substring(0, 2).toUpperCase() || 'BO',
        document: beneficiaryCnpj.replace(/\D/g, ''),
        institution: extractedData.beneficiaryBank || 'BCO DO BRASIL S.A.',
        accountType: extractedData.beneficiaryAccountType || 'Conta corrente',
        agency: '0001',
        account: '',
      },
      amount: parsedAmount,
      date: 'Hoje',
      isBillPayment: true,
      transactionId: newTransactionId,
      receiptDateFormatted: currentFormattedDate,
      dueDate: dueDate,
      nossoNumero: nossoNumero,
      barcodeNumber: barcodeNumber,
      identifierCode: `BOLETO${nossoNumero.replace(/\D/g, '')}`,
      originalDescription: `Venc: ${dueDate} - R$ ${parsedAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    };

    onConfirm(transferData);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center select-none bg-black/60 backdrop-blur-xs p-0 sm:p-4">
        <motion.div
          initial={{ opacity: 0, y: '100%' }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: '100%' }}
          transition={{ type: 'spring', damping: 26, stiffness: 280 }}
          className="w-full max-w-md bg-white rounded-t-[28px] sm:rounded-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden"
        >
          {/* Header */}
          <div className="px-6 pt-5 pb-3 border-b border-neutral-100 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center text-[#820AD1]">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h2 className="text-[16px] font-bold text-neutral-900 leading-none">
                    Dados do Boleto / Fatura
                  </h2>
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-1.5 py-0.5 rounded">
                    Lido com sucesso
                  </span>
                </div>
                <p className="text-xs text-neutral-500 mt-0.5 truncate max-w-[220px]">
                  {fileName || 'Arquivo PDF processado'}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-neutral-100 hover:bg-neutral-200 active:scale-95 flex items-center justify-center text-neutral-600 transition-all cursor-pointer"
              aria-label="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body Fields */}
          <div className="px-6 py-4 overflow-y-auto space-y-4 flex-1 text-sm">
            <div className="p-3 bg-purple-50/70 border border-purple-100 rounded-xl flex items-start gap-2.5 text-xs text-purple-900">
              <Sparkles className="w-4 h-4 text-[#820AD1] shrink-0 mt-0.5" />
              <span>
                Confira ou ajuste os dados extraídos do seu PDF antes de emitir o comprovante oficial.
              </span>
            </div>

            {/* Valor */}
            <div>
              <label className="block text-xs font-semibold text-neutral-600 mb-1 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                Valor a Pagar (R$)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-neutral-400">
                  R$
                </span>
                <input
                  type="text"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0,00"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-neutral-50 focus:bg-white border border-neutral-200 focus:border-[#820AD1] rounded-xl text-base font-bold text-neutral-900 outline-hidden transition-colors"
                />
              </div>
            </div>

            {/* Data de Vencimento */}
            <div>
              <label className="block text-xs font-semibold text-neutral-600 mb-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#820AD1]" />
                Data de Vencimento
              </label>
              <input
                type="text"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                placeholder="DD.MM.AAAA"
                className="w-full px-3.5 py-2.5 bg-neutral-50 focus:bg-white border border-neutral-200 focus:border-[#820AD1] rounded-xl font-medium text-neutral-900 outline-hidden transition-colors"
              />
            </div>

            {/* Código do Boleto (Linha Digitável / Código de barras) */}
            <div>
              <label className="block text-xs font-semibold text-neutral-600 mb-1 flex items-center gap-1.5">
                <Barcode className="w-3.5 h-3.5 text-[#820AD1]" />
                Código do Boleto / Linha Digitável
              </label>
              <input
                type="text"
                value={barcodeNumber}
                onChange={(e) => setBarcodeNumber(e.target.value)}
                placeholder="Linha digitável ou código de barras"
                className="w-full px-3.5 py-2.5 bg-neutral-50 focus:bg-white border border-neutral-200 focus:border-[#820AD1] rounded-xl font-mono text-xs text-neutral-900 outline-hidden transition-colors"
              />
            </div>

            {/* Nosso Número de Boleto */}
            <div>
              <label className="block text-xs font-semibold text-neutral-600 mb-1 flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5 text-[#820AD1]" />
                Nosso Número do Boleto
              </label>
              <input
                type="text"
                value={nossoNumero}
                onChange={(e) => setNossoNumero(e.target.value)}
                placeholder="Ex: 33733841850847025"
                className="w-full px-3.5 py-2.5 bg-neutral-50 focus:bg-white border border-neutral-200 focus:border-[#820AD1] rounded-xl font-mono text-xs text-neutral-900 outline-hidden transition-colors"
              />
            </div>

            {/* Beneficiário */}
            <div>
              <label className="block text-xs font-semibold text-neutral-600 mb-1 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-neutral-500" />
                Beneficiário / Empresa
              </label>
              <input
                type="text"
                value={beneficiaryName}
                onChange={(e) => setBeneficiaryName(e.target.value)}
                placeholder="Nome da empresa emissora"
                className="w-full px-3.5 py-2 bg-neutral-50 focus:bg-white border border-neutral-200 focus:border-[#820AD1] rounded-xl text-xs font-medium text-neutral-900 outline-hidden transition-colors"
              />
            </div>

            {/* CNPJ Beneficiário */}
            <div>
              <label className="block text-xs font-semibold text-neutral-600 mb-1">
                CNPJ do Beneficiário
              </label>
              <input
                type="text"
                value={beneficiaryCnpj}
                onChange={(e) => setBeneficiaryCnpj(e.target.value)}
                placeholder="00.000.000/0001-00"
                className="w-full px-3.5 py-2 bg-neutral-50 focus:bg-white border border-neutral-200 focus:border-[#820AD1] rounded-xl font-mono text-xs text-neutral-900 outline-hidden transition-colors"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-4 sm:p-5 border-t border-neutral-100 bg-neutral-50/60 flex items-center gap-3">
            <button
              onClick={onClose}
              type="button"
              className="flex-1 py-3 text-xs font-bold text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-2xl transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirm}
              type="button"
              className="flex-1 py-3 px-4 text-xs font-bold text-white bg-[#820AD1] hover:bg-[#7209b7] active:scale-[0.98] rounded-2xl transition-all shadow-md shadow-purple-600/20 flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Gerar Comprovante</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
