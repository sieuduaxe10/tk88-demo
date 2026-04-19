import React from 'react';
import clsx from 'clsx';
import { useSessionStore, formatVND } from '../../stores/useSessionStore';

interface BalancePillProps {
  compact?: boolean;
  className?: string;
}

export const BalancePill: React.FC<BalancePillProps> = ({
  compact,
  className,
}) => {
  const balance = useSessionStore((s) => s.balance);
  const openPaymentModal = useSessionStore((s) => s.openPaymentModal);

  return (
    <button
      onClick={() => openPaymentModal('deposit')}
      className={clsx(
        'flex items-center gap-2 rounded-full border border-casino-gold/40 bg-black/40 transition hover:border-casino-gold hover:shadow-gold-glow',
        compact ? 'px-2 py-1' : 'px-3 py-1.5',
        className,
      )}
    >
      <span className={clsx('text-casino-gold', compact ? 'text-xs' : 'text-xs')}>
        💰
      </span>
      {!compact && (
        <span className="text-xs text-casino-muted">Số dư</span>
      )}
      <span
        className={clsx(
          'font-black text-casino-gold',
          compact ? 'text-xs' : 'text-sm',
        )}
      >
        {formatVND(balance)}
      </span>
      <span className="flex items-center justify-center w-5 h-5 rounded-full bg-cta-gradient text-black text-xs font-black">
        +
      </span>
    </button>
  );
};

export default BalancePill;
