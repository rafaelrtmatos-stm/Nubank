import React, { useState, useRef, useEffect } from 'react';
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
  Edit2,
  Dices,
  CheckCircle2,
  Monitor,
  Hexagon,
  Image as ImageIcon,
  Pencil,
  Users,
  RotateCcw,
  CornerUpLeft,
  Heart,
  Store,
  UserPlus,
  FileText
} from 'lucide-react';
import { AppCustomData, ScreenName, Transaction } from '../types';
import { EditableText } from '../components/EditableText';
import { QuickBalanceModal } from '../components/QuickBalanceModal';
import { parseCurrency } from '../utils/currencyUtils';
import { generateRandomBankAccount } from '../utils/bankGenerator';

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
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Triple click handler on avatar: 1 click = authentic Nubank profile card, 3 clicks = admin configuration
  const clickCountRef = useRef<number>(0);
  const clickTimeoutRef = useRef<any>(null);

  const handleLeftMenuClick = () => {
    clickCountRef.current += 1;
    const currentClicks = clickCountRef.current;

    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current);
    }

    if (currentClicks >= 3) {
      clickCountRef.current = 0;
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        try {
          navigator.vibrate([40, 40, 40]);
        } catch (e) {
          // ignore
        }
      }
      setShowProfileModal(false);
      onOpenEditModal();
      return;
    }

    clickTimeoutRef.current = setTimeout(() => {
      if (clickCountRef.current === 1 || clickCountRef.current === 2) {
        setShowProfileModal(true);
      }
      clickCountRef.current = 0;
    }, 380);
  };

  // Avatar inside the opened profile modal can also trigger admin configuration if triple-clicked
  const modalAvatarClicksRef = useRef<number>(0);
  const modalAvatarTimeoutRef = useRef<any>(null);

  const handleModalAvatarClick = () => {
    modalAvatarClicksRef.current += 1;
    if (modalAvatarTimeoutRef.current) clearTimeout(modalAvatarTimeoutRef.current);

    if (modalAvatarClicksRef.current >= 3) {
      modalAvatarClicksRef.current = 0;
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        try {
          navigator.vibrate([40, 40, 40]);
        } catch (e) {}
      }
      setShowProfileModal(false);
      onOpenEditModal();
    } else {
      modalAvatarTimeoutRef.current = setTimeout(() => {
        modalAvatarClicksRef.current = 0;
      }, 420);
    }
  };

  const handleCopyAccountInfo = () => {
    const info = `Nu Pagamentos S.A. (260) • Agência ${appData.agency || '0001'} • Conta ${appData.accountNumber || '••••••••-•'}`;
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(info).catch(() => {});
    }
    setToastMessage("Dados da conta copiados!");
    setTimeout(() => setToastMessage(null), 2500);
  };

  const formattedBalance = Number(appData.balance).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });

  return (
    <div className="flex flex-col h-full w-full bg-white select-none overflow-y-auto pb-16">
      {/* Toast Feedback */}
      {toastMessage && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="fixed top-6 left-1/2 -translate-x-1/2 z-60 bg-neutral-900/90 text-white text-xs font-semibold px-4 py-2 rounded-full shadow-lg flex items-center gap-2 backdrop-blur-xs"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </motion.div>
      )}

      {/* Header PJ Purple Zone with Safe Area Top */}
      <div 
        className="bg-[#5f259f] text-white pb-6 px-5 transition-all"
        style={{ paddingTop: 'max(env(safe-area-inset-top, 0px), 3.25rem)' }}
      >
        {/* Top Header Icons */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {/* Store Icon with subtle dot */}
            <div 
              className="relative w-11 h-11 rounded-2xl bg-white/15 hover:bg-white/20 active:scale-95 flex items-center justify-center transition-colors cursor-pointer text-white"
              title="Minha loja PJ"
            >
              <Store className="w-5 h-5 text-white/90" />
              <span className="absolute top-2.5 right-2.5 w-1.5 h-1.5 rounded-full bg-white/70" />
            </div>

            {/* Profile Avatar Button */}
            <button
              id="btn-home-profile"
              onClick={handleLeftMenuClick}
              className="w-11 h-11 rounded-full bg-white/20 hover:bg-white/30 active:scale-95 flex items-center justify-center transition-all cursor-pointer relative shadow-xs font-bold text-sm text-white"
              aria-label="Perfil do usuário"
              title="Toque para abrir perfil • Toque 3x para configurações"
            >
              <User className="w-5 h-5 text-white" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="btn-toggle-eye"
              onClick={onToggleBalance}
              className="w-10 h-10 hover:bg-white/10 rounded-full flex items-center justify-center transition-colors cursor-pointer text-white"
              aria-label={isBalanceVisible ? "Ocultar saldo" : "Exibir saldo"}
            >
              {isBalanceVisible ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
            </button>
            <button
              id="btn-home-help"
              onClick={() => alert("Central de Atendimento Nu Empresas: Suporte 24 horas.")}
              className="w-10 h-10 hover:bg-white/10 rounded-full flex items-center justify-center transition-colors cursor-pointer text-white"
              aria-label="Ajuda"
            >
              <HelpCircle className="w-5 h-5" />
            </button>
            <button
              onClick={() => alert("Convide sócios ou envie convite Nu")}
              className="w-10 h-10 hover:bg-white/10 rounded-full flex items-center justify-center transition-colors cursor-pointer text-white"
              aria-label="Convidar"
            >
              <UserPlus className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Company / Greeting info */}
        <div className="mt-4">
          <p className="text-white/80 text-xs font-medium uppercase tracking-wider">
            Olá{appData.userName ? `, ` : ' '}
            <EditableText
              value={appData.userName || (isInlineEditMode ? 'Definir Nome' : 'Conta PJ')}
              onSave={(val) => onUpdateField('userName', val)}
              isInlineEditMode={isInlineEditMode}
            />
          </p>
          {(appData.companyName || isInlineEditMode) && (
            <div className="text-white/95 text-xs sm:text-sm font-semibold truncate flex items-center gap-1.5 mt-0.5">
              <Building2 className="w-3.5 h-3.5 text-purple-200 shrink-0" />
              <EditableText
                value={appData.companyName || 'Definir Empresa'}
                onSave={(val) => onUpdateField('companyName', val)}
                isInlineEditMode={isInlineEditMode}
              />
            </div>
          )}
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
              onClick={() => onNavigate('Extrato')}
              className="flex items-center gap-1 cursor-pointer hover:opacity-80 transition-opacity"
              title="Toque para abrir o extrato da conta"
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
                  <span 
                    onClick={() => {
                      if (!isInlineEditMode) {
                        onNavigate('Extrato');
                      }
                    }}
                    className="text-2xl sm:text-[28px] font-bold text-neutral-900 tracking-tight cursor-pointer hover:text-[#820AD1] transition-colors"
                    title="Toque para ver o extrato"
                  >
                    {isInlineEditMode ? (
                      <span className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <span>R$ </span>
                        <EditableText
                          type="currency"
                          value={appData.balance}
                          onSave={(val) => onUpdateField('balance', parseCurrency(val))}
                          isInlineEditMode={isInlineEditMode}
                        />
                      </span>
                    ) : (
                      <span>{formattedBalance}</span>
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
                <div 
                  onClick={() => onNavigate('Extrato')}
                  className="h-8 flex items-center gap-1.5 py-1 cursor-pointer"
                  title="Toque para abrir o extrato"
                >
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

          {/* Subir fatura */}
          <button
            id="btn-action-upload-fatura"
            onClick={() => onNavigate('PaymentOptions')}
            className="flex flex-col items-center gap-2 shrink-0 group cursor-pointer"
          >
            <div className="w-16 h-16 rounded-full bg-[#f5f5f5] group-hover:bg-[#ebebeb] group-active:scale-95 flex items-center justify-center transition-all relative">
              <FileText className="w-7 h-7 text-[#820AD1]" />
              <span className="absolute -top-1 -right-1 bg-[#820AD1] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow-xs">
                PDF
              </span>
            </div>
            <span className="text-xs font-bold text-neutral-800">Subir fatura</span>
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

          {/* Ler QR code */}
          <button
            id="btn-action-scan-qr"
            onClick={() => onNavigate('ScanQrCode')}
            className="flex flex-col items-center gap-2 shrink-0 group cursor-pointer"
          >
            <div className="w-16 h-16 rounded-full bg-[#f5f5f5] group-hover:bg-[#ebebeb] group-active:scale-95 flex items-center justify-center transition-all">
              <QrCode className="w-7 h-7 text-neutral-900" />
            </div>
            <span className="text-xs font-bold text-neutral-800">Ler QR code</span>
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
            onClick={() => onNavigate('Extrato')}
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
      {/* Banner Promocional / Capital de Giro (apenas se configurado) */}
      {(appData.bannerTitle || isInlineEditMode) && (
        <div className="px-5 py-2">
          <div className="bg-gradient-to-r from-purple-50 to-indigo-50/50 border border-purple-100 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-[#820AD1]">
                <EditableText
                  value={appData.bannerTitle || 'Título do Banner'}
                  onSave={(val) => onUpdateField('bannerTitle', val)}
                  isInlineEditMode={isInlineEditMode}
                />
              </p>
              <p className="text-[12px] text-neutral-600 mt-0.5">
                <EditableText
                  value={appData.bannerSubtitle || 'Subtítulo do Banner'}
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
      )}

      <div className="h-1.5 bg-[#f0f1f5] my-3" />

      {/* Recent Activity / Extrato */}
      <div id="recent-activity-section" className="px-5 pt-2">
        <div className="flex items-center justify-between mb-3">
          <div 
            onClick={() => onNavigate('Extrato')}
            className="flex items-center gap-1 cursor-pointer hover:opacity-80 transition-opacity"
            title="Abrir extrato completo"
          >
            <h3 className="text-sm font-bold text-neutral-900">Histórico de Transações</h3>
            <ChevronRight className="w-4 h-4 text-neutral-400" />
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => onNavigate('Extrato')}
              className="text-xs text-[#820AD1] font-semibold hover:underline cursor-pointer"
            >
              Ver extrato
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {appData.transactions.map((tx, idx) => {
            const isNegative = tx.amount < 0;
            const isBill = tx.type === 'bill_payment' || tx.title?.toLowerCase().includes('boleto') || tx.subtitle?.toLowerCase().includes('boleto');
            return (
              <div
                key={tx.id || idx}
                onClick={() => onNavigate('Extrato')}
                className="flex items-center justify-between p-3.5 rounded-2xl hover:bg-neutral-50 active:bg-neutral-100 border border-neutral-100 transition-colors cursor-pointer"
                title="Toque para ver detalhes no extrato"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1 mr-2">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                    isBill ? 'bg-purple-50 text-[#820AD1]' : isNegative ? 'bg-neutral-100 text-neutral-600' : 'bg-emerald-50 text-emerald-600'
                  }`}>
                    {isBill ? <Barcode className="w-5 h-5" /> : isNegative ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownLeft className="w-5 h-5" />}
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
          {appData.transactions.length === 0 && (
            <div className="py-8 text-center text-neutral-400 bg-neutral-50 rounded-2xl border border-dashed border-neutral-200 p-4">
              <p className="text-xs">Nenhuma movimentação recente cadastrada.</p>
            </div>
          )}
        </div>
      </div>

      {/* User Profile Modal - Authentic Nubank PJ Drawer */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 backdrop-blur-[2px]">
          <motion.div
            initial={{ opacity: 0, y: "100%" }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className="bg-white rounded-t-[28px] sm:rounded-3xl w-full max-w-md pt-5 pb-6 px-6 text-neutral-900 shadow-2xl overflow-y-auto max-h-[92vh]"
          >
            {/* Top Icons Bar */}
            <div className="flex items-center justify-between pb-2">
              <button
                id="btn-close-profile-modal"
                onClick={() => setShowProfileModal(false)}
                className="w-10 h-10 -ml-2 rounded-full hover:bg-neutral-100 active:scale-95 flex items-center justify-center text-neutral-900 transition-all cursor-pointer"
                aria-label="Fechar"
              >
                <X className="w-6 h-6 stroke-[2]" />
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => alert("Modo apresentação / tela externa")}
                  className="w-10 h-10 rounded-full hover:bg-neutral-100 flex items-center justify-center text-neutral-900 transition-colors cursor-pointer"
                  aria-label="Modo monitor"
                >
                  <Monitor className="w-5 h-5 stroke-[1.8]" />
                </button>

                <button
                  onClick={() => alert("Configurações do aplicativo")}
                  className="w-10 h-10 rounded-full hover:bg-neutral-100 flex items-center justify-center text-neutral-900 transition-colors cursor-pointer"
                  aria-label="Opções"
                >
                  <Hexagon className="w-5 h-5 stroke-[1.8]" />
                </button>

                <div className="relative">
                  <button
                    onClick={() => alert("Notificações da conta")}
                    className="w-10 h-10 rounded-full hover:bg-neutral-100 flex items-center justify-center text-neutral-900 transition-colors cursor-pointer"
                    aria-label="Notificações"
                  >
                    <Bell className="w-5 h-5 stroke-[1.8]" />
                  </button>
                  <span className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-[#820AD1]" />
                </div>
              </div>
            </div>

            {/* Profile Info Header */}
            <div className="flex items-center gap-3.5 mt-2">
              <div 
                onClick={handleModalAvatarClick}
                className="relative w-14 h-14 rounded-full bg-[#f0f1f5] flex items-center justify-center text-neutral-700 shrink-0 cursor-pointer select-none active:scale-95 transition-transform"
                title="Avatar • Toque 3x para configurações do administrador"
              >
                <ImageIcon className="w-6 h-6 stroke-[1.7] text-neutral-700" />
                <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-white border border-neutral-300 flex items-center justify-center shadow-2xs">
                  <Pencil className="w-2.5 h-2.5 text-neutral-700 stroke-[2.5]" />
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="text-base sm:text-[17px] font-bold text-neutral-900 tracking-tight leading-snug truncate">
                  {appData.companyName || 'Conta PJ'}
                </h3>
                <p className="text-[13px] text-neutral-600 mt-0.5 flex items-center gap-1.5 flex-wrap">
                  <span>Agência {appData.agency || '0001'} • Conta {appData.accountNumber || '••••••••-•'}</span>
                  <button
                    onClick={handleCopyAccountInfo}
                    className="text-[#820AD1] font-semibold hover:underline cursor-pointer ml-0.5"
                  >
                    Mais
                  </button>
                </p>
              </div>
            </div>

            {/* Acesso Compartilhado PJ Card */}
            <div 
              id="btn-profile-shared-access"
              onClick={() => alert("Acesso Compartilhado PJ: gerencie sócios e colaboradores")}
              className="mt-6 p-4 rounded-2xl bg-[#f5f5f7] hover:bg-[#ebebed] active:scale-[0.99] flex items-center gap-3.5 cursor-pointer transition-all"
            >
              <Users className="w-5 h-5 text-neutral-900 stroke-[1.8]" />
              <span className="text-[15px] font-semibold text-neutral-900">Acesso Compartilhado PJ</span>
            </div>

            {/* Outras contas pessoais Section */}
            <div className="mt-6">
              <p className="text-[13px] text-neutral-500 font-normal mb-2 px-1">
                Outras contas pessoais
              </p>

              {/* User personal account */}
              <div 
                onClick={() => alert(`Acessando conta pessoal de ${appData.userName || 'Titular da Conta'}`)}
                className="flex items-center justify-between py-3 px-1 hover:bg-neutral-50 active:bg-neutral-100 rounded-xl cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-11 h-11 rounded-full bg-[#f0f1f5] flex items-center justify-center text-neutral-900 shrink-0">
                    <User className="w-5 h-5 stroke-[1.8]" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[15px] font-bold text-neutral-900 leading-tight truncate">
                      {appData.userName || 'Titular da Conta'}
                    </p>
                    <p className="text-[12px] text-neutral-500 mt-0.5">Conta pessoal</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-neutral-900 stroke-[1.8] shrink-0" />
              </div>

              {/* Switch account */}
              <div 
                onClick={() => alert("Trocar conta: funcionalidade para contas internacionais Nu.")}
                className="flex items-center justify-between py-3 px-1 hover:bg-neutral-50 active:bg-neutral-100 rounded-xl cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-11 h-11 rounded-full bg-purple-100/70 flex items-center justify-center text-[#820AD1] shrink-0">
                    <RotateCcw className="w-5 h-5 stroke-[1.8]" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[15px] font-bold text-neutral-900 leading-tight">
                      Trocar conta
                    </p>
                    <p className="text-[12px] text-neutral-500 mt-0.5">Contas de outros países</p>
                  </div>
                </div>
              </div>

              {/* Logout / Exit */}
              <div 
                id="btn-profile-logout"
                onClick={() => {
                  setShowProfileModal(false);
                  onNavigate('Login');
                }}
                className="flex items-center justify-between py-3 px-1 hover:bg-neutral-50 active:bg-neutral-100 rounded-xl cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-full bg-[#f0f1f5] flex items-center justify-center text-neutral-900 shrink-0">
                    <CornerUpLeft className="w-5 h-5 stroke-[1.8]" />
                  </div>
                  <div>
                    <p className="text-[15px] font-bold text-neutral-900 leading-tight">
                      Sair do aplicativo
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer: Avalie esta tela */}
            <div className="mt-8 flex flex-col items-center justify-center">
              <button
                onClick={() => {
                  setToastMessage("Obrigado por avaliar nossa tela!");
                  setTimeout(() => setToastMessage(null), 2500);
                }}
                className="flex items-center gap-2 text-[#820AD1] hover:text-[#6f09b5] font-semibold text-sm cursor-pointer transition-colors"
              >
                <Heart className="w-4 h-4 text-[#820AD1] stroke-[2]" />
                <span>Avalie esta tela</span>
              </button>
              <div className="w-36 h-1 bg-black rounded-full mx-auto mt-6 mb-1" />
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
                id="btn-close-cobrar-modal"
                onClick={() => setShowCobrarModal(false)}
                className="w-9 h-9 rounded-full bg-neutral-100 hover:bg-neutral-200 active:scale-95 flex items-center justify-center text-neutral-600 transition-colors cursor-pointer"
                aria-label="Fechar modal"
              >
                <X className="w-5 h-5" />
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
                  <p className="text-xs font-bold text-neutral-900">{appData.companyName || 'Conta PJ'}</p>
                  <p className="text-[11px] text-neutral-500">Chave CNPJ: {appData.cnpj || 'Não cadastrada'}</p>
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

                <div className="grid grid-cols-3 gap-2 pt-1">
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
                    className="bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-neutral-950 font-bold py-2.5 px-2 rounded-xl text-xs flex items-center justify-center gap-1 cursor-pointer shadow-sm"
                  >
                    <Zap className="w-3.5 h-3.5" /> Agora
                  </button>

                  <button
                    onClick={() => {
                      if (onTriggerSimulatedPix) {
                        onTriggerSimulatedPix(
                          appData.simulatedPixSender,
                          appData.simulatedPixAmount,
                          appData.simulatedPixBank,
                          appData.simulatedPixMessage,
                          5
                        );
                      }
                      setShowCobrarModal(false);
                    }}
                    className="bg-purple-600 hover:bg-purple-500 active:scale-95 text-white font-bold py-2.5 px-2 rounded-xl text-xs flex items-center justify-center gap-1 cursor-pointer shadow-sm"
                  >
                    <span>Em 5s</span>
                  </button>

                  <button
                    onClick={() => {
                      if (onTriggerSimulatedPix) {
                        onTriggerSimulatedPix(
                          appData.simulatedPixSender,
                          appData.simulatedPixAmount,
                          appData.simulatedPixBank,
                          appData.simulatedPixMessage,
                          15
                        );
                      }
                      setShowCobrarModal(false);
                    }}
                    className="bg-neutral-800 hover:bg-neutral-700 active:scale-95 text-neutral-200 font-bold py-2.5 px-2 rounded-xl text-xs flex items-center justify-center gap-1 cursor-pointer shadow-sm border border-neutral-700"
                    title="Tempo para você minimizar o app e ver a notificação na barra do celular"
                  >
                    <span>Em 15s (2º plano)</span>
                  </button>
                </div>
              </div>
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
