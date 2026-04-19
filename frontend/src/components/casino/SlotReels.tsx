import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

/**
 * 3-column slot machine reels. While spinning, each reel cycles through
 * a long symbol strip. On stop, reels snap to the final reveal symbols.
 */
const SYMBOLS = ['🍒', '🍋', '🔔', '💎', '7️⃣', '⭐', '🍉'];

const buildStrip = (final: string, length = 30) => {
  const strip: string[] = [];
  for (let i = 0; i < length; i++) {
    strip.push(SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]);
  }
  strip.push(final);
  return strip;
};

const Reel: React.FC<{
  finalSymbol: string;
  spinning: boolean;
  delay: number;
}> = ({ finalSymbol, spinning, delay }) => {
  const [strip, setStrip] = useState<string[]>(() => buildStrip(finalSymbol));
  const itemH = 72;

  useEffect(() => {
    if (spinning) setStrip(buildStrip(finalSymbol));
  }, [spinning, finalSymbol]);

  const finalY = -(strip.length - 1) * itemH;

  return (
    <div
      className="relative overflow-hidden rounded-lg bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 border-2 border-yellow-600/70 shadow-inner"
      style={{ width: 88, height: itemH }}
    >
      <motion.div
        initial={{ y: 0 }}
        animate={spinning ? { y: finalY } : { y: finalY }}
        transition={
          spinning
            ? { duration: 1.8 + delay, ease: [0.2, 0, 0.2, 1] }
            : { duration: 0.4, ease: 'easeOut' }
        }
      >
        {strip.map((s, i) => (
          <div
            key={i}
            className="flex items-center justify-center text-5xl"
            style={{ height: itemH }}
          >
            {s}
          </div>
        ))}
      </motion.div>
      {/* Glass shine */}
      <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
      <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
    </div>
  );
};

export const SlotReels: React.FC<{
  reels: [string, string, string];
  spinning: boolean;
}> = ({ reels, spinning }) => {
  return (
    <div className="relative">
      {/* Machine frame */}
      <div className="relative p-4 rounded-2xl bg-gradient-to-b from-red-700 via-red-800 to-red-950 border-4 border-yellow-500 shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
        {/* Marquee */}
        <div className="text-center font-black text-yellow-300 text-xs tracking-widest mb-2 drop-shadow">
          ★ JACKPOT ★
        </div>
        <div className="flex gap-2 justify-center">
          {reels.map((r, i) => (
            <Reel key={i} finalSymbol={r} spinning={spinning} delay={i * 0.3} />
          ))}
        </div>
        {/* Side bulbs */}
        <div className="absolute -left-2 top-1/2 -translate-y-1/2 flex flex-col gap-1">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 rounded-full bg-yellow-300"
              animate={{ opacity: spinning ? [1, 0.3, 1] : 1 }}
              transition={{ duration: 0.4, repeat: spinning ? Infinity : 0, delay: i * 0.1 }}
            />
          ))}
        </div>
        <div className="absolute -right-2 top-1/2 -translate-y-1/2 flex flex-col gap-1">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 rounded-full bg-yellow-300"
              animate={{ opacity: spinning ? [1, 0.3, 1] : 1 }}
              transition={{ duration: 0.4, repeat: spinning ? Infinity : 0, delay: i * 0.1 + 0.2 }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
