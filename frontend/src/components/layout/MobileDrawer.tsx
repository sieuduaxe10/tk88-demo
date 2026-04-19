import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useSessionStore, formatVND } from '../../stores/useSessionStore';
import { CategoryNav } from './CategoryNav';
import { CTAButton } from '../ui/CTAButton';

export const MobileDrawer: React.FC = () => {
  const isOpen = useSessionStore((s) => s.isMobileDrawerOpen);
  const close = useSessionStore((s) => s.closeMobileDrawer);
  const user = useSessionStore((s) => s.user);
  const balance = useSessionStore((s) => s.balance);
  const openAuthModal = useSessionStore((s) => s.openAuthModal);
  const openPaymentModal = useSessionStore((s) => s.openPaymentModal);
  const logout = useSessionStore((s) => s.logout);
  const navigate = useNavigate();

  const go = (path: string) => {
    close();
    navigate(path);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={close}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[90] lg:hidden"
          />
          <motion.aside
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'tween', duration: 0.28 }}
            className="fixed left-0 top-0 bottom-0 w-80 max-w-[85vw] bg-gradient-to-b from-casino-black via-[#1a0808] to-casino-black border-r border-casino-gold/30 z-[95] overflow-y-auto lg:hidden shadow-2xl"
          >
            <div className="p-5 border-b border-white/10 bg-red-gradient/30">
              {user ? (
                <div>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-cta-gradient text-black flex items-center justify-center text-xl font-black">
                      {user.username.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-bold text-white">{user.username}</div>
                      <div className="text-xs text-casino-muted">
                        VIP cấp {user.vipLevel}
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-between bg-black/40 rounded-lg px-3 py-2 border border-casino-gold/30">
                    <span className="text-xs text-casino-muted">Số dư</span>
                    <span className="font-black text-casino-gold">
                      {formatVND(balance)}
                    </span>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <CTAButton
                      size="sm"
                      variant="primary"
                      fullWidth
                      onClick={() => {
                        close();
                        openPaymentModal('deposit');
                      }}
                    >
                      Nạp
                    </CTAButton>
                    <CTAButton
                      size="sm"
                      variant="secondary"
                      fullWidth
                      onClick={() => {
                        close();
                        openPaymentModal('withdraw');
                      }}
                    >
                      Rút
                    </CTAButton>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="text-3xl font-black text-gradient-gold mb-1">
                    TK88
                  </div>
                  <p className="text-xs text-casino-muted mb-3">
                    Đăng nhập để bắt đầu chơi
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <CTAButton
                      size="sm"
                      variant="secondary"
                      fullWidth
                      onClick={() => {
                        close();
                        openAuthModal('login');
                      }}
                    >
                      Đăng Nhập
                    </CTAButton>
                    <CTAButton
                      size="sm"
                      variant="primary"
                      fullWidth
                      onClick={() => {
                        close();
                        openAuthModal('register');
                      }}
                    >
                      Đăng Ký
                    </CTAButton>
                  </div>
                </div>
              )}
            </div>

            <div className="p-3">
              <div className="text-[10px] uppercase tracking-wider text-casino-muted px-2 mb-2">
                Danh mục
              </div>
              <CategoryNav orientation="vertical" onNavigate={close} />
            </div>

            <div className="p-3 border-t border-white/10 space-y-1">
              <button
                onClick={() => go('/promotions')}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-white/90 hover:bg-white/10"
              >
                <span>🎁</span> Khuyến Mãi
              </button>
              <button
                onClick={() => go('/vip')}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-white/90 hover:bg-white/10"
              >
                <span>👑</span> Câu Lạc Bộ VIP
              </button>
              <button
                onClick={() => go('/history')}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-white/90 hover:bg-white/10"
              >
                <span>📊</span> Lịch Sử
              </button>
              {user && (
                <button
                  onClick={() => {
                    close();
                    logout();
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-400 hover:bg-red-500/10"
                >
                  <span>🚪</span> Đăng Xuất
                </button>
              )}
            </div>

            <div className="p-4 border-t border-white/10 text-center">
              <div className="text-[9px] text-casino-muted">
                🔞 CHỈ DÀNH CHO NGƯỜI TRÊN 18 TUỔI
              </div>
              <div className="text-[9px] text-casino-muted mt-1">
                DEMO ONLY — Không có giao dịch tiền thật
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};

export default MobileDrawer;
