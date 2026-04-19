import React from 'react';
import { motion } from 'framer-motion';
import clsx from 'clsx';

/**
 * Immersive casino scene background used by 3D mini-games.
 * Provides: felt gradient, wood rim, vignette spotlight, dealer avatar frame.
 */
export const CasinoTable: React.FC<{
  children: React.ReactNode;
  gameIcon: string;
  gameName: string;
  dealerStatus?: string;
  compact?: boolean;
}> = ({ children, gameIcon, gameName, dealerStatus, compact = false }) => {
  return (
    <div className="relative overflow-hidden rounded-3xl border-4 border-[#5a3a1a] shadow-[0_20px_60px_rgba(0,0,0,0.6)]">
      {/* Wooden rim glow */}
      <div className="absolute inset-0 rounded-3xl ring-2 ring-yellow-600/30 pointer-events-none" />

      {/* Felt table + vignette */}
      <div
        className={clsx('relative p-3 sm:p-4', compact ? 'min-h-[200px]' : 'min-h-[340px]')}
        style={{
          background:
            'radial-gradient(ellipse at top, #1a6b3d 0%, #0d4326 55%, #051a0e 100%)',
        }}
      >
        {/* Felt texture — subtle weave */}
        <div
          className="absolute inset-0 opacity-30 pointer-events-none"
          style={{
            backgroundImage:
              "repeating-linear-gradient(45deg, rgba(0,0,0,0.15) 0 1px, transparent 1px 3px), repeating-linear-gradient(-45deg, rgba(255,255,255,0.04) 0 1px, transparent 1px 3px)",
          }}
        />

        {/* Ambient warm spotlight from dealer */}
        <div
          className="absolute -top-20 right-10 w-[280px] h-[280px] pointer-events-none opacity-60"
          style={{
            background:
              'radial-gradient(circle, rgba(255,200,80,0.4) 0%, transparent 70%)',
          }}
        />

        {/* Dealer avatar — SVG stylized croupier */}
        <div className="absolute top-3 right-3 flex items-center gap-2 z-10">
          <div className="hidden sm:flex flex-col items-end">
            <div className="text-[10px] uppercase tracking-wider text-yellow-300/80 font-bold">
              Chuyên viên chia bài
            </div>
            {dealerStatus && (
              <motion.div
                key={dealerStatus}
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xs text-white/90 font-semibold"
              >
                {dealerStatus}
              </motion.div>
            )}
          </div>
          <DealerAvatar />
        </div>

        {/* Game title */}
        <div className="relative z-10 mb-4 inline-flex items-center gap-2 bg-black/40 backdrop-blur px-3 py-1.5 rounded-full border border-yellow-600/40">
          <span className="text-xl">{gameIcon}</span>
          <span className="text-sm font-black tracking-wider text-yellow-300 uppercase">
            {gameName}
          </span>
        </div>

        {/* Main scene */}
        <div className={clsx('relative z-10 flex items-center justify-center', compact ? 'min-h-[160px]' : 'min-h-[240px]')}>
          {children}
        </div>
      </div>

      {/* Inner bottom gold line */}
      <div className="h-[3px] bg-gradient-to-r from-yellow-700 via-yellow-400 to-yellow-700" />
    </div>
  );
};

/**
 * Inline SVG croupier avatar — genderless professional in bow tie,
 * works at 64px and pairs with the casino rim styling.
 */
const DealerAvatar: React.FC = () => (
  <motion.div
    initial={{ scale: 0.8, opacity: 0 }}
    animate={{ scale: 1, opacity: 1 }}
    transition={{ type: 'spring', stiffness: 180 }}
    className="relative"
  >
    <div className="absolute inset-0 rounded-full bg-yellow-400/30 blur-md" />
    <svg
      width="64"
      height="64"
      viewBox="0 0 64 64"
      className="relative rounded-full border-2 border-yellow-500 bg-gradient-to-b from-[#2a1208] to-[#0d0403] shadow-lg"
    >
      {/* Head */}
      <circle cx="32" cy="22" r="9" fill="#e8c69a" />
      {/* Hair — slicked back */}
      <path d="M23 20 Q32 10 41 20 Q40 15 32 13 Q24 15 23 20 Z" fill="#2a1b0f" />
      {/* Eyes */}
      <circle cx="29" cy="22" r="1" fill="#1a0d05" />
      <circle cx="35" cy="22" r="1" fill="#1a0d05" />
      {/* Smile */}
      <path d="M29 26 Q32 28 35 26" stroke="#8b4513" strokeWidth="0.8" fill="none" strokeLinecap="round" />
      {/* Shirt collar (white) */}
      <path d="M20 38 L26 32 L32 36 L38 32 L44 38 L44 64 L20 64 Z" fill="#f5f5f5" />
      {/* Black vest */}
      <path d="M20 40 L26 34 L32 38 L38 34 L44 40 L44 64 L20 64 Z" fill="#0a0a0a" />
      <path d="M26 34 L32 38 L38 34 L38 54 L32 52 L26 54 Z" fill="#1a1a1a" />
      {/* Red bow tie */}
      <path d="M28 34 L32 36 L36 34 L34 38 L30 38 Z" fill="#b91c1c" />
      <circle cx="32" cy="36" r="0.8" fill="#7f1d1d" />
      {/* Gold lapel pin */}
      <circle cx="28" cy="44" r="1" fill="#fbbf24" />
    </svg>
    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-500 border-2 border-[#2a1208] animate-pulse" />
  </motion.div>
);
