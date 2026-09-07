import React, { useEffect } from 'react';
import { motion } from 'motion/react';

interface SplashScreenProps {
  onFinish: () => void;
  durationMs?: number;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish, durationMs = 1600 }) => {
  useEffect(() => {
    const timer = setTimeout(onFinish, durationMs);
    return () => clearTimeout(timer);
  }, [onFinish, durationMs]);

  return (
    <div
      className="flex flex-col h-full w-full items-center justify-center select-none"
      style={{ backgroundColor: '#781AC8' }}
    >
      <motion.img
        src="/nu-logo.png"
        alt="Nubank"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="w-28 h-auto"
      />
    </div>
  );
};
