import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  QrCode, 
  Building2, 
  ArrowRight,
  FileText,
  Loader2,
  Sparkles,
  UploadCloud
} from 'lucide-react';
import { Contact } from '../types';
import { extractRecipientFromReceipt, ExtractedRecipientData } from '../utils/transferReceiptParser';
import { RecipientReceiptModal } from '../components/RecipientReceiptModal';

interface SelectRecipientScreenProps {
  onGoBack: () => void;
  onSelectRecipient: (contact: Contact, initialAmount?: number) => void;
  onNavigateScanQrCode?: () => void;
  onAddContact?: (contact: Contact) => void;
  contacts: Contact[];
}

export const SelectRecipientScreen: React.FC<SelectRecipientScreenProps> = ({
  onGoBack,
  onSelectRecipient,
  onNavigateScanQrCode,
  onAddContact,
  contacts,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showReceiptSecretOption, setShowReceiptSecretOption] = useState(false);
  const [isProcessingReceipt, setIsProcessingReceipt] = useState(false);
  const [extractedRecipient, setExtractedRecipient] = useState<ExtractedRecipientData | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const qrClickCountRef = useRef<number>(0);
  const qrClickTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (qrClickTimeoutRef.current) {
        clearTimeout(qrClickTimeoutRef.current);
      }
    };
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Handler for clicks on the QR Code icon
  // 1 click -> opens ScanQrCode camera screen
  // 3 clicks in quick succession -> reveals the secret "Extrair de Comprovante" option
  const handleQrSymbolClick = (e: React.MouseEvent) => {
    e.preventDefault();
    qrClickCountRef.current += 1;

    if (qrClickTimeoutRef.current) {
      clearTimeout(qrClickTimeoutRef.current);
    }

    if (qrClickCountRef.current >= 3) {
      // 3 clicks reached!
      qrClickCountRef.current = 0;
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        try {
          navigator.vibrate([40, 40, 40]);
        } catch (err) {
          // ignore
        }
      }
      setShowReceiptSecretOption(true);
    } else {
      // Wait to see if further clicks follow
      qrClickTimeoutRef.current = setTimeout(() => {
        const count = qrClickCountRef.current;
        qrClickCountRef.current = 0;
        if (count === 1) {
          // Normal single click: go to camera scanner
          if (onNavigateScanQrCode) {
            onNavigateScanQrCode();
          }
        }
      }, 380);
    }
  };

  // Frequent contacts (first 3)
  const frequentContacts = contacts.slice(0, 3);

  // Filtered contacts for search
  const filteredContacts = contacts.filter((c) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      c.name.toLowerCase().includes(q) ||
      c.document.toLowerCase().includes(q) ||
      (c.pixKey && c.pixKey.toLowerCase().includes(q)) ||
      c.institution.toLowerCase().includes(q)
    );
  });

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    // Check if matching contact exists
    const match = contacts.find(
      (c) => c.name.toLowerCase() === searchQuery.toLowerCase().trim()
    );
    if (match) {
      onSelectRecipient(match);
      return;
    }

    // Otherwise create custom recipient from search query
    const customContact: Contact = {
      id: 'custom-' + Date.now(),
      name: searchQuery.trim(),
      initials: searchQuery.trim().substring(0, 2).toUpperCase(),
      document: '***.***.***-**',
      institution: 'Nu Pagamentos S.A.',
      accountType: 'Conta Corrente PJ',
      pixKey: searchQuery.trim(),
    };
    onSelectRecipient(customContact);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingReceipt(true);
    setUploadedFileName(file.name);
    setShowReceiptSecretOption(false);

    try {
      const extracted = await extractRecipientFromReceipt(file);
      setExtractedRecipient(extracted);
      setIsReceiptModalOpen(true);
    } catch (err) {
      console.warn('Receipt parsing error:', err);
      setExtractedRecipient({
        name: 'Destinatário Comprovante',
        initials: 'DC',
        document: '***.000.000-**',
        institution: 'Nu Pagamentos S.A.',
        accountType: 'Conta de pagamentos',
        pixKey: '',
        amount: 0,
      });
      setIsReceiptModalOpen(true);
    } finally {
      setIsProcessingReceipt(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSaveAndTransfer = (contact: Contact, suggestedAmount?: number) => {
    setIsReceiptModalOpen(false);
    if (onAddContact) {
      onAddContact(contact);
    }
    showToast(`Contato "${contact.name}" adicionado à agenda Pix!`);
    setTimeout(() => {
      onSelectRecipient(contact, suggestedAmount);
    }, 200);
  };

  const handleSaveOnly = (contact: Contact) => {
    setIsReceiptModalOpen(false);
    if (onAddContact) {
      onAddContact(contact);
    }
    showToast(`Contato "${contact.name}" salvo nos seus contatos!`);
  };

  return (
    <div className="flex flex-col h-full bg-white select-none text-neutral-900 relative font-sans overflow-hidden">
      {/* Hidden File Input for PDF / Image Receipt */}
      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf,image/*"
        onChange={handleFileUpload}
        className="hidden"
        id="input-upload-receipt-file"
      />

      {/* Top Close Button (X) with Safe Area */}
      <div 
        className="px-5 pb-2 flex items-center justify-between shrink-0"
        style={{ paddingTop: 'max(env(safe-area-inset-top, 0px), 3rem)' }}
      >
        <button
          id="btn-close-recipient-modal"
          onClick={onGoBack}
          className="w-11 h-11 -ml-2 rounded-full flex items-center justify-center text-neutral-800 hover:bg-neutral-100 active:scale-95 transition-all cursor-pointer"
          aria-label="Fechar"
        >
          <X className="w-7 h-7 stroke-[2.2]" />
        </button>

        {isProcessingReceipt && (
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#820AD1] bg-purple-50 px-3 py-1.5 rounded-full animate-pulse">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span>Lendo comprovante...</span>
          </div>
        )}
      </div>

      {/* Main Content Body */}
      <div className="flex-1 px-6 pt-1 overflow-y-auto pb-6">
        {/* Main Title */}
        <h1 className="text-[23px] sm:text-[25px] font-bold text-neutral-900 tracking-tight leading-tight">
          Para quem você quer transferir?
        </h1>

        {/* Input Field Section */}
        <div className="mt-6">
          <label className="text-[13px] text-neutral-500 font-normal block">
            Insira o dado de quem vai receber
          </label>
          <form onSubmit={handleCustomSubmit} className="mt-1">
            <div className="flex items-center justify-between pb-2.5 border-b border-neutral-200 focus-within:border-neutral-900 transition-colors">
              <input
                id="input-recipient-search"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Nome, CPF/CNPJ ou chave Pix"
                className="w-full text-base sm:text-[17px] text-neutral-900 placeholder:text-neutral-400 placeholder:font-normal font-medium bg-transparent focus:outline-none"
              />
              <button
                type="button"
                id="btn-trigger-qr-options"
                onClick={handleQrSymbolClick}
                className="text-neutral-900 hover:text-[#820AD1] p-1.5 rounded-xl hover:bg-purple-50 active:scale-95 shrink-0 cursor-pointer transition-all"
                title="Escanear QR Code Pix"
              >
                <QrCode className="w-6 h-6" />
              </button>
            </div>
          </form>

          {/* Quick confirmation if typed text and not empty */}
          {searchQuery.trim() && (
            <motion.button
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={handleCustomSubmit}
              className="mt-2.5 w-full py-2.5 px-4 bg-purple-50 text-[#820AD1] font-bold rounded-xl text-xs flex items-center justify-between hover:bg-purple-100 transition-colors cursor-pointer"
            >
              <span>Continuar para: <strong>{searchQuery}</strong></span>
              <ArrowRight className="w-4 h-4" />
            </motion.button>
          )}
        </div>

        {/* Section: Você sempre costuma pagar */}
        {!searchQuery && frequentContacts.length > 0 && (
          <div className="mt-7">
            <p className="text-[13px] text-neutral-500 font-normal mb-3">
              Você sempre costuma pagar
            </p>

            <div className="flex gap-4 overflow-x-auto no-scrollbar -mx-6 px-6 pb-2">
              {frequentContacts.map((contact) => (
                <div 
                  key={contact.id}
                  onClick={() => onSelectRecipient(contact)}
                  className="flex flex-col items-center shrink-0 w-[94px] cursor-pointer group"
                >
                  <div className="w-[72px] h-[72px] rounded-full bg-[#f5f5f5] group-hover:bg-[#ebebeb] group-active:scale-95 flex items-center justify-center transition-all mb-2">
                    {contact.document && contact.document.length > 14 ? (
                      <Building2 className="w-7 h-7 text-neutral-900" />
                    ) : contact.initials ? (
                      <span className="text-[15px] font-bold text-neutral-800">{contact.initials}</span>
                    ) : (
                      <Building2 className="w-7 h-7 text-neutral-900" />
                    )}
                  </div>
                  <p className="text-[12px] font-bold text-neutral-900 leading-tight text-center truncate w-full">
                    {contact.name}
                  </p>
                  <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-tight text-center mt-0.5 truncate w-full">
                    {contact.institution || 'Nu Pagamentos'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Section: Todos os seus contatos */}
        <div className="mt-7">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[13px] text-neutral-500 font-normal">
              Todos os seus contatos ({contacts.length})
            </p>
          </div>

          <div className="divide-y divide-neutral-100">
            {filteredContacts.map((contact) => (
              <div
                key={contact.id}
                onClick={() => onSelectRecipient(contact)}
                className="py-3.5 flex items-center gap-4 cursor-pointer group hover:bg-neutral-50/80 -mx-6 px-6 transition-colors"
              >
                <div className="w-11 h-11 rounded-full bg-[#f5f5f5] group-hover:bg-[#ebebeb] group-active:scale-95 flex items-center justify-center shrink-0 transition-all">
                  {contact.document && contact.document.length > 14 ? (
                    <Building2 className="w-5 h-5 text-neutral-900" />
                  ) : contact.initials ? (
                    <span className="text-xs font-bold text-neutral-800">{contact.initials}</span>
                  ) : (
                    <Building2 className="w-5 h-5 text-neutral-900" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-semibold text-neutral-900 leading-snug group-hover:text-[#820AD1] transition-colors truncate">
                    {contact.name}
                  </p>
                  <p className="text-[11px] text-neutral-400 truncate">
                    {contact.institution} {contact.document ? `• ${contact.document}` : ''}
                  </p>
                </div>
              </div>
            ))}

            {filteredContacts.length === 0 && (
              <div className="py-8 text-center text-neutral-500">
                <p className="text-xs">
                  {searchQuery 
                    ? `Nenhum contato encontrado para "${searchQuery}"`
                    : 'Nenhum contato cadastrado ainda.'}
                </p>
                {searchQuery && (
                  <button
                    type="button"
                    onClick={handleCustomSubmit}
                    className="mt-3 text-xs text-[#820AD1] font-bold underline cursor-pointer"
                  >
                    Continuar transferência para "{searchQuery}"
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Home Indicator */}
      <div className="p-4 pt-1 shrink-0 bg-white">
        <div className="w-32 sm:w-36 h-1 bg-black rounded-full mx-auto" />
      </div>

      {/* Modal revelado APENAS após clicar 3x no símbolo de QR Code */}
      <AnimatePresence>
        {showReceiptSecretOption && (
          <div 
            className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-end sm:items-center justify-center p-3 sm:p-5"
            onClick={() => setShowReceiptSecretOption(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 40, scale: 0.95 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-neutral-100 flex flex-col"
            >
              <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-2xl bg-purple-100 text-[#820AD1] flex items-center justify-center shadow-xs">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-neutral-900 text-sm">
                      Extrair de Comprovante
                    </h3>
                    <span className="text-[10px] text-purple-700 font-semibold">
                      Opção desbloqueada
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setShowReceiptSecretOption(false)}
                  className="text-neutral-400 hover:text-neutral-700 p-1.5 rounded-full hover:bg-neutral-100 cursor-pointer transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="py-4">
                <p className="text-xs text-neutral-600 leading-relaxed mb-4">
                  Selecione um comprovante de transferência bancária ou Pix (em arquivo PDF ou foto) para extrair os dados do recebedor e cadastrá-lo aos seus contatos.
                </p>

                <button
                  type="button"
                  id="btn-upload-receipt-from-secret"
                  onClick={() => {
                    setShowReceiptSecretOption(false);
                    fileInputRef.current?.click();
                  }}
                  className="w-full py-3.5 px-4 bg-[#820AD1] hover:bg-[#6f09b5] active:scale-[0.98] text-white font-bold rounded-2xl transition-all shadow-md flex items-center justify-center gap-2.5 text-xs sm:text-sm cursor-pointer"
                >
                  <UploadCloud className="w-4 h-4" />
                  <span>Selecionar comprovante (PDF / Foto)</span>
                </button>
              </div>

              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setShowReceiptSecretOption(false)}
                  className="w-full py-2 text-neutral-500 text-xs font-semibold hover:text-neutral-800 transition-colors cursor-pointer text-center"
                >
                  Cancelar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Recipient Receipt Extracted Modal */}
      <RecipientReceiptModal
        isOpen={isReceiptModalOpen}
        extractedData={extractedRecipient}
        fileName={uploadedFileName}
        onClose={() => setIsReceiptModalOpen(false)}
        onSaveAndTransfer={handleSaveAndTransfer}
        onSaveOnly={handleSaveOnly}
      />

      {/* Toast message */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 bg-neutral-900 text-white text-xs px-4 py-2.5 rounded-full shadow-lg font-medium flex items-center gap-2"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
