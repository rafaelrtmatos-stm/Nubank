import React, { useState, useRef } from 'react';
import { motion } from 'motion/react';
import { 
  User, 
  Eye, 
  EyeOff, 
  HelpCircle, 
  Barcode, 
  LayoutGrid, 
  ArrowUpRight, 
  QrCode, 
  CreditCard, 
  ReceiptText, 
  ChevronRight, 
  Bell, 
  Building2,
  ArrowDownLeft,
  Sliders,
  Check,
  X,
  Zap,
  Copy,
  Edit2
} from 'lucide-react';
import { AppCustomData, ScreenName, Transaction } from '../types';
import { EditableText } from '../components/EditableText';
import { QuickBalanceModal } from '../components/QuickBalanceModal';
import { parseCurrency } from '../utils/currencyUtils';

interface HomeScreenProps {
  appData: AppCustomData;
  isBalanceVisible: boolean;
  onToggleBalance: () => void;
  onNavigate: (screen: ScreenName) => void;
  onOpenEditModal: () => void;
  onUpdateField: <K extends keyof AppCustomData>(key: K, value: AppCustomData[K]) => void;
  isInlineEditMode: boolean;
  onTriggerSimulatedPix?: (
    senderName?: string,
    amount?: number,
    bank?: string,
    message?: string,
    delaySeconds?: number
  ) => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  appData,
  isBalanceVisible,
  onToggleBalance,
  onNavigate,
  onOpenEditModal,
  onUpdateField,
  isInlineEditMode,
  onTriggerSimulatedPix,
}) => {
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showCobrarModal, setShowCobrarModal] = useState(false);
  const [showQuickBalanceModal, setShowQuickBalanceModal] = useState(false);
  const [clickCount, setClickCount] = useState(0);
  const clickTimeoutRef = useRef<any>(null);

  // Triple click handler on left menu icon
  const handleLeftMenuClick = () => {
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
      if (newCount === 1) {
        setShowProfileModal(true);
      }
      setClickCount(0);
    }, 450);
  };

  const formattedBalance = Number(appData.balance).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });

  return (
    <div className="flex flex-col h-full w-full bg-white select-none overflow-y-auto pb-16">
      {/* Header PJ Purple Zone */}
      <div className="bg-[#5f259f] text-white pt-6 sm:pt-8 pb-6 px-5 transition-all">
        {/* Top Header Icons */}
        <div className="flex items-center justify-between">
          <div className="relative">
            <button
              id="btn-home-profile"
              onClick={handleLeftMenuClick}
              className="w-11 h-11 rounded-full bg-white/20 hover:bg-white/30 active:scale-95 flex items-center justify-center transition-all cursor-pointer relative"
              aria-label="Perfil do usuário ou clique 3x para editar"
              title="Clique 3x para abrir o menu de edição"
            >
              <User className="w-5 h-5 text-white" />
              {clickCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-amber-400 text-neutral-900 text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center animate-bounce">
                  {clickCount}
                </span>
              )}
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button
              id="btn-toggle-eye"
              onClick={onToggleBalance}
              className="p-2 hover:bg-white/10 rounded-full transition-colors cursor-pointer text-white"
              aria-label={isBalanceVisible ? "Ocultar saldo" : "Exibir saldo"}
            >
              {isBalanceVisible ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
            </button>
            <button
              id="btn-home-help"
              onClick={() => alert("Central de Atendimento Nu Empresas: Suporte 24 horas.")}
              className="p-2 hover:bg-white/10 rounded-full transition-colors cursor-pointer text-white"
              aria-label="Ajuda"
            >
              <HelpCircle className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Company / Greeting info */}
        <div className="mt-4">
          <p className="text-white/80 text-xs font-medium uppercase tracking-wider">
            Olá,{' '}
            <EditableText
              value={appData.userName}
              onSave={(val) => onUpdateField('userName', val)}
              isInlineEditMode={isInlineEditMode}
            />
          </p>
          <div className="text-white/95 text-xs sm:text-sm font-semibold truncate flex items-center gap-1.5 mt-0.5">
            <Building2 className="w-3.5 h-3.5 text-purple-200 shrink-0" />
            <EditableText
              value={appData.companyName}
              onSave={(val) => onUpdateField('companyName', val)}
              isInlineEditMode={isInlineEditMode}
            />
          </div>
        </div>

        {/* Reminder Card */}
        {appData.showReminder && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white text-[#5f259f] rounded-2xl p-4 mt-4 shadow-sm flex items-center justify-between"
          >
            <div className="flex items-center gap-3 flex-1 mr-2">
              <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center shrink-0">
                <Bell className="w-5 h-5 text-[#5f259f]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-neutral-800 truncate">
                  <EditableText
                    value={appData.reminderTitle}
                    onSave={(val) => onUpdateField('reminderTitle', val)}
                    isInlineEditMode={isInlineEditMode}
                  />
                </p>
                <p className="text-[11px] text-neutral-500 truncate">
                  <EditableText
                    value={appData.reminderSubtitle}
                    onSave={(val) => onUpdateField('reminderSubtitle', val)}
                    isInlineEditMode={isInlineEditMode}
                  />
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                id="btn-reminder-pay"
                onClick={() => onNavigate('PaymentOptions')}
                className="text-xs font-bold text-[#820AD1] bg-purple-50 hover:bg-purple-100 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
              >
                Pagar
              </button>
              <button
                onClick={() => onUpdateField('showReminder', false)}
                className="text-xs text-neutral-400 hover:text-neutral-600 p-1"
                aria-label="Fechar lembrete"
              >
                ✕
              </button>
            </div>
          </motion.div>
        )}
      </div>

      {/* Main Account Balance Section */}
      <div className="px-5 pt-6 pb-2">
        <div className="flex items-center justify-between cursor-pointer group">
          <div className="flex-1">
            <div 
              onClick={() => setShowQuickBalanceModal(true)}
              className="flex items-center gap-1 cursor-pointer hover:opacity-80 transition-opacity"
              title="Clique para editar o saldo da conta"
            >
              <h2 className="text-base font-bold text-neutral-900">
                <EditableText
                  value={appData.accountTitle}
                  onSave={(val) => onUpdateField('accountTitle', val)}
                  isInlineEditMode={isInlineEditMode}
                />
              </h2>
              <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:translate-x-0.5 transition-transform" />
            </div>
            <div className="mt-1 flex items-center gap-2">
              {isBalanceVisible ? (
                <div className="flex items-center gap-2">
                  <span className="text-2xl sm:text-[28px] font-bold text-neutral-900 tracking-tight">
                    {isInlineEditMode ? (
                      <span className="flex items-center gap-1">
                        <span>R$ </span>
                        <EditableText
                          type="currency"
                          value={appData.balance}
                          onSave={(val) => onUpdateField('balance', parseCurrency(val))}
                          isInlineEditMode={isInlineEditMode}
                        />
                      </span>
                    ) : (
                      <span
                        onClick={() => setShowQuickBalanceModal(true)}
                        className="cursor-pointer hover:text-[#820AD1] transition-colors"
                        title="Toque para editar o saldo"
                      >
                        {formattedBalance}
                      </span>
                    )}
                  </span>
                  
                  {/* Quick Edit Balance Button */}
                  {!isInlineEditMode && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowQuickBalanceModal(true);
                      }}
                      className="p-1 rounded-full text-neutral-400 hover:text-[#820AD1] hover:bg-purple-50 transition-colors cursor-pointer"
                      title="Editar saldo da conta"
                      aria-label="Editar saldo"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ) : (
                <div className="h-8 flex items-center gap-1.5 py-1">
                  <div className="w-2.5 h-2.5 rounded-full bg-neutral-300" />
                  <div className="w-2.5 h-2.5 rounded-full bg-neutral-300" />
                  <div className="w-2.5 h-2.5 rounded-full bg-neutral-300" />
                  <div className="w-2.5 h-2.5 rounded-full bg-neutral-300" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Horizontal Action Buttons Carousel */}
        <div className="mt-5 flex gap-4 overflow-x-auto pb-3 pt-1 no-scrollbar -mx-5 px-5">
          {/* Pagar */}
          <button
            id="btn-action-pay"
            onClick={() => onNavigate('PaymentOptions')}
            className="flex flex-col items-center gap-2 shrink-0 group cursor-pointer"
          >
            <div className="w-16 h-16 rounded-full bg-[#f5f5f5] group-hover:bg-[#ebebeb] group-active:scale-95 flex items-center justify-center transition-all">
              <Barcode className="w-7 h-7 text-neutral-900" />
            </div>
            <span className="text-xs font-bold text-neutral-800">Pagar</span>
          </button>

          {/* Área Pix */}
          <button
            id="btn-action-pix"
            onClick={() => onNavigate('AreaPix')}
            className="flex flex-col items-center gap-2 shrink-0 group cursor-pointer"
          >
            <div className="w-16 h-16 rounded-full bg-[#f5f5f5] group-hover:bg-[#ebebeb] group-active:scale-95 flex items-center justify-center transition-all relative">
              <LayoutGrid className="w-7 h-7 text-neutral-900" />
              <span className="absolute -top-1 -right-1 bg-[#820AD1] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow-xs">
                Pix
              </span>
            </div>
            <span className="text-xs font-bold text-neutral-800">Área Pix</span>
          </button>

          {/* Transferir */}
          <button
            id="btn-action-transfer"
            onClick={() => onNavigate('SelectRecipient')}
            className="flex flex-col items-center gap-2 shrink-0 group cursor-pointer"
          >
            <div className="w-16 h-16 rounded-full bg-[#f5f5f5] group-hover:bg-[#ebebeb] group-active:scale-95 flex items-center justify-center transition-all">
              <ArrowUpRight className="w-7 h-7 text-neutral-900" />
            </div>
            <span className="text-xs font-bold text-neutral-800">Transferir</span>
          </button>

          {/* Cobrar */}
          <button
            id="btn-action-charge"
            onClick={() => setShowCobrarModal(true)}
            className="flex flex-col items-center gap-2 shrink-0 group cursor-pointer"
          >
            <div className="w-16 h-16 rounded-full bg-[#f5f5f5] group-hover:bg-[#ebebeb] group-active:scale-95 flex items-center justify-center transition-all">
              <QrCode className="w-7 h-7 text-neutral-900" />
            </div>
            <span className="text-xs font-bold text-neutral-800">Cobrar</span>
          </button>

          {/* Extrato */}
          <button
            id="btn-action-statement"
            onClick={() => {
              const el = document.getElementById('recent-activity-section');
              el?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="flex flex-col items-center gap-2 shrink-0 group cursor-pointer"
          >
            <div className="w-16 h-16 rounded-full bg-[#f5f5f5] group-hover:bg-[#ebebeb] group-active:scale-95 flex items-center justify-center transition-all">
              <ReceiptText className="w-7 h-7 text-neutral-900" />
            </div>
            <span className="text-xs font-bold text-neutral-800">Extrato</span>
          </button>
        </div>
      </div>

      <div className="h-1.5 bg-[#f0f1f5] my-2" />

      {/* Meus Cartões Section */}
      <div className="px-5 py-2">
        <div className="bg-[#f5f5f5] hover:bg-[#ededed] active:bg-[#e5e5e5] rounded-2xl p-4 flex items-center justify-between cursor-pointer transition-colors">
          <div className="flex items-center gap-3">
            <CreditCard className="w-5 h-5 text-neutral-700" />
            <span className="text-sm font-semibold text-neutral-800">Meus cartões PJ</span>
          </div>
          <div className="text-right">
            <span className="text-xs text-[#820AD1] font-bold">
              <EditableText
                value={appData.creditCardLimit}
                onSave={(val) => onUpdateField('creditCardLimit', val)}
                isInlineEditMode={isInlineEditMode}
              />
            </span>
          </div>
        </div>
      </div>

      {/* Nu Empresas Highlights Banner */}
      <div className="px-5 py-2">
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50/50 border border-purple-100 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-[#820AD1]">
              <EditableText
                value={appData.bannerTitle}
                onSave={(val) => onUpdateField('bannerTitle', val)}
                isInlineEditMode={isInlineEditMode}
              />
            </p>
            <p className="text-[12px] text-neutral-600 mt-0.5">
              <EditableText
                value={appData.bannerSubtitle}
                onSave={(val) => onUpdateField('bannerSubtitle', val)}
                isInlineEditMode={isInlineEditMode}
              />
            </p>
          </div>
          <button className="text-xs font-bold text-[#820AD1] bg-white px-3 py-1.5 rounded-lg border border-purple-200 shadow-2xs shrink-0 ml-2">
            Simular
          </button>
        </div>
      </div>

      <div className="h-1.5 bg-[#f0f1f5] my-3" />

      {/* Recent Activity / Extrato */}
      <div id="recent-activity-section" className="px-5 pt-2">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-neutral-900">Histórico de Transações</h3>
          <button 
            onClick={onOpenEditModal}
            className="text-xs text-[#820AD1] font-semibold flex items-center gap-1 hover:underline"
          >
            <span>Editar lista</span>
          </button>
        </div>

        <div className="space-y-3">
          {appData.transactions.map((tx, idx) => {
            const isNegative = tx.amount < 0;
            return (
              <div
                key={tx.id || idx}
                className="flex items-center justify-between p-3.5 rounded-2xl hover:bg-neutral-50 border border-neutral-100 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1 mr-2">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                    isNegative ? 'bg-neutral-100 text-neutral-600' : 'bg-emerald-50 text-emerald-600'
                  }`}>
                    {isNegative ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownLeft className="w-5 h-5" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-neutral-900 truncate">{tx.title}</p>
                    <p className="text-[11px] text-neutral-500 truncate">{tx.subtitle}</p>
                    <p className="text-[10px] text-neutral-400 mt-0.5">{tx.date}</p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className={`text-xs sm:text-sm font-bold ${
                    isNegative ? 'text-neutral-900' : 'text-emerald-600'
                  }`}>
                    {isBalanceVisible ? (
                      `${isNegative ? '-' : '+'} ${Math.abs(tx.amount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`
                    ) : (
                      '••••••'
                    )}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* User Profile Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-sm p-6 text-neutral-900 shadow-xl"
          >
            <div className="flex justify-between items-center pb-4 border-b border-neutral-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-[#5f259f] text-white flex items-center justify-center font-bold text-lg">
                  {appData.userInitials}
                </div>
                <div>
                  <h4 className="font-bold text-sm">{appData.userName}</h4>
                  <p className="text-xs text-neutral-500">
                    Ag {appData.agency} • C/C {appData.accountNumber}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowProfileModal(false)}
                className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-500 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="py-4 space-y-2.5 text-xs text-neutral-700">
              <div className="p-3 bg-neutral-50 rounded-xl">
                <p className="font-semibold text-neutral-900">Empresa Cadastrada</p>
                <p className="text-neutral-500 mt-0.5">{appData.companyName}</p>
                <p className="text-neutral-400 text-[10px]">CNPJ: {appData.cnpj}</p>
              </div>

              <button
                onClick={() => {
                  setShowProfileModal(false);
                  onOpenEditModal();
                }}
                className="w-full text-center py-3 text-purple-700 font-bold bg-purple-50 hover:bg-purple-100 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <Sliders className="w-4 h-4" />
                <span>Abrir Editor Completo</span>
              </button>

              <button
                onClick={() => {
                  setShowProfileModal(false);
                  onNavigate('Login');
                }}
                className="w-full text-center py-3 text-red-600 font-semibold bg-red-50 hover:bg-red-100 rounded-xl transition-colors"
              >
                Bloquear app / Sair
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Cobrar & Simular Pix Recebido Modal */}
      {showCobrarModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 backdrop-blur-xs">
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-[#820AD1]">
                  <QrCode className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-neutral-900 text-sm">Cobrar via Pix</h3>
                  <p className="text-[11px] text-neutral-500">Nu Empresas PJ</p>
                </div>
              </div>
              <button
                onClick={() => setShowCobrarModal(false)}
                className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-500 hover:text-neutral-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-4 space-y-4">
              {/* QR Code Graphic Representation */}
              <div className="bg-neutral-50 border border-neutral-200 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
                <div className="w-40 h-40 bg-white p-3 rounded-xl border border-neutral-300 shadow-xs flex flex-col items-center justify-center relative">
                  <QrCode className="w-32 h-32 text-neutral-900" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-7 h-7 bg-[#820AD1] rounded-lg text-white font-black text-[10px] flex items-center justify-center shadow-md">
                      nu
                    </div>
                  </div>
                </div>

                <div className="mt-3 w-full">
                  <p className="text-xs font-bold text-neutral-900">{appData.companyName}</p>
                  <p className="text-[11px] text-neutral-500">Chave CNPJ: {appData.cnpj}</p>
                </div>
              </div>

              {/* Simulation Trigger Box */}
              <div className="bg-purple-950 text-white rounded-2xl p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 fill-emerald-400" /> Testar Notificação de Recebimento
                  </span>
                  <span className="text-[10px] bg-purple-800 text-purple-200 px-2 py-0.5 rounded-full font-semibold">
                    Simulação
                  </span>
                </div>
                <p className="text-[11px] text-purple-200 leading-tight">
                  Simule o cliente efetuando o pagamento deste Pix. A notificação bancária descerá da aba do celular com o som de confirmação.
                </p>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    onClick={() => {
                      if (onTriggerSimulatedPix) {
                        onTriggerSimulatedPix(
                          appData.simulatedPixSender,
                          appData.simulatedPixAmount,
                          appData.simulatedPixBank,
                          appData.simulatedPixMessage,
                          0
                        );
                      }
                      setShowCobrarModal(false);
                    }}
                    className="bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-neutral-950 font-bold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <Zap className="w-3.5 h-3.5" /> Disparar Agora
                  </button>

                  <button
                    onClick={() => {
                      if (onTriggerSimulatedPix) {
                        onTriggerSimulatedPix(
                          appData.simulatedPixSender,
                          appData.simulatedPixAmount,
                          appData.simulatedPixBank,
                          appData.simulatedPixMessage,
                          3
                        );
                      }
                      setShowCobrarModal(false);
                    }}
                    className="bg-purple-600 hover:bg-purple-500 active:scale-95 text-white font-bold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <span>Em 3 segundos</span>
                  </button>
                </div>
              </div>

              {/* Edit simulation data quick link */}
              <button
                onClick={() => {
                  setShowCobrarModal(false);
                  onOpenEditModal();
                }}
                className="w-full text-center py-2.5 text-xs text-purple-700 font-semibold bg-purple-50 hover:bg-purple-100 rounded-xl transition-colors flex items-center justify-center gap-1.5"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Configurar valor e remetente do Pix na aba de edição</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Modal de Edição Rápida de Saldo */}
      <QuickBalanceModal
        isOpen={showQuickBalanceModal}
        onClose={() => setShowQuickBalanceModal(false)}
        currentBalance={appData.balance}
        onSaveBalance={(newBalance) => onUpdateField('balance', newBalance)}
      />
    </div>
  );
};
