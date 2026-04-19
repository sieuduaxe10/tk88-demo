import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import { useSessionStore, AuthModalTab } from '../../stores/useSessionStore';
import { api } from '../../services/apiClient';
import { CTAButton } from '../ui/CTAButton';

const TABS: { id: AuthModalTab; label: string }[] = [
  { id: 'login', label: 'Đăng Nhập' },
  { id: 'register', label: 'Đăng Ký' },
  { id: 'forgot', label: 'Quên Mật Khẩu' },
];

export const AuthModal: React.FC = () => {
  const isOpen = useSessionStore((s) => s.isAuthModalOpen);
  const close = useSessionStore((s) => s.closeAuthModal);
  const tab = useSessionStore((s) => s.authModalTab);
  const openAuthModal = useSessionStore((s) => s.openAuthModal);
  const setUser = useSessionStore((s) => s.setUser);
  const setTokens = useSessionStore((s) => s.setTokens);
  const setBalance = useSessionStore((s) => s.setBalance);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [agreedTerms, setAgreedTerms] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const reset = () => {
    setUsername('');
    setPassword('');
    setConfirmPassword('');
    setPhone('');
    setAgreedTerms(false);
    setError(null);
    setSuccessMsg(null);
  };

  const onClose = () => {
    reset();
    close();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    try {
      if (tab === 'login') {
        if (!username || !password) throw new Error('Nhập đủ thông tin.');
        setLoading(true);
        const res = await api.login(username, password);
        setUser(res.user);
        setTokens(res.token, res.refreshToken);
        setBalance(res.balance);
        onClose();
      } else if (tab === 'register') {
        if (!username || username.length < 4)
          throw new Error('Tên đăng nhập ≥ 4 ký tự.');
        if (!password || password.length < 6)
          throw new Error('Mật khẩu ≥ 6 ký tự.');
        if (password !== confirmPassword)
          throw new Error('Mật khẩu xác nhận không khớp.');
        if (!agreedTerms) throw new Error('Đồng ý điều khoản để tiếp tục.');
        setLoading(true);
        const res = await api.register(username, password, phone);
        setUser(res.user);
        setTokens(res.token, res.refreshToken);
        setBalance(res.balance);
        setSuccessMsg('Đăng ký thành công! Tặng 500,000 ₫ demo.');
        setTimeout(onClose, 1200);
      } else {
        if (!username) throw new Error('Nhập tên đăng nhập.');
        setLoading(true);
        const res = await api.forgotPassword(username);
        setSuccessMsg(res.message);
      }
    } catch (err: any) {
      setError(err.message || 'Có lỗi xảy ra.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[110] flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ y: 40, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 20, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-casino-card border border-casino-gold/30 rounded-2xl shadow-card-hover overflow-hidden"
          >
            <div className="relative p-6 bg-gradient-to-br from-casino-red/30 via-casino-red/10 to-casino-gold/10 border-b border-white/10">
              <button
                onClick={onClose}
                className="absolute top-3 right-3 w-8 h-8 rounded-full hover:bg-white/10 text-white/70 hover:text-white"
                aria-label="Close"
              >
                ✕
              </button>
              <div className="text-3xl font-black text-gradient-gold">TK88</div>
              <p className="text-xs text-white/70 mt-1">
                Chào mừng đến sòng bài trực tuyến #1 Châu Á
              </p>
            </div>

            <div className="flex border-b border-white/10">
              {TABS.filter((t) => t.id !== 'forgot').map((t) => (
                <button
                  key={t.id}
                  onClick={() => {
                    openAuthModal(t.id);
                    reset();
                  }}
                  className={clsx(
                    'flex-1 py-3 text-sm font-bold uppercase tracking-wide transition',
                    tab === t.id
                      ? 'text-casino-gold border-b-2 border-casino-gold bg-white/5'
                      : 'text-white/60 hover:text-white',
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {tab === 'forgot' && (
                <div className="flex items-center gap-2 p-2 rounded bg-yellow-500/10 border border-yellow-500/30 text-yellow-200 text-xs">
                  ℹ Nhập tên đăng nhập để nhận hướng dẫn.
                </div>
              )}

              <div>
                <label className="block text-[11px] uppercase tracking-wider text-casino-muted mb-1.5">
                  Tên đăng nhập
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.trim())}
                  placeholder="tk88_user"
                  className="w-full bg-black/40 border border-white/20 focus:border-casino-gold rounded-lg px-3 py-2.5 text-sm outline-none transition text-white placeholder-white/30"
                  autoComplete="username"
                />
              </div>

              {tab !== 'forgot' && (
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-casino-muted mb-1.5">
                    Mật khẩu
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-black/40 border border-white/20 focus:border-casino-gold rounded-lg px-3 py-2.5 text-sm outline-none transition text-white placeholder-white/30"
                    autoComplete={
                      tab === 'login' ? 'current-password' : 'new-password'
                    }
                  />
                </div>
              )}

              {tab === 'register' && (
                <>
                  <div>
                    <label className="block text-[11px] uppercase tracking-wider text-casino-muted mb-1.5">
                      Xác nhận mật khẩu
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-black/40 border border-white/20 focus:border-casino-gold rounded-lg px-3 py-2.5 text-sm outline-none transition text-white placeholder-white/30"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] uppercase tracking-wider text-casino-muted mb-1.5">
                      Số điện thoại (tùy chọn)
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="0912 345 678"
                      className="w-full bg-black/40 border border-white/20 focus:border-casino-gold rounded-lg px-3 py-2.5 text-sm outline-none transition text-white placeholder-white/30"
                    />
                  </div>
                  <label className="flex items-start gap-2 text-xs text-white/70 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={agreedTerms}
                      onChange={(e) => setAgreedTerms(e.target.checked)}
                      className="mt-0.5 accent-casino-gold"
                    />
                    <span>
                      Tôi đủ 18 tuổi và đồng ý với{' '}
                      <a
                        href="#"
                        className="text-casino-gold hover:underline"
                      >
                        Điều khoản sử dụng
                      </a>
                    </span>
                  </label>
                </>
              )}

              {error && (
                <div className="p-2.5 rounded bg-red-500/10 border border-red-500/30 text-red-300 text-xs">
                  ⚠ {error}
                </div>
              )}
              {successMsg && (
                <div className="p-2.5 rounded bg-green-500/10 border border-green-500/30 text-green-300 text-xs">
                  ✓ {successMsg}
                </div>
              )}

              <CTAButton
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                disabled={loading}
              >
                {loading
                  ? 'Đang xử lý…'
                  : tab === 'login'
                  ? 'Đăng Nhập'
                  : tab === 'register'
                  ? 'Đăng Ký Ngay'
                  : 'Gửi Yêu Cầu'}
              </CTAButton>

              {tab === 'login' && (
                <div className="flex justify-between text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      openAuthModal('forgot');
                      reset();
                    }}
                    className="text-casino-muted hover:text-casino-gold"
                  >
                    Quên mật khẩu?
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      openAuthModal('register');
                      reset();
                    }}
                    className="text-casino-gold hover:underline"
                  >
                    Tạo tài khoản mới →
                  </button>
                </div>
              )}

              {tab === 'forgot' && (
                <button
                  type="button"
                  onClick={() => {
                    openAuthModal('login');
                    reset();
                  }}
                  className="w-full text-center text-xs text-casino-muted hover:text-casino-gold"
                >
                  ← Quay lại đăng nhập
                </button>
              )}
            </form>

            <div className="px-6 pb-4 text-center text-[10px] text-casino-muted">
              🔒 Bảo mật SSL · DEMO ONLY — không có giao dịch tiền thật
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AuthModal;
