import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import clsx from 'clsx';

export const BAUCUA_SYMBOLS = ['bau', 'cua', 'tom', 'ca', 'ga', 'nai'] as const;
export type BauCuaSymbol = (typeof BAUCUA_SYMBOLS)[number];

export const BAUCUA_EMOJI: Record<BauCuaSymbol, string> = {
  bau: '🎍',
  cua: '🦀',
  tom: '🦐',
  ca: '🐟',
  ga: '🐓',
  nai: '🦌',
};

export const BAUCUA_LABEL: Record<BauCuaSymbol, string> = {
  bau: 'Bầu',
  cua: 'Cua',
  tom: 'Tôm',
  ca: 'Cá',
  ga: 'Gà',
  nai: 'Nai',
};

// Symbol face colors (hue backgrounds per face for visual variety).
const FACE_BG: Record<BauCuaSymbol, string> = {
  bau: 'linear-gradient(135deg, #86efac, #16a34a)',
  cua: 'linear-gradient(135deg, #fca5a5, #dc2626)',
  tom: 'linear-gradient(135deg, #fdba74, #ea580c)',
  ca: 'linear-gradient(135deg, #93c5fd, #2563eb)',
  ga: 'linear-gradient(135deg, #fde68a, #f59e0b)',
  nai: 'linear-gradient(135deg, #d6bb9c, #92400e)',
};

// Position each symbol on a cube face. translateZ brings face outward.
const FACE_POSITIONS: Record<BauCuaSymbol, string> = {
  bau: 'translateZ',
  cua: 'rotateY(180deg) translateZ',
  tom: 'rotateY(90deg) translateZ',
  ca: 'rotateY(-90deg) translateZ',
  ga: 'rotateX(-90deg) translateZ',
  nai: 'rotateX(90deg) translateZ',
};

// Final rotation to bring the target face to camera.
const SETTLED_ROT: Record<BauCuaSymbol, string> = {
  bau: 'rotateY(0deg)',
  cua: 'rotateY(180deg)',
  tom: 'rotateY(-90deg)',
  ca: 'rotateY(90deg)',
  ga: 'rotateX(90deg)',
  nai: 'rotateX(-90deg)',
};

const SymbolFace: React.FC<{ symbol: BauCuaSymbol; transform: string; size: number }> = ({
  symbol,
  transform,
  size,
}) => (
  <div
    className="absolute inset-0 rounded-lg border-2 border-white/70 shadow-inner flex items-center justify-center"
    style={{
      transform,
      backfaceVisibility: 'hidden',
      background: FACE_BG[symbol],
      fontSize: size * 0.55,
    }}
  >
    <span className="drop-shadow-[0_2px_3px_rgba(0,0,0,0.5)]">{BAUCUA_EMOJI[symbol]}</span>
  </div>
);

export const BauCuaDie: React.FC<{
  symbol: BauCuaSymbol;
  rolling: boolean;
  delay?: number;
  size?: number;
  tilt?: number;
}> = ({ symbol, rolling, delay = 0, size = 64, tilt = 0 }) => {
  const half = size / 2;
  const settled = SETTLED_ROT[symbol];

  return (
    <div style={{ width: size, height: size, perspective: 800 }} className="relative">
      <motion.div
        className="relative w-full h-full"
        style={{ transformStyle: 'preserve-3d' }}
        animate={
          rolling
            ? {
                rotateX: [0, 360, 720, 1080],
                rotateY: [0, 360, 720, 1080],
                rotateZ: 0,
                y: [0, -18, 8, 0],
              }
            : { rotateX: 0, rotateY: 0, rotateZ: tilt, y: 0 }
        }
        transition={
          rolling
            ? { duration: 1.6, ease: 'linear', repeat: Infinity, delay }
            : { duration: 0.4, type: 'spring', stiffness: 120 }
        }
      >
        <div
          className="absolute inset-0"
          style={{
            transformStyle: 'preserve-3d',
            transform: rolling ? 'none' : settled,
          }}
        >
          {BAUCUA_SYMBOLS.map((s) => (
            <SymbolFace
              key={s}
              symbol={s}
              transform={`${FACE_POSITIONS[s]}(${half}px)`}
              size={size}
            />
          ))}
        </div>
      </motion.div>
      <motion.div
        className="absolute left-1/2 -bottom-1 w-8 h-1.5 rounded-full bg-black/50 blur-sm"
        animate={{ scale: rolling ? [1, 0.6, 1] : 1 }}
        transition={{ duration: 1.6, repeat: rolling ? Infinity : 0, delay }}
        style={{ transform: 'translateX(-50%)' }}
      />
    </div>
  );
};

/**
 * Bầu Cua bowl: 3 dice in a pyramid + golden dish cover, drag to peek.
 */
