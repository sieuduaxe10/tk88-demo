import React from 'react';
import { Link } from 'react-router-dom';

const COLUMNS = [
  {
    title: 'Sản Phẩm',
    links: [
      { label: 'Thể Thao', to: '/?category=sports' },
      { label: 'Casino', to: '/?category=casino' },
      { label: 'Nổ Hũ', to: '/?category=nohu' },
      { label: 'Game Bài', to: '/?category=gamebai' },
      { label: 'Bắn Cá', to: '/?category=banca' },
    ],
  },
  {
    title: 'Thông Tin',
    links: [
      { label: 'Khuyến Mãi', to: '/promotions' },
      { label: 'Câu Lạc Bộ VIP', to: '/vip' },
      { label: 'Về Chúng Tôi', to: '/about' },
      { label: 'Điều Khoản', to: '/terms' },
    ],
  },
  {
    title: 'Hỗ Trợ',
    links: [
      { label: 'Liên Hệ 24/7', to: '/support' },
      { label: 'Hướng Dẫn', to: '/guide' },
      { label: 'Câu Hỏi Thường Gặp', to: '/faq' },
      { label: 'Chơi Có Trách Nhiệm', to: '/responsible' },
    ],
  },
];

const PAYMENT_METHODS = [
  { id: 'bank', label: 'BANK', icon: '🏦' },
  { id: 'momo', label: 'MoMo', icon: '📱' },
  { id: 'zalo', label: 'ZaloPay', icon: '💙' },
  { id: 'viettel', label: 'Viettel', icon: '📡' },
  { id: 'usdt', label: 'USDT', icon: '₮' },
];

const LICENSES = ['18+', 'PAGCOR', 'MGA', 'GC'];

export const SiteFooter: React.FC = () => {
  return (
    <footer className="bg-gradient-to-b from-black to-[#0a0505] border-t-2 border-casino-gold/30 mt-10">
      <div className="max-w-7xl mx-auto px-4 py-10">
        {/* Top grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          <div className="col-span-2 md:col-span-1">
            <div className="text-3xl font-black text-gradient-gold mb-2">
              TK88
            </div>
            <p className="text-xs text-casino-muted leading-relaxed">
              Nền tảng giải trí trực tuyến hàng đầu Châu Á. Hàng nghìn trò chơi,
              giao dịch nhanh chóng, bảo mật tuyệt đối.
            </p>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h4 className="text-sm font-black uppercase text-casino-gold mb-3 tracking-wider">
                {col.title}
              </h4>
              <ul className="space-y-2">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link
                      to={l.to}
                      className="text-xs text-casino-muted hover:text-casino-gold transition"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Payment methods */}
        <div className="border-t border-white/10 pt-6 mb-6">
          <h4 className="text-[10px] uppercase tracking-widest text-casino-muted mb-3">
            Phương thức thanh toán (DEMO)
          </h4>
          <div className="flex flex-wrap gap-2">
            {PAYMENT_METHODS.map((p) => (
              <div
                key={p.id}
                className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5"
              >
                <span className="text-sm">{p.icon}</span>
                <span className="text-[11px] font-bold text-white/80">
                  {p.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Licenses + warnings */}
        <div className="border-t border-white/10 pt-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            {LICENSES.map((l) => (
              <div
                key={l}
                className="px-2.5 py-1 rounded bg-white/5 border border-casino-gold/30 text-[10px] font-black text-casino-gold tracking-wider"
              >
                {l}
              </div>
            ))}
          </div>
          <div className="text-[10px] text-casino-muted leading-relaxed md:text-right">
            ⚠ Trang web chỉ dành cho mục đích giải trí trên 18 tuổi. Chơi có
            trách nhiệm.
            <br />
            <span className="text-red-400/80 font-semibold">
              DEMO ONLY — Không có giao dịch tiền thật.
            </span>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-white/5 text-center text-[10px] text-casino-muted">
          © 2026 TK88 Gaming Platform · All rights reserved
        </div>
      </div>
    </footer>
  );
};

export default SiteFooter;
