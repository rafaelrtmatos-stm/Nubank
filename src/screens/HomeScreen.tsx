import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
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
  CheckCircle2,
  Monitor,
  Hexagon,
  Users,
  RotateCcw,
  Store,
  UserPlus,
  MoreVertical,
  Link2,
  Smartphone,
  Lock,
  Plus,
  ArrowUpDown,
  BarChart3,
  Calendar,
  MessageSquare,
  DollarSign,
  Radio,
  CornerUpLeft,
  Heart,
  Pencil
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
  const [activeBottomTab, setActiveBottomTab] = useState<'dia' | 'cobrancas' | 'gestao'>('dia');

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
        } catch (e) {}
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
    }, 350);
  };

  const handleModalAvatarClick = () => {
    setShowProfileModal(false);
    onOpenEditModal();
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
    <div className="flex flex-col h-full w-full bg-white select-none overflow-y-auto pb-28 relative">
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

      {/* Header PJ Purple Zone with Safe Area Top (Faithful to Screenshot) */}
      <div 
        className="bg-[#5f259f] text-white pb-5 px-5 transition-all"
        style={{ paddingTop: 'max(env(safe-area-inset-top, 0px), 3.25rem)' }}
      >
        {/* Top Header Icons */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {/* Store Icon with subtle white dot (Casinha) */}
            <div 
              onClick={() => {
                setShowProfileModal(true);
              }}
              className="relative w-10 h-10 rounded-full bg-white/20 hover:bg-white/25 active:scale-95 flex items-center justify-center transition-colors cursor-pointer text-white"
              title="Informações da conta PJ"
            >
              <Store className="w-5 h-5 text-white" />
              <span className="absolute top-0 right-0 w-2.5 h-2.5 rounded-full bg-white border-2 border-[#5f259f]" />
            </div>

            {/* Profile Avatar Button (1 click = profile, 3 clicks = admin modal) */}
            <button
              id="btn-home-profile"
              onClick={handleLeftMenuClick}
              className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 active:scale-95 flex items-center justify-center transition-all cursor-pointer relative shadow-xs font-bold text-sm text-white"
              aria-label="Perfil do usuário"
              title="Perfil Nu Empresas (toque 3x para configurações)"
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
              onClick={() => {
                setToastMessage("Ajuda Nu Empresas: suporte 24h");
                setTimeout(() => setToastMessage(null), 2000);
              }}
              className="w-10 h-10 hover:bg-white/10 rounded-full flex items-center justify-center transition-colors cursor-pointer text-white"
              aria-label="Ajuda"
            >
              <HelpCircle className="w-5 h-5" />
            </button>
            <button
              onClick={() => {
                setToastMessage("Convite de sócios e colaboradores");
                setTimeout(() => setToastMessage(null), 2000);
              }}
              className="w-10 h-10 hover:bg-white/10 rounded-full flex items-center justify-center transition-colors cursor-pointer text-white"
              aria-label="Convidar sócios"
            >
              <UserPlus className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Carousel of Cards inside Purple Header (Exactly matching IMG_7624.png) */}
        <div className="mt-5 flex gap-3 overflow-x-auto pb-1 pt-1 no-scrollbar -mx-5 px-5">
          {/* Card 1 - White Reminder Card */}
          <div 
            onClick={() => onNavigate('PaymentOptions')}
            className="bg-white text-purple-900 rounded-2xl p-3.5 shadow-sm min-w-[210px] sm:min-w-[225px] h-[105px] flex flex-col justify-between shrink-0 cursor-pointer active:scale-[0.98] transition-transform"
          >
            <div className="flex items-start justify-between">
              <div className="relative">
                <div className="w-7 h-7 bg-purple-100 rounded-lg flex items-center justify-center">
                  <ReceiptText className="w-4 h-4 text-[#5f259f]" />
                </div>
                <div className="absolute -bottom-1 -left-1 w-4 h-4 bg-white rounded-md shadow-2xs flex items-center justify-center border border-purple-200">
                  <Calendar className="w-2.5 h-2.5 text-[#5f259f]" />
                </div>
              </div>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onNavigate('PaymentOptions');
                }}
                className="text-neutral-400 hover:text-neutral-700 p-0.5"
              >
                <MoreVertical className="w-4 h-4" />
              </button>
            </div>
            <div>
              <p className="text-xs font-bold text-[#5f259f] leading-snug">
                {appData.reminderTitle || 'Lembrete de conta: Realize o Pagamento'}
              </p>
            </div>
          </div>

          {/* Card 2 - Purple Link Card */}
          <div 
            onClick={() => setShowCobrarModal(true)}
            className="bg-white/15 text-white rounded-2xl p-3.5 min-w-[210px] sm:min-w-[225px] h-[105px] flex flex-col justify-between shrink-0 border border-white/10 cursor-pointer active:scale-[0.98] transition-transform"
          >
            <div className="flex items-start justify-between">
              <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
                <Link2 className="w-4 h-4 text-white" />
              </div>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setShowCobrarModal(true);
                }}
                className="text-white/60 hover:text-white p-0.5"
              >
                <MoreVertical className="w-4 h-4" />
              </button>
            </div>
            <div>
              <p className="text-xs font-bold text-white leading-snug">
                Link: agora você recebe na hora
              </p>
            </div>
          </div>

          {/* Card 3 - Purple QR Code Card */}
          <div 
            onClick={() => setShowCobrarModal(true)}
            className="bg-white/15 text-white rounded-2xl p-3.5 min-w-[190px] sm:min-w-[200px] h-[105px] flex flex-col justify-between shrink-0 border border-white/10 cursor-pointer active:scale-[0.98] transition-transform"
          >
            <div className="flex items-start justify-between">
              <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
                <QrCode className="w-4 h-4 text-white" />
              </div>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setShowCobrarModal(true);
                }}
                className="text-white/60 hover:text-white p-0.5"
              >
                <MoreVertical className="w-4 h-4" />
              </button>
            </div>
            <div>
              <p className="text-xs font-bold text-white leading-snug">
                Peça seu QR Code
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Account Balance Section (100% Faithful to Screenshot - Clean, No Pencil) */}
      <div className="px-5 pt-6 pb-2">
        <div 
          onClick={() => onNavigate('Extrato')}
          className="flex items-center justify-between cursor-pointer group"
          title="Toque para abrir o extrato da conta"
        >
          <h2 className="text-[17px] font-bold text-neutral-900 tracking-tight flex items-center gap-1.5">
            {appData.accountTitle || 'Conta Nu Empresas'}
          </h2>
          <ChevronRight className="w-5 h-5 text-neutral-400 group-hover:translate-x-0.5 transition-transform" />
        </div>

        {/* Balance Display (NO PENCIL ICON) */}
        <div className="mt-1">
          {isBalanceVisible ? (
            <div 
              onClick={() => onNavigate('Extrato')}
              className="text-2xl sm:text-[28px] font-bold text-neutral-900 tracking-tight cursor-pointer"
            >
              {formattedBalance}
            </div>
          ) : (
            <div 
              onClick={() => onNavigate('Extrato')}
              className="h-8 flex items-center gap-1.5 py-1 cursor-pointer"
            >
              <div className="w-2.5 h-2.5 rounded-full bg-neutral-300" />
              <div className="w-2.5 h-2.5 rounded-full bg-neutral-300" />
              <div className="w-2.5 h-2.5 rounded-full bg-neutral-300" />
              <div className="w-2.5 h-2.5 rounded-full bg-neutral-300" />
            </div>
          )}
        </div>

        {/* Pill Button: + Vincular conta */}
        <button
          type="button"
          onClick={() => {
            setToastMessage("Funcionalidade Open Finance / Vincular conta");
            setTimeout(() => setToastMessage(null), 2200);
          }}
          className="mt-3 bg-neutral-100 hover:bg-neutral-200 active:scale-95 text-neutral-800 text-xs font-semibold px-3 py-1.5 rounded-full inline-flex items-center gap-1.5 cursor-pointer transition-colors"
        >
          <Plus className="w-3.5 h-3.5 text-neutral-600" />
          <span>Vincular conta</span>
        </button>

        {/* Horizontal Action Buttons Carousel (Faithful to Screenshot) */}
        <div className="mt-6 flex gap-4 overflow-x-auto pb-3 pt-1 no-scrollbar -mx-5 px-5 items-start">
          {/* 1. Área Pix e Transferir */}
          <button
            id="btn-action-pix"
            onClick={() => onNavigate('AreaPix')}
            className="flex flex-col items-center gap-2 shrink-0 group cursor-pointer"
          >
            <div className="w-16 h-16 rounded-full bg-neutral-100 group-hover:bg-neutral-200 group-active:scale-95 flex items-center justify-center transition-all">
              {/* Authentic Pix 4-diamond shape */}
              <div className="grid grid-cols-2 gap-0.5 rotate-45">
                <div className="w-2 h-2 rounded-[2px] bg-neutral-900" />
                <div className="w-2 h-2 rounded-[2px] bg-neutral-900" />
                <div className="w-2 h-2 rounded-[2px] bg-neutral-900" />
                <div className="w-2 h-2 rounded-[2px] bg-neutral-900" />
              </div>
            </div>
            <span className="text-[11px] sm:text-xs font-medium text-neutral-800 text-center max-w-[76px] leading-tight">
              Área Pix e Transferir
            </span>
          </button>

          {/* 2. Tap to Pay no iPhone */}
          <button
            id="btn-action-taptopay"
            onClick={() => setShowCobrarModal(true)}
            className="flex flex-col items-center gap-2 shrink-0 group cursor-pointer relative"
          >
            <div className="w-16 h-16 rounded-full bg-neutral-100 group-hover:bg-neutral-200 group-active:scale-95 flex items-center justify-center transition-all relative">
              <Smartphone className="w-6 h-6 text-neutral-900" />
              <span className="absolute -bottom-1 bg-[#5f259f] text-white text-[9px] font-bold px-1.5 py-0.2 rounded-full shadow-2xs leading-tight">
                Na hora
              </span>
            </div>
            <span className="text-[11px] sm:text-xs font-medium text-neutral-800 text-center max-w-[78px] leading-tight">
              Tap to Pay no iPhone
            </span>
          </button>

          {/* 3. Cobrar com link */}
          <button
            id="btn-action-cobrar-link"
            onClick={() => setShowCobrarModal(true)}
            className="flex flex-col items-center gap-2 shrink-0 group cursor-pointer relative"
          >
            <div className="w-16 h-16 rounded-full bg-neutral-100 group-hover:bg-neutral-200 group-active:scale-95 flex items-center justify-center transition-all relative">
              <Link2 className="w-6 h-6 text-neutral-900" />
              <span className="absolute -bottom-1 bg-[#5f259f] text-white text-[9px] font-bold px-1.5 py-0.2 rounded-full shadow-2xs leading-tight">
                Na hora
              </span>
            </div>
            <span className="text-[11px] sm:text-xs font-medium text-neutral-800 text-center max-w-[76px] leading-tight">
              Cobrar com link
            </span>
          </button>

          {/* 4. Caixinhas PJ */}
          <button
            id="btn-action-caixinhas"
            onClick={() => {
              setToastMessage("Caixinhas PJ: rendendo a 100% do CDI");
              setTimeout(() => setToastMessage(null), 2500);
            }}
            className="flex flex-col items-center gap-2 shrink-0 group cursor-pointer"
          >
            <div className="w-16 h-16 rounded-full bg-neutral-100 group-hover:bg-neutral-200 group-active:scale-95 flex items-center justify-center transition-all">
              <Lock className="w-6 h-6 text-neutral-900" />
            </div>
            <span className="text-[11px] sm:text-xs font-medium text-neutral-800 text-center max-w-[76px] leading-tight">
              Caixinhas PJ
            </span>
          </button>

          {/* 5. Pagar */}
          <button
            id="btn-action-pay"
            onClick={() => onNavigate('PaymentOptions')}
            className="flex flex-col items-center gap-2 shrink-0 group cursor-pointer"
          >
            <div className="w-16 h-16 rounded-full bg-neutral-100 group-hover:bg-neutral-200 group-active:scale-95 flex items-center justify-center transition-all">
              <Barcode className="w-6 h-6 text-neutral-900" />
            </div>
            <span className="text-[11px] sm:text-xs font-medium text-neutral-800 text-center max-w-[76px] leading-tight">
              Pagar
            </span>
          </button>

          {/* 6. Extrato */}
          <button
            id="btn-action-statement"
            onClick={() => onNavigate('Extrato')}
            className="flex flex-col items-center gap-2 shrink-0 group cursor-pointer"
          >
            <div className="w-16 h-16 rounded-full bg-neutral-100 group-hover:bg-neutral-200 group-active:scale-95 flex items-center justify-center transition-all">
              <ReceiptText className="w-6 h-6 text-neutral-900" />
            </div>
            <span className="text-[11px] sm:text-xs font-medium text-neutral-800 text-center max-w-[76px] leading-tight">
              Extrato
            </span>
          </button>
        </div>
      </div>

      {/* Tap to Pay Promo Banner (Faithful to Screenshot) */}
      <div className="px-5 py-2">
        <div 
          onClick={() => setShowCobrarModal(true)}
          className="bg-neutral-100 rounded-2xl p-4 flex flex-col justify-between cursor-pointer hover:bg-neutral-200/80 transition-colors shadow-2xs"
        >
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs sm:text-[13px] text-neutral-800 leading-snug flex-1">
              <span className="font-bold text-neutral-950">Tap to Pay:</span> venda com a menor taxa e dinheiro na hora.
            </p>
            {/* Visual Icon Badge matching Screenshot */}
            <div className="w-10 h-10 rounded-2xl bg-purple-100 flex items-center justify-center shrink-0 border border-purple-200/60 shadow-2xs">
              <div className="w-6 h-6 rounded-full bg-emerald-400 flex items-center justify-center text-neutral-950 font-black text-[11px]">
                $
              </div>
            </div>
          </div>

          {/* Carousel dots indicator */}
          <div className="flex items-center justify-center gap-1.5 mt-3">
            <span className="w-1.5 h-1.5 rounded-full bg-neutral-900" />
            <span className="w-1.5 h-1.5 rounded-full bg-neutral-300" />
          </div>
        </div>
      </div>

      {/* Meus Cartões PJ Section */}
      <div className="px-5 py-2">
        <div 
          onClick={() => {
            setToastMessage("Meus cartões PJ ativos");
            setTimeout(() => setToastMessage(null), 2000);
          }}
          className="bg-neutral-100 hover:bg-neutral-200/80 active:bg-neutral-200 rounded-2xl p-4 flex items-center justify-between cursor-pointer transition-colors"
        >
          <div className="flex items-center gap-3">
            <Smartphone className="w-5 h-5 text-neutral-800" />
            <span className="text-xs sm:text-sm font-semibold text-neutral-900">Meus cartões PJ</span>
          </div>
          <ChevronRight className="w-4 h-4 text-neutral-400" />
        </div>
      </div>

      {/* Recent Activity / Extrato Section */}
      <div id="recent-activity-section" className="px-5 pt-3">
        <div className="flex items-center justify-between mb-3">
          <div 
            onClick={() => onNavigate('Extrato')}
            className="flex items-center gap-1 cursor-pointer hover:opacity-80 transition-opacity"
            title="Abrir extrato completo"
          >
            <h3 className="text-sm font-bold text-neutral-900">Histórico de Transações</h3>
            <ChevronRight className="w-4 h-4 text-neutral-400" />
          </div>
          <button 
            onClick={() => onNavigate('Extrato')}
            className="text-xs text-[#5f259f] font-semibold hover:underline cursor-pointer"
          >
            Ver tudo
          </button>
        </div>

        <div className="space-y-2.5">
          {appData.transactions.slice(0, 5).map((tx, idx) => {
            const isNegative = tx.amount < 0;
            const isBill = tx.type === 'bill_payment' || tx.title?.toLowerCase().includes('boleto') || tx.subtitle?.toLowerCase().includes('boleto');
            return (
              <div
                key={tx.id || idx}
                onClick={() => onNavigate('Extrato')}
                className="flex items-center justify-between p-3 rounded-2xl hover:bg-neutral-50 active:bg-neutral-100 border border-neutral-100 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1 mr-2">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                    isBill ? 'bg-purple-50 text-[#5f259f]' : isNegative ? 'bg-neutral-100 text-neutral-600' : 'bg-emerald-50 text-emerald-600'
                  }`}>
                    {isBill ? <Barcode className="w-4 h-4" /> : isNegative ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownLeft className="w-4 h-4" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-neutral-900 truncate">{tx.title}</p>
                    <p className="text-[11px] text-neutral-500 truncate">{tx.subtitle}</p>
                    <p className="text-[10px] text-neutral-400 mt-0.5">{tx.date}</p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className={`text-xs font-bold ${
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

      {/* Floating Bottom Navigation Bar (Dock matching Screenshot) */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 bg-white/95 backdrop-blur-md rounded-full px-2 py-1.5 shadow-2xl border border-neutral-200/60 flex items-center gap-1 sm:gap-2">
        {/* Dia a dia (Selected) */}
        <button
          type="button"
          onClick={() => setActiveBottomTab('dia')}
          className={`px-3.5 py-1.5 rounded-full flex flex-col items-center gap-0.5 transition-all cursor-pointer ${
            activeBottomTab === 'dia'
              ? 'bg-purple-100 text-[#5f259f] font-bold'
              : 'text-neutral-500 font-medium hover:text-neutral-900'
          }`}
        >
          <ArrowUpDown className="w-4 h-4" />
          <span className="text-[10px] leading-none">Dia a dia</span>
        </button>

        {/* Cobranças */}
        <button
          type="button"
          onClick={() => {
            setActiveBottomTab('cobrancas');
            setShowCobrarModal(true);
          }}
          className={`px-3.5 py-1.5 rounded-full flex flex-col items-center gap-0.5 transition-all cursor-pointer ${
            activeBottomTab === 'cobrancas'
              ? 'bg-purple-100 text-[#5f259f] font-bold'
              : 'text-neutral-500 font-medium hover:text-neutral-900'
          }`}
        >
          <div className="relative">
            <MessageSquare className="w-4 h-4" />
            <DollarSign className="w-2.5 h-2.5 absolute top-0.5 left-0.5 text-neutral-600" />
          </div>
          <span className="text-[10px] leading-none">Cobranças</span>
        </button>

        {/* Gestão */}
        <button
          type="button"
          onClick={() => {
            setActiveBottomTab('gestao');
            onNavigate('Extrato');
          }}
          className={`px-3.5 py-1.5 rounded-full flex flex-col items-center gap-0.5 transition-all cursor-pointer ${
            activeBottomTab === 'gestao'
              ? 'bg-purple-100 text-[#5f259f] font-bold'
              : 'text-neutral-500 font-medium hover:text-neutral-900'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span className="text-[10px] leading-none">Gestão</span>
        </button>
      </div>

      {/* User Profile / Store Drawer Modal - 100% Faithful to IMG_7625.png */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 backdrop-blur-[2px]">
          <motion.div
            initial={{ opacity: 0, y: "100%" }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className="bg-white rounded-t-[28px] sm:rounded-3xl w-full max-w-md pt-5 pb-6 px-6 text-neutral-900 shadow-2xl overflow-y-auto max-h-[92vh]"
          >
            {/* Top Icons Bar: X on left, Monitor, Hexagon, Bell with purple dot on right */}
            <div className="flex items-center justify-between pb-3">
              <button
                id="btn-close-profile-modal"
                onClick={() => setShowProfileModal(false)}
                className="w-10 h-10 -ml-2 rounded-full hover:bg-neutral-100 active:scale-95 flex items-center justify-center text-neutral-900 transition-all cursor-pointer"
                aria-label="Fechar"
              >
                <X className="w-6 h-6 stroke-[2]" />
              </button>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => alert("Modo apresentação / tela externa")}
                  className="w-9 h-9 rounded-full hover:bg-neutral-100 flex items-center justify-center text-neutral-800 transition-colors cursor-pointer"
                  aria-label="Modo monitor"
                >
                  <Monitor className="w-5 h-5 stroke-[1.8]" />
                </button>

                <button
                  onClick={() => {
                    setShowProfileModal(false);
                    onOpenEditModal();
                  }}
                  className="w-9 h-9 rounded-full hover:bg-neutral-100 flex items-center justify-center text-neutral-800 transition-colors cursor-pointer"
                  title="Painel de Edição e Configurações"
                  aria-label="Configurações"
                >
                  <Hexagon className="w-5 h-5 stroke-[1.8]" />
                </button>

                <button
                  onClick={() => {
                    setToastMessage("Notificações Nu Empresas ativadas");
                    setTimeout(() => setToastMessage(null), 2000);
                  }}
                  className="relative w-9 h-9 rounded-full hover:bg-neutral-100 flex items-center justify-center text-neutral-800 transition-colors cursor-pointer"
                  aria-label="Notificações"
                >
                  <Bell className="w-5 h-5 stroke-[1.8]" />
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#5f259f]" />
                </button>
              </div>
            </div>

            {/* Profile / Business Info Row */}
            <div className="flex items-center gap-3.5 py-3">
              <div 
                onClick={() => {
                  setShowProfileModal(false);
                  onOpenEditModal();
                }}
                className="w-12 h-12 rounded-2xl bg-neutral-100 border border-neutral-200/80 flex items-center justify-center relative cursor-pointer group shrink-0"
                title="Toque para editar dados da empresa"
              >
                <Building2 className="w-6 h-6 text-neutral-700" />
                <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-white shadow-2xs border border-neutral-200 flex items-center justify-center">
                  <Pencil className="w-2.5 h-2.5 text-neutral-700" />
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-bold text-base sm:text-[17px] text-neutral-900 truncate">
                  {appData.companyName || 'Nu Empresas PJ'}
                </h3>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Agência {appData.agency || '0001'} • Conta {appData.accountNumber || '79827260-9'}{' '}
                  <span 
                    onClick={handleCopyAccountInfo}
                    className="text-[#5f259f] font-semibold cursor-pointer hover:underline ml-1"
                  >
                    Mais
                  </span>
                </p>
              </div>
            </div>

            {/* Acesso Compartilhado PJ Button */}
            <div 
              onClick={() => alert("Acesso Compartilhado PJ: gerencie permissões para sócios e colaboradores.")}
              className="mt-3 bg-neutral-100/90 hover:bg-neutral-200/70 active:bg-neutral-200 rounded-2xl p-4 flex items-center gap-3.5 cursor-pointer transition-colors"
            >
              <Users className="w-5 h-5 text-neutral-800" />
              <span className="text-xs sm:text-sm font-semibold text-neutral-900">Acesso Compartilhado PJ</span>
            </div>

            {/* Outras Contas Pessoais Section */}
            <div className="pt-6">
              <p className="text-neutral-500 text-xs font-medium mb-2">Outras contas pessoais</p>

              {/* Item 1: Conta Pessoal com Nome do Usuário Dinâmico */}
              <div 
                onClick={() => alert("Alternar para conta pessoal")}
                className="flex items-center justify-between py-3 cursor-pointer hover:opacity-80 active:opacity-60 transition-opacity border-b border-neutral-100"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-700 shrink-0">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-neutral-900 leading-snug">
                      {appData.userName || 'Minha Conta'}
                    </p>
                    <p className="text-xs text-neutral-500">Conta pessoal</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-neutral-400" />
              </div>

              {/* Item 2: Trocar conta */}
              <div 
                onClick={() => alert("Trocar conta: selecione contas de outros países")}
                className="flex items-center justify-between py-3 cursor-pointer hover:opacity-80 active:opacity-60 transition-opacity border-b border-neutral-100"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-full bg-purple-50 flex items-center justify-center text-[#5f259f] shrink-0">
                    <RotateCcw className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-neutral-900 leading-snug">Trocar conta</p>
                    <p className="text-xs text-neutral-500">Contas de outros países</p>
                  </div>
                </div>
              </div>

              {/* Item 3: Sair do aplicativo */}
              <div 
                onClick={() => {
                  setShowProfileModal(false);
                  onNavigate('Login');
                }}
                className="flex items-center justify-between py-3 cursor-pointer hover:opacity-80 active:opacity-60 transition-opacity"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-800 shrink-0">
                    <CornerUpLeft className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-neutral-900 leading-snug">Sair do aplicativo</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer: Avalie esta tela */}
            <div 
              onClick={() => {
                setToastMessage("Obrigado pela sua avaliação!");
                setTimeout(() => setToastMessage(null), 2000);
              }}
              className="mt-8 mb-2 flex items-center justify-center gap-1.5 cursor-pointer hover:opacity-80 transition-opacity"
            >
              <Heart className="w-4 h-4 text-[#5f259f] fill-[#5f259f]/20" />
              <span className="text-xs font-bold text-[#5f259f]">Avalie esta tela</span>
            </div>
          </motion.div>
        </div>
      )}

      {/* Modal Cobrar / Tap to Pay / Link de Pagamento */}
      {showCobrarModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 backdrop-blur-[2px]">
          <motion.div
            initial={{ opacity: 0, y: "100%" }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className="bg-white rounded-t-[28px] sm:rounded-3xl w-full max-w-md pt-5 pb-6 px-6 text-neutral-900 shadow-2xl overflow-y-auto max-h-[92vh]"
          >
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-purple-100 text-[#5f259f] flex items-center justify-center">
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
                    <div className="w-7 h-7 bg-[#5f259f] rounded-lg text-white font-black text-[10px] flex items-center justify-center shadow-md">
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
                  Simule um cliente pagando este Pix. A notificação bancária descerá do topo com o som oficial de confirmação.
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
