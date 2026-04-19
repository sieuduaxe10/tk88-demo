import React from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import clsx from 'clsx';
import { motion } from 'framer-motion';
import { CATEGORIES } from '../../data/categories';

interface CategoryNavProps {
  className?: string;
  orientation?: 'horizontal' | 'vertical';
  onNavigate?: () => void;
}

export const CategoryNav: React.FC<CategoryNavProps> = ({
  className,
  orientation = 'horizontal',
  onNavigate,
}) => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const active = params.get('category');

  const handleClick = (id: string) => {
    const sp = new URLSearchParams(location.search);
    if (sp.get('category') === id) sp.delete('category');
    else sp.set('category', id);
    navigate(`/?${sp.toString()}`);
    onNavigate?.();
  };

  if (orientation === 'vertical') {
    return (
      <nav className={clsx('flex flex-col gap-1', className)}>
        {CATEGORIES.map((c) => (
          <button
            key={c.id}
            onClick={() => handleClick(c.id)}
            className={clsx(
              'flex items-center gap-3 px-4 py-3 rounded-lg text-left transition',
              active === c.id
                ? 'bg-cta-gradient text-black font-black'
                : 'text-white/90 hover:bg-white/10',
            )}
          >
            <span className="text-2xl">{c.iconEmoji}</span>
            <div className="flex-1">
              <div className="font-bold text-sm">{c.vnLabel}</div>
              {c.description && (
                <div className="text-[10px] opacity-70">{c.description}</div>
              )}
            </div>
          </button>
        ))}
      </nav>
    );
  }

  return (
    <nav
      className={clsx(
        'flex items-center gap-1 overflow-x-auto scrollbar-hide',
        className,
      )}
    >
      {CATEGORIES.map((c) => {
        const isActive = active === c.id;
        return (
          <motion.button
            key={c.id}
            onClick={() => handleClick(c.id)}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.96 }}
            className={clsx(
              'relative flex flex-col items-center gap-0.5 px-3 md:px-4 py-1.5 rounded-md whitespace-nowrap transition font-bold text-xs tracking-wide',
              isActive
                ? 'text-casino-gold'
                : 'text-white/80 hover:text-casino-gold',
            )}
          >
            <span className="text-xl leading-none">{c.iconEmoji}</span>
            <span>{c.vnLabel}</span>
            {isActive && (
              <motion.div
                layoutId="cat-underline"
                className="absolute -bottom-1 left-2 right-2 h-0.5 bg-casino-gold rounded-full"
              />
            )}
          </motion.button>
        );
      })}
    </nav>
  );
};

export default CategoryNav;
