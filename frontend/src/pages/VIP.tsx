import React from 'react';
import { motion } from 'framer-motion';
import { useSessionStore, formatVND } from '../stores/useSessionStore';

interface VipTier {
  level: number;
  name: string;
  requirement: number;
  cashback: string;
  bonus: string;
  color: string;
  icon: string;
}

const TIERS: VipTier[] = [
  { level: 1, name: 'Đồng', requirement: 0, cashback: '0.5%', bonus: 'Quà chào mừng', color: 'from-amber-700 to-amber-900', icon: '🥉' },
  { level: 2, name: 'Bạc', requirement: 10_000_000, cashback: '0.8%', bonus: '+ Thưởng nạp 5%', color: 'from-gray-400 to-gray-600', icon: '🥈' },
  { level: 3, name: 'Vàng', requirement: 50_000_000, cashback: '1.0%', bonus: '+ Rút nhanh 5 phút', color: 'from-yellow-500 to-amber-700', icon: '🥇' },
  { level: 4, name: 'Bạch Kim', requirement: 200_000_000, cashback: '1.2%', bonus: '+ Quà sinh nhật 500K', color: 'from-slate-300 to-slate-500', icon: '💎' },
  { level: 5, name: 'Kim Cương', requirement: 1_000_000_000, cashback: '1.5%', bonus: '+ CSV riêng 24/7', color: 'from-cyan-400 to-blue-600', icon: '💠' },
  { level: 6, name: 'Hoàng Gia', requirement: 5_000_000_000, cashback: '1.8%', bonus: '+ Quà du lịch', color: 'from-purple-500 to-fuchsia-700', icon: '👑' },
  { level: 7, name: 'Tối Thượng', requirement: 20_000_000_000, cashback: '2.0%', bonus: '+ Siêu xe cuối năm', color: 'from-red-600 via-rose-700 to-pink-800', icon: '🏆' },
];

const VIP: React.FC = () => {
  const user = useSessionStore((s) => s.user);
  const currentLevel = user?.vipLevel || 1;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-10 text-center">
        <motion.h1
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-4xl sm:text-5xl font-black text-gradient-gold uppercase tracking-widest"
        >
          👑 Câu Lạc Bộ VIP
        </motion.h1>
        <p className="mt-2 text-sm text-casino-muted max-w-2xl mx-auto">
          Đặc quyền dành riêng cho những thành viên tinh hoa · Càng cao cấp bạn
          nhận được càng nhiều
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {TIERS.map((t, i) => {
          const isCurrent = currentLevel === t.level;
          return (
            <motion.div
              key={t.level}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`relative rounded-2xl overflow-hidden bg-gradient-to-br ${t.color} shadow-card-hover ring-1 ${
                isCurrent ? 'ring-casino-gold ring-2 shadow-gold-glow' : 'ring-white/10'
              }`}
            >
              {isCurrent && (
                <div className="absolute top-3 right-3 bg-casino-gold text-black text-[10px] font-black px-2 py-0.5 rounded-full">
                  HIỆN TẠI
                </div>
              )}
              <div className="p-5">
                <div className="text-4xl mb-2">{t.icon}</div>
                <div className="text-xs text-white/70 uppercase tracking-widest">
                  VIP {t.level}
                </div>
                <div className="text-2xl font-black text-white">{t.name}</div>
                <div className="mt-4 pt-4 border-t border-white/20 space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-white/70">Doanh thu:</span>
                    <span className="text-white font-bold">
                      {t.requirement === 0 ? 'Miễn phí' : formatVND(t.requirement)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/70">Hoàn trả:</span>
                    <span className="text-casino-gold font-black">
                      {t.cashback}/ngày
                    </span>
                  </div>
                  <div className="text-white/80 text-[11px] pt-1 italic">
                    {t.bonus}
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default VIP;
