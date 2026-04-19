import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import {
  useSessionStore,
  formatVND,
  PaymentModalTab,
} from '../../stores/useSessionStore';
import { api } from '../../services/apiClient';
import { CTAButton } from '../ui/CTAButton';

interface PaymentMethod {
  id: string;
  label: string;
  icon: string;
  color: string;
  hint: string;
}

const METHODS: PaymentMethod[] = [
  {
    id: 'bank',
    label: 'Chuyển Khoản',
    icon: '🏦',
    color: 'from-blue-500 to-blue-700',
    hint: 'Vietcombank, Techcombank, ACB…',
  },
  {
    id: 'momo',
    label: 'MoMo',
    icon: '📱',
    color: 'from-pink-500 to-rose-700',
    hint: 'Ví điện tử MoMo',
  },
  {
    id: 'zalo',
    label: 'ZaloPay',
    icon: '💙',
    color: 'from-cyan-500 to-blue-700',
    hint: 'Ví điện tử ZaloPay',
  },
  {
    id: 'viettel',
    label: 'Viettel Pay',
    icon: '📡',
    color: 'from-red-500 to-red-800',
    hint: 'Viettel Money',
  },
  {
    id: 'usdt',
    label: 'USDT (TRC20)',
    icon: '₮',
    color: 'from-green-500 to-emerald-700',
    hint: 'Tether TRC-20',
  },
];

const QUICK_AMOUNTS = [50_000, 100_000, 200_000, 500_000, 1_000_000, 5_000_000];

// VietQR — real NAPAS standard QR from vietqr.io
const BANK_INFO = {
  bankCode: 'vietinbank',
  bankName: 'VietinBank',
  accountNumber: '108872110511',
  accountHolder: 'TK88 GAMING',
};

const buildVietQrUrl = (amount: number, order: string) => {
  const params = new URLSearchParams({
    amount: String(amount),
    addInfo: `TK88 ${order}`,
    accountName: BANK_INFO.accountHolder,
  });
  return `https://img.vietqr.io/image/${BANK_INFO.bankCode}-${BANK_INFO.accountNumber}-compact2.png?${params}`;
};

const fmtElapsed = (s: number) => {
  const m = Math.floor(s / 60);
  const ss = s % 60;
  return `${m.toString().padStart(2, '0')}:${ss.toString().padStart(2, '0')}`;
};

const QrView: React.FC<{
  order: string;
  elapsed: number;
  amount: number;
  onCancel: () => void;
  cancelling: boolean;
}> = ({ order, elapsed, amount, onCancel, cancelling }) => {
  const [copiedKey, setCopiedKey] = React.useState<string | null>(null);
  const copy = (key: string, value: string) => {
    navigator.clipboard?.writeText(value);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1500);
  };
  // Short memo ID so bank memo field stays under 32 chars
  const shortId = order.replace(/-/g, '').slice(0, 10).toUpperCase();
  const content = `TK88 ${shortId}`;
  const qrUrl = buildVietQrUrl(amount, shortId);

  return (
    <div className="p-5 text-center">
      <div className="mx-auto w-60 h-60 bg-white rounded-2xl p-2 shadow-gold-glow">
        <img
          src={qrUrl}
          alt="VietQR"
          className="w-full h-full object-contain"
          onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')}
        />
      </div>

      <div className="mt-4 text-xs text-casino-muted">
        Quét bằng app ngân hàng / MoMo / ZaloPay
      </div>
      <div className="mt-1 text-sm text-white">
        Số tiền:{' '}
        <span className="text-casino-gold font-black">{formatVND(amount)}</span>
      </div>

      {/* Manual bank info */}
      <div className="mt-4 text-left bg-black/40 border border-white/10 rounded-xl p-3 space-y-2 text-xs">
        <InfoRow
          label="Ngân hàng"
          value={BANK_INFO.bankName}
          onCopy={() => copy('bank', BANK_INFO.bankName)}
          copied={copiedKey === 'bank'}
        />
        <InfoRow
          label="Số tài khoản"
          value={BANK_INFO.accountNumber}
          onCopy={() => copy('acc', BANK_INFO.accountNumber)}
          copied={copiedKey === 'acc'}
          mono
        />
        <InfoRow
          label="Chủ tài khoản"
          value={BANK_INFO.accountHolder}
          onCopy={() => copy('holder', BANK_INFO.accountHolder)}
          copied={copiedKey === 'holder'}
        />
        <InfoRow
          label="Số tiền"
          value={String(amount)}
          onCopy={() => copy('amt', String(amount))}
          copied={copiedKey === 'amt'}
          display={formatVND(amount)}
        />
        <InfoRow
          label="Nội dung CK"
          value={content}
          onCopy={() => copy('memo', content)}
          copied={copiedKey === 'memo'}
          mono
        />
      </div>

      <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-casino-red/20 border border-casino-red/40 rounded-full">
        <span className="animate-pulse text-casino-red">●</span>
        <span className="text-sm text-white">
          Chờ admin xác nhận… {fmtElapsed(elapsed)}
        </span>
      </div>

      <div className="mt-3 text-[10px] text-casino-muted leading-relaxed">
        ⚠ Chuyển đúng <b>số tiền</b> và <b>nội dung CK</b>. Admin sẽ xác minh và
        cộng tiền vào tài khoản của bạn sau khi nhận được chuyển khoản (thường
        trong vài phút).
      </div>

      <button
        type="button"
        onClick={onCancel}
        disabled={cancelling}
        className="mt-4 text-xs text-casino-muted hover:text-red-300 underline disabled:opacity-50"
      >
        {cancelling ? 'Đang hủy…' : 'Hủy đơn này'}
      </button>
    </div>
  );
};

