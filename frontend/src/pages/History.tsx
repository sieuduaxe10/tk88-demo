import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import clsx from 'clsx';
import { useSessionStore, formatVND } from '../stores/useSessionStore';
import { SectionHeading } from '../components/ui/SectionHeading';
import { api } from '../services/apiClient';

type Tab = 'all' | 'deposit' | 'withdraw' | 'bet';

interface Row {
  id: string;
  type: string;
  amount: number;
  method: string;
  status: string;
  date: string;
}

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'all', label: 'Tất cả', icon: '📋' },
  { id: 'deposit', label: 'Nạp', icon: '💰' },
  { id: 'withdraw', label: 'Rút', icon: '💸' },
  { id: 'bet', label: 'Cược', icon: '🎲' },
];

const History: React.FC = () => {
  const user = useSessionStore((s) => s.user);
  const [tab, setTab] = useState<Tab>('all');
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    api
      .history()
      .then((items) =>
        setRows(
          items.map((r) => ({
            id: r.id,
            type: r.type,
            amount: r.type === 'withdraw' ? r.amount : r.amount,
            method: r.method,
            status: r.status,
            date: r.created_at,
          })),
        ),
      )
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, [user]);

  if (!user) return <Navigate to="/" replace />;

  const filtered = tab === 'all' ? rows : rows.filter((r) => r.type === tab);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <SectionHeading title="Lịch Sử Giao Dịch" icon="📊" />

      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={clsx(
              'flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition',
              tab === t.id
                ? 'bg-cta-gradient text-black shadow-gold-glow'
                : 'bg-white/5 text-white/80 hover:bg-white/10',
            )}
          >
            <span>{t.icon}</span> {t.label}
          </button>
        ))}
      </div>

      <div className="bg-casino-card rounded-xl border border-white/10 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-casino-muted text-sm">Đang tải…</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-casino-muted text-sm">
            Chưa có giao dịch nào.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-black/40 text-[10px] uppercase tracking-wider text-casino-muted">
              <tr>
                <th className="px-4 py-3 text-left">Thời gian</th>
                <th className="px-4 py-3 text-left">Loại</th>
                <th className="px-4 py-3 text-left">Kênh / Game</th>
                <th className="px-4 py-3 text-right">Số tiền</th>
                <th className="px-4 py-3 text-center">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.map((r) => {
                const isPositive = r.amount > 0;
                return (
                  <tr key={r.id} className="hover:bg-white/5 transition">
                    <td className="px-4 py-3 text-casino-muted text-xs">{r.date}</td>
                    <td className="px-4 py-3">
                      {r.type === 'deposit' && <span>💰 Nạp</span>}
                      {r.type === 'withdraw' && <span>💸 Rút</span>}
                      {r.type === 'bet' && <span>🎲 Cược</span>}
                    </td>
                    <td className="px-4 py-3 text-white">{r.method}</td>
                    <td
                      className={clsx(
                        'px-4 py-3 text-right font-black',
                        isPositive ? 'text-green-400' : 'text-red-400',
                      )}
                    >
                      {isPositive ? '+' : ''}
                      {formatVND(r.amount)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {r.status === 'success' && (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-green-500/20 text-green-300 border border-green-500/30">
                          HOÀN TẤT
                        </span>
                      )}
                      {r.status === 'pending' && (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-yellow-500/20 text-yellow-300 border border-yellow-500/30">
                          ĐANG XỬ LÝ
                        </span>
                      )}
                      {r.status === 'win' && (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-green-500/20 text-green-300 border border-green-500/30">
                          THẮNG
                        </span>
                      )}
                      {r.status === 'loss' && (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-red-500/20 text-red-300 border border-red-500/30">
                          THUA
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <p className="mt-4 text-[10px] text-center text-casino-muted">
        Dữ liệu mẫu DEMO · Trang web không có giao dịch tiền thật
      </p>
    </div>
  );
};

export default History;