export const BauCuaBowl: React.FC<{
  symbols: [BauCuaSymbol, BauCuaSymbol, BauCuaSymbol];
  rolling: boolean;
  onAllPeeked?: () => void;
  onPeekSound?: () => void;
}> = ({ symbols, rolling, onAllPeeked, onPeekSound }) => {
  const [revealed, setRevealed] = useState(false);
  const [flyTo, setFlyTo] = useState<{ x: number; y: number; rot: number }>({
    x: 0,
    y: -280,
    rot: -22,
  });

  useEffect(() => {
    if (rolling) setRevealed(false);
  }, [rolling]);

  const peel = (dx = 0, dy = -260) => {
    if (rolling || revealed) return;
    const mag = Math.hypot(dx, dy) || 1;
    const dist = 320;
    const x = (dx / mag) * dist;
    const y = (dy / mag) * dist;
    const rot = Math.max(-45, Math.min(45, dx / 10 + (dy < 0 ? -15 : 15)));
    setFlyTo({ x, y, rot });
    onPeekSound?.();
    setRevealed(true);
    setTimeout(() => onAllPeeked?.(), 620);
  };

  const canPeel = !rolling && !revealed;
  const tilts = [-9, 14, -16];

  return (
    <div className="relative">
      <div className="relative w-[280px] h-[210px] rounded-[100px] border-4 border-yellow-700/60 bg-gradient-to-b from-red-950 via-red-900 to-red-950 shadow-[inset_0_4px_12px_rgba(0,0,0,0.6)] flex flex-col items-center justify-center gap-6 py-4">
        {/* Rim shine */}
        <div className="absolute top-1 left-4 right-4 h-1 rounded-full bg-yellow-400/40 blur-sm" />

        {/* Top die */}
        <div className="flex justify-center">
          <BauCuaDie symbol={symbols[0]} rolling={rolling} delay={0} size={62} tilt={tilts[0]} />
        </div>
        {/* Bottom pair */}
        <div className="flex justify-center gap-9">
          <BauCuaDie symbol={symbols[1]} rolling={rolling} delay={0.08} size={62} tilt={tilts[1]} />
          <BauCuaDie symbol={symbols[2]} rolling={rolling} delay={0.16} size={62} tilt={tilts[2]} />
        </div>

        {/* Lid — drag any direction to peek */}
        <div
          className="absolute inset-x-0 flex justify-center"
          style={{ top: 12, pointerEvents: canPeel ? 'auto' : 'none' }}
        >
          <motion.div
            drag={canPeel}
            dragConstraints={{ top: -240, bottom: 240, left: -240, right: 240 }}
            dragElastic={0.2}
            onDragEnd={(_, info) => {
              const dist = Math.hypot(info.offset.x, info.offset.y);
              const speed = Math.hypot(info.velocity.x, info.velocity.y);
              if (dist > 55 || speed > 500) peel(info.offset.x, info.offset.y);
            }}
            onClick={canPeel ? () => peel(0, -240) : undefined}
            initial={{ x: 0, y: -280, opacity: 0, scale: 0.7, rotate: -10 }}
            animate={
              rolling
                ? { x: 0, y: -280, opacity: 0, scale: 0.7, rotate: -10 }
                : revealed
                ? {
                    x: flyTo.x,
                    y: flyTo.y,
                    opacity: 0,
                    scale: 0.6,
                    rotate: flyTo.rot,
                  }
                : { x: 0, y: 0, opacity: 1, scale: 1, rotate: 0 }
            }
            transition={
              rolling
                ? { duration: 0.25 }
                : revealed
                ? { duration: 0.6, ease: [0.45, 0, 0.2, 1] }
                : { duration: 0.65, type: 'spring', stiffness: 200, damping: 13 }
            }
            whileHover={canPeel ? { scale: 1.03 } : undefined}
            whileTap={canPeel ? { scale: 0.97 } : undefined}
            className={clsx(
              'relative select-none',
              canPeel ? 'cursor-grab active:cursor-grabbing' : '',
            )}
            style={{
              width: 240,
              height: 180,
              borderRadius: '50% / 50%',
              background:
                'radial-gradient(ellipse at 35% 25%, #fef3c7 0%, #f59e0b 25%, #b45309 60%, #78350f 100%)',
              border: '4px solid #fbbf24',
              boxShadow:
                '0 10px 24px rgba(0,0,0,0.65), inset 0 6px 14px rgba(255,255,255,0.3), inset 0 -10px 18px rgba(0,0,0,0.45)',
            }}
          >
            <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none">
              <motion.div
                className="w-10 h-10 rounded-full bg-gradient-to-b from-red-400 via-red-600 to-red-900 border-2 border-yellow-200 shadow-[0_3px_6px_rgba(0,0,0,0.5),inset_0_2px_3px_rgba(255,255,255,0.5)]"
                animate={canPeel ? { scale: [1, 1.12, 1] } : { scale: 1 }}
                transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
              />
            </div>

            <div
              className="absolute inset-3 rounded-full pointer-events-none"
              style={{
                border: '2px solid rgba(255, 215, 0, 0.35)',
                boxShadow: 'inset 0 0 12px rgba(255, 215, 0, 0.15)',
              }}
            />

            <div className="absolute inset-x-0 bottom-3 text-center text-yellow-900 text-[9px] font-black tracking-[0.2em] uppercase drop-shadow-[0_1px_0_rgba(255,255,255,0.5)]">
              {canPeel ? '✋ KÉO ĐỂ MỞ' : ''}
            </div>
          </motion.div>
        </div>
      </div>

      <div className="mt-2 text-center min-h-[20px]">
        {rolling ? (
          <span className="text-[11px] text-yellow-300/80 animate-pulse">
            🎲 Đang xóc bầu cua…
          </span>
        ) : !revealed ? (
          <span className="text-[11px] text-yellow-300/90 font-semibold">
            Úp rồi! Kéo hoặc chạm để mở 🫳
          </span>
        ) : null}
      </div>
    </div>
  );
};