const InfoRow: React.FC<{
  label: string;
  value: string;
  display?: string;
  onCopy: () => void;
  copied: boolean;
  mono?: boolean;
}> = ({ label, value, display, onCopy, copied, mono }) => (
  <div className="flex items-center justify-between gap-2">
    <span className="text-casino-muted shrink-0">{label}</span>
    <div className="flex items-center gap-2 min-w-0">
      <span
        className={clsx(
          'text-white font-bold truncate',
          mono && 'font-mono tracking-wide',
        )}
      >
        {display ?? value}
      </span>
      <button
        onClick={onCopy}
        className={clsx(
          'px-2 py-0.5 rounded text-[10px] font-bold transition shrink-0',
          copied
            ? 'bg-green-500/30 text-green-200'
            : 'bg-casino-gold/20 text-casino-gold hover:bg-casino-gold/30',
        )}
      >
        {copied ? '✓ Đã chép' : 'Chép'}
      </button>
    </div>
  </div>
);

const TABS: { id: PaymentModalTab; label: string; icon: string }[] = [
  { id: 'deposit', label: 'Nạp Tiền', icon: '💰' },
  { id: 'withdraw', label: 'Rút Tiền', icon: '💸' },
];

export const PaymentModal: React.FC = () => {
  const isOpen = useSessionStore((s) => s.isPaymentModalOpen);
  const close = useSessionStore((s) => s.closePaymentModal);
  const tab = useSessionStore((s) => s.paymentModalTab);
  const openPaymentModal = useSessionStore((s) => s.openPaymentModal);
  const openAuthModal = useSessionStore((s) => s.openAuthModal);
  const user = useSessionStore((s) => s.user);
  const balance = useSessionStore((s) => s.balance);
  const setBalance = useSessionStore((s) => s.setBalance);

  const [method, setMethod] = useState(METHODS[0].id);
  const [amount, setAmount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  type Status =
    | null
    | { kind: 'pending'; orderId: string; elapsed: number }
    | { kind: 'ok'; msg: string }
    | { kind: 'err'; msg: string };
  const [status, setStatus] = useState<Status>(null);

  useEffect(() => {
    if (!isOpen) {
      setAmount(0);
      setMethod(METHODS[0].id);
      setStatus(null);
      setCancelling(false);
    }
  }, [isOpen]);

  // Tick elapsed seconds while awaiting admin approval
  useEffect(() => {
    if (status?.kind !== 'pending') return;
    const t = setInterval(() => {
      setStatus((prev) =>
        prev?.kind === 'pending'
          ? { ...prev, elapsed: prev.elapsed + 1 }
          : prev,
      );
    }, 1000);
    return () => clearInterval(t);
  }, [status?.kind]);

  // Poll backend every 4s for order status changes.
  // Extract orderId into a stable var so the effect's dep array is clear.
  const pendingOrderId = status?.kind === 'pending' ? status.orderId : null;
  useEffect(() => {
    if (!pendingOrderId) return;
    let cancelled = false;
    let consecutiveFailures = 0;
    let closeTimer: ReturnType<typeof setTimeout> | null = null;
    const poll = async () => {
      try {
        const r = await api.orderStatus(pendingOrderId);
        if (cancelled) return;
        consecutiveFailures = 0;
        if (r.status === 'success') {
          setBalance(r.balance);
          setStatus({
            kind: 'ok',
            msg: `✓ Admin đã duyệt. Nạp thành công +${formatVND(r.amount)}`,
          });
          closeTimer = setTimeout(close, 1800);
        } else if (r.status === 'rejected') {
          setStatus({
            kind: 'err',
            msg: 'Admin đã từ chối đơn này. Vui lòng liên hệ CSKH.',
          });
        } else if (r.status === 'cancelled') {
          setStatus({ kind: 'err', msg: 'Đơn đã được hủy.' });
        }
      } catch {
        consecutiveFailures += 1;
        if (!cancelled && consecutiveFailures >= 5) {
          setStatus({
            kind: 'err',
            msg: 'Không kết nối được máy chủ. Vui lòng tải lại trang — đơn của bạn vẫn được lưu.',
          });
        }
      }
    };
    const t = setInterval(poll, 4000);
    poll();
    return () => {
      cancelled = true;
      clearInterval(t);
      if (closeTimer) clearTimeout(closeTimer);
    };
  }, [pendingOrderId, setBalance, close]);

  const handleCancelOrder = async () => {
    if (status?.kind !== 'pending') return;
    if (!confirm('Hủy đơn nạp này?')) return;
    setCancelling(true);
    try {
      await api.cancelOrder(status.orderId);
      setStatus({ kind: 'err', msg: 'Đơn đã hủy.' });
      setTimeout(close, 1200);
    } catch (e: any) {
      setStatus({ kind: 'err', msg: e.message || 'Không hủy được đơn.' });
    } finally {
      setCancelling(false);
    }
  };

  if (!user && isOpen) {
    close();
    openAuthModal('login');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);
    if (amount <= 0) {
      setStatus({ kind: 'err', msg: 'Nhập số tiền hợp lệ.' });
      return;
    }
    setLoading(true);
    try {
      if (tab === 'deposit') {
        if (amount < 50_000) throw new Error('Số tiền nạp tối thiểu 50,000 ₫');
        const res = await api.deposit(amount, method);
        setStatus({ kind: 'pending', orderId: res.orderId, elapsed: 0 });
      } else {
        if (amount > balance) throw new Error('Số dư không đủ.');
        const res = await api.withdraw(amount, method);
        setBalance(res.balance);
        setStatus({
          kind: 'ok',
          msg: `Yêu cầu rút ${formatVND(amount)} đã gửi · Mã ${res.orderId}`,
        });
        setTimeout(close, 1400);
      }
    } catch (err: any) {
      setStatus({ kind: 'err', msg: err.message || 'Có lỗi xảy ra.' });
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
          onClick={close}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[110] flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ y: 40, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 20, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg bg-casino-card border border-casino-gold/30 rounded-2xl shadow-card-hover overflow-hidden max-h-[90vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="relative p-5 bg-gradient-to-br from-casino-gold/20 to-casino-red/20 border-b border-white/10">
              <button
                onClick={close}
                className="absolute top-3 right-3 w-8 h-8 rounded-full hover:bg-white/10 text-white/70 hover:text-white"
              >
                ✕
              </button>
              <div className="text-xl font-black text-white">
                💳 Giao Dịch Ví
              </div>
              <div className="text-xs text-white/70 mt-1">
                Số dư hiện tại:{' '}
                <span className="text-casino-gold font-bold">
                  {formatVND(balance)}
                </span>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-white/10">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => openPaymentModal(t.id)}
                  className={clsx(
                    'flex-1 py-3 flex items-center justify-center gap-2 text-sm font-bold uppercase tracking-wide transition',
                    tab === t.id
                      ? 'text-casino-gold border-b-2 border-casino-gold bg-white/5'
                      : 'text-white/60 hover:text-white',
                  )}
                >
                  <span>{t.icon}</span>
                  {t.label}
                </button>
              ))}
            </div>

            {status?.kind === 'pending' ? (
              <QrView
                order={status.orderId}
                elapsed={status.elapsed}
                amount={amount}
                onCancel={handleCancelOrder}
                cancelling={cancelling}
              />
            ) : (
              <form onSubmit={handleSubmit} className="p-5 space-y-4">
                {/* Method */}
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-casino-muted mb-2">
                    Phương thức
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {METHODS.map((m) => (
                      <button
                        type="button"
                        key={m.id}
                        onClick={() => setMethod(m.id)}
                        className={clsx(
                          'relative p-3 rounded-lg text-left border transition',
                          method === m.id
                            ? 'border-casino-gold bg-white/5 shadow-gold-glow'
                            : 'border-white/10 hover:border-white/30 bg-black/20',
                        )}
                      >
                        <div
                          className={clsx(
                            'w-8 h-8 rounded-md bg-gradient-to-br flex items-center justify-center text-lg mb-1.5',
                            m.color,
                          )}
                        >
                          {m.icon}
                        </div>
                        <div className="text-xs font-bold text-white">
                          {m.label}
                        </div>
                        <div className="text-[9px] text-casino-muted truncate">
                          {m.hint}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Amount */}
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-casino-muted mb-2">
                    Số tiền
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min={0}
                      value={amount || ''}
                      onChange={(e) => setAmount(Number(e.target.value))}
                      placeholder="0"
                      className="w-full bg-black/40 border border-white/20 focus:border-casino-gold rounded-lg px-3 py-3 text-lg font-bold outline-none transition text-casino-gold placeholder-white/20 pr-14"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-casino-muted text-sm">
                      VND
                    </span>
                  </div>
                  <div className="mt-2 grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                    {QUICK_AMOUNTS.map((a) => (
                      <button
                        type="button"
                        key={a}
                        onClick={() => setAmount(a)}
                        className="text-xs py-1.5 rounded bg-white/5 hover:bg-white/10 text-white/80 border border-white/10"
                      >
                        {a >= 1_000_000
                          ? `${a / 1_000_000}M`
                          : `${a / 1000}K`}
                      </button>
                    ))}
                  </div>
                </div>

                {tab === 'withdraw' && (
                  <div className="p-3 rounded bg-yellow-500/10 border border-yellow-500/30 text-xs text-yellow-200">
                    ⚠ Rút tối thiểu 100,000 ₫ · Xử lý 5–15 phút · Phí 0%
                  </div>
                )}

                {status?.kind === 'err' && (
                  <div className="p-2.5 rounded bg-red-500/10 border border-red-500/30 text-red-300 text-xs">
                    ⚠ {status.msg}
                  </div>
                )}
                {status?.kind === 'ok' && (
                  <div className="p-2.5 rounded bg-green-500/10 border border-green-500/30 text-green-300 text-xs">
                    ✓ {status.msg}
                  </div>
                )}

                <CTAButton
                  type="submit"
                  variant={tab === 'deposit' ? 'primary' : 'danger'}
                  size="lg"
                  fullWidth
                  disabled={loading || amount <= 0}
                >
                  {loading
                    ? 'Đang xử lý…'
                    : tab === 'deposit'
                    ? `Nạp ${amount ? formatVND(amount) : 'tiền'}`
                    : `Rút ${amount ? formatVND(amount) : 'tiền'}`}
                </CTAButton>

                <p className="text-[10px] text-center text-casino-muted">
                  🔒 Giao dịch DEMO · Không có chuyển tiền thật
                </p>
              </form>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PaymentModal;
