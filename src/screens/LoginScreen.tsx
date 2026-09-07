import React, { useState, useRef } from 'react';
import { motion } from 'motion/react';
import { ShieldCheck, Fingerprint, Sliders } from 'lucide-react';
import { AppCustomData } from '../types';
import { EditableText } from '../components/EditableText';
import { PasswordModal } from '../components/PasswordModal';

interface LoginScreenProps {
  appData: AppCustomData;
  onNavigate: (screen: 'Home') => void;
  skipIntro: boolean;
  onToggleSkipIntro: (val: boolean) => void;
  onOpenEditModal: () => void;
  onUpdateField: <K extends keyof AppCustomData>(key: K, value: AppCustomData[K]) => void;
  isInlineEditMode: boolean;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  appData,
  onNavigate,
  skipIntro,
  onToggleSkipIntro,
  onOpenEditModal,
  onUpdateField,
  isInlineEditMode,
}) => {
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [clickCount, setClickCount] = useState(0);
  const clickTimeoutRef = useRef<any>(null);

  const isFirstAccess = !appData.accessPin;

  const handleLogoClick = () => {
    const newCount = clickCount + 1;
    setClickCount(newCount);

    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current);
    }

    if (newCount >= 3) {
      setClickCount(0);
      onOpenEditModal();
      return;
    }

    clickTimeoutRef.current = setTimeout(() => {
      setClickCount(0);
    }, 450);
  };

  const handleAuthenticate = () => {
    setIsPasswordModalOpen(true);
  };

  const handlePasswordSuccess = () => {
    setIsPasswordModalOpen(false);
    onNavigate('Home');
  };

  const handlePinCreated = (pin: string) => {
    onUpdateField('accessPin', pin);
  };

  return (
    <div className="flex flex-col h-full w-full bg-white justify-between select-none relative overflow-hidden">
      {/* Top Header Logo with Safe Area */}
      <div 
        className="px-6 pb-4"
        style={{ paddingTop: 'max(env(safe-area-inset-top, 0px), 3.25rem)' }}
      >
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <button
            onClick={handleLogoClick}
            className="hover:opacity-80 active:scale-95 transition-all cursor-pointer relative"
            title="Clique 3x no logo para abrir o editor"
          >
            <img src="/nu-logo.png" alt="Nubank" className="w-10 h-10 rounded-xl" />
            {clickCount > 0 && (
              <span className="absolute -top-1 -right-3 bg-amber-400 text-neutral-900 text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center animate-bounce">
                {clickCount}
              </span>
            )}
          </button>
          
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-purple-700 bg-purple-50 px-2.5 py-1 rounded-full border border-purple-200">
              PJ Empresas
            </span>
            <button
              onClick={onOpenEditModal}
              className="p-1.5 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-600 transition-colors"
              title="Abrir configurações de edição"
            >
              <Sliders className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      </div>

      {/* Main Copy Center */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="px-6 flex-1 flex flex-col justify-center max-w-md"
      >
        <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center text-[#820AD1] mb-6 border border-purple-100 shadow-xs">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <h1 className="text-2xl sm:text-[26px] font-bold text-neutral-900 leading-snug tracking-tight">
          <EditableText
            value={appData.loginTitle}
            onSave={(val) => onUpdateField('loginTitle', val)}
            isInlineEditMode={isInlineEditMode}
          />
        </h1>
      </motion.div>

      {/* Footer Actions */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex flex-col"
      >
        <div className="p-6 pb-4">
          <button
            id="btn-login-auth"
            onClick={handleAuthenticate}
            className="w-full bg-[#820AD1] hover:bg-[#7008b4] active:scale-[0.98] transition-all text-white font-semibold py-4 px-6 rounded-full flex items-center justify-center gap-2.5 shadow-md shadow-purple-900/10 cursor-pointer"
          >
            <Fingerprint className="w-5 h-5" />
            <span>
              {isFirstAccess ? (
                'Criar senha de acesso'
              ) : (
                <EditableText
                  value={appData.loginButtonText}
                  onSave={(val) => onUpdateField('loginButtonText', val)}
                  isInlineEditMode={isInlineEditMode}
                />
              )}
            </span>
          </button>

          <p className="text-xs text-neutral-500 text-center mt-3.5 leading-relaxed px-4">
            {isFirstAccess ? (
              'Essa senha será usada sempre que você abrir o app.'
            ) : (
              <EditableText
                value={appData.loginHelperText}
                onSave={(val) => onUpdateField('loginHelperText', val)}
                isInlineEditMode={isInlineEditMode}
              />
            )}
          </p>
        </div>

        {/* Switch Bar at Bottom */}
        <div className="bg-[#F5F5F5] border-t border-neutral-200/80 px-6 py-4 flex items-center justify-between">
          <label htmlFor="skip-intro-toggle" className="text-xs sm:text-[13px] text-neutral-700 font-medium pr-4 cursor-pointer">
            <EditableText
              value={appData.skipIntroText}
              onSave={(val) => onUpdateField('skipIntroText', val)}
              isInlineEditMode={isInlineEditMode}
            />
          </label>
          <button
            id="skip-intro-toggle"
            type="button"
            role="switch"
            aria-checked={skipIntro}
            onClick={() => onToggleSkipIntro(!skipIntro)}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              skipIntro ? 'bg-[#820AD1]' : 'bg-[#D1D1D1]'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                skipIntro ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </motion.div>

      {/* Password Prompt Modal upon clicking access - cria senha no 1º acesso, valida nos seguintes */}
      <PasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        onSuccess={handlePasswordSuccess}
        title="Digite sua senha de 4 dígitos"
        subtitle="A mesma senha que você usa para acessar sua conta Nu Empresas"
        processingText="Validando acesso..."
        mode={isFirstAccess ? 'setup' : 'verify'}
        existingPin={appData.accessPin}
        onSetupComplete={handlePinCreated}
      />
    </div>
  );
};
