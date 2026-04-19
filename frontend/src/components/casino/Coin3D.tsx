import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import clsx from 'clsx';

/**
 * 3D spinning coin. `side`: 0 = sấp (tails), 1 = ngửa (heads).
 * When `spinning=true`: continuously rotates on X axis.
 */
export const Coin: React.FC<{
  side: 0 | 1;
  spinning: boolean;
  size?: number;
  delay?: number;
}> = ({ side, spinning, size = 64, delay = 0 }) => {
  const half = size / 2;
  // Settled rotation — heads face up when side=1, tails up when side=0
  const settledX = side === 1 ? 0 : 180;

  return (
    <div
      style={{ width: size, height: size, perspective: 600 }}
      className="relative"
    >
      <motion.div
        className="relative w-full h-full"
        style={{ transformStyle: 'preserve-3d' }}
        animate={
          spinning
            ? { rotateX: [0, 720, 1440, 2160], y: [0, -14, 6, 0] }
            : { rotateX: settledX, y: 0 }
        }
        transition={
          spinning
            ? { duration: 1.4, ease: 'linear', repeat: Infinity, delay }
            : { duration: 0.5, type: 'spring', stiffness: 140 }
        }
      >
        {/* HEADS (ngửa) — gold */}
        <div
          className="absolute inset-0 rounded-full border-2 border-yellow-700 flex items-center justify-center font-black text-yellow-900"
          style={{
            background: 'radial-gradient(circle at 30% 30%, #fde68a, #f59e0b 60%, #b45309)',
            transform: `translateZ(${half / 6}px)`,
            backfaceVisibility: 'hidden',
            fontSize: size * 0.35,
          }}
        >
          N
        </div>
        {/* TAILS (sấp) — silver */}
        <div
          className="absolute inset-0 rounded-full border-2 border-slate-500 flex items-center justify-center font-black text-slate-800"
          style={{
            background: 'radial-gradient(circle at 30% 30%, #f1f5f9, #94a3b8 60%, #475569)',
            transform: `rotateX(180deg) translateZ(${half / 6}px)`,
            backfaceVisibility: 'hidden',
            fontSize: size * 0.35,
          }}
        >
          S
        </div>
        {/* Coin rim (edge) */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: 'linear-gradient(90deg, #b45309, #fbbf24, #b45309)',
            transform: `rotateX(90deg) translateZ(0px)`,
            height: size / 6,
            top: `calc(50% - ${size / 12}px)`,
          }}
        />
      </motion.div>
      {/* Shadow */}
      <motion.div
        className="absolute left-1/2 -bottom-1 w-10 h-1.5 rounded-full bg-black/40 blur-sm"
        animate={{ scale: spinning ? [1, 0.7, 1] : 1 }}
        transition={{ duration: 1.4, repeat: spinning ? Infinity : 0, delay }}
        style={{ transform: 'translateX(-50%)' }}
      />
    </div>
  );
};

/**
 * Four coins for Xóc Đĩa. Shows them on a red lacquer dish covered by a
 * plate ("chén") — user drags the plate in any direction (or taps) to
 * peek at the coins after the spin stops.
 */
