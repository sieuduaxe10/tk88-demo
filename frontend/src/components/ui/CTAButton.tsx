import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import clsx from 'clsx';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface CTAButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  variant?: Variant;
  size?: Size;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
  fullWidth?: boolean;
  children: React.ReactNode;
}

const VARIANT_CLASSES: Record<Variant, string> = {
  primary:
    'bg-cta-gradient text-black font-black shadow-gold-glow hover:shadow-red-glow',
  secondary:
    'bg-casino-card text-casino-gold border border-casino-gold/40 hover:border-casino-gold hover:bg-casino-gold/10',
  ghost:
    'bg-transparent text-casino-gold hover:bg-white/5 border border-transparent',
  danger:
    'bg-red-gradient text-white font-bold shadow-red-glow hover:shadow-lg',
};

const SIZE_CLASSES: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-5 py-2.5 text-sm',
  lg: 'px-8 py-3.5 text-base',
};

export const CTAButton: React.FC<CTAButtonProps> = ({
  variant = 'primary',
  size = 'md',
  icon,
  iconRight,
  fullWidth,
  className,
  children,
  ...rest
}) => {
  return (
    <motion.button
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
      className={clsx(
        'relative inline-flex items-center justify-center gap-2 rounded-full uppercase tracking-wide transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed',
        VARIANT_CLASSES[variant],
        SIZE_CLASSES[size],
        fullWidth && 'w-full',
        className,
      )}
      {...rest}
    >
      {icon && <span className="text-lg leading-none">{icon}</span>}
      <span>{children}</span>
      {iconRight && <span className="text-lg leading-none">{iconRight}</span>}
    </motion.button>
  );
};

export default CTAButton;
