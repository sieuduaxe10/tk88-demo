import React from 'react';
import clsx from 'clsx';

interface SectionHeadingProps {
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
}

export const SectionHeading: React.FC<SectionHeadingProps> = ({
  icon,
  title,
  subtitle,
  action,
  className,
}) => (
  <div className={clsx('flex items-end justify-between mb-4', className)}>
    <div className="flex items-center gap-3">
      <div className="w-1.5 h-8 bg-cta-gradient rounded-full" />
      {icon && <div className="text-2xl">{icon}</div>}
      <div>
        <h2 className="text-lg sm:text-xl font-black uppercase tracking-wide text-white">
          {title}
        </h2>
        {subtitle && (
          <p className="text-xs text-casino-muted mt-0.5">{subtitle}</p>
        )}
      </div>
    </div>
    {action && <div className="shrink-0">{action}</div>}
  </div>
);

export default SectionHeading;
