import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, ArrowDownLeft, X, CheckCircle2 } from 'lucide-react';
import { ActivePixNotification } from '../types';

interface PixPushNotificationProps {
  notification: ActivePixNotification | null;
  onDismiss: () => void;
  onClickNotification?: () => void;
}

export const PixPushNotification: React.FC<PixPushNotificationProps> = ({
  notification,
  onDismiss,
  onClickNotification,
}) => {
  if (!notification) return null;

  const formattedAmount = Number(notification.amount).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -90, scale: 0.94 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -80, scale: 0.94 }}
        transition={{ type: 'spring', damping: 24, stiffness: 350 }}
        className="fixed top-2 sm:top-4 left-3 right-3 sm:left-auto sm:right-4 sm:w-[410px] z-50 select-none cursor-pointer"
        onClick={() => {
          if (onClickNotification) onClickNotification();
        }}
      >
        <div className="bg-neutral-900/95 backdrop-blur-xl text-white rounded-3xl p-3.5 shadow-2xl border border-white/15 hover:border-purple-400/50 transition-all">
          {/* Header Bar */}
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10 text-[11px] text-neutral-300">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-lg bg-[#820AD1] flex items-center justify-center font-bold text-white text-[10px] shadow-xs">
                nu
              </div>
              <span className="font-bold tracking-wide uppercase text-neutral-200">
                Nu Empresas
              </span>
              <span className="text-neutral-500">•</span>
              <span className="text-neutral-400">{notification.timestamp || 'agora'}</span>
            </div>
            
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDismiss();
                }}
                className="w-5 h-5 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-neutral-300 hover:text-white transition-colors cursor-pointer"
                title="Fechar notificação"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Main Body */}
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
              <ArrowDownLeft className="w-5 h-5" />
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-white flex items-center gap-1.5">
                <span>Transferência Pix recebida!</span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-1.5 py-0.2 rounded border border-emerald-500/30">
                  +{formattedAmount}
                </span>
              </p>

              <p className="text-xs text-neutral-200 mt-1 leading-snug">
                Você recebeu <strong className="text-emerald-400 font-bold">{formattedAmount}</strong> de <strong className="text-white font-semibold">{notification.senderName}</strong>.
              </p>

              {notification.message && (
                <p className="text-[11px] text-neutral-400 italic mt-1 truncate">
                  "{notification.message}"
                </p>
              )}
            </div>
          </div>

          {/* Quick Actions Footer */}
          <div className="mt-2.5 pt-2 border-t border-white/10 flex items-center justify-between text-[11px]">
            <span className="text-purple-300 font-medium flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" />
              Saldo atualizado
            </span>
            <span className="text-neutral-400 hover:text-white font-semibold flex items-center gap-0.5">
              Toque para abrir extrato <ChevronDown className="w-3 h-3 rotate-270" />
            </span>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
