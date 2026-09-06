import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Delete, Loader2, Lock, ShieldCheck } from 'lucide-react';

interface PasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  title?: string;
  subtitle?: string;
  contextInfo?: {
    amount?: number;
    recipientName?: string;
  };
  processingText?: string;
}

export const PasswordModal: React.FC<PasswordModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  title = 'Digite sua senha de 4 dígitos',
  subtitle = 'Para acessar sua conta Nu Empresas com segurança',
  contextInfo,
  processingText = 'Validando acesso...',
}) => {
  const [pin, setPin] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setPin('');
      setIsProcessing(false);
    }
  }, [isOpen]);

  // Support physical keyboard on desktop
  useEffect(() => {
    if (!isOpen || isProcessing) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        handleDigit(e.key);
      } else if (e.key === 'Backspace') {
        handleDelete();
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isProcessing, pin]);

  const handleDigit = (digit: string) => {
    if (pin.length < 4 && !isProcessing) {
      const newPin = pin + digit;
      setPin(newPin);

      if (newPin.length === 4) {
        setIsProcessing(true);
        setTimeout(() => {
          setIsProcessing(false);
          onSuccess();
        }, 750);
      }
    }
  };

  const handleDelete = () => {
    if (pin.length > 0 && !isProcessing) {
      setPin(pin.slice(0, -1));
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center select-none">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={!isProcessing ? onClose : undefined}
          className="absolute inset-0 bg-black/60 backdrop-blur-xs"
        />

        {/* Modal Sheet */}
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 28, stiffness: 320 }}
          className="relative bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl flex flex-col z-10 overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
            <div className="flex items-center gap-2 text-neutral-800">
              <div className="w-8 h-8 rounded-full bg-purple-50 text-[#820AD1] flex items-center justify-center">
                <Lock className="w-4 h-4" />
              </div>
              <span className="text-sm font-bold">Confirmação de segurança</span>
            </div>

            <button
              onClick={onClose}
              disabled={isProcessing}
              className="w-8 h-8 rounded-full flex items-center justify-center text-neutral-400 hover:bg-neutral-100 disabled:opacity-30 cursor-pointer transition-colors"
              aria-label="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Context Info if transferring */}
          {contextInfo?.amount !== undefined && (
            <div className="text-center pt-3 pb-1 border-b border-neutral-100/70 mb-2">
              <p className="text-xs text-neutral-500 font-medium">
                Transferindo <strong className="text-neutral-900 font-bold">{contextInfo.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong> para
              </p>
              <h3 className="text-sm font-bold text-neutral-900 truncate px-4 mt-0.5">
                {contextInfo.recipientName || 'Beneficiário'}
              </h3>
            </div>
          )}

          {/* Title and instructions */}
          <div className="text-center pt-3 pb-2">
            <div className="w-10 h-10 rounded-2xl bg-purple-50 flex items-center justify-center text-[#820AD1] mx-auto mb-2.5">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <p className="text-[17px] font-bold text-neutral-900 leading-snug">
              {title}
            </p>
            <p className="text-xs text-neutral-500 mt-1 px-4 leading-relaxed">
              {subtitle}
            </p>

            {/* 4 Pin Indicator Dots */}
            <div className="flex justify-center items-center gap-4 my-5">
              {[0, 1, 2, 3].map((index) => {
                const filled = pin.length > index;
                return (
                  <motion.div
                    key={index}
                    animate={{
                      scale: filled ? [1, 1.25, 1] : 1,
                    }}
                    transition={{ duration: 0.15 }}
                    className={`w-4 h-4 rounded-full transition-all duration-200 ${
                      filled
                        ? 'bg-[#820AD1] shadow-sm shadow-purple-500/40'
                        : 'border-2 border-neutral-300 bg-neutral-100'
                    }`}
                  />
                );
              })}
            </div>

            {/* Processing State */}
            {isProcessing && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-center gap-2 text-xs font-semibold text-[#820AD1] py-1"
              >
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{processingText}</span>
              </motion.div>
            )}
          </div>

          {/* Realistic Virtual Keypad */}
          <div className="grid grid-cols-3 gap-2.5 pt-1 pb-1 max-w-[280px] mx-auto w-full">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
              <button
                key={digit}
                type="button"
                onClick={() => handleDigit(digit)}
                disabled={isProcessing}
                className="h-13 sm:h-14 rounded-2xl bg-neutral-50 hover:bg-neutral-100 active:bg-purple-100 active:text-[#820AD1] text-xl font-bold text-neutral-800 flex items-center justify-center transition-all cursor-pointer shadow-2xs disabled:opacity-40"
              >
                {digit}
              </button>
            ))}
            <div />
            <button
              type="button"
              onClick={() => handleDigit('0')}
              disabled={isProcessing}
              className="h-13 sm:h-14 rounded-2xl bg-neutral-50 hover:bg-neutral-100 active:bg-purple-100 active:text-[#820AD1] text-xl font-bold text-neutral-800 flex items-center justify-center transition-all cursor-pointer shadow-2xs disabled:opacity-40"
            >
              0
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={isProcessing || pin.length === 0}
              className="h-13 sm:h-14 rounded-2xl bg-neutral-50 hover:bg-neutral-100 active:bg-neutral-200 text-neutral-600 flex items-center justify-center transition-all cursor-pointer shadow-2xs disabled:opacity-20"
              aria-label="Apagar dígito"
            >
              <Delete className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
