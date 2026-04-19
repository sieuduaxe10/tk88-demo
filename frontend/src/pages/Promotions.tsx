import React from 'react';
import { motion } from 'framer-motion';
import { useSessionStore } from '../stores/useSessionStore';
import { CTAButton } from '../components/ui/CTAButton';
import { SectionHeading } from '../components/ui/SectionHeading';
import { Badge } from '../components/ui/Badge';

interface Promotion {
  id: string;
  title: string;
  body: string;
  badge?: string;
  icon: string;
  gradient: string;
  cta: string;
}

const PROMOS: Promotion[] = [
  {
    id: 'welcome',
    title: 'Thưởng Chào Mừng 100%',
    body: 'Nạp lần đầu nhận thưởng 100% tối đa 8,888,000 ₫. Áp dụng cho tất cả thành viên mới đăng ký trong tháng.',
    badge: 'HOT',
    icon: '🎁',
    gradient: 'from-red-600 via-rose-700 to-red-900',
    cta: 'Nhận Ngay',
  },
  {
    id: 'daily',
    title: 'Hoàn Trả Hàng Ngày 1.5%',
    body: 'Hoàn trả tự động mỗi ngày cho tất cả cược thua tại Casino · Nổ Hũ · Bắn Cá.',
    badge: 'VIP',
    icon: '💰',
    gradient: 'from-amber-500 via-orange-600 to-red-700',
    cta: 'Chi Tiết',
  },
  {
    id: 'friend',
    title: 'Giới Thiệu Bạn Bè',
    body: 'Mỗi người bạn đăng ký thành công bạn nhận 100,000 ₫ + 0.5% doanh thu trọn đời.',
    icon: '🤝',
    gradient: 'from-emerald-500 via-green-700 to-teal-800',
    cta: 'Lấy Link',
  },
  {
    id: 'weekend',
    title: 'Cuồng Nhiệt Cuối Tuần',
    body: 'Thứ 7 & Chủ Nhật nạp mỗi lần tặng 20% — không giới hạn lượt tham gia.',
    badge: 'NEW',
    icon: '🔥',
    gradient: 'from-pink-500 via-fuchsia-600 to-purple-800',
    cta: 'Tham Gia',
  },
  {
    id: 'birthday',
    title: 'Quà Sinh Nhật',
    body: 'Nhận voucher 500,000 ₫ vào đúng ngày sinh nhật + 1 vòng quay may mắn miễn phí.',
    icon: '🎂',
    gradient: 'from-purple-500 via-pink-600 to-rose-700',
    cta: 'Cập Nhật DOB',
  },
  {
    id: 'live3d',
    title: 'Live 3D Cashback 2%',
    body: 'Đặc quyền cho Tài Xỉu · Xóc Đĩa · Baccarat 3D — hoàn trả 2% mọi giao dịch.',
    badge: 'LIVE',
    icon: '🎲',
    gradient: 'from-cyan-500 via-blue-600 to-indigo-800',
    cta: 'Chơi Ngay',
  },
];

const Promotions: React.FC = () => {
  const openAuthModal = useSessionStore((s) => s.openAuthModal);
  const openPaymentModal = useSessionStore((s) => s.openPaymentModal);
  const user = useSessionStore((s) => s.user);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8 text-center">
        <motion.h1
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-3xl sm:text-4xl font-black text-gradient-gold uppercase tracking-wider"
        >
          🎁 Khuyến Mãi
        </motion.h1>
        <p className="mt-2 text-sm text-casino-muted">
          Ưu đãi siêu hấp dẫn mỗi ngày cho mọi thành viên TK88
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
        {PROMOS.map((p, i) => (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            whileHover={{ y: -4 }}
            className={`relative rounded-2xl overflow-hidden shadow-card-hover bg-gradient-to-br ${p.gradient} ring-1 ring-white/10 hover:ring-casino-gold/50 transition-all`}
          >
            <div className="absolute inset-0 opacity-20 mix-blend-overlay">
              <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white blur-2xl" />
            </div>
            <div className="relative p-6">
              {p.badge && (
                <div className="mb-2">
                  <Badge variant={p.badge === 'HOT' ? 'hot' : p.badge === 'NEW' ? 'new' : p.badge === 'VIP' ? 'vip' : 'live'}>
                    {p.badge}
                  </Badge>
                </div>
              )}
              <div className="text-5xl mb-3 drop-shadow-lg">{p.icon}</div>
              <h3 className="text-xl font-black text-white mb-2 drop-shadow">
                {p.title}
              </h3>
              <p className="text-sm text-white/90 mb-5 leading-relaxed min-h-[60px]">
                {p.body}
              </p>
              <CTAButton
                variant="secondary"
                size="sm"
                fullWidth
                onClick={() => {
                  if (!user) openAuthModal('register');
                  else openPaymentModal('deposit');
                }}
              >
                {p.cta} →
              </CTAButton>
            </div>
          </motion.div>
        ))}
      </div>

      <SectionHeading title="Điều kiện chung" className="mt-12 mb-4" />
      <div className="bg-casino-card rounded-xl p-6 text-sm text-white/80 space-y-2 border border-white/10">
        <p>• Mỗi tài khoản chỉ áp dụng 1 khuyến mãi cho cùng 1 thời điểm nạp tiền.</p>
        <p>• Tiền thưởng phải cược đủ 10× mới được phép rút.</p>
        <p>• TK88 có quyền thu hồi thưởng nếu phát hiện gian lận hoặc tài khoản đa dụng.</p>
        <p>• Tất cả ưu đãi là mô phỏng trên trang DEMO — không có giao dịch tiền thật.</p>
      </div>
    </div>
  );
};

export default Promotions;
