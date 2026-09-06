import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, ShieldCheck, CheckCircle2, Building, Calendar, Wallet, Lock } from 'lucide-react';
import { TransferData } from '../types';
import { PasswordModal } from '../components/PasswordModal';

interface ConfirmTransferScreenProps {
  onGoBack: () => void;
  onConfirmTransfer: (data: TransferData) => void;
  transferData: TransferData;
}

export const ConfirmTransferScreen: React.FC<ConfirmTransferScreenProps> = ({
  onGoBack,
  onConfirmTransfer,
  transferData,
}) => {
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const { recipient, amount } = transferData;

  const handleConfirm = () => {
    setIsPasswordModalOpen(true);
  };

  const handlePasswordSuccess = () => {
    setIsPasswordModalOpen(false);
    onConfirmTransfer(transferData);
  };

  return (
    <div className="flex flex-col h-full bg-white select-none justify-between overflow-y-auto">
      {/* Header with back button */}
      <div>
        <div className="p-5 pb-0">
          <button
            id="btn-back-confirm"
            onClick={onGoBack}
            disabled={isPasswordModalOpen}
            className="w-10 h-10 -ml-2 rounded-full hover:bg-neutral-100 flex items-center justify-center transition-colors cursor-pointer text-neutral-700"
            aria-label="Voltar"
          >
            <ChevronLeft className="w-8 h-8" />
          </button>
        </div>

        <div className="px-6 pt-2">
          <p className="text-xs font-bold uppercase tracking-wider text-[#820AD1]">
            Revisão da transferência
          </p>
          <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 mt-1">
            Confirmar Pix para
          </h1>
        </div>
      </div>

      {/* Main Center Avatar and Recipient Info */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="px-6 py-6 flex flex-col items-center justify-center text-center"
      >
        {/* Avatar Big */}
        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-[#f2f2f2] border-2 border-purple-100 text-neutral-800 flex items-center justify-center text-2xl sm:text-3xl font-extrabold mb-4 shadow-sm">
          {recipient.initials || 'LM'}
        </div>

        <h2 className="font-bold text-base sm:text-lg text-neutral-900 tracking-tight max-w-xs">
          {recipient.name}
        </h2>
        <p className="text-xs sm:text-sm text-neutral-500 mt-0.5">
          {recipient.document}
        </p>
        <span className="inline-flex items-center gap-1 mt-2 px-2.5 py-1 rounded-full bg-purple-50 text-[11px] font-semibold text-[#820AD1] border border-purple-200">
          <Building className="w-3 h-3" />
          {recipient.institution}
        </span>

        {/* Transfer Value Badge */}
        <div className="mt-6 bg-[#f7f8fa] border border-neutral-200/80 rounded-2xl p-4 w-full max-w-xs text-center">
          <span className="text-xs text-neutral-500 font-medium block">Valor da transferência</span>
          <span className="text-2xl sm:text-3xl font-black text-neutral-900 mt-1 block">
            {amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </span>
        </div>

        {/* Breakdown Items */}
        <div className="w-full max-w-xs mt-4 text-left divide-y divide-neutral-100 text-xs text-neutral-600">
          <div className="py-2.5 flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-neutral-500">
              <Calendar className="w-3.5 h-3.5" /> Quando
            </span>
            <span className="font-semibold text-neutral-800">Agora (Instantâneo)</span>
          </div>
          <div className="py-2.5 flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-neutral-500">
              <Wallet className="w-3.5 h-3.5" /> Pagamento
            </span>
            <span className="font-semibold text-neutral-800">Saldo da Conta Nu PJ</span>
          </div>
          <div className="py-2.5 flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-neutral-500">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Tarifa Pix
            </span>
            <span className="font-bold text-emerald-600">Gratuito (R$ 0,00)</span>
          </div>
        </div>
      </motion.div>

      {/* Footer Confirm Button */}
      <div className="p-6 pt-2">
        <button
          id="btn-confirm-transfer-submit"
          onClick={handleConfirm}
          className="w-full bg-[#820AD1] hover:bg-[#7008b4] active:scale-[0.98] transition-all text-white font-semibold py-4 px-6 rounded-full flex items-center justify-center gap-2 shadow-lg shadow-purple-900/15 cursor-pointer"
        >
          <Lock className="w-4 h-4" />
          <span>Confirmar</span>
        </button>

        <p className="text-[11px] text-neutral-400 text-center mt-2.5">
          Protegido pela criptografia de ponta a ponta do Banco Central do Brasil.
        </p>
      </div>

      {/* Password Modal to authorize Pix transfer */}
      <PasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        onSuccess={handlePasswordSuccess}
        title="Digite sua senha de 4 dígitos"
        subtitle="A mesma usada para autorizar transações da conta"
        contextInfo={{
          amount: amount,
          recipientName: recipient.name,
        }}
        processingText="Autenticando Pix..."
      />
    </div>
  );
};
