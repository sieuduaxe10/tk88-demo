import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useSessionStore } from '../../stores/useSessionStore';

export const UserMenu: React.FC = () => {
  const user = useSessionStore((s) => s.user);
  const logout = useSessionStore((s) => s.logout);
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  if (!user) return null;

  const initial = user.username.charAt(0).toUpperCase();

  const items = [
    { label: 'Hồ Sơ', icon: '👤', path: '/profile' },
    { label: 'Lịch Sử Giao Dịch', icon: '📊', path: '/history' },
    { label: 'Khuyến Mãi', icon: '🎁', path: '/promotions' },
    { label: 'VIP', icon: '👑', path: '/vip' },
  ];

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 px-2 py-1 rounded-full hover:bg-white/10 transition"
      >
        <div className="w-8 h-8 rounded-full bg-cta-gradient text-black font-black flex items-center justify-center shadow-gold-glow">
          {initial}
        </div>
        <span className="text-sm text-white/90 hidden md:block font-semibold">
          {user.username}
        </span>
        <span className="text-xs text-casino-muted">▾</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-60 bg-casino-card border border-casino-gold/30 rounded-xl shadow-card-hover overflow-hidden z-50"
          >
            <div className="p-4 bg-gradient-to-br from-casino-red/20 to-casino-gold/10 border-b border-white/10">
              <div className="text-sm font-bold text-white">{user.username}</div>
              <div className="text-xs text-casino-muted mt-0.5">
                VIP cấp {user.vipLevel}
              </div>
            </div>
            <div className="py-1">
              {items.map((item) => (
                <button
                  key={item.path}
                  onClick={() => {
                    setOpen(false);
                    navigate(item.path);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-white/90 hover:bg-white/5 transition"
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              ))}
              <div className="border-t border-white/10 my-1" />
              <button
                onClick={() => {
                  setOpen(false);
                  logout();
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition"
              >
                <span>🚪</span>
                <span>Đăng Xuất</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default UserMenu;
