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
  /**
   * 'verify' (padrão): pede a senha existente. Se `existingPin` for informado,
   * o valor digitado precisa bater com ele; caso contrário, qualquer PIN de 4
   * dígitos é aceito (mantém compatibilidade com fluxos que não têm senha configurada).
   * 'setup': fluxo de primeiro acesso — pede para criar e depois confirmar uma nova senha.
   */
  mode?: 'verify' | 'setup';
  existingPin?: string;
  onSetupComplete?: (pin: string) => void;
}

export const PasswordModal: React.FC<PasswordModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  title = 'Digite sua senha de 4 dígitos',
  subtitle = 'Para acessar sua conta Nu Empresas com segurança',
  contextInfo,
  processingText = 'Validando acesso...',
  mode = 'verify',
  existingPin,
  onSetupComplete,
}) => {
  const [pin, setPin] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [setupStage, setSetupStage] = useState<'create' | 'confirm'>('create');
  const [firstPin, setFirstPin] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [shake, setShake] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setPin('');
      setIsProcessing(false);
      setSetupStage('create');
      setFirstPin('');
      setErrorMessage('');
      setShake(false);
    }
  }, [isOpen]);

  const triggerError = (message: string, resetToStage?: 'create') => {
    setErrorMessage(message);
    setShake(true);
    setTimeout(() => {
      setShake(false);
      setPin('');
      setIsProcessing(false);
      if (resetToStage) {
        setSetupStage(resetToStage);
        setFirstPin('');
      }
    }, 550);
  };

  const handleDigit = (digit: string) => {
    if (pin.length < 4 && !isProcessing) {
      const newPin = pin + digit;
      setPin(newPin);
      setErrorMessage('');

      if (newPin.length === 4) {
        setIsProcessing(true);

        if (mode === 'setup') {
          if (setupStage === 'create') {
            setTimeout(() => {
              setFirstPin(newPin);
              setPin('');
              setIsProcessing(false);
              setSetupStage('confirm');
            }, 500);
          } else {
            setTimeout(() => {
              if (newPin === firstPin) {
                onSetupComplete?.(newPin);
                setIsProcessing(false);
                onSuccess();
              } else {
                triggerError('As senhas não coincidem. Vamos tentar de novo.', 'create');
              }
            }, 500);
          }
        } else {
          setTimeout(() => {
            if (!existingPin || newPin === existingPin) {
              setIsProcessing(false);
              onSuccess();
            } else {
              triggerError('Senha incorreta. Tente novamente.');
            }
          }, 750);
        }
      }
    }
  };

  const handleDelete = () => {
    if (pin.length > 0 && !isProcessing) {
      setPin(pin.slice(0, -1));
    }
  };

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
  }, [isOpen, isProcessing, pin, setupStage, firstPin]);

  if (!isOpen) return null;

  const resolvedTitle = mode === 'setup'
    ? (setupStage === 'create' ? 'Crie sua senha de 4 dígitos' : 'Confirme sua nova senha')
    : title;

  const resolvedSubtitle = mode === 'setup'
    ? (setupStage === 'create'
        ? 'Essa será a senha usada para acessar o app daqui pra frente'
        : 'Digite novamente a mesma senha para confirmar')
    : subtitle;

  const resolvedProcessingText = mode === 'setup'
    ? (setupStage === 'create' ? 'Salvando primeira etapa...' : 'Criando sua senha...')
    : processingText;

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
              {resolvedTitle}
            </p>
            <p className="text-xs text-neutral-500 mt-1 px-4 leading-relaxed">
              {resolvedSubtitle}
            </p>

            {/* 4 Pin Indicator Dots */}
            <motion.div
              animate={shake ? { x: [0, -8, 8, -8, 8, 0] } : { x: 0 }}
              transition={{ duration: 0.4 }}
              className="flex justify-center items-center gap-4 my-5"
            >
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
                      errorMessage
                        ? 'bg-red-500 shadow-sm shadow-red-500/40'
                        : filled
                        ? 'bg-[#820AD1] shadow-sm shadow-purple-500/40'
                        : 'border-2 border-neutral-300 bg-neutral-100'
                    }`}
                  />
                );
              })}
            </motion.div>

            {/* Error State */}
            {errorMessage && !isProcessing && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-xs font-semibold text-red-500 -mt-2 mb-2"
              >
                {errorMessage}
              </motion.p>
            )}

            {/* Processing State */}
            {isProcessing && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-center gap-2 text-xs font-semibold text-[#820AD1] py-1"
              >
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{resolvedProcessingText}</span>
              </motion.div>
            )}

            {/* Setup progress hint */}
            {mode === 'setup' && !isProcessing && !errorMessage && (
              <p className="text-[11px] text-neutral-400 -mt-1 mb-1">
                Etapa {setupStage === 'create' ? '1' : '2'} de 2
              </p>
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
