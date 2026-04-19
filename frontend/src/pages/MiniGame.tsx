import React, { useMemo, useRef, useState } from 'react';
import { useParams, Navigate, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import { useSessionStore, formatVND } from '../stores/useSessionStore';
import { api } from '../services/apiClient';
import { CTAButton } from '../components/ui/CTAButton';
import { CasinoTable } from '../components/casino/CasinoTable';
import { DiceBowl } from '../components/casino/Dice3D';
import { CardsTable, type CardData } from '../components/casino/Card3D';
import { CoinDish, SingleCoin } from '../components/casino/Coin3D';
import { SlotReels } from '../components/casino/SlotReels';
import { sfx, primeAudio } from '../components/casino/sounds';
import { BaccaratRoad } from '../components/casino/BaccaratRoad';
import { CasinoChip, ChipStack } from '../components/casino/CasinoChip';
import { RoosterFight } from '../components/casino/RoosterFight';
import { BauCuaBowl, BAUCUA_SYMBOLS, BAUCUA_EMOJI, BAUCUA_LABEL, type BauCuaSymbol } from '../components/casino/BauCuaDice';

interface BetOption {
  id: string;
  label: string;
  color: string;
  payout: string;
}

interface GameDef {
  id: string;
  name: string;
  icon: string;
  tagline: string;
  options: BetOption[];
  /** If true, chips can be placed on multiple options simultaneously (Bầu Cua). */
  multiBet?: boolean;
}

const GAMES: Record<string, GameDef> = {
  taixiu: {
    id: 'taixiu',
    name: 'Tài Xỉu',
    icon: '🎲',
    tagline: 'Đoán tổng 3 xúc xắc · Tài (11-17) / Xỉu (4-10)',
    options: [
      { id: 'tai', label: 'TÀI', color: 'from-red-500 to-red-700', payout: '1.95x' },
      { id: 'xiu', label: 'XỈU', color: 'from-blue-500 to-blue-700', payout: '1.95x' },
    ],
  },
  xocdia: {
    id: 'xocdia',
    name: 'Xóc Đĩa',
    icon: '🎰',
    tagline: '4 đồng xu · Chẵn (0/2/4 đỏ) / Lẻ (1/3 đỏ)',
    options: [
      { id: 'chan', label: 'CHẴN', color: 'from-red-500 to-red-700', payout: '1.95x' },
      { id: 'le', label: 'LẺ', color: 'from-gray-500 to-gray-700', payout: '1.95x' },
    ],
  },
  coinflip: {
    id: 'coinflip',
    name: 'Tung Đồng Xu',
    icon: '🪙',
    tagline: 'Chọn Ngửa hoặc Sấp',
    options: [
      { id: 'head', label: 'NGỬA', color: 'from-yellow-400 to-yellow-600', payout: '1.95x' },
      { id: 'tail', label: 'SẤP', color: 'from-orange-500 to-orange-700', payout: '1.95x' },
    ],
  },
  baccarat: {
    id: 'baccarat',
    name: 'Baccarat',
    icon: '🃏',
    tagline: 'Đoán Con · Hòa · Cái',
    options: [
      { id: 'player', label: 'CON', color: 'from-blue-500 to-blue-700', payout: '2x' },
      { id: 'tie', label: 'HÒA', color: 'from-green-500 to-green-700', payout: '8x' },
      { id: 'banker', label: 'CÁI', color: 'from-red-500 to-red-700', payout: '1.95x' },
    ],
  },
  longho: {
    id: 'longho',
    name: 'Long Hổ',
    icon: '🐉',
    tagline: 'Long (Rồng) vs Hổ · Lá nào lớn hơn thắng',
    options: [
      { id: 'long', label: 'LONG', color: 'from-casino-red to-red-800', payout: '1.95x' },
      { id: 'ho', label: 'HỔ', color: 'from-yellow-500 to-orange-700', payout: '1.95x' },
      { id: 'tie', label: 'HÒA', color: 'from-green-500 to-green-700', payout: '8x' },
    ],
  },
  slot: {
    id: 'slot',
    name: 'Slot Máy Nổ Hũ',
    icon: '🎰',
    tagline: '3 reels · 2 trùng ×1.5 · 3 trùng ×5 đến ×50',
    options: [
      { id: 'spin', label: '🎰 QUAY', color: 'from-yellow-500 via-orange-500 to-red-600', payout: 'tới 50x' },
    ],
  },
  number: {
    id: 'number',
    name: 'Xổ Số Nhanh',
    icon: '🔢',
    tagline: 'Chọn 1 số từ 0-9 · Đoán đúng thắng 8x',
    options: Array.from({ length: 10 }, (_, i) => ({
      id: String(i),
      label: String(i),
      color: ['from-red-500 to-red-700','from-orange-500 to-orange-700','from-yellow-500 to-yellow-700','from-green-500 to-green-700','from-teal-500 to-teal-700','from-cyan-500 to-cyan-700','from-blue-500 to-blue-700','from-indigo-500 to-indigo-700','from-purple-500 to-purple-700','from-pink-500 to-pink-700'][i],
      payout: '8x',
    })),
  },
  pick2: {
    id: 'pick2',
    name: 'Cửa Đỏ Cửa Xanh',
    icon: '🎯',
    tagline: 'Chọn bên ĐỎ hoặc XANH · Thắng 1.95x',
    options: [
      { id: 'red', label: 'ĐỎ', color: 'from-red-500 to-red-800', payout: '1.95x' },
      { id: 'blue', label: 'XANH', color: 'from-blue-500 to-blue-800', payout: '1.95x' },
    ],
  },
  chonga: {
    id: 'chonga',
    name: 'Chọi Gà',
    icon: '🐓',
    tagline: 'Gà Đỏ vs Gà Xanh · Đặt cược vào gà chiến thắng',
    options: [
      { id: 'red', label: 'GÀ ĐỎ', color: 'from-red-500 to-red-800', payout: '1.95x' },
      { id: 'blue', label: 'GÀ XANH', color: 'from-blue-500 to-blue-800', payout: '1.95x' },
    ],
  },
  baucua: {
    id: 'baucua',
    name: 'Bầu Cua Tôm Cá',
    icon: '🦐',
    tagline: '3 hột · Đặt nhiều mặt cùng lúc · Trúng 1 mặt 2x · 2 mặt 3x · 3 mặt 4x',
    multiBet: true,
    options: BAUCUA_SYMBOLS.map((s) => ({
      id: s,
      label: `${BAUCUA_EMOJI[s]} ${BAUCUA_LABEL[s].toUpperCase()}`,
      color:
        s === 'bau' ? 'from-green-500 to-green-800'
        : s === 'cua' ? 'from-red-500 to-red-800'
        : s === 'tom' ? 'from-orange-500 to-orange-800'
        : s === 'ca' ? 'from-blue-500 to-blue-800'
        : s === 'ga' ? 'from-yellow-500 to-yellow-700'
        : 'from-amber-700 to-amber-900',
      payout: 'tới 4x',
    })),
  },
};

const CHIP_DENOMS = [10_000, 50_000, 100_000, 500_000, 1_000_000];

// ─── 3D Scene router ──────────────────────────────────────────────────────
interface SceneProps {
  gameId: string;
  rolling: boolean;
  reveal: Record<string, any> | null;
  onAllPeeked?: () => void;
  onPeekSound?: () => void;
}

const GameScene: React.FC<SceneProps> = ({ gameId, rolling, reveal, onAllPeeked, onPeekSound }) => {
  // Default values while idle — each scene renders blank state nicely.
  if (gameId === 'taixiu') {
    const dice: [number, number, number] = (reveal?.dice as [number, number, number]) ?? [1, 1, 1];
    return (
      <DiceBowl
        values={dice}
        rolling={rolling}
        onAllPeeked={onAllPeeked}
        onPeekSound={onPeekSound}
      />
    );
  }

  if (gameId === 'xocdia') {
    const coins: [number, number, number, number] =
      (reveal?.coins as [number, number, number, number]) ?? [0, 0, 0, 0];
    return (
      <CoinDish
        coins={coins}
        spinning={rolling}
        onAllPeeked={onAllPeeked}
        onPeekSound={onPeekSound}
      />
    );
  }

  if (gameId === 'coinflip') {
    const side: 0 | 1 = ((reveal?.side ?? 1) as 0 | 1);
    return <SingleCoin side={side} spinning={rolling} />;
  }

  if (gameId === 'baccarat') {
    const b = (reveal?.banker as { cards: CardData[]; total: number }) ?? { cards: [], total: 0 };
    const p = (reveal?.player as { cards: CardData[]; total: number }) ?? { cards: [], total: 0 };
    return (
      <CardsTable
        sideLeft={{ label: 'CON', cards: p.cards, total: p.total, color: 'bg-blue-600 text-white' }}
        sideRight={{ label: 'CÁI', cards: b.cards, total: b.total, color: 'bg-red-600 text-white' }}
        revealed={!!reveal}
      />
    );
  }

  if (gameId === 'longho') {
    const l = (reveal?.long as CardData) ?? null;
    const h = (reveal?.ho as CardData) ?? null;
    return (
      <CardsTable
        sideLeft={{ label: 'LONG', cards: l ? [l] : [], color: 'bg-casino-red text-white' }}
        sideRight={{ label: 'HỔ', cards: h ? [h] : [], color: 'bg-orange-600 text-white' }}
        revealed={!!reveal}
      />
    );
  }

  if (gameId === 'slot') {
    const reels: [string, string, string] =
      (reveal?.reels as [string, string, string]) ?? ['🍒', '🍋', '🔔'];
    return <SlotReels reels={reels} spinning={rolling} />;
  }

  if (gameId === 'number') {
    const drawn: number = reveal?.drawn ?? 0;
    return (
      <div className="flex flex-col items-center gap-2">
        <div className="text-xs uppercase tracking-wider text-yellow-300/80">Số trúng thưởng</div>
        <motion.div
          key={rolling ? 'spin' : String(drawn)}
          animate={rolling ? { rotateY: [0, 360, 720] } : { rotateY: 0 }}
          transition={{ duration: 1.4, repeat: rolling ? Infinity : 0, ease: 'linear' }}
          className="w-28 h-28 rounded-full bg-gradient-to-br from-yellow-400 via-yellow-500 to-yellow-700 border-4 border-yellow-200 flex items-center justify-center shadow-2xl"
        >
          <div className="text-6xl font-black text-red-900">{rolling ? '?' : drawn}</div>
        </motion.div>
      </div>
    );
  }

  if (gameId === 'chonga') {
    const winner = (reveal?.winner as 'red' | 'blue' | null) ?? null;
    return <RoosterFight fighting={rolling} winner={winner} />;
  }

  if (gameId === 'baucua') {
    const syms: [BauCuaSymbol, BauCuaSymbol, BauCuaSymbol] =
      (reveal?.symbols as [BauCuaSymbol, BauCuaSymbol, BauCuaSymbol]) ?? ['bau', 'cua', 'tom'];
    return (
      <BauCuaBowl
        symbols={syms}
        rolling={rolling}
        onAllPeeked={onAllPeeked}
        onPeekSound={onPeekSound}
      />
    );
  }

  if (gameId === 'pick2') {
    const side: string = reveal?.side ?? '';
    return (
      <div className="flex flex-col items-center gap-3">
        <div className="text-xs uppercase tracking-wider text-yellow-300/80">Cửa mở</div>
        <motion.div
          key={rolling ? 'spin' : side}
          animate={rolling ? { rotateY: [0, 180, 360], scale: [1, 1.1, 1] } : { rotateY: 0 }}
          transition={{ duration: 1.0, repeat: rolling ? Infinity : 0, ease: 'linear' }}
          className={clsx(
            'w-32 h-32 rounded-2xl border-4 flex items-center justify-center font-black text-3xl shadow-2xl',
            rolling
              ? 'bg-gradient-to-br from-slate-700 to-slate-900 border-slate-500 text-white/40'
              : side === 'red'
              ? 'bg-gradient-to-br from-red-500 to-red-800 border-red-300 text-white'
              : 'bg-gradient-to-br from-blue-500 to-blue-800 border-blue-300 text-white',
          )}
        >
          {rolling ? '?' : side === 'red' ? 'ĐỎ' : side === 'blue' ? 'XANH' : '?'}
        </motion.div>
      </div>
    );
  }

  return <div className="text-6xl">{rolling ? '🎲' : '✨'}</div>;
};

// ─── Result banner ────────────────────────────────────────────────────────
const ResultBanner: React.FC<{
  result: { win: boolean; delta: number; label: string; detail: string };
}> = ({ result }) => (
  <motion.div
    initial={{ scale: 0.6, opacity: 0, y: 20 }}
    animate={{ scale: 1, opacity: 1, y: 0 }}
    transition={{ type: 'spring', stiffness: 200, damping: 15 }}
    className="mt-4 mx-auto max-w-md bg-black/70 border border-casino-gold/40 rounded-xl p-4 text-center backdrop-blur"
  >
    <div
      className={clsx(
        'text-3xl font-black mb-1',
        result.win ? 'text-gradient-gold' : 'text-red-400',
      )}
    >
      {result.win ? '🎉 THẮNG' : '😔 THUA'}
    </div>
    <div className="text-white/90 text-sm font-bold">
      Kết quả: <span className="text-casino-gold">{result.label}</span>
    </div>
    <div className="text-[11px] text-casino-muted mb-2">{result.detail}</div>
    <div
      className={clsx(
        'inline-block px-3 py-1.5 rounded-lg font-black',
        result.win
          ? 'bg-green-500/20 text-green-300 border border-green-500/40'
          : 'bg-red-500/20 text-red-300 border border-red-500/40',
      )}
    >
      {result.delta >= 0 ? '+' : ''}
      {formatVND(result.delta)}
    </div>
  </motion.div>
);

const MiniGame: React.FC = () => {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const user = useSessionStore((s) => s.user);
  const balance = useSessionStore((s) => s.balance);
  const setBalance = useSessionStore((s) => s.setBalance);
  const openAuthModal = useSessionStore((s) => s.openAuthModal);

  const game = useMemo(() => (gameId ? GAMES[gameId] : undefined), [gameId]);

  // For single-button games (slot), auto-select the only option.
  const [selected, setSelected] = useState<string | null>(
    game && game.options.length === 1 ? game.options[0].id : null,
  );
  type Chip = { id: number; value: number };
  // Per-option chip stacks. Single-bet games only ever populate one key;
  // multiBet games (Bầu Cua) can have chips on multiple symbols at once.
  const [chipsByOpt, setChipsByOpt] = useState<Record<string, Chip[]>>({});
  const chipIdRef = useRef(0);
  const [rolling, setRolling] = useState(false);
  const [awaitingPeek, setAwaitingPeek] = useState(false);
  const [reveal, setReveal] = useState<Record<string, any> | null>(null);
  const [roadHistory, setRoadHistory] = useState<string[]>([]);
  const [result, setResult] = useState<null | {
    win: boolean;
    delta: number;
    payout: number;
    label: string;
    detail: string;
  }>(null);
  const [err, setErr] = useState<string | null>(null);
  const peekResolverRef = useRef<(() => void) | null>(null);

  const totalAmount = Object.values(chipsByOpt)
    .flat()
    .reduce((s, c) => s + c.value, 0);

  const addChip = (value: number) => {
    setErr(null);
    if (rolling || awaitingPeek) return;
    if (!selected) {
      setErr('Chọn cửa cược trước khi đặt chip.');
      return;
    }
    if (totalAmount + value > balance) {
      setErr('Số dư không đủ cho chip này.');
      return;
    }
    sfx.chipClink();
    setChipsByOpt((prev) => {
      const next = { ...prev };
      const arr = next[selected] ? [...next[selected]] : [];
      arr.push({ id: ++chipIdRef.current, value });
      next[selected] = arr;
      return next;
    });
  };

  const clearChips = () => {
    if (rolling || awaitingPeek) return;
    setChipsByOpt({});
    setErr(null);
  };

  const allIn = () => {
    setErr(null);
    if (rolling || awaitingPeek) return;
    if (!selected) {
      setErr('Chọn cửa cược trước khi ALL IN.');
      return;
    }
    if (balance <= 0) {
      setErr('Số dư trống.');
      return;
    }
    // ALL IN places the ENTIRE balance onto the currently-selected option,
    // even for multi-bet games. Existing chips on other options are cleared
    // so total never exceeds balance.
    const MAX_CHIPS = 20;
    const descending = [...CHIP_DENOMS].sort((a, b) => b - a);
    const stack: Chip[] = [];
    let remaining = balance;
    for (const denom of descending) {
      while (remaining >= denom && stack.length < MAX_CHIPS - 1) {
        stack.push({ id: ++chipIdRef.current, value: denom });
        remaining -= denom;
      }
    }
    if (remaining > 0) {
      stack.push({ id: ++chipIdRef.current, value: remaining });
    }
    sfx.chipClink();
    setChipsByOpt({ [selected]: stack });
  };

  const handleAllPeeked = () => {
    const resolve = peekResolverRef.current;
    if (resolve) {
      peekResolverRef.current = null;
      resolve();
    }
  };

  if (!game) return <Navigate to="/" replace />;
  if (!user) {
    openAuthModal('login');
    return <Navigate to="/" replace />;
  }

  const playStartSfx = () => {
    primeAudio();
    if (game.id === 'taixiu' || game.id === 'baucua') sfx.diceRoll();
    else if (game.id === 'baccarat' || game.id === 'longho') sfx.cardFlip();
    else if (game.id === 'coinflip' || game.id === 'xocdia') sfx.coinFlip();
    else if (game.id === 'slot') sfx.slotStop();
    else sfx.chipClink();
  };

  const handleBet = async () => {
    setErr(null);
    if (totalAmount <= 0) {
      setErr('Đặt chip vào ô cược trước.');
      return;
    }
    if (!game.multiBet && !selected) {
      setErr('Chọn cửa cược trước.');
      return;
    }
    if (totalAmount > balance) {
      setErr('Số dư không đủ.');
      return;
    }
    setRolling(true);
    setResult(null);
    setReveal(null);
    playStartSfx();
    try {
      const res = game.multiBet
        ? await api.betMulti(
            game.id,
            Object.entries(chipsByOpt)
              .filter(([, arr]) => arr.length > 0)
              .map(([prediction, arr]) => ({
                prediction,
                amount: arr.reduce((s, c) => s + c.value, 0),
              })),
          )
        : await api.bet(game.id, selected!, totalAmount);
      // Pacing: cards get sequential flips; taixiu/xocdia get interactive peel; others static.
      const isCardGame = game.id === 'baccarat' || game.id === 'longho';
      const isTaiXiu = game.id === 'taixiu';
      const isXocDia = game.id === 'xocdia';
      const isBauCua = game.id === 'baucua';
      const isChonga = game.id === 'chonga';
      const isPeelGame = isTaiXiu || isXocDia || isBauCua;
      const dealPause = isCardGame
        ? 700
        : isPeelGame
        ? 900
        : isChonga
        ? 2500
        : 1900;
      await new Promise((r) => setTimeout(r, dealPause));
      setBalance(res.balance);
      setReveal(res.reveal);

      if (isPeelGame && res.reveal) {
        // Stop the shake so user can grab the cover.
        setRolling(false);
        setAwaitingPeek(true);
        await new Promise<void>((resolve) => {
          peekResolverRef.current = resolve;
        });
        setAwaitingPeek(false);
      } else if (isCardGame && res.reveal) {
        // Same flip-delay formula as CardsTable — keep in sync.
        const flipDelay = (k: number, sideIdx: number) =>
          (k * 2 + sideIdx) * 0.7 + (k >= 2 ? 1.2 : 0);
        const player =
          game.id === 'baccarat' ? res.reveal.player?.cards ?? [] : [res.reveal.long];
        const banker =
          game.id === 'baccarat' ? res.reveal.banker?.cards ?? [] : [res.reveal.ho];
        // Schedule card-flip SFX at each card's flip start.
        player.forEach((_: unknown, k: number) => {
          setTimeout(() => sfx.cardFlip(), flipDelay(k, 0) * 1000);
        });
        banker.forEach((_: unknown, k: number) => {
          setTimeout(() => sfx.cardFlip(), flipDelay(k, 1) * 1000);
        });
        // Last card ends at flipDelay + 0.6 (flip duration). Wait 500ms buffer after.
        const lastP = player.length > 0 ? flipDelay(player.length - 1, 0) : 0;
        const lastB = banker.length > 0 ? flipDelay(banker.length - 1, 1) : 0;
        const lastMs = (Math.max(lastP, lastB) + 0.6) * 1000 + 500;
        await new Promise((r) => setTimeout(r, lastMs));
      }

      // Only record the history AFTER the reveal animation fully completes.
      // (Was updating too early → cầu appeared before cards/coins were shown.)
      if (
        res.reveal?.result &&
        (game.id === 'baccarat' ||
          game.id === 'longho' ||
          game.id === 'xocdia' ||
          game.id === 'taixiu' ||
          game.id === 'chonga')
      ) {
        setRoadHistory((prev) => [...prev, res.reveal!.result].slice(-90));
      }

      setResult({
        win: res.win,
        delta: res.delta,
        payout: res.payout,
        label: res.result.label,
        detail: res.result.detail,
      });
      if (res.win) sfx.win();
      else sfx.lose();
    } catch (e: any) {
      setErr(e.message || 'Có lỗi.');
    } finally {
      setRolling(false);
      setAwaitingPeek(false);
      peekResolverRef.current = null;
      // Clear chips once the round fully resolves so the next bet starts fresh.
      setChipsByOpt({});
    }
  };

  const dealerStatus = rolling
    ? 'Đang chia bài…'
    : result
    ? result.win
      ? 'Chúc mừng!'
      : 'Chúc may mắn lần sau'
    : 'Sẵn sàng';

  const hasRoad =
    game.id === 'baccarat' ||
    game.id === 'longho' ||
    game.id === 'xocdia' ||
    game.id === 'taixiu' ||
    game.id === 'chonga';
  const roadVariant: 'baccarat' | 'longho' | 'xocdia' | 'taixiu' | 'chonga' =
    game.id === 'baccarat' ||
    game.id === 'longho' ||
    game.id === 'xocdia' ||
    game.id === 'taixiu' ||
    game.id === 'chonga'
      ? (game.id as 'baccarat' | 'longho' | 'xocdia' | 'taixiu' | 'chonga')
      : 'baccarat';
  const busy = rolling || awaitingPeek;

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-4 py-3">
      {/* Compact top bar: back · title · balance */}
      <div className="flex items-center gap-3 mb-3">
        <button
          onClick={() => navigate('/')}
          className="text-xs text-casino-muted hover:text-casino-gold shrink-0"
          title="Về sảnh"
        >
          ← Sảnh
        </button>
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="text-2xl">{game.icon}</span>
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl font-black text-gradient-gold leading-none">
              {game.name}
            </h1>
            <p className="text-[10px] text-casino-muted truncate">{game.tagline}</p>
          </div>
        </div>
        <div className="bg-black/40 border border-casino-gold/30 rounded-lg px-3 py-1.5 shrink-0">
          <div className="text-[9px] uppercase text-casino-muted leading-none">Số dư</div>
          <div className="text-sm font-black text-gradient-gold leading-tight">
            {formatVND(balance)}
          </div>
        </div>
      </div>

      {/* 2-col grid on lg+, stacked on small screens */}
      <div className="grid gap-3 lg:grid-cols-[1fr_340px]">
        {/* LEFT: Scene + Cầu */}
        <div className="flex flex-col gap-3 min-w-0">
          <CasinoTable
            gameIcon={game.icon}
            gameName={game.name}
            dealerStatus={dealerStatus}
            compact
          >
            <div className="flex flex-col items-center w-full">
              <GameScene
                gameId={game.id}
                rolling={rolling}
                reveal={reveal}
                onAllPeeked={handleAllPeeked}
                onPeekSound={() => sfx.cardFlip()}
              />
              <AnimatePresence>
                {result && !rolling && <ResultBanner result={result} />}
              </AnimatePresence>
            </div>
          </CasinoTable>

          {hasRoad && (
            <BaccaratRoad history={roadHistory} variant={roadVariant} />
          )}
        </div>

        {/* RIGHT: Controls */}
        <div className="flex flex-col gap-3">
          {/* Options */}
          <div>
            <div className="text-[10px] uppercase tracking-wider text-casino-muted mb-1.5">
              Chọn cửa cược
            </div>
            <div
              className={clsx(
                'grid gap-2',
                game.options.length === 1 && 'grid-cols-1',
                game.options.length === 2 && 'grid-cols-2',
                game.options.length === 3 && 'grid-cols-3',
                game.options.length === 6 && 'grid-cols-3',
                game.options.length !== 1 && game.options.length !== 2 && game.options.length !== 3 && game.options.length !== 6 && 'grid-cols-5',
              )}
            >
              {game.options.map((opt) => {
                const isSel = selected === opt.id;
                const chipsHere = chipsByOpt[opt.id] ?? [];
                const optTotal = chipsHere.reduce((s, c) => s + c.value, 0);
                return (
                  <button
                    key={opt.id}
                    disabled={busy}
                    onClick={() => {
                      if (!game.multiBet && selected !== opt.id) {
                        // Single-bet games: switching option clears chips.
                        // Multi-bet games (Bầu Cua): keep all placed chips.
                        setChipsByOpt({});
                      }
                      setSelected(opt.id);
                      setResult(null);
                    }}
                    className={clsx(
                      'relative py-3 rounded-lg font-black text-sm transition overflow-hidden min-h-[58px]',
                      `bg-gradient-to-br ${opt.color}`,
                      isSel
                        ? 'ring-2 ring-casino-gold scale-[1.03] shadow-gold-glow'
                        : 'opacity-75 hover:opacity-100',
                      busy && 'opacity-50 cursor-not-allowed',
                    )}
                  >
                    <div className="text-white leading-none">{opt.label}</div>
                    <div className="text-[9px] text-white/80 font-semibold mt-0.5">
                      × {opt.payout}
                    </div>
                    {chipsHere.length > 0 && (
                      <>
                        <div className="absolute left-1/2 -translate-x-1/2 -bottom-1 flex items-end justify-center">
                          <ChipStack chips={chipsHere} size={22} maxVisible={6} />
                        </div>
                        {game.multiBet && (
                          <div className="absolute top-1 right-1 bg-black/70 rounded px-1 text-[8px] font-black text-casino-gold">
                            {formatVND(optTotal)}
                          </div>
                        )}
                      </>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Chip picker */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="text-[10px] uppercase tracking-wider text-casino-muted">
                Đặt chip vào cửa cược
              </div>
              {totalAmount > 0 && (
                <div className="text-[11px] font-black text-casino-gold">
                  Tổng: {formatVND(totalAmount)}
                </div>
              )}
            </div>

            {/* Chip denominations — click to fly a chip into the selected option */}
            <div className="grid grid-cols-5 gap-1.5">
              {CHIP_DENOMS.map((denom) => {
                const disabled = busy || !selected || totalAmount + denom > balance;
                return (
                  <motion.button
                    key={denom}
                    type="button"
                    disabled={disabled}
                    onClick={() => addChip(denom)}
                    whileHover={!disabled ? { y: -4, scale: 1.08 } : undefined}
                    whileTap={!disabled ? { scale: 0.9, rotate: 8 } : undefined}
                    className={clsx(
                      'flex items-center justify-center py-1 rounded-lg transition',
                      disabled
                        ? 'opacity-35 cursor-not-allowed'
                        : 'hover:bg-white/5',
                    )}
                    title={`Thêm chip ${formatVND(denom)}`}
                  >
                    <CasinoChip value={denom} size={44} />
                  </motion.button>
                );
              })}
            </div>

            {/* Action row: ALL IN + CLEAR */}
            <div className="grid grid-cols-2 gap-1.5 mt-2">
              <button
                type="button"
                disabled={busy || !selected || balance <= 0}
                onClick={allIn}
                className={clsx(
                  'py-2 rounded-lg text-[11px] font-black tracking-wider uppercase transition',
                  busy || !selected || balance <= 0
                    ? 'bg-white/5 text-white/30 cursor-not-allowed'
                    : 'bg-gradient-to-br from-red-600 via-red-700 to-red-900 text-yellow-300 border border-yellow-500/60 hover:brightness-110 shadow-md',
                )}
              >
                💰 ALL IN
              </button>
              <button
                type="button"
                disabled={busy || totalAmount === 0}
                onClick={clearChips}
                className={clsx(
                  'py-2 rounded-lg text-[11px] font-black tracking-wider uppercase transition',
                  busy || totalAmount === 0
                    ? 'bg-white/5 text-white/30 cursor-not-allowed'
                    : 'bg-white/10 text-white/80 hover:bg-white/20 border border-white/20',
                )}
              >
                ✕ XÓA CHIP
              </button>
            </div>
          </div>

          {err && (
            <div className="p-2 rounded bg-red-500/10 border border-red-500/30 text-red-300 text-[11px]">
              ⚠ {err}
            </div>
          )}

          <CTAButton
            variant="primary"
            size="lg"
            fullWidth
            disabled={busy || totalAmount <= 0 || (!game.multiBet && !selected)}
            onClick={handleBet}
          >
            {rolling
              ? 'Đang quay…'
              : awaitingPeek
              ? '🫳 Đang nặn…'
              : totalAmount > 0
              ? `🎲 CƯỢC ${formatVND(totalAmount)}`
              : '🪙 Đặt chip trước'}
          </CTAButton>

          <p className="text-center text-[9px] text-casino-muted">
            DEMO · Tiền ảo · Không giao dịch thật
          </p>
        </div>
      </div>
    </div>
  );
};

export default MiniGame;