export const CoinDish: React.FC<{
  coins: [number, number, number, number];
  spinning: boolean;
  onAllPeeked?: () => void;
  onPeekSound?: () => void;
}> = ({ coins, spinning, onAllPeeked, onPeekSound }) => {
  const [revealed, setRevealed] = useState(false);
  const [flyTo, setFlyTo] = useState<{ x: number; y: number; rot: number }>({
    x: 0,
    y: -260,
    rot: -22,
  });

  useEffect(() => {
    if (spinning) setRevealed(false);
  }, [spinning]);

  const peel = (dx = 0, dy = -240) => {
    if (spinning || revealed) return;
    const mag = Math.hypot(dx, dy) || 1;
    const dist = 300;
    const x = (dx / mag) * dist;
    const y = (dy / mag) * dist;
    const rot = Math.max(-45, Math.min(45, dx / 10 + (dy < 0 ? -15 : 15)));
    setFlyTo({ x, y, rot });
    onPeekSound?.();
    setRevealed(true);
    setTimeout(() => onAllPeeked?.(), 620);
  };

  const canPeel = !spinning && !revealed;

  return (
    <div className="relative">
      <div className="relative w-[240px] h-[170px] rounded-[100px] border-4 border-yellow-700/60 bg-gradient-to-b from-red-950 via-red-900 to-red-950 shadow-[inset_0_4px_12px_rgba(0,0,0,0.6)] flex items-center justify-center">
        {/* Rim shine */}
        <div className="absolute top-1 left-4 right-4 h-1 rounded-full bg-yellow-400/40 blur-sm" />

        {/* Coins inside the dish */}
        <div className="grid grid-cols-2 gap-3 p-3 pointer-events-none">
          {coins.map((c, i) => (
            <Coin
              key={i}
              side={(c === 1 ? 1 : 0) as 0 | 1}
              spinning={spinning}
              size={52}
              delay={i * 0.08}
            />
          ))}
        </div>

        {/* Plate cover — drag in any direction to peek */}
        <div
          className="absolute inset-x-0 flex justify-center"
          style={{ top: 8, pointerEvents: canPeel ? 'auto' : 'none' }}
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
            initial={{ x: 0, y: -260, opacity: 0, scale: 0.7, rotate: -10 }}
            animate={
              spinning
                ? { x: 0, y: -260, opacity: 0, scale: 0.7, rotate: -10 }
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
              spinning
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
              width: 200,
              height: 150,
              borderRadius: '50% / 50%',
              background:
                'radial-gradient(ellipse at 35% 25%, #fef3c7 0%, #f59e0b 25%, #b45309 60%, #78350f 100%)',
              border: '4px solid #fbbf24',
              boxShadow:
                '0 10px 24px rgba(0,0,0,0.65), inset 0 6px 14px rgba(255,255,255,0.3), inset 0 -10px 18px rgba(0,0,0,0.45)',
            }}
          >
            {/* Center knob */}
            <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none">
              <motion.div
                className="w-9 h-9 rounded-full bg-gradient-to-b from-red-400 via-red-600 to-red-900 border-2 border-yellow-200 shadow-[0_3px_6px_rgba(0,0,0,0.5),inset_0_2px_3px_rgba(255,255,255,0.5)]"
                animate={canPeel ? { scale: [1, 1.12, 1] } : { scale: 1 }}
                transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
              />
            </div>

            {/* Decorative ring */}
            <div
              className="absolute inset-3 rounded-full pointer-events-none"
              style={{
                border: '2px solid rgba(255, 215, 0, 0.35)',
                boxShadow: 'inset 0 0 12px rgba(255, 215, 0, 0.15)',
              }}
            />

            {/* Hint label */}
            <div className="absolute inset-x-0 bottom-2 text-center text-yellow-900 text-[9px] font-black tracking-[0.2em] uppercase drop-shadow-[0_1px_0_rgba(255,255,255,0.5)]">
              {canPeel ? '✋ KÉO ĐI ĐỂ MỞ' : ''}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Hint below */}
      <div className="mt-2 text-center min-h-[20px]">
        {spinning ? (
          <span className="text-[11px] text-yellow-300/80 animate-pulse">
            🪙 Đang xóc đĩa…
          </span>
        ) : !revealed ? (
          <span className="text-[11px] text-yellow-300/90 font-semibold">
            Úp đĩa rồi! Kéo mọi hướng hoặc chạm để mở 🫳
          </span>
        ) : null}
      </div>
    </div>
  );
};

/**
 * Single flipping coin for Coinflip game.
 */
export const SingleCoin: React.FC<{
  side: 0 | 1;
  spinning: boolean;
}> = ({ side, spinning }) => (
  <div className="flex items-center justify-center p-4">
    <Coin side={side} spinning={spinning} size={120} />
  </div>
);
