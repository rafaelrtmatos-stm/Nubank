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
  Sparkles,
  Clock,
  RotateCcw
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
    extractedData?.amount ? extractedData.amount.toFixed(2).replace('.', ',') : '0,00'
  );
  const [dueDate, setDueDate] = useState<string>(() => extractedData?.dueDate || new Date().toLocaleDateString('pt-BR'));
  const [receiptDateTime, setReceiptDateTime] = useState<string>(() => formatNubankReceiptDate(new Date()));
  const [barcodeNumber, setBarcodeNumber] = useState<string>(
    () => extractedData?.barcodeNumber || ''
  );
  const [nossoNumero, setNossoNumero] = useState<string>(
    () => extractedData?.nossoNumero || ''
  );
  const [beneficiaryName, setBeneficiaryName] = useState<string>(
    () => extractedData?.beneficiaryName || 'Beneficiário do Boleto'
  );
  const [beneficiaryCnpj, setBeneficiaryCnpj] = useState<string>(
    () => extractedData?.beneficiaryCnpj || '00.000.000/0001-00'
  );
  const [payerName, setPayerName] = useState<string>(
    () => extractedData?.payerName || ''
  );
  const [payerCpf, setPayerCpf] = useState<string>(
    () => extractedData?.payerCpf || ''
  );
  const [unitOrContract, setUnitOrContract] = useState<string>(
    () => extractedData?.unitOrContract || ''
  );

  // Whenever extractedData changes or modal opens, update the form fields with newly extracted data
  React.useEffect(() => {
    if (extractedData) {
      setAmount(
        extractedData.amount ? extractedData.amount.toFixed(2).replace('.', ',') : '0,00'
      );
      setDueDate(extractedData.dueDate || new Date().toLocaleDateString('pt-BR'));
      setReceiptDateTime(formatNubankReceiptDate(new Date()));
      setBarcodeNumber(extractedData.barcodeNumber || '');
      setNossoNumero(extractedData.nossoNumero || '');
      setBeneficiaryName(extractedData.beneficiaryName || 'Beneficiário do Boleto');
      setBeneficiaryCnpj(extractedData.beneficiaryCnpj || '00.000.000/0001-00');
      setPayerName(extractedData.payerName || '');
      setPayerCpf(extractedData.payerCpf || '');
      setUnitOrContract(extractedData.unitOrContract || '');
    }
  }, [extractedData, isOpen]);

  if (!isOpen || !extractedData) return null;

  const handleConfirm = () => {
    const parsedAmount = parseFloat(amount.replace(/\./g, '').replace(',', '.')) || 0;
    const now = new Date();
    const currentFormattedDate = receiptDateTime.trim() || formatNubankReceiptDate(now);
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
      identifierCode: nossoNumero ? `BOLETO${nossoNumero.replace(/\D/g, '')}` : `BOLETO${Date.now()}`,
      originalDescription: `Venc: ${dueDate} - R$ ${parsedAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      payerName: payerName,
      payerCpf: payerCpf,
      unitOrContract: unitOrContract,
    };

    onConfirm(transferData);
  };

  return (
    <AnimatePresence>
      <div 
        onClick={onClose}
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center select-none bg-black/60 backdrop-blur-sm p-0 sm:p-4"
      >
        <motion.div
          initial={{ opacity: 0, y: '100%' }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: '100%' }}
          transition={{ type: 'spring', damping: 26, stiffness: 280 }}
          onClick={(e) => e.stopPropagation()}
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
            {/* Price & Beneficiary High-Visibility Card */}
            <div className={`p-4 rounded-2xl border transition-all ${
              (parseFloat(amount.replace(/\./g, '').replace(',', '.')) || 0) > 0
                ? 'bg-purple-50/80 border-purple-200 text-purple-950'
                : 'bg-amber-50 border-amber-200 text-amber-950'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#820AD1]">
                  Resumo da Fatura / Boleto
                </span>
                {(parseFloat(amount.replace(/\./g, '').replace(',', '.')) || 0) > 0 ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100/90 px-2 py-0.5 rounded-full">
                    <CheckCircle2 className="w-3 h-3" />
                    Valor Detectado
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                    Digite o Valor
                  </span>
                )}
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <div>
                  <span className="text-xs text-neutral-500 block">Total a pagar</span>
                  <span className="text-2xl font-extrabold text-neutral-900 tracking-tight">
                    R$ {amount || '0,00'}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs text-neutral-500 block">Vencimento</span>
                  <span className="text-sm font-bold text-neutral-800">
                    {dueDate || 'A definir'}
                  </span>
                </div>
              </div>
              <p className="mt-2 text-xs font-semibold text-neutral-700 truncate border-t border-black/5 pt-2">
                {beneficiaryName}
              </p>
            </div>

            {/* Valor */}
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                  Valor a Pagar (R$)
                </span>
                <span className="text-[10px] text-neutral-400 font-normal">Edite se necessário</span>
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
                  className="w-full pl-10 pr-3.5 py-2.5 bg-neutral-50 focus:bg-white border-2 border-purple-200 focus:border-[#820AD1] rounded-xl text-lg font-extrabold text-neutral-900 outline-hidden transition-colors"
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

            {/* Data e Hora do Pagamento / Comprovante */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-neutral-700 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#820AD1]" />
                  Data e Hora do Comprovante
                </label>
                <button
                  type="button"
                  onClick={() => setReceiptDateTime(formatNubankReceiptDate(new Date()))}
                  className="text-[11px] font-semibold text-[#820AD1] hover:underline cursor-pointer flex items-center gap-1"
                  title="Atualizar para o horário atual"
                >
                  <RotateCcw className="w-3 h-3" />
                  Agora
                </button>
              </div>
              <input
                type="text"
                value={receiptDateTime}
                onChange={(e) => setReceiptDateTime(e.target.value)}
                placeholder="Ex: 23 SET 2026 - 15:30:00"
                className="w-full px-3.5 py-2.5 bg-neutral-50 focus:bg-white border border-neutral-200 focus:border-[#820AD1] rounded-xl font-medium text-neutral-900 outline-hidden transition-colors text-xs"
              />
              <span className="text-[10px] text-neutral-400 mt-1 block">
                Automático no padrão oficial (ex: 23 SET 2026 - 14:20:00), editável se desejar.
              </span>
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

            {/* Pagador / Titular */}
            <div>
              <label className="block text-xs font-semibold text-neutral-600 mb-1 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-neutral-500" />
                Pagador / Titular da Conta
              </label>
              <input
                type="text"
                value={payerName}
                onChange={(e) => setPayerName(e.target.value)}
                placeholder="Nome completo do pagador"
                className="w-full px-3.5 py-2 bg-neutral-50 focus:bg-white border border-neutral-200 focus:border-[#820AD1] rounded-xl text-xs font-medium text-neutral-900 outline-hidden transition-colors"
              />
            </div>

            {/* CPF do Pagador */}
            <div>
              <label className="block text-xs font-semibold text-neutral-600 mb-1">
                CPF do Pagador
              </label>
              <input
                type="text"
                value={payerCpf}
                onChange={(e) => setPayerCpf(e.target.value)}
                placeholder="000.000.000-00"
                className="w-full px-3.5 py-2 bg-neutral-50 focus:bg-white border border-neutral-200 focus:border-[#820AD1] rounded-xl font-mono text-xs text-neutral-900 outline-hidden transition-colors"
              />
            </div>

            {/* Unidade Consumidora / Contrato */}
            <div>
              <label className="block text-xs font-semibold text-neutral-600 mb-1 flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5 text-neutral-500" />
                Unidade Consumidora / Conta Contrato
              </label>
              <input
                type="text"
                value={unitOrContract}
                onChange={(e) => setUnitOrContract(e.target.value)}
                placeholder="Ex: 2.105.447.013-05"
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
