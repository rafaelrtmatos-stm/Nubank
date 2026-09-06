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
  Clock
} from 'lucide-react';
import { AppCustomData, Transaction, Contact } from '../types';

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
  const [activeTab, setActiveTab] = useState<
    'user' | 'balance' | 'reminder' | 'transfer' | 'history' | 'contacts' | 'login' | 'simulate_pix'
  >('simulate_pix');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [triggerStatus, setTriggerStatus] = useState<string | null>(null);

  // Sync with prop if opened
  React.useEffect(() => {
    if (isOpen) {
      setFormData({ ...data });
      setSavedSuccess(false);
    }
  }, [isOpen, data]);

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

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
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
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer transition-colors"
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

              {/* Trigger Instant Actions */}
              <div className="bg-neutral-900 text-white p-4 rounded-2xl space-y-3 shadow-md">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs flex items-center gap-1.5 text-emerald-400">
                    <Zap className="w-4 h-4 fill-emerald-400" /> Disparadores Rápidos
                  </span>
                  {triggerStatus && (
                    <span className="text-[11px] text-amber-300 font-semibold animate-pulse">
                      {triggerStatus}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
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
                    <Zap className="w-3.5 h-3.5" /> Disparar Agora
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
                          3
                        );
                        setTriggerStatus('Em 3 segundos...');
                        setTimeout(() => {
                          setTriggerStatus(null);
                          onClose();
                        }, 500);
                      }
                    }}
                    className="bg-purple-600 hover:bg-purple-700 active:scale-95 text-white font-bold py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all text-xs cursor-pointer shadow-xs"
                  >
                    <Clock className="w-3.5 h-3.5" /> Em 3 segundos
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
                          10
                        );
                        setTriggerStatus('Em 10 segundos...');
                        setTimeout(() => {
                          setTriggerStatus(null);
                          onClose();
                        }, 500);
                      }
                    }}
                    className="bg-neutral-800 hover:bg-neutral-700 active:scale-95 text-neutral-200 font-semibold py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all text-xs cursor-pointer border border-neutral-700"
                  >
                    <Clock className="w-3.5 h-3.5" /> Em 10 segundos
                  </button>
                </div>
              </div>

              {/* Form Settings */}
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-neutral-700 block mb-1">
                      Valor do Pix Recebido (R$)
                    </label>
                    <div className="flex items-center bg-white border border-neutral-300 rounded-xl px-3 py-2 focus-within:border-[#820AD1]">
                      <span className="font-bold text-emerald-600 mr-2">R$</span>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.simulatedPixAmount}
                        onChange={(e) => handleChange('simulatedPixAmount', parseFloat(e.target.value) || 0)}
                        className="w-full font-bold text-neutral-900 focus:outline-none"
                      />
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
                <label className="font-bold text-neutral-800 block mb-1">
                  Saldo da Conta (R$)
                </label>
                <div className="flex items-center bg-white border border-neutral-300 rounded-xl px-3 py-2 focus-within:border-[#820AD1]">
                  <span className="font-bold text-purple-700 mr-2">R$</span>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.balance}
                    onChange={(e) => handleChange('balance', parseFloat(e.target.value) || 0)}
                    className="w-full text-base font-bold text-neutral-900 focus:outline-none"
                  />
                </div>
                <p className="text-[11px] text-neutral-500 mt-1">
                  Este valor será exibido no topo da tela inicial e recalculado após transferências.
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
                <input
                  type="number"
                  step="0.01"
                  value={formData.defaultTransferAmount}
                  onChange={(e) => handleChange('defaultTransferAmount', parseFloat(e.target.value) || 0)}
                  className="w-full bg-white border border-neutral-300 rounded-xl px-3 py-2 font-bold focus:outline-none focus:border-[#820AD1]"
                />
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
                        type="number"
                        step="0.01"
                        value={tx.amount}
                        onChange={(e) => handleUpdateTx(idx, 'amount', parseFloat(e.target.value) || 0)}
                        placeholder="Valor"
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
              <p className="font-bold text-neutral-800">Contatos Frequentes da Área Pix</p>
              <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
                {formData.contacts.map((contact, idx) => (
                  <div key={contact.id || idx} className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 space-y-2">
                    <div className="grid grid-cols-3 gap-2">
                      <input
                        type="text"
                        value={contact.name}
                        onChange={(e) => {
                          const updated = [...formData.contacts];
                          updated[idx] = { ...updated[idx], name: e.target.value };
                          handleChange('contacts', updated);
                        }}
                        placeholder="Nome"
                        className="col-span-2 font-bold text-xs bg-white border border-neutral-300 rounded-lg px-2 py-1"
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
                        className="font-bold text-xs bg-white border border-neutral-300 rounded-lg px-2 py-1 text-center"
                      />
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
                        placeholder="Documento"
                        className="text-xs bg-white border border-neutral-300 rounded-lg px-2 py-1"
                      />
                      <input
                        type="text"
                        value={contact.institution}
                        onChange={(e) => {
                          const updated = [...formData.contacts];
                          updated[idx] = { ...updated[idx], institution: e.target.value };
                          handleChange('contacts', updated);
                        }}
                        placeholder="Banco"
                        className="text-xs bg-white border border-neutral-300 rounded-lg px-2 py-1"
                      />
                    </div>
                  </div>
                ))}
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
