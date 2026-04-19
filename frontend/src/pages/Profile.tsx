import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSessionStore, formatVND } from '../stores/useSessionStore';
import { CTAButton } from '../components/ui/CTAButton';
import { SectionHeading } from '../components/ui/SectionHeading';

const Profile: React.FC = () => {
  const user = useSessionStore((s) => s.user);
  const balance = useSessionStore((s) => s.balance);
  const openPaymentModal = useSessionStore((s) => s.openPaymentModal);
  const logout = useSessionStore((s) => s.logout);

  if (!user) return <Navigate to="/" replace />;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header card */}
      <div className="bg-gradient-to-br from-casino-red/30 via-casino-gold/10 to-black rounded-2xl p-6 shadow-card-hover border border-casino-gold/30 mb-6">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="w-20 h-20 rounded-full bg-cta-gradient text-black flex items-center justify-center text-4xl font-black shadow-gold-glow">
            {user.username.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-[200px]">
            <div className="text-2xl font-black text-white">{user.username}</div>
            <div className="text-xs text-casino-muted">
              ID: {user.id} · Thành viên từ{' '}
              {new Date(user.createdAt).toLocaleDateString('vi-VN')}
            </div>
            <div className="inline-flex items-center gap-2 mt-2 px-2.5 py-1 rounded-full bg-casino-gold/20 border border-casino-gold/50">
              <span>👑</span>
              <span className="text-xs font-bold text-casino-gold">
                VIP cấp {user.vipLevel}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Balance card */}
      <div className="bg-casino-card rounded-2xl p-5 border border-white/10 mb-6">
        <div className="text-xs uppercase tracking-wider text-casino-muted mb-1">
          Số Dư Tài Khoản
        </div>
        <div className="text-3xl font-black text-gradient-gold">
          {formatVND(balance)}
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <CTAButton
            variant="primary"
            size="md"
            fullWidth
            onClick={() => openPaymentModal('deposit')}
          >
            💰 Nạp Tiền
          </CTAButton>
          <CTAButton
            variant="danger"
            size="md"
            fullWidth
            onClick={() => openPaymentModal('withdraw')}
          >
            💸 Rút Tiền
          </CTAButton>
        </div>
      </div>

      {/* Info */}
      <SectionHeading title="Thông Tin Tài Khoản" />
      <div className="bg-casino-card rounded-xl border border-white/10 divide-y divide-white/10 mb-6">
        {[
          { label: 'Tên đăng nhập', value: user.username },
          { label: 'Email', value: user.email || '— chưa cập nhật —' },
          { label: 'Số điện thoại', value: user.phone || '— chưa cập nhật —' },
          {
            label: 'Ngày tham gia',
            value: new Date(user.createdAt).toLocaleString('vi-VN'),
          },
        ].map((r) => (
          <div key={r.label} className="flex justify-between px-5 py-3 text-sm">
            <span className="text-casino-muted">{r.label}</span>
            <span className="text-white font-semibold">{r.value}</span>
          </div>
        ))}
      </div>

      <button
        onClick={logout}
        className="w-full py-3 rounded-xl bg-red-900/30 border border-red-500/40 text-red-300 hover:bg-red-900/50 transition font-bold"
      >
        🚪 Đăng Xuất
      </button>
    </div>
  );
};

export default Profile;
