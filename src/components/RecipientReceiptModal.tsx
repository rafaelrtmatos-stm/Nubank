import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  FileText, 
  Building2, 
  User, 
  CreditCard, 
  KeyRound, 
  DollarSign, 
  CheckCircle2, 
  ArrowRight,
  Sparkles,
  UserCheck
} from 'lucide-react';
import { Contact, TransferData } from '../types';
import { ExtractedRecipientData, convertExtractedToContact } from '../utils/transferReceiptParser';

interface RecipientReceiptModalProps {
  isOpen: boolean;
  extractedData: ExtractedRecipientData | null;
  fileName?: string;
  onClose: () => void;
  onSaveAndTransfer: (contact: Contact, suggestedAmount?: number) => void;
  onSaveOnly: (contact: Contact) => void;
}

export const RecipientReceiptModal: React.FC<RecipientReceiptModalProps> = ({
  isOpen,
  extractedData,
  fileName,
  onClose,
  onSaveAndTransfer,
  onSaveOnly,
}) => {
  const [activeParty, setActiveParty] = useState<'recipient' | 'payer'>('recipient');
  const [name, setName] = useState('');
  const [document, setDocument] = useState('');
  const [institution, setInstitution] = useState('');
  const [pixKey, setPixKey] = useState('');
  const [accountType, setAccountType] = useState('Conta de pagamentos');
  const [agency, setAgency] = useState('');
  const [account, setAccount] = useState('');
  const [amountStr, setAmountStr] = useState('0,00');

  useEffect(() => {
    if (extractedData) {
      if (activeParty === 'recipient') {
        setName(extractedData.name || 'Destinatário Pix');
        setDocument(extractedData.document || '***.***.***-**');
        setInstitution(extractedData.institution || 'Nu Pagamentos S.A.');
      } else {
        setName(extractedData.payerName || 'Pagador Pix');
        setDocument(extractedData.payerDocument || '***.***.***-**');
        setInstitution(extractedData.payerInstitution || 'Banco Cooperativo Sicredi S.A.');
      }

      setPixKey(extractedData.pixKey || '');
      setAccountType(extractedData.accountType || 'Conta de pagamentos');
      setAgency(extractedData.agency || '0001');
      setAccount(extractedData.account || '');
      setAmountStr(
        extractedData.amount && extractedData.amount > 0
          ? extractedData.amount.toFixed(2).replace('.', ',')
          : '0,00'
      );
    }
  }, [extractedData, isOpen, activeParty]);

  if (!isOpen || !extractedData) return null;

  const getContactObject = (): Contact => {
    const initials = name
      .split(' ')
      .filter(Boolean)
      .map((p) => p[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() || 'PX';

    return {
      id: 'contact-' + Date.now(),
      name: name.trim() || 'Destinatário Pix',
      initials,
      document: document.trim() || '***.***.***-**',
      institution: institution.trim() || 'Nu Pagamentos S.A.',
      accountType: accountType.trim() || 'Conta de pagamentos',
      agency: agency.trim() || '0001',
      account: account.trim(),
      pixKey: pixKey.trim(),
    };
  };

  const handleSaveAndTransferClick = () => {
    const contact = getContactObject();
    const parsedAmount = parseFloat(amountStr.replace(/\./g, '').replace(',', '.')) || 0;
    onSaveAndTransfer(contact, parsedAmount > 0 ? parsedAmount : undefined);
  };

  const handleSaveOnlyClick = () => {
    const contact = getContactObject();
    onSaveOnly(contact);
  };

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-end sm:items-center justify-center p-3 sm:p-5 overflow-y-auto"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.96 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-md bg-white rounded-3xl overflow-hidden shadow-2xl border border-neutral-100 flex flex-col max-h-[92vh]"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-900 via-[#820AD1] to-purple-800 text-white p-5 pb-4 relative">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-white/80 hover:text-white p-1.5 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
              aria-label="Fechar"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-1.5">
              <span className="p-1.5 rounded-lg bg-white/20 text-white">
                <Sparkles className="w-4 h-4" />
              </span>
              <span className="text-[11px] font-bold tracking-wider uppercase text-purple-200">
                Comprovante Pix Lido
              </span>
            </div>

            <h2 className="text-xl font-bold tracking-tight text-white leading-tight">
              {activeParty === 'recipient' ? 'Dados do Recebedor' : 'Dados do Pagador (Cliente)'}
            </h2>
            <p className="text-xs text-purple-100 mt-1 leading-relaxed">
              {fileName ? `Extraído de "${fileName}". ` : ''}
              Verifique os dados abaixo. O contato será adicionado à sua agenda Pix.
            </p>

            {/* If both Recipient and Payer were identified in the receipt (e.g. Sicredi, BB) */}
            {extractedData.payerName && extractedData.name && (
              <div className="mt-3 pt-3 border-t border-white/20 flex flex-col gap-1.5">
                <span className="text-[10px] uppercase font-bold text-purple-200 tracking-wider">
                  Quem você deseja cadastrar ou transferir?
                </span>
                <div className="grid grid-cols-2 gap-2 bg-black/20 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setActiveParty('recipient')}
                    className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all text-center truncate ${
                      activeParty === 'recipient'
                        ? 'bg-white text-[#820AD1] shadow-xs'
                        : 'text-purple-200 hover:text-white'
                    }`}
                  >
                    Recebedor: {extractedData.name.split(' ')[0]}
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveParty('payer')}
                    className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all text-center truncate ${
                      activeParty === 'payer'
                        ? 'bg-white text-[#820AD1] shadow-xs'
                        : 'text-purple-200 hover:text-white'
                    }`}
                  >
                    Pagador: {extractedData.payerName.split(' ')[0]}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Form Content */}
          <div className="p-5 overflow-y-auto space-y-3.5 flex-1 text-neutral-800 text-sm">
            {/* Receipt Summary Pills */}
            {(extractedData.payerInstitution || extractedData.transactionId) && (
              <div className="bg-purple-50/70 border border-purple-200/80 rounded-2xl p-3 text-xs text-purple-950 space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-bold text-purple-900">
                  <span>Banco Emissor do Comprovante</span>
                  <span className="text-[#820AD1]">{extractedData.payerInstitution || 'Sicredi'}</span>
                </div>
                {extractedData.transactionId && (
                  <div className="text-[10px] text-neutral-600 truncate">
                    <span className="font-semibold">ID Transação:</span> {extractedData.transactionId}
                  </div>
                )}
                {extractedData.date && (
                  <div className="text-[10px] text-neutral-600">
                    <span className="font-semibold">Data/Hora:</span> {extractedData.date}
                  </div>
                )}
              </div>
            )}

            {/* Nome */}
            <div>
              <label className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider block mb-1">
                {activeParty === 'recipient' ? 'Nome do Recebedor / Favorecido' : 'Nome do Pagador / Cliente'}
              </label>
              <div className="flex items-center gap-2.5 px-3.5 py-2.5 bg-neutral-50 rounded-xl border border-neutral-200 focus-within:border-[#820AD1] focus-within:bg-white transition-colors">
                <User className="w-4 h-4 text-neutral-400 shrink-0" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-transparent font-semibold text-neutral-900 focus:outline-none text-sm"
                  placeholder="Nome completo ou Razão Social"
                />
              </div>
            </div>

            {/* Documento & Banco em duas colunas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* CPF / CNPJ */}
              <div>
                <label className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider block mb-1">
                  CPF ou CNPJ
                </label>
                <div className="flex items-center gap-2 px-3 py-2.5 bg-neutral-50 rounded-xl border border-neutral-200 focus-within:border-[#820AD1] focus-within:bg-white transition-colors">
                  <CreditCard className="w-4 h-4 text-neutral-400 shrink-0" />
                  <input
                    type="text"
                    value={document}
                    onChange={(e) => setDocument(e.target.value)}
                    className="w-full bg-transparent font-medium text-neutral-900 focus:outline-none text-xs"
                    placeholder="000.000.000-00"
                  />
                </div>
              </div>

              {/* Instituição / Banco */}
              <div>
                <label className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider block mb-1">
                  Banco / Instituição
                </label>
                <div className="flex items-center gap-2 px-3 py-2.5 bg-neutral-50 rounded-xl border border-neutral-200 focus-within:border-[#820AD1] focus-within:bg-white transition-colors">
                  <Building2 className="w-4 h-4 text-neutral-400 shrink-0" />
                  <input
                    type="text"
                    value={institution}
                    onChange={(e) => setInstitution(e.target.value)}
                    className="w-full bg-transparent font-medium text-neutral-900 focus:outline-none text-xs truncate"
                    placeholder="Nome do Banco"
                  />
                </div>
              </div>
            </div>

            {/* Chave Pix e Tipo de Conta */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Chave Pix */}
              <div>
                <label className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider block mb-1">
                  Chave Pix (opcional)
                </label>
                <div className="flex items-center gap-2 px-3 py-2.5 bg-neutral-50 rounded-xl border border-neutral-200 focus-within:border-[#820AD1] focus-within:bg-white transition-colors">
                  <KeyRound className="w-4 h-4 text-neutral-400 shrink-0" />
                  <input
                    type="text"
                    value={pixKey}
                    onChange={(e) => setPixKey(e.target.value)}
                    className="w-full bg-transparent font-medium text-neutral-900 focus:outline-none text-xs"
                    placeholder="E-mail, CPF, tel ou chave"
                  />
                </div>
              </div>

              {/* Tipo de Conta */}
              <div>
                <label className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider block mb-1">
                  Tipo de Conta
                </label>
                <div className="flex items-center gap-2 px-3 py-2.5 bg-neutral-50 rounded-xl border border-neutral-200 focus-within:border-[#820AD1] focus-within:bg-white transition-colors">
                  <input
                    type="text"
                    value={accountType}
                    onChange={(e) => setAccountType(e.target.value)}
                    className="w-full bg-transparent font-medium text-neutral-900 focus:outline-none text-xs"
                    placeholder="Conta de pagamentos"
                  />
                </div>
              </div>
            </div>

            {/* Valor do Comprovante (opcional) */}
            <div>
              <label className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider block mb-1">
                Valor detectado no comprovante (R$)
              </label>
              <div className="flex items-center gap-2 px-3.5 py-2.5 bg-neutral-50 rounded-xl border border-neutral-200 focus-within:border-[#820AD1] focus-within:bg-white transition-colors">
                <span className="font-bold text-neutral-600 text-sm">R$</span>
                <input
                  type="text"
                  value={amountStr}
                  onChange={(e) => setAmountStr(e.target.value)}
                  className="w-full bg-transparent font-bold text-neutral-900 focus:outline-none text-sm"
                  placeholder="0,00"
                />
              </div>
              <span className="text-[11px] text-neutral-400 block mt-1">
                Ao prosseguir para a transferência, este valor já ficará pré-preenchido.
              </span>
            </div>
          </div>

          {/* Action Buttons Footer */}
          <div className="p-5 pt-3 bg-neutral-50 border-t border-neutral-200 flex flex-col gap-2.5 shrink-0">
            <button
              type="button"
              id="btn-confirm-save-and-transfer"
              onClick={handleSaveAndTransferClick}
              className="w-full py-3.5 bg-[#820AD1] hover:bg-[#6f09b5] active:scale-[0.98] text-white font-bold rounded-2xl transition-all shadow-md flex items-center justify-center gap-2 text-sm cursor-pointer"
            >
              <UserCheck className="w-4 h-4" />
              <span>Adicionar aos Contatos e Transferir</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>

            <button
              type="button"
              id="btn-save-contact-only"
              onClick={handleSaveOnlyClick}
              className="w-full py-2.5 text-neutral-700 hover:text-neutral-900 font-semibold text-xs transition-colors cursor-pointer text-center"
            >
              Salvar apenas nos contatos
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
