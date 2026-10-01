import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Delete, ShieldCheck, AlertCircle, KeyRound, Check } from 'lucide-react';
import { AppCustomData } from '../types';

interface LoginScreenProps {
  appData: AppCustomData;
  onNavigate: (screen: 'Home') => void;
  onPinCreated?: (pin: string) => void;
  onUpdateField: <K extends keyof AppCustomData>(key: K, value: AppCustomData[K]) => void;
  isInlineEditMode?: boolean;
}

const KEYPAD_DATA = [
  { num: '1', letters: '' },
  { num: '2', letters: 'ABC' },
  { num: '3', letters: 'DEF' },
  { num: '4', letters: 'GHI' },
  { num: '5', letters: 'JKL' },
  { num: '6', letters: 'MNO' },
  { num: '7', letters: 'PQRS' },
  { num: '8', letters: 'TUV' },
  { num: '9', letters: 'WXYZ' },
];

export const LoginScreen: React.FC<LoginScreenProps> = ({
  appData,
  onNavigate,
  onPinCreated,
  onUpdateField,
}) => {
  const isFirstAccess = !appData.accessPin || appData.accessPin.trim().length !== 4;

  const [pin, setPin] = useState<string>('');
  const [setupStage, setSetupStage] = useState<'create' | 'confirm'>('create');
  const [firstPin, setFirstPin] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [shake, setShake] = useState<boolean>(false);
  const [showForgotModal, setShowForgotModal] = useState<boolean>(false);

  // Reset state when PIN changes
  useEffect(() => {
    setPin('');
    setSetupStage('create');
    setFirstPin('');
    setErrorMessage('');
    setIsSuccess(false);
    setIsProcessing(false);
    setShake(false);
  }, [appData.accessPin]);

  const triggerError = useCallback((msg: string, resetToCreate = false) => {
    setErrorMessage(msg);
    setShake(true);
    setTimeout(() => {
      setShake(false);
      setPin('');
      setIsProcessing(false);
      if (resetToCreate) {
        setSetupStage('create');
        setFirstPin('');
      }
    }, 400);
  }, []);

  const handleDigit = useCallback((digit: string) => {
    if (pin.length >= 4 || isProcessing || isSuccess) return;

    const nextPin = pin + digit;
    setPin(nextPin);
    setErrorMessage('');

    if (nextPin.length === 4) {
      setIsProcessing(true);

      if (isFirstAccess) {
        // FLUXO DE PRIMEIRO ACESSO (CRIAÇÃO DE SENHA)
        if (setupStage === 'create') {
          setTimeout(() => {
            setFirstPin(nextPin);
            setPin('');
            setIsProcessing(false);
            setSetupStage('confirm');
          }, 120);
        } else {
          // Etapa de confirmação
          if (nextPin === firstPin) {
            setIsSuccess(true);
            onUpdateField('accessPin', nextPin);
            setTimeout(() => {
              setIsProcessing(false);
              setIsSuccess(false);
              if (onPinCreated) {
                onPinCreated(nextPin);
              } else {
                onNavigate('Home');
              }
            }, 100);
          } else {
            triggerError('As senhas não coincidem. Vamos tentar de novo.', true);
          }
        }
      } else {
        // FLUXO NORMAL (DESBLOQUEIO INSTANTÂNEO COM SENHA JÁ CRIADA)
        if (nextPin === appData.accessPin) {
          setIsSuccess(true);
          // Transição ultra rápida para a Home (60ms) - sem atrasos desnecessários
          setTimeout(() => {
            setIsProcessing(false);
            onNavigate('Home');
          }, 60);
        } else {
          triggerError('Senha incorreta. Tente novamente.');
        }
      }
    }
  }, [pin, isProcessing, isSuccess, isFirstAccess, setupStage, firstPin, appData.accessPin, onUpdateField, onPinCreated, onNavigate, triggerError]);

  const handleDelete = useCallback(() => {
    if (pin.length > 0 && !isProcessing && !isSuccess) {
      setPin((prev) => prev.slice(0, -1));
      setErrorMessage('');
    }
  }, [pin.length, isProcessing, isSuccess]);

  const handleClear = useCallback(() => {
    if (!isProcessing && !isSuccess) {
      setPin('');
      setErrorMessage('');
    }
  }, [isProcessing, isSuccess]);

  // Teclado físico do computador com resposta imediata
  useEffect(() => {
    if (isProcessing || isSuccess) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        handleDigit(e.key);
      } else if (e.key === 'Backspace') {
        handleDelete();
      } else if (e.key === 'Escape') {
        handleClear();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleDigit, handleDelete, handleClear, isProcessing, isSuccess]);

  return (
    <div className="flex flex-col h-full w-full min-h-screen bg-white justify-between select-none relative overflow-hidden touch-manipulation">
      {/* Top Header & Branding */}
      <div 
        className="w-full flex flex-col items-center px-6"
        style={{ paddingTop: 'max(env(safe-area-inset-top, 0px), 2.25rem)' }}
      >
        <div className="flex items-center gap-2 mb-2">
          <img 
            src="/nu-logo.png" 
            alt="Nubank" 
            className="w-10 h-10 rounded-2xl shadow-xs object-cover" 
          />
          <span className="text-[11px] font-bold uppercase tracking-wider text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200">
            PJ Empresas
          </span>
        </div>

        {/* Title and Subtitle */}
        <div className="text-center max-w-xs mt-1">
          {isFirstAccess ? (
            <>
              <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 tracking-tight">
                {setupStage === 'create' ? 'Crie sua senha de 4 dígitos' : 'Confirme sua nova senha'}
              </h1>
              <p className="text-xs sm:text-[13px] text-neutral-500 mt-1 leading-snug">
                {setupStage === 'create'
                  ? 'Essa senha protegerá seu aplicativo a cada abertura'
                  : 'Digite os mesmos 4 dígitos para confirmar'}
              </p>
              <div className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full">
                Etapa {setupStage === 'create' ? '1' : '2'} de 2
              </div>
            </>
          ) : (
            <>
              <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 tracking-tight">
                Digite sua senha de 4 dígitos
              </h1>
              <p className="text-xs sm:text-[13px] text-neutral-500 mt-0.5">
                {appData.companyName || 'Nu Empresas'}
              </p>
            </>
          )}
        </div>

        {/* 4 PIN Dots Indicator - Hardware Accelerated */}
        <motion.div
          animate={shake ? { x: [-8, 8, -6, 6, 0] } : { x: 0 }}
          transition={{ duration: 0.3 }}
          className="flex justify-center items-center gap-5 my-5 sm:my-6"
        >
          {[0, 1, 2, 3].map((index) => {
            const filled = pin.length > index;
            return (
              <div
                key={index}
                className={`w-4 h-4 rounded-full transition-transform duration-75 ${
                  filled ? 'scale-110' : 'scale-100'
                } ${
                  isSuccess
                    ? 'bg-emerald-500 shadow-md shadow-emerald-500/40'
                    : errorMessage
                    ? 'bg-red-500 shadow-md shadow-red-500/40'
                    : filled
                    ? 'bg-[#820AD1] shadow-md shadow-purple-500/40'
                    : 'border-2 border-neutral-300 bg-neutral-100'
                }`}
              />
            );
          })}
        </motion.div>

        {/* Status / Error Message */}
        <div className="h-5 flex items-center justify-center">
          {errorMessage && !isProcessing && (
            <p className="text-xs font-semibold text-red-500 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{errorMessage}</span>
            </p>
          )}
          {isSuccess && (
            <p className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
              <Check className="w-3.5 h-3.5 shrink-0" />
              <span>{isFirstAccess ? 'Senha criada com sucesso!' : 'Acesso autorizado!'}</span>
            </p>
          )}
        </div>
      </div>

      {/* Full Screen Keypad - Fast Native Mobile Tactile Response */}
      <div 
        className="w-full flex flex-col items-center justify-center px-4"
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 2rem)' }}
      >
        <div className="grid grid-cols-3 gap-x-6 sm:gap-x-8 gap-y-3 sm:gap-y-4 max-w-[310px] sm:max-w-[340px] mx-auto w-full items-center justify-items-center">
          {KEYPAD_DATA.map(({ num, letters }) => (
            <button
              key={num}
              type="button"
              id={`keypad-digit-${num}`}
              onClick={() => handleDigit(num)}
              disabled={isProcessing || isSuccess}
              className="w-18 h-18 sm:w-20 sm:h-20 rounded-full bg-neutral-100 active:bg-neutral-300 active:scale-95 text-neutral-900 border border-neutral-200/60 shadow-2xs transition-transform duration-75 flex flex-col items-center justify-center select-none cursor-pointer disabled:opacity-40 disabled:pointer-events-none touch-manipulation"
            >
              <span className="text-2xl sm:text-[28px] font-semibold leading-none text-neutral-900">
                {num}
              </span>
              {letters ? (
                <span className="text-[10px] tracking-widest text-neutral-400 font-semibold uppercase mt-0.5">
                  {letters}
                </span>
              ) : (
                <span className="h-2.5" />
              )}
            </button>
          ))}

          {/* Row 4 - Left Button (Limpar) */}
          <div className="w-18 h-18 sm:w-20 sm:h-20 flex items-center justify-center">
            {pin.length > 0 ? (
              <button
                type="button"
                id="keypad-clear-btn"
                onClick={handleClear}
                disabled={isProcessing || isSuccess}
                className="text-xs font-semibold text-neutral-500 hover:text-neutral-900 active:scale-95 py-2 px-3 transition-transform duration-75 cursor-pointer touch-manipulation"
              >
                Limpar
              </button>
            ) : null}
          </div>

          {/* Row 4 - Center 0 */}
          <button
            type="button"
            id="keypad-digit-0"
            onClick={() => handleDigit('0')}
            disabled={isProcessing || isSuccess}
            className="w-18 h-18 sm:w-20 sm:h-20 rounded-full bg-neutral-100 active:bg-neutral-300 active:scale-95 text-neutral-900 border border-neutral-200/60 shadow-2xs transition-transform duration-75 flex flex-col items-center justify-center select-none cursor-pointer disabled:opacity-40 disabled:pointer-events-none touch-manipulation"
          >
            <span className="text-2xl sm:text-[28px] font-semibold leading-none text-neutral-900">
              0
            </span>
            <span className="h-2.5" />
          </button>

          {/* Row 4 - Right Delete */}
          <button
            type="button"
            id="keypad-delete-btn"
            onClick={handleDelete}
            disabled={isProcessing || isSuccess || pin.length === 0}
            className="w-18 h-18 sm:w-20 sm:h-20 rounded-full flex items-center justify-center text-neutral-600 hover:text-neutral-900 active:scale-95 transition-transform duration-75 cursor-pointer disabled:opacity-20 disabled:pointer-events-none touch-manipulation"
            aria-label="Apagar dígito"
          >
            <Delete className="w-6 h-6 sm:w-7 sm:h-7" />
          </button>
        </div>

        {/* Footer info or Forgot Password */}
        <div className="mt-4 sm:mt-5 flex flex-col items-center">
          {!isFirstAccess ? (
            <button
              type="button"
              onClick={() => setShowForgotModal(true)}
              className="text-xs font-semibold text-[#820AD1] hover:text-[#6a08ab] py-2 px-4 transition-colors cursor-pointer"
            >
              Esqueci minha senha
            </button>
          ) : (
            <p className="text-[11px] text-neutral-400 text-center px-6">
              Guarde sua senha com cuidado. Ela será solicitada para acessar o aplicativo.
            </p>
          )}
        </div>
      </div>

      {/* Forgot Password Modal */}
      <AnimatePresence>
        {showForgotModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.15 }}
              className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl text-center space-y-4"
            >
              <div className="w-12 h-12 rounded-2xl bg-purple-50 text-[#820AD1] flex items-center justify-center mx-auto">
                <KeyRound className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-neutral-900">Redefinir Senha</h3>
                <p className="text-xs text-neutral-500 mt-1 leading-relaxed">
                  Deseja apagar a senha atual e criar uma nova senha de 4 dígitos para este aplicativo?
                </p>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForgotModal(false)}
                  className="flex-1 py-2.5 px-4 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-semibold rounded-xl cursor-pointer transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotModal(false);
                    onUpdateField('accessPin', '');
                    setPin('');
                    setSetupStage('create');
                    setFirstPin('');
                  }}
                  className="flex-1 py-2.5 px-4 bg-[#820AD1] hover:bg-[#6e09b3] text-white text-xs font-bold rounded-xl cursor-pointer transition-colors shadow-sm"
                >
                  Criar Nova Senha
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
