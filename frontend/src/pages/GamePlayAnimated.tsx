import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { GameContainerServer } from '../components/GameContainerServer';
import {
  AnimatedButton,
  AnimatedCard,
  AnimatedBalance,
  AnimatedResult,
  AnimatedStat,
  AnimatedBadge,
} from '../animations/AnimatedComponents';
import {
  containerVariants,
  itemVariants,
  slideInVariants,
  slideInRightVariants,
  popInVariants,
  pageVariants,
} from '../animations/variants';

type GameType = 'taiXiu' | 'xocDia' | 'baccarat' | 'longHo' | 'roulette';

interface GameStats {
  totalBets: number;
  totalWins: number;
  totalLosses: number;
  totalPayout: number;
  winRate: number;
}

const VALID_GAMES: GameType[] = ['taiXiu', 'xocDia', 'baccarat', 'longHo', 'roulette'];

export const GamePlayAnimated: React.FC = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const initialGame = (params.get('game') as GameType) || 'taiXiu';
  const [selectedGame, setSelectedGame] = useState<GameType>(
    VALID_GAMES.includes(initialGame) ? initialGame : 'taiXiu'
  );

  useEffect(() => {
    const q = params.get('game') as GameType;
    if (q && VALID_GAMES.includes(q) && q !== selectedGame) setSelectedGame(q);
  }, [params]);
  const [previousBalance, setPreviousBalance] = useState(1000);
  const [userBalance, setUserBalance] = useState(1000);
  const [stats, setStats] = useState<GameStats>({
    totalBets: 0,
    totalWins: 0,
    totalLosses: 0,
    totalPayout: 0,
    winRate: 0,
  });
  const [lastResult, setLastResult] = useState<{
    result: string;
    payout: number;
    isWin: boolean;
  } | null>(null);

  const games: { id: GameType; name: string; icon: string; rtp: number }[] = [
    { id: 'taiXiu', name: 'Tài Xỉu', icon: '🎲', rtp: 98.5 },
    { id: 'xocDia', name: 'Xóc Đĩa', icon: '🪙', rtp: 98 },
    { id: 'baccarat', name: 'Baccarat', icon: '🃏', rtp: 98.6 },
    { id: 'longHo', name: 'Long Hổ', icon: '🐉', rtp: 98.5 },
    { id: 'roulette', name: 'Roulette', icon: '🎡', rtp: 97.3 },
  ];

  const handleBalanceChange = (newBalance: number) => {
    setPreviousBalance(userBalance);
    setUserBalance(newBalance);
    const diff = newBalance - userBalance;

    if (diff !== 0) {
      setLastResult({
        result: diff > 0 ? 'WIN!' : 'LOST',
        payout: Math.abs(diff),
        isWin: diff > 0,
      });

      setTimeout(() => setLastResult(null), 3000);
    }
  };

  return (
    <motion.div
      className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white"
      variants={pageVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Animated Header */}
      <motion.header
        className="bg-gray-800/80 backdrop-blur border-b border-gray-700 sticky top-0 z-50"
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          {/* Logo with back button */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-yellow-200 text-sm font-semibold transition"
            >
              ← Sảnh
            </button>
            <motion.div whileHover={{ scale: 1.05 }} transition={{ type: 'spring', stiffness: 400 }}>
              <h1 className="text-2xl font-bold text-yellow-400">🎮 TK88 Gaming</h1>
              <p className="text-gray-400 text-xs">Professional 3D Casino</p>
            </motion.div>
          </div>

          {/* Balance - Animated */}
          <AnimatedBalance balance={userBalance} previousBalance={previousBalance} />
        </div>
      </motion.header>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-6 h-[calc(100vh-120px)] gap-4 p-4">
        {/* Animated Sidebar */}
        <motion.div
          className="col-span-1 bg-gray-800/50 backdrop-blur border border-gray-700 rounded-lg p-4 overflow-y-auto"
          variants={slideInVariants}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.2 }}
        >
          <motion.h2
            className="text-lg font-bold mb-4 text-yellow-400"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            🎮 Games
          </motion.h2>

          <motion.div
            className="space-y-2"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {games.map((game, index) => (
              <motion.div
                key={game.id}
                variants={itemVariants}
                whileHover={{ x: 5 }}
                custom={index}
              >
                <motion.button
                  onClick={() => setSelectedGame(game.id)}
                  className={`w-full text-left p-3 rounded transition-colors ${
                    selectedGame === game.id
                      ? 'bg-yellow-600 text-white font-bold'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                  whileHover={{
                    scale: 1.02,
                    boxShadow: '0 0 20px rgba(234, 179, 8, 0.3)',
                  }}
                  whileTap={{ scale: 0.98 }}
                  layout
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xl">{game.icon}</div>
                      <div className="text-sm font-semibold">{game.name}</div>
                    </div>
                    <AnimatedBadge variant="info">{game.rtp}%</AnimatedBadge>
                  </div>
                </motion.button>
              </motion.div>
            ))}
          </motion.div>

          {/* Stats Section */}
          <motion.div
            className="mt-8 pt-4 border-t border-gray-700"
            variants={slideInVariants}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.5 }}
          >
            <h3 className="text-sm font-bold text-yellow-400 mb-3">📊 Statistics</h3>
            <motion.div
              className="space-y-2"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              <AnimatedStat
                label="Total Bets"
                value={stats.totalBets}
                changed={stats.totalBets > 0}
              />
              <AnimatedStat
                label="Wins"
                value={stats.totalWins}
                changed={stats.totalWins > 0}
              />
              <AnimatedStat
                label="Losses"
                value={stats.totalLosses}
                changed={stats.totalLosses > 0}
              />
              <AnimatedStat
                label="Win Rate"
                value={`${stats.winRate.toFixed(1)}%`}
                changed={stats.winRate > 0}
              />
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Animated Game Container */}
        <motion.div
          className="col-span-4 bg-gray-800/50 backdrop-blur border border-gray-700 rounded-lg overflow-hidden"
          variants={slideInRightVariants}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.3 }}
          layout
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedGame}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className="h-full"
            >
              <GameContainerServer
                gameType={selectedGame}
                userId="user-123"
                userBalance={userBalance}
                onBalanceChange={handleBalanceChange}
              />
            </motion.div>
          </AnimatePresence>
        </motion.div>

        {/* Animated Right Panel - Last Result & Info */}
        <motion.div
          className="col-span-1 bg-gray-800/50 backdrop-blur border border-gray-700 rounded-lg p-4 flex flex-col gap-4 overflow-y-auto"
          variants={slideInRightVariants}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.4 }}
        >
          {/* Last Result Animation */}
          <AnimatePresence>
            {lastResult && (
              <motion.div
                initial={{ opacity: 0, y: -20, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.8 }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              >
                <div
                  className={`p-4 rounded-lg border-2 ${
                    lastResult.isWin
                      ? 'bg-green-900/50 border-green-500'
                      : 'bg-red-900/50 border-red-500'
                  }`}
                >
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 0.6 }}
                    className={`text-2xl font-bold ${
                      lastResult.isWin ? 'text-green-400' : 'text-red-400'
                    }`}
                  >
                    {lastResult.isWin ? '🎉 WIN!' : '❌ LOST'}
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="text-sm text-gray-300 mt-2"
                  >
                    {lastResult.result}
                  </motion.div>
                  <motion.div
                    animate={{ scale: [1, 1.15, 1] }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                    className="text-xl font-bold text-yellow-400 mt-2"
                  >
                    ${lastResult.payout.toFixed(2)}
                  </motion.div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Quick Stats */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <h3 className="text-sm font-bold text-yellow-400 mb-3">💡 Tips</h3>
            <motion.ul
              className="text-xs text-gray-400 space-y-2"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              <motion.li variants={itemVariants}>✓ All games verified with seeds</motion.li>
              <motion.li variants={itemVariants}>✓ Server-based fairness</motion.li>
              <motion.li variants={itemVariants}>✓ Real-time multiplayer</motion.li>
              <motion.li variants={itemVariants}>✓ Instant withdrawals</motion.li>
            </motion.ul>
          </motion.div>

          {/* Connection Status */}
          <motion.div
            className="mt-auto pt-4 border-t border-gray-700"
            whileHover={{ scale: 1.02 }}
          >
            <motion.div
              animate={{ boxShadow: ['0 0 0px rgba(34, 197, 94, 0)', '0 0 10px rgba(34, 197, 94, 0.5)'] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="flex items-center gap-2 bg-gray-700 p-3 rounded"
            >
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="w-2 h-2 bg-green-500 rounded-full"
              />
              <span className="text-xs">Connected</span>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  );
};
export default GamePlayAnimated;
