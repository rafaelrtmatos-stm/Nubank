import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Check, DollarSign, ArrowUpRight, RotateCcw } from 'lucide-react';
import { parseCurrency, formatCurrencyBRL } from '../utils/currencyUtils';

interface QuickBalanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentBalance: number;
  onSaveBalance: (newBalance: number) => void;
}

export const QuickBalanceModal: React.FC<QuickBalanceModalProps> = ({
  isOpen,
  onClose,
  currentBalance,
  onSaveBalance,
}) => {
  const [inputValue, setInputValue] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      // Se for 0, deixa vazio ou com '0' selecionável
      setInputValue(currentBalance === 0 ? '' : currentBalance.toFixed(2).replace('.', ','));
    }
  }, [isOpen, currentBalance]);

  if (!isOpen) return null;

  const numericValue = parseCurrency(inputValue);

  const handleQuickAdd = (amount: number) => {
    const nextVal = numericValue + amount;
    setInputValue(nextVal.toFixed(2).replace('.', ','));
  };

  const handleClear = () => {
    setInputValue('');
  };

  const handleConfirm = () => {
    onSaveBalance(numericValue);
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl flex flex-col border border-neutral-100"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-[#820AD1]">
                <DollarSign className="w-4 h-4 stroke-[2.5]" />
              </div>
              <h3 className="font-bold text-neutral-900 text-base">
                Editar Saldo da Conta
              </h3>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-neutral-100 text-neutral-400 hover:text-neutral-700 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Main Input Area */}
          <div className="py-4">
            <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider block mb-2">
              Digite o novo saldo (R$)
            </label>
            <div className="flex items-center bg-neutral-50 border-2 border-purple-200 focus-within:border-[#820AD1] rounded-2xl px-4 py-3 transition-colors">
              <span className="text-xl font-bold text-[#820AD1] mr-2">R$</span>
              <input
                type="text"
                inputMode="decimal"
                autoFocus
                value={inputValue}
                onFocus={(e) => e.target.select()}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="0,00"
                className="w-full text-2xl font-black text-neutral-900 bg-transparent focus:outline-none placeholder:text-neutral-300"
              />
              {inputValue !== '' && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="p-1 rounded-full text-neutral-400 hover:text-neutral-700 hover:bg-neutral-200 transition-colors shrink-0"
                  title="Limpar campo"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Live Preview */}
            <div className="mt-2.5 flex items-center justify-between text-xs text-neutral-500 px-1">
              <span>Prévia na Tela Inicial:</span>
              <span className="font-bold text-[#820AD1] text-sm">
                {formatCurrencyBRL(numericValue)}
              </span>
            </div>
          </div>

          {/* Quick Increment Shortcuts */}
          <div className="space-y-1.5 pt-1 pb-3">
            <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
              Atalhos de valor rápido:
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleQuickAdd(100)}
                className="px-2.5 py-1 text-xs font-bold rounded-lg bg-purple-50 text-[#820AD1] hover:bg-purple-100 transition-colors cursor-pointer"
              >
                +R$ 100
              </button>
              <button
                type="button"
                onClick={() => handleQuickAdd(500)}
                className="px-2.5 py-1 text-xs font-bold rounded-lg bg-purple-50 text-[#820AD1] hover:bg-purple-100 transition-colors cursor-pointer"
              >
                +R$ 500
              </button>
              <button
                type="button"
                onClick={() => handleQuickAdd(1000)}
                className="px-2.5 py-1 text-xs font-bold rounded-lg bg-purple-50 text-[#820AD1] hover:bg-purple-100 transition-colors cursor-pointer"
              >
                +R$ 1.000
              </button>
              <button
                type="button"
                onClick={() => handleQuickAdd(5000)}
                className="px-2.5 py-1 text-xs font-bold rounded-lg bg-purple-50 text-[#820AD1] hover:bg-purple-100 transition-colors cursor-pointer"
              >
                +R$ 5.000
              </button>
              <button
                type="button"
                onClick={() => setInputValue('0,00')}
                className="px-2.5 py-1 text-xs font-bold rounded-lg bg-neutral-100 text-neutral-600 hover:bg-neutral-200 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" /> Zerar
              </button>
            </div>
          </div>

          {/* Footer Action Buttons */}
          <div className="mt-2 pt-3 border-t border-neutral-100 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 font-bold text-sm text-neutral-600 hover:bg-neutral-100 rounded-xl transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="flex-1 py-3 font-bold text-sm text-white bg-[#820AD1] hover:bg-[#6e07b0] active:scale-98 rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              Salvar Saldo
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
