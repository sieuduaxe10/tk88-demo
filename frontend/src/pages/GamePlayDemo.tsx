import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  AnimatedButton,
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

export const GamePlayDemo: React.FC = () => {
  const [selectedGame, setSelectedGame] = useState<GameType>('taiXiu');
  const [previousBalance, setPreviousBalance] = useState(1000);
  const [userBalance, setUserBalance] = useState(1000);
  const [lastResult, setLastResult] = useState<{
    result: string;
    payout: number;
    isWin: boolean;
  } | null>(null);
  const [betAmount, setBetAmount] = useState(10);

  const games: { id: GameType; name: string; icon: string; rtp: number; description: string }[] = [
    { id: 'taiXiu', name: 'Tài Xỉu', icon: '🎲', rtp: 98.5, description: 'Dự đoán tổng 3 xúc xắc' },
    { id: 'xocDia', name: 'Xóc Đĩa', icon: '🪙', rtp: 98, description: 'Chẵn hay Lẻ' },
    { id: 'baccarat', name: 'Baccarat', icon: '🃏', rtp: 98.6, description: 'Người hay Nhà cái' },
    { id: 'longHo', name: 'Long Hổ', icon: '🐉', rtp: 98.5, description: 'Long hay Hổ' },
    { id: 'roulette', name: 'Roulette', icon: '🎡', rtp: 97.3, description: 'Dự đoán số' },
  ];

  const handlePlayGame = () => {
    const outcomes = [
      { result: 'WIN! 🎉', payout: betAmount * 1.95, isWin: true },
      { result: 'LOSE 😢', payout: 0, isWin: false },
      { result: 'WIN! 🎉', payout: betAmount * 1.5, isWin: true },
    ];

    const randomResult = outcomes[Math.floor(Math.random() * outcomes.length)];
    setPreviousBalance(userBalance);

    if (randomResult.isWin) {
      setUserBalance(userBalance + randomResult.payout);
    } else {
      setUserBalance(Math.max(0, userBalance - betAmount));
    }

    setLastResult(randomResult);
    setTimeout(() => setLastResult(null), 3000);
  };

  const selectedGameData = games.find(g => g.id === selectedGame);

  return (
    <motion.div
      className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900"
      variants={pageVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Animated Header */}
      <motion.header
        className="bg-gradient-to-r from-purple-900/80 to-slate-900/80 backdrop-blur border-b border-purple-500/30 sticky top-0 z-50"
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, type: 'spring', stiffness: 100 }}
      >
        <div className="max-w-7xl mx-auto px-6 py-5 flex justify-between items-center">
          {/* Logo */}
          <motion.div
            whileHover={{ scale: 1.08 }}
            transition={{ type: 'spring', stiffness: 400 }}
            className="cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <motion.div
                className="text-4xl"
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                🎮
              </motion.div>
              <div>
                <h1 className="text-3xl font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  TK88 Gaming
                </h1>
                <p className="text-xs text-purple-300">Professional Casino Platform</p>
              </div>
            </div>
          </motion.div>

          {/* Balance Section */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur px-6 py-3 rounded-xl border border-purple-500/30"
          >
            <div className="text-xs text-purple-300 uppercase tracking-widest mb-1">
              💰 Your Balance
            </div>
            <AnimatedBalance balance={userBalance} previousBalance={previousBalance} />
          </motion.div>
        </div>
      </motion.header>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-12 min-h-[calc(100vh-80px)] gap-4 p-6">
        {/* LEFT SIDEBAR - Game Selection */}
        <motion.div
          className="col-span-3 space-y-4"
          variants={slideInVariants}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.2 }}
        >
          {/* Games Section */}
          <motion.div
            className="bg-gradient-to-br from-purple-900/40 to-slate-900/40 backdrop-blur border border-purple-500/30 rounded-xl p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <h2 className="text-lg font-bold text-transparent bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text mb-4 flex items-center gap-2">
              <span>🎯</span> Popular Games
            </h2>

            <motion.div
              className="space-y-2"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {games.map((game, index) => (
                <motion.button
                  key={game.id}
                  variants={itemVariants}
                  custom={index}
                  onClick={() => setSelectedGame(game.id)}
                  whileHover={{ x: 6 }}
                  className={`w-full text-left p-3 rounded-lg transition-all duration-300 group relative overflow-hidden ${
                    selectedGame === game.id
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/50'
                      : 'bg-purple-900/30 text-gray-300 hover:bg-purple-800/40'
                  }`}
                >
                  <div className="relative z-10 flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{game.icon}</span>
                      <div className="text-left">
                        <div className="font-bold text-sm">{game.name}</div>
                        <div className="text-xs opacity-75">{game.description}</div>
                      </div>
                    </div>
                    <div className="text-xs font-semibold bg-black/30 px-2 py-1 rounded">
                      {game.rtp}%
                    </div>
                  </div>
                </motion.button>
              ))}
            </motion.div>
          </motion.div>

          {/* Stats Cards */}
          <motion.div
            className="bg-gradient-to-br from-purple-900/40 to-slate-900/40 backdrop-blur border border-purple-500/30 rounded-xl p-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <h3 className="text-sm font-bold text-purple-300 uppercase tracking-widest mb-4">
              📊 Statistics
            </h3>
            <motion.div className="space-y-3" variants={containerVariants} initial="hidden" animate="visible">
              <motion.div variants={itemVariants} className="bg-purple-900/50 rounded-lg p-3">
                <div className="text-xs text-purple-400 uppercase mb-1">Total Bets</div>
                <div className="text-2xl font-bold">$450</div>
              </motion.div>
              <motion.div variants={itemVariants} className="bg-green-900/50 rounded-lg p-3">
                <div className="text-xs text-green-400 uppercase mb-1">Total Wins</div>
                <div className="text-2xl font-bold">$1,240</div>
              </motion.div>
              <motion.div variants={itemVariants} className="bg-pink-900/50 rounded-lg p-3">
                <div className="text-xs text-pink-400 uppercase mb-1">Win Rate</div>
                <div className="text-2xl font-bold">58%</div>
              </motion.div>
            </motion.div>
          </motion.div>
        </motion.div>

        {/* CENTER - Game Display */}
        <motion.div
          className="col-span-6 bg-gradient-to-br from-purple-900/40 to-slate-900/40 backdrop-blur border border-purple-500/30 rounded-xl p-8 flex flex-col items-center justify-center"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, type: 'spring' }}
        >
          {/* Game Icon - Animated */}
          <motion.div
            className="mb-8"
            animate={{ y: [0, -20, 0] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          >
            <div className="text-9xl drop-shadow-lg">{selectedGameData?.icon}</div>
          </motion.div>

          {/* Game Name */}
          <motion.div
            className="text-center mb-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <h2 className="text-4xl font-black mb-2 bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent">
              {selectedGameData?.name}
            </h2>
            <p className="text-gray-400 text-lg">{selectedGameData?.description}</p>
          </motion.div>

          {/* Game Info Cards */}
          <motion.div
            className="grid grid-cols-3 gap-4 w-full mb-8"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.5 }}
          >
            <motion.div variants={itemVariants} className="bg-purple-600/30 rounded-lg p-4 text-center border border-purple-500/50">
              <div className="text-xs text-purple-300 uppercase mb-2">Min Bet</div>
              <div className="text-2xl font-bold text-purple-200">$0.01</div>
            </motion.div>
            <motion.div variants={itemVariants} className="bg-pink-600/30 rounded-lg p-4 text-center border border-pink-500/50">
              <div className="text-xs text-pink-300 uppercase mb-2">Bet Amount</div>
              <div className="text-2xl font-bold text-pink-200">${betAmount}</div>
            </motion.div>
            <motion.div variants={itemVariants} className="bg-blue-600/30 rounded-lg p-4 text-center border border-blue-500/50">
              <div className="text-xs text-blue-300 uppercase mb-2">Max Bet</div>
              <div className="text-2xl font-bold text-blue-200">$10k</div>
            </motion.div>
          </motion.div>

          {/* Bet Slider */}
          <motion.div
            className="w-full mb-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <label className="block text-sm font-semibold text-purple-300 mb-3">
              Choose Your Bet 🎲
            </label>
            <input
              type="range"
              min="0.01"
              max="1000"
              step="0.01"
              value={betAmount}
              onChange={(e) => setBetAmount(parseFloat(e.target.value))}
              className="w-full h-2 bg-purple-900 rounded-lg appearance-none cursor-pointer accent-purple-500"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-2">
              <span>$0.01</span>
              <span>${betAmount.toFixed(2)}</span>
              <span>$1,000</span>
            </div>
          </motion.div>

          {/* Play Button */}
          <motion.div
            className="w-full"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <motion.button
              onClick={handlePlayGame}
              className="w-full bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 hover:from-purple-500 hover:via-pink-500 hover:to-purple-500 text-white font-bold py-4 px-6 rounded-lg text-lg transition-all duration-300 shadow-lg shadow-pink-500/50"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              🎮 PLAY NOW
            </motion.button>
          </motion.div>

          {/* Info */}
          <motion.div
            className="mt-6 text-center text-sm text-gray-500 space-y-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            <p>✨ Built with Framer Motion • 60 FPS Smooth Animations</p>
            <p>⚡ GPU Accelerated • Production Ready</p>
          </motion.div>
        </motion.div>

        {/* RIGHT SIDEBAR - Results */}
        <motion.div
          className="col-span-3"
          variants={slideInRightVariants}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.4 }}
        >
          {/* Results Card */}
          <motion.div
            className="bg-gradient-to-br from-purple-900/40 to-slate-900/40 backdrop-blur border border-purple-500/30 rounded-xl p-6 mb-4 min-h-[400px] flex flex-col items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            {lastResult ? (
              <motion.div
                variants={popInVariants}
                initial="hidden"
                animate="visible"
                className="w-full"
              >
                <AnimatedResult
                  result={lastResult.result}
                  payout={lastResult.payout}
                  isWin={lastResult.isWin}
                />
              </motion.div>
            ) : (
              <motion.div
                className="text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <div className="text-6xl mb-4 opacity-50">🎯</div>
                <p className="text-gray-400">Click "PLAY NOW" button</p>
                <p className="text-gray-500 text-sm">to see the result animation</p>
              </motion.div>
            )}
          </motion.div>

          {/* Badges Section */}
          <motion.div
            className="bg-gradient-to-br from-purple-900/40 to-slate-900/40 backdrop-blur border border-purple-500/30 rounded-xl p-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <h3 className="text-sm font-bold text-purple-300 uppercase tracking-widest mb-3">
              ✨ Highlights
            </h3>
            <motion.div
              className="space-y-2"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              <motion.div variants={itemVariants}>
                <AnimatedBadge variant="success">
                  🏆 {selectedGameData?.rtp}% RTP
                </AnimatedBadge>
              </motion.div>
              <motion.div variants={itemVariants}>
                <AnimatedBadge variant="info">💻 Live Demo</AnimatedBadge>
              </motion.div>
              <motion.div variants={itemVariants}>
                <AnimatedBadge variant="warning">
                  🎬 Animated UI
                </AnimatedBadge>
              </motion.div>
            </motion.div>
          </motion.div>

          {/* Status Indicator */}
          <motion.div
            className="mt-4 bg-gradient-to-br from-green-900/40 to-emerald-900/40 backdrop-blur border border-green-500/30 rounded-xl p-4"
            whileHover={{ scale: 1.02 }}
            transition={{ type: 'spring' }}
          >
            <motion.div
              animate={{ boxShadow: [
                '0 0 0px rgba(34, 197, 94, 0)',
                '0 0 20px rgba(34, 197, 94, 0.4)',
                '0 0 0px rgba(34, 197, 94, 0)'
              ] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="flex items-center gap-3 p-3"
            >
              <motion.div
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="w-3 h-3 bg-green-400 rounded-full"
              />
              <div>
                <div className="text-sm font-semibold text-green-300">System Ready</div>
                <div className="text-xs text-green-400">All animations active</div>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default GamePlayDemo;
