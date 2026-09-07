import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { 
  ChevronLeft, 
  Eye, 
  EyeOff, 
  Moon,
  Delete,
  Check
} from 'lucide-react';
import { Contact, TransferData } from '../types';

interface TransferScreenProps {
  onGoBack: () => void;
  onContinue: (data: TransferData) => void;
  contacts: Contact[];
  preselectedContact?: Contact | null;
  accountBalance: number;
}

export const TransferScreen: React.FC<TransferScreenProps> = ({
  onGoBack,
  onContinue,
  contacts,
  preselectedContact,
  accountBalance,
}) => {
  const [recipient, setRecipient] = useState<Contact>(() => {
    if (preselectedContact) return preselectedContact;
    if (contacts && contacts.length > 0) return contacts[0];
    return {
      id: 'default-vm',
      name: 'V Mendes Ribeiro Comercio Ltda',
      initials: 'VM',
      document: '42.189.204/0001-90',
      institution: 'Nu Pagamentos S.A.',
      accountType: 'Conta Corrente PJ',
      pixKey: 'financeiro@vmendes.com.br'
    };
  });

  const [rawDigits, setRawDigits] = useState<string>('0');
  const [isBalanceHidden, setIsBalanceHidden] = useState<boolean>(false);
  const [showRecipientPicker, setShowRecipientPicker] = useState<boolean>(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (preselectedContact) {
      setRecipient(preselectedContact);
    }
  }, [preselectedContact]);

  // Convert rawDigits to numeric float
  const numericAmount = parseInt(rawDigits || '0', 10) / 100;

  // Format as Brazilian currency string: "0,00"
  const formattedAmount = numericAmount.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const onlyNums = e.target.value.replace(/\D/g, '');
    setRawDigits(onlyNums || '0');
  };

  const handleQuickAdd = (valueInReais: number) => {
    const current = parseInt(rawDigits || '0', 10) / 100;
    const newTotal = current + valueInReais;
    setRawDigits(Math.round(newTotal * 100).toString());
  };

  const handleContinue = () => {
    if (numericAmount <= 0) return;

    onContinue({
      recipient,
      amount: numericAmount,
      date: new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }),
    });
  };

  return (
    <div className="flex flex-col h-full bg-white select-none text-neutral-900 relative font-sans overflow-hidden">
      {/* Top Navigation Bar: Back Arrow */}
      <div className="px-4 py-2 flex items-center shrink-0">
        <button
          id="btn-back-transfer"
          onClick={onGoBack}
          className="w-10 h-10 -ml-1 rounded-full flex items-center justify-center text-neutral-900 hover:bg-neutral-100 active:scale-95 transition-all cursor-pointer"
          aria-label="Voltar"
        >
          <ChevronLeft className="w-7 h-7 stroke-[2]" />
        </button>
      </div>

      {/* Main Content Body */}
      <div className="flex-1 px-6 pt-1 overflow-y-auto">
        {/* Section 1: Transferir para */}
        <div className="mb-6">
          <p className="text-[13px] text-neutral-500 font-normal">
            Transferir para
          </p>
          <div 
            onClick={() => setShowRecipientPicker(!showRecipientPicker)}
            className="flex items-center justify-between mt-1 cursor-pointer group"
          >
            <h2 className="text-[16px] sm:text-[17px] font-bold text-neutral-900 tracking-tight leading-snug group-hover:text-[#820AD1] transition-colors">
              {recipient.name}
            </h2>
          </div>
        </div>

        {/* Section 2: Valor */}
        <div className="mb-8">
          <label className="text-[13px] text-neutral-500 font-normal block">
            Valor
          </label>
          
          <div 
            onClick={() => inputRef.current?.focus()}
            className="flex items-baseline gap-2 pt-1 pb-2 border-b border-neutral-200 cursor-text group focus-within:border-neutral-900"
          >
            <span className="text-2xl sm:text-[28px] font-bold text-neutral-900 tracking-tight">
              R$
            </span>
            <span className="text-2xl sm:text-[28px] font-bold text-neutral-900 tracking-tight flex-1">
              {formattedAmount}
            </span>
            {/* Hidden Input for Keyboard Focus */}
            <input
              ref={inputRef}
              id="input-transfer-amount-numeric"
              type="tel"
              inputMode="numeric"
              value={rawDigits}
              onChange={handleInputChange}
              className="opacity-0 w-0 h-0 absolute pointer-events-none"
              autoFocus
            />
          </div>

          {/* Quick Value Helper Chips */}
          <div className="flex gap-2 mt-3 overflow-x-auto no-scrollbar py-0.5">
            {[10, 50, 100, 250, 500].map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => handleQuickAdd(val)}
                className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-neutral-100 hover:bg-purple-100 hover:text-[#820AD1] text-neutral-700 transition-colors shrink-0 cursor-pointer"
              >
                +R$ {val}
              </button>
            ))}
            {numericAmount > 0 && (
              <button
                type="button"
                onClick={() => setRawDigits('0')}
                className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-neutral-100 hover:bg-rose-100 hover:text-rose-600 text-neutral-500 transition-colors shrink-0 cursor-pointer"
              >
                Limpar
              </button>
            )}
          </div>
        </div>

        {/* Section 3: Pagando com */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[13px] font-medium text-neutral-800">
              Pagando com
            </span>
            <button
              onClick={() => setIsBalanceHidden(!isBalanceHidden)}
              className="text-neutral-700 hover:text-neutral-900 p-1 cursor-pointer transition-colors"
              title={isBalanceHidden ? "Mostrar saldo" : "Ocultar saldo"}
            >
              {isBalanceHidden ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>

          {/* Payment Method Card with Purple Border */}
          <div className="w-[172px] sm:w-[185px] rounded-[22px] border-[1.5px] border-[#820AD1] p-4 bg-white shadow-xs">
            {/* Banknote / Money icon */}
            <div className="w-6 h-4.5 rounded-[3px] border-[1.5px] border-[#820AD1] flex items-center justify-center p-[2px]">
              <div className="w-1.5 h-1.5 rounded-full bg-[#820AD1]" />
            </div>

            <div className="mt-5">
              <p className="text-[12px] font-bold text-[#820AD1] leading-tight">
                Conta Nubank
              </p>
              <p className="text-[11px] font-medium text-purple-900 mt-0.5 leading-tight">
                Atual: {isBalanceHidden 
                  ? '••••' 
                  : accountBalance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </p>
              <p className="text-[11px] font-medium text-purple-900/80 mt-0.5 leading-tight">
                Envio imediato
              </p>
            </div>
          </div>
        </div>

        {/* Optional Dropdown to Change Contact */}
        {showRecipientPicker && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 bg-neutral-50 p-3.5 rounded-2xl border border-neutral-200"
          >
            <p className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider mb-2">
              Escolha outro contato:
            </p>
            <div className="space-y-1.5 max-h-40 overflow-y-auto">
              {contacts.map((c) => (
                <button
                  key={c.id}
                  onClick={() => {
                    setRecipient(c);
                    setShowRecipientPicker(false);
                  }}
                  className={`w-full text-left p-2 rounded-xl text-xs flex items-center justify-between transition-colors ${
                    recipient.id === c.id 
                      ? 'bg-purple-100/70 text-[#820AD1] font-bold' 
                      : 'hover:bg-neutral-200/50 text-neutral-800'
                  }`}
                >
                  <span className="truncate">{c.name}</span>
                  {recipient.id === c.id && <Check className="w-3.5 h-3.5 text-[#820AD1]" />}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* Bottom Action Footer */}
      <div className="p-6 pt-2 shrink-0 bg-white">
        <button
          id="btn-transfer-continue"
          onClick={handleContinue}
          disabled={numericAmount <= 0}
          className={`w-full py-4 rounded-full text-sm font-semibold tracking-tight transition-all text-center flex items-center justify-center ${
            numericAmount > 0
              ? 'bg-[#820AD1] text-white hover:bg-[#7008b4] active:scale-[098] cursor-pointer shadow-md shadow-purple-900/15'
              : 'bg-[#f2f2f4] text-neutral-400 cursor-not-allowed'
          }`}
        >
          Continuar
        </button>

        {/* iOS Home Indicator Bar */}
        <div className="w-32 sm:w-36 h-1 bg-black rounded-full mx-auto mt-4 mb-1" />
      </div>
    </div>
  );
};
