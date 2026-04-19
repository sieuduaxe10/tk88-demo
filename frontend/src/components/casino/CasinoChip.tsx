import React from 'react';
import { motion } from 'framer-motion';

/**
 * Casino chip — round disc with dashed edge pattern, denomination in center.
 * Color-coded by value (VND): white < red < blue < green < black/gold.
 */
const chipStyle = (value: number) => {
  if (value >= 1_000_000)
    return { bg: '#111827', edge: '#fbbf24', text: '#fbbf24', ring: '#1f2937' };
  if (value >= 500_000)
    return { bg: '#15803d', edge: '#bbf7d0', text: '#fff', ring: '#14532d' };
  if (value >= 100_000)
    return { bg: '#1d4ed8', edge: '#bfdbfe', text: '#fff', ring: '#1e3a8a' };
  if (value >= 50_000)
    return { bg: '#dc2626', edge: '#fecaca', text: '#fff', ring: '#7f1d1d' };
  return { bg: '#f8fafc', edge: '#475569', text: '#1e293b', ring: '#94a3b8' };
};

export const formatChipLabel = (v: number) => {
  if (v >= 1_000_000_000) return `${(v / 1_000_000_000).toFixed(1)}B`;
  if (v >= 1_000_000) {
    const m = v / 1_000_000;
    return m === Math.floor(m) ? `${m}M` : `${m.toFixed(1)}M`;
  }
  if (v >= 1_000) return `${Math.round(v / 1_000)}K`;
  return String(v);
};

export const CasinoChip: React.FC<{
  value: number;
  size?: number;
  className?: string;
}> = ({ value, size = 42, className }) => {
  const c = chipStyle(value);
  const pad = size * 0.14;

  return (
    <div
      className={className}
      style={{
        width: size,
        height: size,
        position: 'relative',
        borderRadius: '50%',
        background: `radial-gradient(circle at 30% 25%, ${c.bg} 0%, ${c.ring} 100%)`,
        boxShadow: `0 3px 6px rgba(0,0,0,0.55), inset 0 2px 4px rgba(255,255,255,0.2), inset 0 -3px 6px rgba(0,0,0,0.35)`,
      }}
    >
      {/* Dashed outer edge — 8 dashes */}
      <svg
        viewBox="0 0 100 100"
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ transform: 'rotate(-11deg)' }}
      >
        {Array.from({ length: 8 }).map((_, i) => {
          const a = (i * 360) / 8;
          return (
            <rect
              key={i}
              x={48}
              y={2}
              width={4}
              height={12}
              fill={c.edge}
              transform={`rotate(${a} 50 50)`}
              rx={1}
            />
          );
        })}
      </svg>
      {/* Inner disc with value */}
      <div
        className="absolute inset-0 flex items-center justify-center rounded-full"
        style={{
          margin: pad,
          background: `radial-gradient(circle at 35% 30%, ${c.ring} 0%, ${c.bg} 60%, ${c.ring} 100%)`,
          border: `1.5px solid ${c.edge}`,
          color: c.text,
          fontWeight: 900,
          fontSize: size * 0.28,
          fontFamily: 'system-ui, -apple-system, sans-serif',
          letterSpacing: size > 30 ? '0.02em' : 0,
          textShadow: '0 1px 1px rgba(0,0,0,0.5)',
        }}
      >
        {formatChipLabel(value)}
      </div>
    </div>
  );
};

/**
 * Stack of chips — newest drops in from above with a spring.
 * Use inside bet-option buttons to show the wagered chips.
 */
export const ChipStack: React.FC<{
  chips: { id: number; value: number }[];
  size?: number;
  maxVisible?: number;
}> = ({ chips, size = 26, maxVisible = 5 }) => {
  const visible = chips.slice(-maxVisible);
  const hidden = Math.max(0, chips.length - maxVisible);
  return (
    <div
      className="relative pointer-events-none"
      style={{ width: size, height: size + (visible.length - 1) * 4 }}
    >
      {visible.map((chip, i) => (
        <motion.div
          key={chip.id}
          initial={{ y: -60, scale: 0, rotate: -200, opacity: 0 }}
          animate={{ y: -i * 4, scale: 1, rotate: 0, opacity: 1 }}
          transition={{
            type: 'spring',
            stiffness: 320,
            damping: 18,
            delay: i === visible.length - 1 ? 0 : 0.02 * i,
          }}
          className="absolute left-0"
          style={{ bottom: 0 }}
        >
          <CasinoChip value={chip.value} size={size} />
        </motion.div>
      ))}
      {hidden > 0 && (
        <div
          className="absolute left-1/2 -translate-x-1/2 -top-3 bg-black/80 text-yellow-300 text-[9px] font-black px-1 rounded"
          style={{ fontSize: size * 0.3 }}
        >
          +{hidden}
        </div>
      )}
    </div>
  );
};
