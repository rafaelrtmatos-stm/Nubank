import React from 'react';
import { motion } from 'motion/react';
import { 
  X, 
  ArrowUpRight, 
  Copy, 
  QrCode, 
  Coins, 
  KeyRound, 
  ShieldCheck, 
  ChevronRight,
  UserPlus
} from 'lucide-react';
import { Contact } from '../types';

interface AreaPixScreenProps {
  onGoBack: () => void;
  onNavigateTransfer: (contact?: Contact) => void;
  contacts: Contact[];
}

export const AreaPixScreen: React.FC<AreaPixScreenProps> = ({
  onGoBack,
  onNavigateTransfer,
  contacts,
}) => {
  return (
    <div className="flex flex-col h-full bg-white select-none overflow-y-auto pb-10">
      {/* Top Close Bar */}
      <div className="p-5 pb-2 flex items-center justify-between">
        <button
          id="btn-close-area-pix"
          onClick={onGoBack}
          className="w-10 h-10 -ml-2 rounded-full hover:bg-neutral-100 flex items-center justify-center transition-colors cursor-pointer text-neutral-600"
          aria-label="Fechar Área Pix"
        >
          <X className="w-7 h-7" />
        </button>
        <span className="text-xs font-bold text-[#820AD1] bg-purple-50 px-2.5 py-1 rounded-full">
          Pix PJ 24h
        </span>
      </div>

      {/* Title */}
      <div className="px-6 pt-2">
        <motion.h1
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-2xl sm:text-[26px] font-bold text-neutral-900 leading-tight tracking-tight"
        >
          Área Pix
        </motion.h1>
        <p className="text-xs sm:text-sm text-neutral-500 mt-1.5 leading-relaxed">
          Envie e receba pagamentos a qualquer hora do dia ou da noite, inclusive fins de semana e feriados.
        </p>

        {/* Primary Action Buttons Carousel */}
        <div className="mt-6 flex gap-4 overflow-x-auto pb-2 no-scrollbar -mx-6 px-6">
          {/* Transferir */}
          <button
            id="btn-pix-transfer"
            onClick={() => onNavigateTransfer()}
            className="flex flex-col items-center gap-2 shrink-0 group cursor-pointer"
          >
            <div className="w-16 h-16 rounded-full bg-[#f5f5f5] group-hover:bg-[#ebd5fa] group-active:scale-95 flex items-center justify-center transition-all">
              <ArrowUpRight className="w-7 h-7 text-neutral-900 group-hover:text-[#820AD1]" />
            </div>
            <span className="text-xs font-bold text-neutral-800">Transferir</span>
          </button>

          {/* Pix Copia e Cola */}
          <button
            id="btn-pix-copiacola"
            onClick={() => alert("Cole o código Pix Copia e Cola recebido")}
            className="flex flex-col items-center gap-2 shrink-0 group cursor-pointer"
          >
            <div className="w-16 h-16 rounded-full bg-[#f5f5f5] group-hover:bg-[#ebebeb] group-active:scale-95 flex items-center justify-center transition-all">
              <Copy className="w-7 h-7 text-neutral-900" />
            </div>
            <span className="text-xs font-bold text-neutral-800">Pix Copia e Cola</span>
          </button>

          {/* Ler QR Code */}
          <button
            id="btn-pix-qrcode"
            onClick={() => alert("Abrindo câmera para escanear QR Code Pix...")}
            className="flex flex-col items-center gap-2 shrink-0 group cursor-pointer"
          >
            <div className="w-16 h-16 rounded-full bg-[#f5f5f5] group-hover:bg-[#ebebeb] group-active:scale-95 flex items-center justify-center transition-all">
              <QrCode className="w-7 h-7 text-neutral-900" />
            </div>
            <span className="text-xs font-bold text-neutral-800">Ler QR code</span>
          </button>

          {/* Cobrar */}
          <button
            id="btn-pix-charge"
            onClick={() => alert("Gerar cobrança Pix")}
            className="flex flex-col items-center gap-2 shrink-0 group cursor-pointer"
          >
            <div className="w-16 h-16 rounded-full bg-[#f5f5f5] group-hover:bg-[#ebebeb] group-active:scale-95 flex items-center justify-center transition-all">
              <Coins className="w-7 h-7 text-neutral-900" />
            </div>
            <span className="text-xs font-bold text-neutral-800">Cobrar</span>
          </button>
        </div>
      </div>

      <div className="h-1.5 bg-[#f0f1f5] my-4" />

      {/* Contatos Frequentes */}
      <div className="px-6 py-2">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-neutral-900">Contatos frequentes</h2>
          <span className="text-xs text-[#820AD1] font-semibold">Todos</span>
        </div>

        <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar -mx-6 px-6">
          {contacts.map((contact) => (
            <button
              key={contact.id}
              onClick={() => onNavigateTransfer(contact)}
              className="flex flex-col items-center gap-1.5 shrink-0 max-w-[76px] text-center group cursor-pointer"
            >
              <div className="w-14 h-14 rounded-full bg-[#f2f2f2] group-hover:bg-[#ebd5fa] group-hover:text-[#820AD1] flex items-center justify-center text-sm font-bold text-neutral-800 transition-colors border border-neutral-200/60 shadow-xs">
                {contact.initials}
              </div>
              <span className="text-[11px] font-semibold text-neutral-800 truncate w-full leading-tight">
                {contact.name.split(' ')[0]}
              </span>
              <span className="text-[10px] text-neutral-400 truncate w-full">
                {contact.name.split(' ')[1] || ''}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="h-1.5 bg-[#f0f1f5] my-3" />

      {/* Minhas Chaves & Configurações Pix */}
      <div className="px-6 py-1 space-y-1">
        <button
          onClick={() => alert("Gerenciamento de chaves Pix: CNPJ, E-mail, Celular e Chave Aleatória")}
          className="w-full py-4 flex items-center justify-between text-left group hover:bg-neutral-50 -mx-3 px-3 rounded-2xl transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-700">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-neutral-900">Registrar ou gerenciar chaves</p>
              <p className="text-xs text-neutral-500">Cadastre seu CNPJ, e-mail ou telefone</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-neutral-300 group-hover:text-neutral-500 transition-colors" />
        </button>

        <button
          onClick={() => alert("Configuração de limites diários e noturnos para Nu Empresas")}
          className="w-full py-4 flex items-center justify-between text-left group hover:bg-neutral-50 -mx-3 px-3 rounded-2xl transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-700">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-neutral-900">Meus limites Pix</p>
              <p className="text-xs text-neutral-500">Defina limite diurno e noturno</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-neutral-300 group-hover:text-neutral-500 transition-colors" />
        </button>
      </div>
    </div>
  );
};
