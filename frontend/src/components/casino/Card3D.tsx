import React from 'react';
import { motion } from 'framer-motion';
import clsx from 'clsx';

const RANK_LABEL: Record<number, string> = {
  1: 'A',
  11: 'J',
  12: 'Q',
  13: 'K',
};
const rankStr = (r: number) => RANK_LABEL[r] ?? String(r);
const isRed = (suit: string) => suit === '♥' || suit === '♦';

export interface CardData {
  rank: number;
  suit: string;
}

/**
 * Playing card with 3D flip. `revealed=false` shows the patterned back.
 */
export const PlayingCard: React.FC<{
  card?: CardData | null;
  revealed: boolean;
  size?: 'sm' | 'md' | 'lg';
  dealDelay?: number;
  revealDelay?: number;
}> = ({ card, revealed, size = 'md', dealDelay = 0, revealDelay = 0 }) => {
  const dim =
    size === 'sm'
      ? { w: 56, h: 80, fontBig: 'text-2xl', fontCorner: 'text-xs' }
      : size === 'lg'
      ? { w: 96, h: 140, fontBig: 'text-5xl', fontCorner: 'text-base' }
      : { w: 72, h: 104, fontBig: 'text-4xl', fontCorner: 'text-sm' };

  const r = card?.rank ?? 1;
  const s = card?.suit ?? '♠';
  const red = isRed(s);

  return (
    <motion.div
      initial={{ y: -80, opacity: 0, rotate: -20 }}
      animate={{ y: 0, opacity: 1, rotate: 0 }}
      transition={{ type: 'spring', stiffness: 180, damping: 18, delay: dealDelay }}
      style={{ width: dim.w, height: dim.h, perspective: 1000 }}
      className="relative"
    >
      <motion.div
        className="w-full h-full relative"
        style={{ transformStyle: 'preserve-3d' }}
        animate={{ rotateY: revealed ? 180 : 0 }}
        transition={{ duration: 0.6, ease: [0.45, 0.05, 0.55, 0.95], delay: revealed ? revealDelay : 0 }}
      >
        {/* BACK face (default visible) */}
        <div
          className="absolute inset-0 rounded-lg border-2 border-white bg-gradient-to-br from-red-800 via-red-900 to-red-950 shadow-lg overflow-hidden"
          style={{ backfaceVisibility: 'hidden' }}
        >
          {/* Argyle pattern */}
          <div
            className="absolute inset-1 rounded opacity-70"
            style={{
              background:
                'repeating-linear-gradient(45deg, rgba(255,215,0,0.2) 0 6px, transparent 6px 12px), repeating-linear-gradient(-45deg, rgba(255,215,0,0.2) 0 6px, transparent 6px 12px)',
              border: '1.5px solid rgba(255,215,0,0.5)',
            }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-yellow-400 font-black text-xl drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
              ♦ TK88 ♦
            </div>
          </div>
        </div>

        {/* FRONT face */}
        <div
          className={clsx(
            'absolute inset-0 rounded-lg bg-white shadow-xl border border-slate-300 flex flex-col justify-between p-1.5',
            red ? 'text-red-600' : 'text-slate-900',
          )}
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
        >
          <div className={clsx(dim.fontCorner, 'font-black leading-none')}>
            <div>{rankStr(r)}</div>
            <div>{s}</div>
          </div>
          <div className={clsx(dim.fontBig, 'font-black text-center')}>{s}</div>
          <div
            className={clsx(dim.fontCorner, 'font-black leading-none self-end')}
            style={{ transform: 'rotate(180deg)' }}
          >
            <div>{rankStr(r)}</div>
            <div>{s}</div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

/**
 * Two-side card table for Baccarat / Long Ho.
 */
export const CardsTable: React.FC<{
  sideLeft: { label: string; cards: CardData[]; total?: number; color: string };
  sideRight: { label: string; cards: CardData[]; total?: number; color: string };
  revealed: boolean;
}> = ({ sideLeft, sideRight, revealed }) => {
  // Flip order: CON1 (0s), CÁI1 (0.7s), CON2 (1.4s), CÁI2 (2.1s)
  // Pause 1.2s so player reads totals, then 3rd cards if any.
  // CON3 (4.0s), CÁI3 (4.7s)
  const flipDelay = (k: number, sideIdx: number) =>
    (k * 2 + sideIdx) * 0.7 + (k >= 2 ? 1.2 : 0);
  return (
    <div className="w-full flex items-start justify-around gap-2 sm:gap-6">
      {[sideLeft, sideRight].map((side, sideIdx) => {
        const maxCards = Math.max(sideLeft.cards.length, sideRight.cards.length, 2);
        const lastIdx = side.cards.length - 1;
        const lastDelay = lastIdx >= 0 ? flipDelay(lastIdx, sideIdx) : 0;
        return (
          <div key={sideIdx} className="flex flex-col items-center gap-2">
            <div
              className={clsx(
                'px-3 py-1 rounded-full text-sm font-black tracking-wider uppercase shadow-lg',
                side.color,
              )}
            >
              {side.label}
              {revealed && side.total !== undefined && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: lastDelay + 0.6 }}
                  className="ml-2 text-yellow-300"
                >
                  · {side.total}
                </motion.span>
              )}
            </div>
            <div className="flex gap-1.5">
              {side.cards.length === 0
                ? Array.from({ length: maxCards }).map((_, k) => (
                    <PlayingCard key={k} revealed={false} dealDelay={k * 0.15} />
                  ))
                : side.cards.map((c, k) => (
                    <PlayingCard
                      key={k}
                      card={c}
                      revealed={revealed}
                      dealDelay={
                        k < 2
                          ? k * 0.15 + (sideIdx === 0 ? 0 : 0.25)
                          : flipDelay(k, sideIdx) - 0.4
                      }
                      revealDelay={flipDelay(k, sideIdx)}
                    />
                  ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};
