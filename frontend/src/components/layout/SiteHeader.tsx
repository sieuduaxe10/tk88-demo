import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import clsx from 'clsx';
import { useSessionStore } from '../../stores/useSessionStore';
import { CategoryNav } from './CategoryNav';
import { BalancePill } from './BalancePill';
import { AuthButtons } from './AuthButtons';
import { UserMenu } from './UserMenu';
import { CTAButton } from '../ui/CTAButton';

export const SiteHeader: React.FC = () => {
  const user = useSessionStore((s) => s.user);
  const openSearch = useSessionStore((s) => s.openSearch);
  const openMobileDrawer = useSessionStore((s) => s.openMobileDrawer);
  const openPaymentModal = useSessionStore((s) => s.openPaymentModal);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={clsx(
        'sticky top-0 z-40 bg-gradient-to-r from-[#1a0b0b] via-[#2a0a0a] to-[#1a0b0b] border-b-2 border-casino-gold/40 transition-shadow',
        scrolled && 'shadow-xl shadow-black/50',
      )}
    >
      {/* Top strip */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 h-14 sm:h-16 flex items-center justify-between gap-2 sm:gap-4">
        {/* Mobile hamburger */}
        <button
          onClick={openMobileDrawer}
          className="lg:hidden w-9 h-9 rounded-md hover:bg-white/10 flex items-center justify-center text-white"
          aria-label="Open menu"
        >
          <span className="text-2xl leading-none">☰</span>
        </button>

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <div className="text-2xl sm:text-3xl font-black text-gradient-gold drop-shadow">
            TK88
          </div>
          <span className="hidden sm:inline text-[10px] uppercase tracking-widest text-casino-gold/70">
            Casino
          </span>
        </Link>

        {/* Center spacer pushes right cluster */}
        <div className="flex-1" />

        {/* Search icon (always visible) */}
        <button
          onClick={openSearch}
          className="w-9 h-9 rounded-full border border-casino-gold/30 hover:border-casino-gold hover:bg-white/10 flex items-center justify-center text-casino-gold transition"
          aria-label="Search"
          title="Tìm game (Ctrl+K)"
        >
          🔍
        </button>

        {user ? (
          <>
            <BalancePill className="hidden md:flex" />
            <CTAButton
              size="sm"
              variant="primary"
              className="hidden sm:inline-flex"
              onClick={() => openPaymentModal('deposit')}
            >
              Nạp Tiền
            </CTAButton>
            <UserMenu />
          </>
        ) : (
          <div className="hidden sm:block">
            <AuthButtons compact />
          </div>
        )}
      </div>

      {/* Category nav row (desktop only) */}
      <div className="hidden lg:block border-t border-white/5 bg-black/30">
        <div className="max-w-7xl mx-auto px-4 h-11">
          <CategoryNav className="h-full" />
        </div>
      </div>

      {/* Demo banner */}
      <div className="bg-casino-red/20 border-t border-casino-gold/20 text-center py-1">
        <span className="text-[10px] uppercase tracking-wider text-casino-gold font-bold">
          ⚠ Demo Only — Không có giao dịch tiền thật · 18+
        </span>
      </div>
    </header>
  );
};

export default SiteHeader;
