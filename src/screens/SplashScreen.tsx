import React, { useEffect } from 'react';
import { motion } from 'motion/react';

interface SplashScreenProps {
  onFinish: () => void;
  durationMs?: number;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish, durationMs = 950 }) => {
  useEffect(() => {
    const timer = setTimeout(onFinish, durationMs);
    return () => clearTimeout(timer);
  }, [onFinish, durationMs]);

  return (
    <div
      className="flex flex-col h-full w-full items-center justify-center select-none"
      style={{ backgroundColor: '#820AD1' }}
    >
      <motion.img
        src="/nu-logo.png"
        alt="Nubank"
        initial={{ opacity: 0, scale: 0.88 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="w-24 h-24 sm:w-28 sm:h-28 object-contain rounded-3xl shadow-xl"
      />
    </div>
  );
};
