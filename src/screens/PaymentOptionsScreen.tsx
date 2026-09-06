import React from 'react';
import { motion } from 'motion/react';
import { X, LayoutGrid, Barcode, Landmark, RefreshCw, ChevronRight, Sparkles } from 'lucide-react';

interface PaymentOptionsScreenProps {
  onGoBack: () => void;
  onNavigate: (screen: 'AreaPix' | 'Transfer') => void;
}

export const PaymentOptionsScreen: React.FC<PaymentOptionsScreenProps> = ({
  onGoBack,
  onNavigate,
}) => {
  return (
    <div className="flex flex-col h-full bg-white select-none">
      {/* Top Close Bar */}
      <div className="p-5 pb-2">
        <button
          id="btn-close-payment-options"
          onClick={onGoBack}
          className="w-10 h-10 -ml-2 rounded-full hover:bg-neutral-100 flex items-center justify-center transition-colors cursor-pointer text-neutral-600"
          aria-label="Fechar opções de pagamento"
        >
          <X className="w-7 h-7" />
        </button>
      </div>

      {/* Main Content */}
      <div className="px-6 pt-2 flex-1 overflow-y-auto">
        <motion.h1
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-2xl sm:text-[26px] font-bold text-neutral-900 leading-tight tracking-tight mb-6"
        >
          Estas são suas opções de pagamento
        </motion.h1>

        <div className="divide-y divide-neutral-100">
          {/* Pagar com Pix */}
          <motion.button
            id="btn-pay-pix"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            onClick={() => onNavigate('AreaPix')}
            className="w-full py-5 flex items-center justify-between text-left group cursor-pointer hover:bg-neutral-50/80 -mx-3 px-3 rounded-2xl transition-colors"
          >
            <div className="flex items-center gap-4 flex-1">
              <div className="w-11 h-11 rounded-full bg-purple-50 flex items-center justify-center text-[#820AD1]">
                <LayoutGrid className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-neutral-900 text-[15px]">Pagar com Pix</span>
                  <span className="bg-[#820AD1] text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Sparkles className="w-2.5 h-2.5" /> Instantâneo
                  </span>
                </div>
                <p className="text-xs text-neutral-500 mt-0.5">Use QR code ou Pix Copia e Cola</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-neutral-300 group-hover:text-neutral-500 group-hover:translate-x-0.5 transition-all" />
          </motion.button>

          {/* Pagar Boleto */}
          <motion.button
            id="btn-pay-boleto"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            onClick={() => alert("Leitor de código de barras ou linha digitável")}
            className="w-full py-5 flex items-center justify-between text-left group cursor-pointer hover:bg-neutral-50/80 -mx-3 px-3 rounded-2xl transition-colors"
          >
            <div className="flex items-center gap-4 flex-1">
              <div className="w-11 h-11 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-800">
                <Barcode className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <span className="font-bold text-neutral-900 text-[15px]">Pagar boleto</span>
                <p className="text-xs text-neutral-500 mt-0.5">Contas de consumo, tributos e fornecedores</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-neutral-300 group-hover:text-neutral-500 group-hover:translate-x-0.5 transition-all" />
          </motion.button>

          {/* Débito Automático */}
          <motion.button
            id="btn-pay-autopay"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            onClick={() => alert("Gerenciar contas cadastradas em débito automático")}
            className="w-full py-5 flex items-center justify-between text-left group cursor-pointer hover:bg-neutral-50/80 -mx-3 px-3 rounded-2xl transition-colors"
          >
            <div className="flex items-center gap-4 flex-1">
              <div className="w-11 h-11 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-800">
                <RefreshCw className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <span className="font-bold text-neutral-900 text-[15px]">Débito automático</span>
                <p className="text-xs text-neutral-500 mt-0.5">Pague suas contas sem se preocupar com o vencimento</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-neutral-300 group-hover:text-neutral-500 group-hover:translate-x-0.5 transition-all" />
          </motion.button>

          {/* Tributos Federais e Estaduais (PJ) */}
          <motion.button
            id="btn-pay-taxes"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            onClick={() => alert("Pagamento de DAS, DARF, GPS e tributos PJ")}
            className="w-full py-5 flex items-center justify-between text-left group cursor-pointer hover:bg-neutral-50/80 -mx-3 px-3 rounded-2xl transition-colors"
          >
            <div className="flex items-center gap-4 flex-1">
              <div className="w-11 h-11 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-800">
                <Landmark className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <span className="font-bold text-neutral-900 text-[15px]">Impostos e Tributos (DAS/DARF)</span>
                <p className="text-xs text-neutral-500 mt-0.5">Guia DAS do MEI e Simples Nacional</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-neutral-300 group-hover:text-neutral-500 group-hover:translate-x-0.5 transition-all" />
          </motion.button>
        </div>
      </div>
    </div>
  );
};
