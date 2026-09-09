import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Save, 
  RotateCcw, 
  User, 
  DollarSign, 
  Bell, 
  Send, 
  Receipt, 
  Users, 
  Sliders, 
  Plus, 
  Trash2, 
  Check,
  Edit3,
  Zap,
  ArrowDownLeft,
  Volume2,
  Clock,
  Smartphone,
  CheckCircle2,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { AppCustomData, Transaction, Contact } from '../types';
import { INITIAL_CONTACTS } from '../data/mockData';
import { parseCurrency, formatCurrencyBRL } from '../utils/currencyUtils';
import { 
  getNativeNotificationPermission, 
  requestNativeNotificationPermission, 
  NotificationPermissionState 
} from '../utils/nativeNotification';

interface EditMenuModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: AppCustomData;
  onSave: (newData: AppCustomData) => void;
  onReset: () => void;
  isInlineEditMode: boolean;
  onToggleInlineEditMode: (enabled: boolean) => void;
  onTriggerSimulatedPix?: (
    senderName?: string,
    amount?: number,
    bank?: string,
    message?: string,
    delaySeconds?: number
  ) => void;
}

export const EditMenuModal: React.FC<EditMenuModalProps> = ({
  isOpen,
  onClose,
  data,
  onSave,
  onReset,
  isInlineEditMode,
  onToggleInlineEditMode,
  onTriggerSimulatedPix,
}) => {
  const [formData, setFormData] = useState<AppCustomData>({ ...data });
  const [balanceString, setBalanceString] = useState<string>(
    data.balance === 0 ? '' : data.balance.toFixed(2).replace('.', ',')
  );
  const [simulatedPixAmountString, setSimulatedPixAmountString] = useState<string>(
    data.simulatedPixAmount === 0 ? '' : (data.simulatedPixAmount || 0).toFixed(2).replace('.', ',')
  );
  const [defaultTransferAmountString, setDefaultTransferAmountString] = useState<string>(
    data.defaultTransferAmount === 0 ? '' : (data.defaultTransferAmount || 0).toFixed(2).replace('.', ',')
  );
  const [activeTab, setActiveTab] = useState<
    'user' | 'balance' | 'reminder' | 'transfer' | 'history' | 'contacts' | 'login' | 'simulate_pix'
  >('simulate_pix');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [triggerStatus, setTriggerStatus] = useState<string | null>(null);
  const [nativePerm, setNativePerm] = useState<NotificationPermissionState>(getNativeNotificationPermission());
  const [customDelay, setCustomDelay] = useState<string>('15');

  // Sync with prop if opened
  React.useEffect(() => {
    if (isOpen) {
      setFormData({ ...data });
      setBalanceString(data.balance === 0 ? '' : data.balance.toFixed(2).replace('.', ','));
      setSimulatedPixAmountString(
        data.simulatedPixAmount === 0 ? '' : (data.simulatedPixAmount || 0).toFixed(2).replace('.', ',')
      );
      setDefaultTransferAmountString(
        data.defaultTransferAmount === 0 ? '' : (data.defaultTransferAmount || 0).toFixed(2).replace('.', ',')
      );
      setNativePerm(getNativeNotificationPermission());
      setSavedSuccess(false);
    }
  }, [isOpen, data]);

  const handleRequestNativePermission = async () => {
    const res = await requestNativeNotificationPermission();
    setNativePerm(res);
  };

  if (!isOpen) return null;

  const handleChange = <K extends keyof AppCustomData>(key: K, value: AppCustomData[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    onSave(formData);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 600);
  };

  // Currency input handlers with flexible typing
  const handleBalanceChange = (val: string) => {
    setBalanceString(val);
    const parsed = parseCurrency(val);
    handleChange('balance', parsed);
  };

  const handleQuickAddBalance = (increment: number) => {
    const current = parseCurrency(balanceString);
    const next = current + increment;
    const formatted = next.toFixed(2).replace('.', ',');
    setBalanceString(formatted);
    handleChange('balance', next);
  };

  const handleClearBalance = () => {
    setBalanceString('');
    handleChange('balance', 0);
  };

  const handleSimulatedPixAmountChange = (val: string) => {
    setSimulatedPixAmountString(val);
    const parsed = parseCurrency(val);
    handleChange('simulatedPixAmount', parsed);
  };

  const handleDefaultTransferAmountChange = (val: string) => {
    setDefaultTransferAmountString(val);
    const parsed = parseCurrency(val);
    handleChange('defaultTransferAmount', parsed);
  };

  // Transaction editing helpers
  const handleUpdateTx = (index: number, field: keyof Transaction, val: any) => {
    const updated = [...formData.transactions];
    updated[index] = { ...updated[index], [field]: val };
    setFormData((prev) => ({ ...prev, transactions: updated }));
  };

  const handleAddTx = () => {
    const newTx: Transaction = {
      id: 'tx-' + Date.now(),
      type: 'pix_receive',
      title: 'Transferência recebida',
      subtitle: 'NOVO CLIENTE - Pix',
      amount: 250.00,
      date: 'Hoje, ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    };
    setFormData((prev) => ({ ...prev, transactions: [newTx, ...prev.transactions] }));
  };

  const handleDeleteTx = (index: number) => {
    const updated = formData.transactions.filter((_, i) => i !== index);
    setFormData((prev) => ({ ...prev, transactions: updated }));
  };

  // Contact editing helpers
  const handleAddContact = () => {
    const newContact: Contact = {
      id: 'contact-' + Date.now(),
      name: '',
      initials: '',
      document: '',
      institution: 'Nu Pagamentos S.A.',
      accountType: 'Conta Corrente PJ',
      agency: '0001',
      account: '',
      pixKey: ''
    };
    setFormData((prev) => ({ ...prev, contacts: [newContact, ...prev.contacts] }));
  };

  const handleDeleteContact = (index: number) => {
    const updated = formData.contacts.filter((_, i) => i !== index);
    setFormData((prev) => ({ ...prev, contacts: updated }));
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
      style={{ 
        paddingTop: 'max(env(safe-area-inset-top, 0px), 1.5rem)',
        paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 1rem)' 
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-neutral-900 border border-neutral-200"
      >
        {/* Header */}
        <div className="bg-[#5f259f] text-white px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center font-black text-white">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold flex items-center gap-2">
                Menu de Edição Geral
                <span className="text-[10px] bg-purple-950/80 text-purple-200 px-2 py-0.5 rounded-full border border-purple-400/30">
                  Modo Admin
                </span>
              </h2>
              <p className="text-xs text-purple-200">
                Edite todos os nomes, valores, números e textos do app
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/15 hover:bg-white/25 active:scale-95 flex items-center justify-center text-white cursor-pointer transition-all"
            aria-label="Fechar editor"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Inline Mode Switch Banner */}
        <div className="bg-purple-50 border-b border-purple-100 px-6 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Edit3 className="w-4 h-4 text-[#820AD1]" />
            <span className="text-xs font-bold text-purple-950">
              Modo de Edição Direta nas Telas:
            </span>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={isInlineEditMode}
            onClick={() => onToggleInlineEditMode(!isInlineEditMode)}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              isInlineEditMode ? 'bg-[#820AD1]' : 'bg-neutral-300'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                isInlineEditMode ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-1.5 p-3 px-6 bg-neutral-50 border-b border-neutral-200 overflow-x-auto no-scrollbar shrink-0">
          {[
            { id: 'simulate_pix', label: '🔔 Simular Pix Recebido', icon: Zap },
            { id: 'balance', label: 'Saldos & Valores', icon: DollarSign },
            { id: 'user', label: 'Usuário & PJ', icon: User },
            { id: 'transfer', label: 'Pix & Destinatário', icon: Send },
            { id: 'history', label: 'Extrato Transações', icon: Receipt },
            { id: 'reminder', label: 'Lembretes & Avisos', icon: Bell },
            { id: 'contacts', label: 'Agenda Pix', icon: Users },
            { id: 'login', label: 'Tela Login', icon: Sliders },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-all cursor-pointer ${
                  active
                    ? 'bg-[#820AD1] text-white shadow-xs'
                    : 'bg-white text-neutral-600 hover:bg-neutral-200/70 border border-neutral-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content Body */}
        <div className="p-6 flex-1 overflow-y-auto space-y-4 text-xs sm:text-sm">
          {/* TAB: SIMULAR PIX RECEBIDO */}
          {activeTab === 'simulate_pix' && (
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-emerald-500/10 via-purple-500/10 to-indigo-500/10 border border-emerald-500/30 p-4 rounded-2xl">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-6 h-6 rounded-lg bg-[#820AD1] text-white flex items-center justify-center font-black text-[10px]">
                    nu
                  </div>
                  <h3 className="font-bold text-neutral-900 text-sm">
                    Simulação de Notificação de Pix Recebido
                  </h3>
                </div>
                <p className="text-[11px] text-neutral-600">
                  Configure os dados do Pix recebido. Ao disparar, a notificação com som desce do topo da tela ("aba do celular") exatamente como no aplicativo real.
                </p>
              </div>

              {/* Background System Notification Permission Card */}
              <div className={`p-4 rounded-2xl border transition-all ${
                nativePerm === 'granted' 
                  ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950' 
                  : 'bg-purple-50/80 border-purple-200 text-purple-950'
              }`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                      nativePerm === 'granted' ? 'bg-emerald-500 text-white' : 'bg-[#820AD1] text-white'
                    }`}>
                      <Smartphone className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-xs sm:text-sm">
                          Notificação na Barra de Status (Segundo Plano)
                        </h4>
                        {nativePerm === 'granted' ? (
                          <span className="bg-emerald-200 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Ativada no Sistema
                          </span>
                        ) : (
                          <span className="bg-purple-200 text-purple-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                            Requer Permissão
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-neutral-600 mt-1 leading-snug">
                        {nativePerm === 'granted'
                          ? 'Perfeito! As notificações do Pix aparecerão diretamente na barra de notificações do seu celular ou computador, mesmo com a tela minimizada.'
                          : 'Clique abaixo para permitir que o navegador envie notificações nativas para a barra de status do seu celular/PC quando o app estiver em segundo plano.'}
                      </p>
                    </div>
                  </div>

                  {nativePerm !== 'granted' && (
                    <button
                      type="button"
                      onClick={handleRequestNativePermission}
                      className="shrink-0 bg-[#820AD1] hover:bg-[#6c07af] active:scale-95 text-white font-bold text-xs py-2 px-3 rounded-xl transition-all shadow-xs cursor-pointer"
                    >
                      Ativar no Aparelho
                    </button>
                  )}
                </div>
              </div>

              {/* Trigger Actions with Background Delay Presets */}
              <div className="bg-neutral-900 text-white p-4 rounded-2xl space-y-3 shadow-md">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs flex items-center gap-1.5 text-emerald-400">
                    <Zap className="w-4 h-4 fill-emerald-400" /> Disparar Notificação Pix
                  </span>
                  {triggerStatus && (
                    <span className="text-[11px] text-amber-300 font-semibold animate-pulse">
                      {triggerStatus}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (onTriggerSimulatedPix) {
                        onTriggerSimulatedPix(
                          formData.simulatedPixSender,
                          formData.simulatedPixAmount,
                          formData.simulatedPixBank,
                          formData.simulatedPixMessage,
                          0
                        );
                        setTriggerStatus('Disparado agora!');
                        setTimeout(() => {
                          setTriggerStatus(null);
                          onClose();
                        }, 400);
                      }
                    }}
                    className="bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-neutral-950 font-bold py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all text-xs cursor-pointer shadow-xs"
                  >
                    <Zap className="w-3.5 h-3.5" /> Agora (0s)
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (onTriggerSimulatedPix) {
                        onTriggerSimulatedPix(
                          formData.simulatedPixSender,
                          formData.simulatedPixAmount,
                          formData.simulatedPixBank,
                          formData.simulatedPixMessage,
                          5
                        );
                        setTriggerStatus('Em 5 segundos...');
                        setTimeout(() => {
                          setTriggerStatus(null);
                          onClose();
                        }, 500);
                      }
                    }}
                    className="bg-purple-600 hover:bg-purple-700 active:scale-95 text-white font-bold py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all text-xs cursor-pointer shadow-xs"
                  >
                    <Clock className="w-3.5 h-3.5" /> Em 5 segundos
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (onTriggerSimulatedPix) {
                        onTriggerSimulatedPix(
                          formData.simulatedPixSender,
                          formData.simulatedPixAmount,
                          formData.simulatedPixBank,
                          formData.simulatedPixMessage,
                          15
                        );
                        setTriggerStatus('Em 15 segundos...');
                        setTimeout(() => {
                          setTriggerStatus(null);
                          onClose();
                        }, 500);
                      }
                    }}
                    className="bg-neutral-800 hover:bg-neutral-700 active:scale-95 text-neutral-200 font-semibold py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all text-xs cursor-pointer border border-neutral-700"
                  >
                    <Clock className="w-3.5 h-3.5" /> Em 15 segundos
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (onTriggerSimulatedPix) {
                        onTriggerSimulatedPix(
                          formData.simulatedPixSender,
                          formData.simulatedPixAmount,
                          formData.simulatedPixBank,
                          formData.simulatedPixMessage,
                          30
                        );
                        setTriggerStatus('Em 30 segundos...');
                        setTimeout(() => {
                          setTriggerStatus(null);
                          onClose();
                        }, 500);
                      }
                    }}
                    className="bg-neutral-800 hover:bg-neutral-700 active:scale-95 text-neutral-200 font-semibold py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all text-xs cursor-pointer border border-neutral-700"
                  >
                    <Clock className="w-3.5 h-3.5" /> Em 30 segundos
                  </button>
                </div>

                {/* Custom Delay Input */}
                <div className="pt-1 flex items-center gap-2">
                  <div className="flex items-center gap-1.5 bg-neutral-800 border border-neutral-700 rounded-xl px-2.5 py-1.5 text-xs text-neutral-300 flex-1">
                    <span className="text-[11px] text-neutral-400">Tempo customizado:</span>
                    <input
                      type="number"
                      min="1"
                      max="300"
                      value={customDelay}
                      onChange={(e) => setCustomDelay(e.target.value)}
                      className="w-14 bg-neutral-900 border border-neutral-600 rounded px-1.5 py-0.5 text-white text-center font-bold focus:outline-none focus:border-purple-400"
                    />
                    <span className="text-[11px] text-neutral-400">segundos</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const delayNum = parseInt(customDelay, 10);
                      const finalDelay = isNaN(delayNum) || delayNum < 1 ? 10 : delayNum;
                      if (onTriggerSimulatedPix) {
                        onTriggerSimulatedPix(
                          formData.simulatedPixSender,
                          formData.simulatedPixAmount,
                          formData.simulatedPixBank,
                          formData.simulatedPixMessage,
                          finalDelay
                        );
                        setTriggerStatus(`Em ${finalDelay} segundos...`);
                        setTimeout(() => {
                          setTriggerStatus(null);
                          onClose();
                        }, 500);
                      }
                    }}
                    className="bg-purple-700 hover:bg-purple-600 active:scale-95 text-white font-bold py-2 px-3 rounded-xl text-xs transition-all cursor-pointer shrink-0"
                  >
                    Agendar
                  </button>
                </div>

                <div className="bg-neutral-800/80 rounded-xl p-2.5 text-[11px] text-neutral-300 flex items-start gap-2 border border-neutral-700/60">
                  <span className="text-sm">💡</span>
                  <p className="leading-tight">
                    <strong>Como testar em segundo plano:</strong> Selecione 15s ou 30s, clique no botão e imediatamente minimize o app ou bloqueie a tela do celular. A notificação cairá diretamente na barra de notificações do seu aparelho!
                  </p>
                </div>
              </div>

              {/* Form Settings */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="text-xs font-bold text-neutral-700">Preenchimento Rápido com Comprovantes:</span>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        handleChange('simulatedPixAmount', 35.0);
                        setSimulatedPixAmountString('35,00');
                        handleChange('simulatedPixSender', 'Josiane M Moreira Neves');
                        handleChange('simulatedPixBank', 'BANCO DO BRASIL S.A.');
                        handleChange('simulatedPixMessage', 'Pix Banco do Brasil');
                      }}
                      className="text-[10px] font-bold text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded-lg border border-blue-200 cursor-pointer"
                    >
                      <span>BB (R$ 35,00)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        handleChange('simulatedPixAmount', 1200.0);
                        setSimulatedPixAmountString('1.200,00');
                        handleChange('simulatedPixSender', 'Elicleia Solange do Nascimento');
                        handleChange('simulatedPixBank', 'Nu Pagamentos S.A.');
                        handleChange('simulatedPixMessage', 'Pix Nubank');
                      }}
                      className="text-[10px] font-bold text-purple-700 hover:text-purple-900 bg-purple-50 hover:bg-purple-100 px-2 py-1 rounded-lg border border-purple-200 cursor-pointer"
                    >
                      <span>Nubank (R$ 1.200,00)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        handleChange('simulatedPixAmount', 1225.0);
                        setSimulatedPixAmountString('1.225,00');
                        handleChange('simulatedPixSender', 'Uclebson Comercio De Eletrodomesticos Ltda');
                        handleChange('simulatedPixBank', 'BANCO COOPERATIVO SICREDI S.A.');
                        handleChange('simulatedPixMessage', 'Pix Sicredi');
                      }}
                      className="text-[10px] font-bold text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 px-2 py-1 rounded-lg border border-emerald-200 cursor-pointer"
                    >
                      <span>Sicredi (R$ 1.225,00)</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-neutral-700 block mb-1">
                      Valor do Pix Recebido (R$)
                    </label>
                    <div className="flex items-center bg-white border border-neutral-300 rounded-xl px-3 py-2 focus-within:border-[#820AD1]">
                      <span className="font-bold text-emerald-600 mr-2">R$</span>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={simulatedPixAmountString}
                        placeholder="0,00"
                        onFocus={(e) => e.target.select()}
                        onChange={(e) => handleSimulatedPixAmountChange(e.target.value)}
                        className="w-full font-bold text-neutral-900 focus:outline-none"
                      />
                      {simulatedPixAmountString !== '' && (
                        <button
                          type="button"
                          onClick={() => {
                            setSimulatedPixAmountString('');
                            handleChange('simulatedPixAmount', 0);
                          }}
                          className="p-1 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded-full transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="font-semibold text-neutral-700 block mb-1">
                      Nome de Quem Pagou (Remetente)
                    </label>
                    <input
                      type="text"
                      value={formData.simulatedPixSender}
                      onChange={(e) => handleChange('simulatedPixSender', e.target.value)}
                      className="w-full bg-white border border-neutral-300 rounded-xl px-3 py-2 font-bold focus:outline-none focus:border-[#820AD1]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-neutral-700 block mb-1">
                      Instituição / Banco Emissor
                    </label>
                    <input
                      type="text"
                      value={formData.simulatedPixBank}
                      onChange={(e) => handleChange('simulatedPixBank', e.target.value)}
                      className="w-full bg-white border border-neutral-300 rounded-xl px-3 py-2 focus:outline-none focus:border-[#820AD1]"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-neutral-700 block mb-1">
                      Mensagem / Descrição Opcional
                    </label>
                    <input
                      type="text"
                      value={formData.simulatedPixMessage}
                      onChange={(e) => handleChange('simulatedPixMessage', e.target.value)}
                      placeholder="Ex: Pagamento referente a serviços"
                      className="w-full bg-white border border-neutral-300 rounded-xl px-3 py-2 focus:outline-none focus:border-[#820AD1]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-xl border border-neutral-200">
                    <div className="flex items-center gap-2">
                      <Volume2 className="w-4 h-4 text-purple-600" />
                      <span className="font-semibold text-neutral-800 text-xs">Som de Notificação</span>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={formData.pixNotificationSound}
                      onClick={() => handleChange('pixNotificationSound', !formData.pixNotificationSound)}
                      className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        formData.pixNotificationSound ? 'bg-[#820AD1]' : 'bg-neutral-300'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                          formData.pixNotificationSound ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-xl border border-neutral-200">
                    <div className="flex items-center gap-2">
                      <ArrowDownLeft className="w-4 h-4 text-emerald-600" />
                      <span className="font-semibold text-neutral-800 text-xs">Auto-Creditar no Saldo</span>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={formData.pixAutoCreditBalance}
                      onClick={() => handleChange('pixAutoCreditBalance', !formData.pixAutoCreditBalance)}
                      className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        formData.pixAutoCreditBalance ? 'bg-[#820AD1]' : 'bg-neutral-300'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                          formData.pixAutoCreditBalance ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: SALDOS E VALORES */}
          {activeTab === 'balance' && (
            <div className="space-y-4">
              <div className="bg-purple-50/70 border border-purple-100 p-4 rounded-2xl">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-bold text-neutral-800 text-sm">
                    Saldo da Conta (R$)
                  </label>
                  <span className="text-xs font-bold text-[#820AD1] bg-white px-2 py-0.5 rounded-md border border-purple-100">
                    {formatCurrencyBRL(formData.balance)}
                  </span>
                </div>
                <div className="flex items-center bg-white border-2 border-purple-200 focus-within:border-[#820AD1] rounded-xl px-3 py-2.5 transition-colors">
                  <span className="font-bold text-purple-700 mr-2 text-base">R$</span>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={balanceString}
                    placeholder="0,00"
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => handleBalanceChange(e.target.value)}
                    className="w-full text-lg font-bold text-neutral-900 focus:outline-none placeholder:text-neutral-300"
                  />
                  {balanceString !== '' && (
                    <button
                      type="button"
                      onClick={handleClearBalance}
                      className="p-1 rounded-full text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors shrink-0"
                      title="Limpar saldo"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Quick Add Buttons */}
                <div className="mt-3">
                  <p className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider mb-1.5">
                    Adicionar valor rápido:
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleQuickAddBalance(100)}
                      className="px-2.5 py-1 text-xs font-bold rounded-lg bg-white border border-purple-200 text-[#820AD1] hover:bg-purple-50 transition-colors cursor-pointer"
                    >
                      +R$ 100
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickAddBalance(500)}
                      className="px-2.5 py-1 text-xs font-bold rounded-lg bg-white border border-purple-200 text-[#820AD1] hover:bg-purple-50 transition-colors cursor-pointer"
                    >
                      +R$ 500
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickAddBalance(1000)}
                      className="px-2.5 py-1 text-xs font-bold rounded-lg bg-white border border-purple-200 text-[#820AD1] hover:bg-purple-50 transition-colors cursor-pointer"
                    >
                      +R$ 1.000
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickAddBalance(5000)}
                      className="px-2.5 py-1 text-xs font-bold rounded-lg bg-white border border-purple-200 text-[#820AD1] hover:bg-purple-50 transition-colors cursor-pointer"
                    >
                      +R$ 5.000
                    </button>
                    <button
                      type="button"
                      onClick={handleClearBalance}
                      className="px-2.5 py-1 text-xs font-bold rounded-lg bg-neutral-100 text-neutral-600 hover:bg-neutral-200 transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" /> Zerar
                    </button>
                  </div>
                </div>

                <p className="text-[11px] text-neutral-500 mt-2.5">
                  Este valor é exibido no topo da tela inicial e recalculado após transferências ou cobranças.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200">
                  <label className="font-semibold text-neutral-700 block mb-1">
                    Limite do Cartão PJ
                  </label>
                  <input
                    type="text"
                    value={formData.creditCardLimit}
                    onChange={(e) => handleChange('creditCardLimit', e.target.value)}
                    className="w-full bg-white border border-neutral-300 rounded-lg px-3 py-1.5 font-medium focus:outline-none focus:border-[#820AD1]"
                  />
                </div>

                <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200">
                  <label className="font-semibold text-neutral-700 block mb-1">
                    Crédito / Capital de Giro
                  </label>
                  <input
                    type="text"
                    value={formData.loanLimit}
                    onChange={(e) => handleChange('loanLimit', e.target.value)}
                    className="w-full bg-white border border-neutral-300 rounded-lg px-3 py-1.5 font-medium focus:outline-none focus:border-[#820AD1]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB: USUÁRIO E EMPRESA */}
          {activeTab === 'user' && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-neutral-700 block mb-1">Nome do Titular</label>
                  <input
                    type="text"
                    value={formData.userName}
                    onChange={(e) => handleChange('userName', e.target.value)}
                    className="w-full bg-white border border-neutral-300 rounded-xl px-3 py-2 focus:outline-none focus:border-[#820AD1]"
                  />
                </div>

                <div>
                  <label className="font-semibold text-neutral-700 block mb-1">Iniciais do Avatar</label>
                  <input
                    type="text"
                    maxLength={3}
                    value={formData.userInitials}
                    onChange={(e) => handleChange('userInitials', e.target.value.toUpperCase())}
                    className="w-full bg-white border border-neutral-300 rounded-xl px-3 py-2 font-bold uppercase focus:outline-none focus:border-[#820AD1]"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-neutral-700 block mb-1">Razão Social / Nome Fantasia (PJ)</label>
                <input
                  type="text"
                  value={formData.companyName}
                  onChange={(e) => handleChange('companyName', e.target.value)}
                  className="w-full bg-white border border-neutral-300 rounded-xl px-3 py-2 font-medium focus:outline-none focus:border-[#820AD1]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-neutral-700 block mb-1">CNPJ</label>
                  <input
                    type="text"
                    value={formData.cnpj}
                    onChange={(e) => handleChange('cnpj', e.target.value)}
                    className="w-full bg-white border border-neutral-300 rounded-xl px-3 py-2 focus:outline-none focus:border-[#820AD1]"
                  />
                </div>

                <div>
                  <label className="font-semibold text-neutral-700 block mb-1">Agência</label>
                  <input
                    type="text"
                    value={formData.agency}
                    onChange={(e) => handleChange('agency', e.target.value)}
                    className="w-full bg-white border border-neutral-300 rounded-xl px-3 py-2 focus:outline-none focus:border-[#820AD1]"
                  />
                </div>

                <div>
                  <label className="font-semibold text-neutral-700 block mb-1">Conta Corrente</label>
                  <input
                    type="text"
                    value={formData.accountNumber}
                    onChange={(e) => handleChange('accountNumber', e.target.value)}
                    className="w-full bg-white border border-neutral-300 rounded-xl px-3 py-2 focus:outline-none focus:border-[#820AD1]"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-neutral-700 block mb-1">Título da Seção de Saldo</label>
                <input
                  type="text"
                  value={formData.accountTitle}
                  onChange={(e) => handleChange('accountTitle', e.target.value)}
                  className="w-full bg-white border border-neutral-300 rounded-xl px-3 py-2 focus:outline-none focus:border-[#820AD1]"
                />
              </div>
            </div>
          )}

          {/* TAB: PIX & DESTINATÁRIO */}
          {activeTab === 'transfer' && (
            <div className="space-y-3">
              <div className="bg-purple-50/50 p-3.5 rounded-2xl border border-purple-100 mb-2">
                <p className="font-bold text-neutral-800 text-xs mb-1">Destinatário Padrão do Fluxo de Transferência</p>
                <p className="text-[11px] text-neutral-500">Configure os dados exibidos na tela de confirmação e recibo Pix.</p>
              </div>

              <div>
                <label className="font-semibold text-neutral-700 block mb-1">Nome Completo do Destinatário</label>
                <input
                  type="text"
                  value={formData.defaultRecipientName}
                  onChange={(e) => handleChange('defaultRecipientName', e.target.value)}
                  className="w-full bg-white border border-neutral-300 rounded-xl px-3 py-2 font-bold focus:outline-none focus:border-[#820AD1]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-neutral-700 block mb-1">Iniciais do Destinatário</label>
                  <input
                    type="text"
                    maxLength={3}
                    value={formData.defaultRecipientInitials}
                    onChange={(e) => handleChange('defaultRecipientInitials', e.target.value.toUpperCase())}
                    className="w-full bg-white border border-neutral-300 rounded-xl px-3 py-2 font-bold uppercase focus:outline-none focus:border-[#820AD1]"
                  />
                </div>

                <div>
                  <label className="font-semibold text-neutral-700 block mb-1">CPF/CNPJ Mascarado</label>
                  <input
                    type="text"
                    value={formData.defaultRecipientDoc}
                    onChange={(e) => handleChange('defaultRecipientDoc', e.target.value)}
                    className="w-full bg-white border border-neutral-300 rounded-xl px-3 py-2 focus:outline-none focus:border-[#820AD1]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-neutral-700 block mb-1">Instituição Bancária</label>
                  <input
                    type="text"
                    value={formData.defaultRecipientInstitution}
                    onChange={(e) => handleChange('defaultRecipientInstitution', e.target.value)}
                    className="w-full bg-white border border-neutral-300 rounded-xl px-3 py-2 focus:outline-none focus:border-[#820AD1]"
                  />
                </div>

                <div>
                  <label className="font-semibold text-neutral-700 block mb-1">Tipo de Conta</label>
                  <input
                    type="text"
                    value={formData.defaultRecipientAccountType}
                    onChange={(e) => handleChange('defaultRecipientAccountType', e.target.value)}
                    className="w-full bg-white border border-neutral-300 rounded-xl px-3 py-2 focus:outline-none focus:border-[#820AD1]"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-neutral-700 block mb-1">Valor Padrão da Transferência (R$)</label>
                <div className="flex items-center bg-white border border-neutral-300 rounded-xl px-3 py-2 focus-within:border-[#820AD1]">
                  <span className="font-bold text-purple-700 mr-2">R$</span>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={defaultTransferAmountString}
                    placeholder="0,00"
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => handleDefaultTransferAmountChange(e.target.value)}
                    className="w-full font-bold text-neutral-900 focus:outline-none"
                  />
                  {defaultTransferAmountString !== '' && (
                    <button
                      type="button"
                      onClick={() => {
                        setDefaultTransferAmountString('');
                        handleChange('defaultTransferAmount', 0);
                      }}
                      className="p-1 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded-full transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB: EXTRATO & TRANSAÇÕES */}
          {activeTab === 'history' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="font-bold text-neutral-800">Transações do Histórico</p>
                <button
                  type="button"
                  onClick={handleAddTx}
                  className="flex items-center gap-1 text-xs font-bold text-[#820AD1] bg-purple-50 hover:bg-purple-100 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Adicionar
                </button>
              </div>

              <div className="space-y-2.5 max-h-[350px] overflow-y-auto pr-1">
                {formData.transactions.map((tx, idx) => (
                  <div
                    key={tx.id || idx}
                    className="p-3 bg-neutral-50 rounded-2xl border border-neutral-200 flex flex-col gap-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <input
                        type="text"
                        value={tx.title}
                        onChange={(e) => handleUpdateTx(idx, 'title', e.target.value)}
                        placeholder="Título"
                        className="font-bold text-xs bg-white border border-neutral-300 rounded-lg px-2 py-1 flex-1 focus:outline-none focus:border-[#820AD1]"
                      />
                      <input
                        type="text"
                        inputMode="decimal"
                        value={tx.amount === 0 ? '' : tx.amount}
                        onFocus={(e) => e.target.select()}
                        onChange={(e) => handleUpdateTx(idx, 'amount', parseCurrency(e.target.value))}
                        placeholder="0,00"
                        className="font-bold text-xs bg-white border border-neutral-300 rounded-lg px-2 py-1 w-28 text-right focus:outline-none focus:border-[#820AD1]"
                      />
                      <button
                        type="button"
                        onClick={() => handleDeleteTx(idx)}
                        className="text-red-500 hover:text-red-700 p-1 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={tx.subtitle}
                        onChange={(e) => handleUpdateTx(idx, 'subtitle', e.target.value)}
                        placeholder="Subtítulo / Descrição"
                        className="text-xs bg-white border border-neutral-300 rounded-lg px-2 py-1 focus:outline-none"
                      />
                      <input
                        type="text"
                        value={tx.date}
                        onChange={(e) => handleUpdateTx(idx, 'date', e.target.value)}
                        placeholder="Data (ex: Hoje, 09:15)"
                        className="text-xs bg-white border border-neutral-300 rounded-lg px-2 py-1 focus:outline-none"
                      />
                    </div>
                  </div>
                ))}
                {formData.transactions.length === 0 && (
                  <div className="py-8 text-center text-neutral-400 bg-neutral-50 rounded-2xl border border-dashed border-neutral-200 p-4">
                    <p className="text-xs">Nenhuma transação no histórico.</p>
                    <p className="text-[11px] text-neutral-400 mt-1">Clique em "+ Adicionar" acima para cadastrar transações.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB: LEMBRETES & AVISOS */}
          {activeTab === 'reminder' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-xl border border-neutral-200">
                <span className="font-semibold text-neutral-800">Exibir Cartão de Lembrete</span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={formData.showReminder}
                  onClick={() => handleChange('showReminder', !formData.showReminder)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    formData.showReminder ? 'bg-[#820AD1]' : 'bg-neutral-300'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                      formData.showReminder ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <div>
                <label className="font-semibold text-neutral-700 block mb-1">Título do Lembrete</label>
                <input
                  type="text"
                  value={formData.reminderTitle}
                  onChange={(e) => handleChange('reminderTitle', e.target.value)}
                  className="w-full bg-white border border-neutral-300 rounded-xl px-3 py-2 font-medium focus:outline-none focus:border-[#820AD1]"
                />
              </div>

              <div>
                <label className="font-semibold text-neutral-700 block mb-1">Subtítulo do Lembrete</label>
                <input
                  type="text"
                  value={formData.reminderSubtitle}
                  onChange={(e) => handleChange('reminderSubtitle', e.target.value)}
                  className="w-full bg-white border border-neutral-300 rounded-xl px-3 py-2 focus:outline-none focus:border-[#820AD1]"
                />
              </div>

              <div className="pt-2 border-t border-neutral-200">
                <label className="font-semibold text-neutral-700 block mb-1">Título do Banner</label>
                <input
                  type="text"
                  value={formData.bannerTitle}
                  onChange={(e) => handleChange('bannerTitle', e.target.value)}
                  className="w-full bg-white border border-neutral-300 rounded-xl px-3 py-2 font-medium focus:outline-none focus:border-[#820AD1]"
                />
              </div>

              <div>
                <label className="font-semibold text-neutral-700 block mb-1">Subtítulo do Banner</label>
                <input
                  type="text"
                  value={formData.bannerSubtitle}
                  onChange={(e) => handleChange('bannerSubtitle', e.target.value)}
                  className="w-full bg-white border border-neutral-300 rounded-xl px-3 py-2 focus:outline-none focus:border-[#820AD1]"
                />
              </div>
            </div>
          )}

          {/* TAB: CONTATOS */}
          {activeTab === 'contacts' && (
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <p className="font-bold text-neutral-800">Contatos da Agenda Pix ({formData.contacts.length})</p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      handleChange('contacts', INITIAL_CONTACTS);
                    }}
                    className="text-[11px] font-bold text-neutral-600 hover:text-[#820AD1] bg-neutral-100 hover:bg-purple-50 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
                  >
                    Restaurar Lista Padrão
                  </button>
                  <button
                    type="button"
                    onClick={handleAddContact}
                    className="flex items-center gap-1 text-xs font-bold text-[#820AD1] bg-purple-50 hover:bg-purple-100 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Adicionar
                  </button>
                </div>
              </div>

              <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
                {formData.contacts.map((contact, idx) => (
                  <div key={contact.id || idx} className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <input
                        type="text"
                        value={contact.name}
                        onChange={(e) => {
                          const updated = [...formData.contacts];
                          updated[idx] = { ...updated[idx], name: e.target.value };
                          handleChange('contacts', updated);
                        }}
                        placeholder="Nome do contato"
                        className="flex-1 font-bold text-xs bg-white border border-neutral-300 rounded-lg px-2 py-1 focus:outline-none focus:border-[#820AD1]"
                      />
                      <input
                        type="text"
                        value={contact.initials}
                        onChange={(e) => {
                          const updated = [...formData.contacts];
                          updated[idx] = { ...updated[idx], initials: e.target.value.toUpperCase() };
                          handleChange('contacts', updated);
                        }}
                        placeholder="Iniciais"
                        className="w-16 font-bold text-xs bg-white border border-neutral-300 rounded-lg px-2 py-1 text-center focus:outline-none focus:border-[#820AD1]"
                      />
                      <button
                        type="button"
                        onClick={() => handleDeleteContact(idx)}
                        className="text-red-500 hover:text-red-700 p-1 cursor-pointer shrink-0"
                        title="Excluir contato"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={contact.document}
                        onChange={(e) => {
                          const updated = [...formData.contacts];
                          updated[idx] = { ...updated[idx], document: e.target.value };
                          handleChange('contacts', updated);
                        }}
                        placeholder="CPF ou CNPJ"
                        className="text-xs bg-white border border-neutral-300 rounded-lg px-2 py-1 focus:outline-none"
                      />
                      <input
                        type="text"
                        value={contact.institution}
                        onChange={(e) => {
                          const updated = [...formData.contacts];
                          updated[idx] = { ...updated[idx], institution: e.target.value };
                          handleChange('contacts', updated);
                        }}
                        placeholder="Instituição / Banco"
                        className="text-xs bg-white border border-neutral-300 rounded-lg px-2 py-1 focus:outline-none"
                      />
                    </div>
                  </div>
                ))}

                {formData.contacts.length === 0 && (
                  <div className="py-8 text-center text-neutral-400 bg-neutral-50 rounded-2xl border border-dashed border-neutral-200 p-4">
                    <p className="text-xs">Nenhum contato cadastrado na agenda Pix.</p>
                    <p className="text-[11px] text-neutral-400 mt-1">Clique no botão "+ Adicionar" acima para incluir contatos.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB: LOGIN */}
          {activeTab === 'login' && (
            <div className="space-y-3">
              <div>
                <label className="font-semibold text-neutral-700 block mb-1">Título da Tela de Login</label>
                <textarea
                  rows={3}
                  value={formData.loginTitle}
                  onChange={(e) => handleChange('loginTitle', e.target.value)}
                  className="w-full bg-white border border-neutral-300 rounded-xl p-2.5 font-medium focus:outline-none focus:border-[#820AD1]"
                />
              </div>

              <div>
                <label className="font-semibold text-neutral-700 block mb-1">Texto do Botão de Entrada</label>
                <input
                  type="text"
                  value={formData.loginButtonText}
                  onChange={(e) => handleChange('loginButtonText', e.target.value)}
                  className="w-full bg-white border border-neutral-300 rounded-xl px-3 py-2 font-bold focus:outline-none focus:border-[#820AD1]"
                />
              </div>

              <div>
                <label className="font-semibold text-neutral-700 block mb-1">Texto Explicativo de Ajuda</label>
                <textarea
                  rows={2}
                  value={formData.loginHelperText}
                  onChange={(e) => handleChange('loginHelperText', e.target.value)}
                  className="w-full bg-white border border-neutral-300 rounded-xl p-2.5 focus:outline-none focus:border-[#820AD1]"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="bg-neutral-50 border-t border-neutral-200 px-6 py-4 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onReset}
            className="flex items-center gap-1.5 text-xs font-bold text-neutral-600 hover:text-neutral-900 bg-neutral-200 hover:bg-neutral-300 px-4 py-2.5 rounded-xl transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" /> Restaurar Padrões
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="text-xs font-semibold text-neutral-600 hover:text-neutral-800 px-4 py-2.5 rounded-xl transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="flex items-center gap-2 text-xs font-bold text-white bg-[#820AD1] hover:bg-[#7008b4] px-6 py-2.5 rounded-xl shadow-md transition-all cursor-pointer"
            >
              {savedSuccess ? (
                <>
                  <Check className="w-4 h-4 text-emerald-300" />
                  <span>Salvo com Sucesso!</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Salvar Alterações</span>
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
