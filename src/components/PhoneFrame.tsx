import React, { useState, useEffect } from 'react';
import { Smartphone, Monitor, RotateCcw, Wifi, Battery, Signal } from 'lucide-react';
import { ScreenName } from '../types';

interface PhoneFrameProps {
  children: React.ReactNode;
  currentScreen: ScreenName;
  onScreenChange: (screen: ScreenName) => void;
  onResetData: () => void;
}

export const PhoneFrame: React.FC<PhoneFrameProps> = ({
  children,
  currentScreen,
  onScreenChange,
  onResetData,
}) => {
  const [time, setTime] = useState('09:41');
  const [isFramed, setIsFramed] = useState(true);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  const screens: { id: ScreenName; label: string }[] = [
    { id: 'Login', label: '1. Login' },
    { id: 'Home', label: '2. Home PJ' },
    { id: 'PaymentOptions', label: '3. Opções Pagamento' },
    { id: 'AreaPix', label: '4. Área Pix' },
    { id: 'Transfer', label: '5. Transferir' },
    { id: 'ConfirmTransfer', label: '6. Confirmar' },
  ];

  return (
    <div className="min-h-screen bg-neutral-950 text-white flex flex-col items-center justify-start p-2 sm:p-6 md:p-8 font-sans">
      {/* Top Controls Bar */}
      <header className="w-full max-w-4xl flex flex-wrap items-center justify-between gap-3 mb-6 bg-neutral-900/90 border border-neutral-800/80 rounded-2xl px-4 py-3 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-[#820AD1] flex items-center justify-center font-black text-white text-lg">
            nu
          </div>
          <div>
            <h1 className="text-sm font-bold text-neutral-100 flex items-center gap-1.5">
              Nubank Nu Empresas
              <span className="text-[10px] bg-purple-900/60 text-purple-300 font-semibold px-2 py-0.5 rounded-full border border-purple-700/50">
                React Native Web
              </span>
            </h1>
            <p className="text-[11px] text-neutral-400">Fluxo interativo de autenticação, Pix e pagamentos PJ</p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Reset App State */}
          <button
            onClick={onResetData}
            title="Restaurar saldo e dados iniciais"
            className="flex items-center gap-1.5 text-xs text-neutral-300 hover:text-white bg-neutral-800 hover:bg-neutral-700 px-3 py-1.5 rounded-lg transition-colors cursor-pointer border border-neutral-700/60"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reiniciar</span>
          </button>

          {/* Toggle Device Frame */}
          <button
            onClick={() => setIsFramed(!isFramed)}
            title={isFramed ? "Modo Tela Cheia" : "Modo Smartphone"}
            className="flex items-center gap-1.5 text-xs text-purple-300 hover:text-purple-100 bg-purple-950/60 hover:bg-purple-900/80 px-3 py-1.5 rounded-lg transition-colors cursor-pointer border border-purple-700/50"
          >
            {isFramed ? <Monitor className="w-3.5 h-3.5" /> : <Smartphone className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{isFramed ? 'Tela Cheia' : 'Moldura Celular'}</span>
          </button>
        </div>
      </header>

      {/* Screen Navigation Breadcrumb / Tabs */}
      <nav aria-label="Navegação de telas" className="w-full max-w-4xl flex items-center gap-1.5 overflow-x-auto pb-2 mb-4 no-scrollbar">
        <span className="text-[11px] text-neutral-400 font-medium px-1 shrink-0">Telas:</span>
        {screens.map((sc) => (
          <button
            key={sc.id}
            onClick={() => onScreenChange(sc.id)}
            className={`text-xs font-semibold px-3 py-1.5 rounded-xl shrink-0 transition-all cursor-pointer ${
              currentScreen === sc.id
                ? 'bg-[#820AD1] text-white shadow-sm ring-1 ring-purple-400/50'
                : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 border border-neutral-800'
            }`}
          >
            {sc.label}
          </button>
        ))}
      </nav>

      {/* Mobile Device Frame or Expanded Container */}
      <main className="w-full flex items-center justify-center flex-1">
        {isFramed ? (
          <div className="relative w-full max-w-[390px] h-[780px] max-h-[88vh] bg-black rounded-[48px] p-3 shadow-2xl shadow-purple-950/30 border-4 border-neutral-800 ring-1 ring-white/10 flex flex-col">
            {/* Screen Inner Bezel */}
            <div className="relative w-full h-full bg-white rounded-[38px] overflow-hidden flex flex-col shadow-inner">
              {/* iOS / Mobile Status Bar */}
              <div className={`px-6 pt-3 pb-1 flex items-center justify-between text-xs font-semibold z-30 transition-colors ${
                currentScreen === 'Home' ? 'bg-[#5f259f] text-white' : 'bg-white text-neutral-900'
              }`}>
                <span className="font-bold tracking-tight text-[13px]">{time}</span>
                {/* Dynamic Island / Notch pill */}
                <div className="w-24 h-4 bg-black rounded-full mx-auto" />
                <div className="flex items-center gap-1.5">
                  <Signal className="w-3.5 h-3.5" />
                  <Wifi className="w-3.5 h-3.5" />
                  <Battery className="w-4 h-4" />
                </div>
              </div>

              {/* Active Screen Content */}
              <div className="flex-1 overflow-hidden relative">
                {children}
              </div>

              {/* Bottom Home Indicator Bar */}
              <div className="h-4 bg-white flex items-center justify-center pb-1 z-30">
                <div className="w-32 h-1 bg-neutral-300 rounded-full" />
              </div>
            </div>
          </div>
        ) : (
          <div className="w-full max-w-xl h-[820px] max-h-[88vh] bg-white rounded-3xl overflow-hidden shadow-2xl flex flex-col border border-neutral-800">
            {/* Screen Content in Clean Expanded Card */}
            <div className="flex-1 overflow-hidden relative">
              {children}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
