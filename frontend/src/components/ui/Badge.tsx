import React from 'react';
import clsx from 'clsx';

type Variant = 'hot' | 'new' | 'jackpot' | 'live' | 'vip' | 'info';

interface BadgeProps {
  variant?: Variant;
  children: React.ReactNode;
  className?: string;
  pulse?: boolean;
}

const VARIANT_CLASSES: Record<Variant, string> = {
  hot: 'bg-red-600 text-white',
  new: 'bg-green-600 text-white',
  jackpot: 'bg-gradient-to-r from-casino-gold to-orange-500 text-black',
  live: 'bg-casino-gold text-black',
  vip: 'bg-gradient-to-r from-purple-600 to-pink-600 text-white',
  info: 'bg-white/10 text-casino-gold border border-casino-gold/30',
};

const LABEL_PREFIX: Partial<Record<Variant, string>> = {
  hot: '🔥 ',
  new: '✨ ',
  jackpot: '💰 ',
  live: '● ',
};

export const Badge: React.FC<BadgeProps> = ({
  variant = 'info',
  children,
  className,
  pulse,
}) => (
  <span
    className={clsx(
      'inline-flex items-center text-[10px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider shadow-lg',
      VARIANT_CLASSES[variant],
      pulse && 'animate-pulse',
      className,
    )}
  >
    {LABEL_PREFIX[variant]}
    {children}
  </span>
);

export default Badge;
