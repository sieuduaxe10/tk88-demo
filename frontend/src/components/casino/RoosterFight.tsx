import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Cartoon fighting rooster — inline SVG, face-right by default.
 * Pass `flip` to mirror horizontally.
 */
const RoosterSVG: React.FC<{
  palette: 'red' | 'blue';
  flip?: boolean;
  knockedOut?: boolean;
}> = ({ palette, flip, knockedOut }) => {
  const body = palette === 'red' ? '#dc2626' : '#2563eb';
  const bodyDark = palette === 'red' ? '#7f1d1d' : '#1e3a8a';
  const bodyHi = palette === 'red' ? '#fca5a5' : '#93c5fd';
  const tail =
    palette === 'red'
      ? ['#7c2d12', '#ea580c', '#fbbf24', '#fde68a']
      : ['#0f172a', '#1e40af', '#06b6d4', '#67e8f9'];
  const comb = '#ef4444';
  const beak = '#f59e0b';
  const leg = '#f59e0b';

  return (
    <svg
      viewBox="0 0 140 140"
      width="100%"
      height="100%"
      style={{
        transform: `${flip ? 'scaleX(-1)' : 'scaleX(1)'} ${
          knockedOut ? 'rotate(75deg)' : ''
        }`,
        transformOrigin: 'center',
        filter: knockedOut
          ? 'grayscale(0.5) brightness(0.7)'
          : 'drop-shadow(0 4px 6px rgba(0,0,0,0.4))',
        transition: 'transform 0.4s ease, filter 0.4s ease',
      }}
    >
      <defs>
        <radialGradient id={`body-${palette}`} cx="30%" cy="30%">
          <stop offset="0%" stopColor={bodyHi} />
          <stop offset="60%" stopColor={body} />
          <stop offset="100%" stopColor={bodyDark} />
        </radialGradient>
      </defs>

      {/* Tail feathers — fan of curved strokes */}
      {tail.map((c, i) => (
        <path
          key={i}
          d={`M 95 75 Q ${115 + i * 6} ${50 - i * 8} ${110 + i * 5} ${
            95 + i * 3
          }`}
          stroke={c}
          strokeWidth={10 - i * 1.2}
          fill="none"
          strokeLinecap="round"
        />
      ))}

      {/* Body */}
      <ellipse
        cx="65"
        cy="85"
        rx="32"
        ry="26"
        fill={`url(#body-${palette})`}
        stroke={bodyDark}
        strokeWidth="1.5"
      />

      {/* Wing */}
      <motion.ellipse
        cx="58"
        cy="86"
        rx="22"
        ry="14"
        fill={bodyDark}
        animate={
          !knockedOut
            ? { scaleY: [1, 0.4, 1] }
            : { scaleY: 1 }
        }
        style={{ transformOrigin: 'center' }}
        transition={{ duration: 0.4, repeat: Infinity, ease: 'easeInOut' }}
      />
      <path
        d="M 38 86 Q 58 76 78 86"
        stroke={bodyHi}
        strokeWidth="1.5"
        fill="none"
        opacity="0.6"
      />

      {/* Chest fluff */}
      <path
        d="M 40 90 Q 35 98 42 105 Q 48 100 46 92 Z"
        fill={bodyDark}
        opacity="0.7"
      />

      {/* Head */}
      <circle cx="38" cy="55" r="18" fill={`url(#body-${palette})`} />

      {/* Neck */}
      <path
        d="M 30 68 Q 40 78 50 72"
        stroke={bodyDark}
        strokeWidth="2"
        fill="none"
      />

      {/* Comb (red zigzag on top of head) */}
      <path
        d="M 23 40 L 26 28 L 32 36 L 38 25 L 44 36 L 50 28 L 52 42 Z"
        fill={comb}
        stroke="#991b1b"
        strokeWidth="1"
      />

      {/* Eye */}
      <circle cx="32" cy="52" r="4" fill="white" />
      <circle cx="31" cy="52" r="2.5" fill="#000" />
      <circle cx="30" cy="51" r="0.8" fill="white" />

      {/* Angry eyebrow */}
      <path
        d="M 27 46 L 36 48"
        stroke="#000"
        strokeWidth="2"
        strokeLinecap="round"
      />

      {/* Beak */}
      <path
        d="M 16 54 L 26 50 L 26 58 Z"
        fill={beak}
        stroke="#b45309"
        strokeWidth="1"
      />

      {/* Wattle (red pouch under beak) */}
      <path
        d="M 22 60 Q 18 68 26 70 Q 28 64 26 58 Z"
        fill={comb}
        stroke="#991b1b"
        strokeWidth="0.8"
      />

      {/* Legs — bent like a fighter stance */}
      <line
        x1="55"
        y1="108"
        x2="50"
        y2="128"
        stroke={leg}
        strokeWidth="4"
        strokeLinecap="round"
      />
      <line
        x1="75"
        y1="108"
        x2="82"
        y2="128"
        stroke={leg}
        strokeWidth="4"
        strokeLinecap="round"
      />
      {/* Feet */}
      <path
        d="M 42 128 L 58 128 M 50 128 L 48 133 M 54 128 L 54 133"
        stroke={leg}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path
        d="M 74 128 L 90 128 M 82 128 L 80 133 M 86 128 L 86 133"
        stroke={leg}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      {/* Spurs (đinh thép) */}
      <path
        d="M 82 128 L 90 123"
        stroke="#64748b"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M 50 128 L 42 123"
        stroke="#64748b"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
};

/**
 * 2 fighting roosters (cockfight). Left = red, right = blue.
 * While `fighting=true`: they bob in and clash periodically with dust puff.
 * When `winner` set: winner struts tall, loser slumps down knocked out.
 */
export const RoosterFight: React.FC<{
  fighting: boolean;
  winner: 'red' | 'blue' | null;
}> = ({ fighting, winner }) => {
  const [clash, setClash] = useState(0);

  // Periodic clash pulse during fight.
  useEffect(() => {
    if (!fighting) return;
    const t = setInterval(() => setClash((n) => n + 1), 1200);
    return () => clearInterval(t);
  }, [fighting]);

  const leftAnim = fighting
    ? {
        x: [0, 40, 10, 35, 0],
        y: [0, -18, 0, -10, 0],
        rotate: [0, -8, 0, 6, 0],
      }
    : winner === 'red'
    ? { x: -10, y: -8, rotate: 0, scale: 1.08 }
    : winner === 'blue'
    ? { x: -30, y: 40, rotate: 0, scale: 0.9 }
    : { x: 0, y: 0, rotate: 0, scale: 1 };

  const rightAnim = fighting
    ? {
        x: [0, -40, -10, -35, 0],
        y: [0, -18, 0, -10, 0],
        rotate: [0, 8, 0, -6, 0],
      }
    : winner === 'blue'
    ? { x: 10, y: -8, rotate: 0, scale: 1.08 }
    : winner === 'red'
    ? { x: 30, y: 40, rotate: 0, scale: 0.9 }
    : { x: 0, y: 0, rotate: 0, scale: 1 };

  return (
    <div className="relative w-[320px] h-[200px] mx-auto">
      {/* Sand/arena floor */}
      <div
        className="absolute bottom-0 left-0 right-0 h-4 rounded-b-xl"
        style={{
          background:
            'linear-gradient(to bottom, #d97706 0%, #92400e 60%, #451a03 100%)',
          boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.4)',
        }}
      />
      {/* Arena ring circle */}
      <div
        className="absolute bottom-4 left-1/2 -translate-x-1/2 w-[280px] h-3 rounded-full opacity-40 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse, rgba(255,215,0,0.5) 0%, transparent 70%)',
        }}
      />

      {/* Clash effects */}
      <AnimatePresence>
        {fighting && clash > 0 && (
          <motion.div
            key={clash}
            initial={{ scale: 0, opacity: 0, rotate: 0 }}
            animate={{ scale: [0, 1.6, 1.2], opacity: [0, 1, 0], rotate: 25 }}
            transition={{ duration: 0.7 }}
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-6xl pointer-events-none z-20"
            style={{ filter: 'drop-shadow(0 0 8px rgba(255,215,0,0.8))' }}
          >
            💥
          </motion.div>
        )}
      </AnimatePresence>

      {/* Feather/dust particles when clashing */}
      <AnimatePresence>
        {fighting && clash > 0 && (
          <motion.div
            key={`dust-${clash}`}
            className="absolute inset-0 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0] }}
            transition={{ duration: 0.9 }}
          >
            {Array.from({ length: 6 }).map((_, i) => (
              <motion.div
                key={i}
                className="absolute left-1/2 top-1/2 text-lg"
                initial={{ x: 0, y: 0, rotate: 0, opacity: 1 }}
                animate={{
                  x: Math.cos((i * 60 * Math.PI) / 180) * 80,
                  y: Math.sin((i * 60 * Math.PI) / 180) * 60 - 20,
                  rotate: 180 + i * 60,
                  opacity: 0,
                }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
              >
                {i % 2 === 0 ? '🪶' : '💨'}
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Red rooster (left, faces right — no flip) */}
      <motion.div
        className="absolute bottom-3 left-8 w-[120px] h-[140px] z-10"
        animate={leftAnim}
        transition={
          fighting
            ? { duration: 1.2, repeat: Infinity, ease: 'easeInOut' }
            : { duration: 0.6, type: 'spring', stiffness: 180 }
        }
      >
        <RoosterSVG palette="red" knockedOut={winner === 'blue'} />
      </motion.div>

      {/* Blue rooster (right, faces left — flip) */}
      <motion.div
        className="absolute bottom-3 right-8 w-[120px] h-[140px] z-10"
        animate={rightAnim}
        transition={
          fighting
            ? { duration: 1.2, repeat: Infinity, ease: 'easeInOut' }
            : { duration: 0.6, type: 'spring', stiffness: 180 }
        }
      >
        <RoosterSVG palette="blue" flip knockedOut={winner === 'red'} />
      </motion.div>

      {/* VS badge in middle when idle */}
      {!fighting && !winner && (
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/70 border-2 border-yellow-500 rounded-full w-10 h-10 flex items-center justify-center font-black text-yellow-300 text-sm shadow-lg">
          VS
        </div>
      )}

      {/* Winner crown */}
      {winner && (
        <motion.div
          initial={{ scale: 0, y: -20 }}
          animate={{ scale: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 260, delay: 0.4 }}
          className="absolute text-4xl z-20"
          style={
            winner === 'red'
              ? { left: 30, top: 10 }
              : { right: 30, top: 10 }
          }
        >
          👑
        </motion.div>
      )}
    </div>
  );
};
