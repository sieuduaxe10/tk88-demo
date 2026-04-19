import React, { useState } from 'react';
import { GameContainer } from '../components/GameContainer';
import { GameState } from '../games/base/GameBase';

type GameType = 'taiXiu' | 'xocDia' | 'baccarat' | 'longHo' | 'roulette';

interface GameStats {
  totalBets: number;
  totalWins: number;
  totalLosses: number;
  totalPayout: number;
  winRate: number;
}

export const GamePlay: React.FC = () => {
  const [selectedGame, setSelectedGame] = useState<GameType>('taiXiu');
  const [stats, setStats] = useState<GameStats>({
    totalBets: 0,
    totalWins: 0,
    totalLosses: 0,
    totalPayout: 0,
    winRate: 0,
  });
  const [userBalance, setUserBalance] = useState(1000); // Mock balance

  const games: { id: GameType; name: string; rtp: number }[] = [
    { id: 'taiXiu', name: 'Tài Xỉu', rtp: 98.5 },
    { id: 'xocDia', name: 'Xóc Đĩa', rtp: 98 },
    { id: 'baccarat', name: 'Baccarat', rtp: 98.6 },
    { id: 'longHo', name: 'Long Hổ', rtp: 98.5 },
    { id: 'roulette', name: 'Roulette', rtp: 97.3 },
  ];

  const handleGameStateChange = (state: GameState) => {
    if (state.payout > 0 && state.result) {
      setStats((prev) => ({
        ...prev,
        totalBets: prev.totalBets + state.betAmount,
        totalWins: prev.totalWins + 1,
        totalPayout: prev.totalPayout + state.payout,
        winRate:
          ((prev.totalWins + 1) / (prev.totalBets + state.betAmount)) * 100,
      }));

      // Update balance
      setUserBalance((prev) => prev - state.betAmount + state.payout);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-yellow-400">🎮 TK88 Gaming</h1>
            <p className="text-gray-400 text-sm">Professional 3D Casino Platform</p>
          </div>

          {/* User Balance */}
          <div className="text-right">
            <div className="text-xs text-gray-400">Balance</div>
            <div className="text-2xl font-bold text-green-400">
              ${userBalance.toFixed(2)}
            </div>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-6 h-screen">
        {/* Sidebar - Game List */}
        <div className="col-span-1 bg-gray-800 border-r border-gray-700 overflow-y-auto">
          <div className="p-4">
            <h2 className="text-lg font-bold mb-4 text-yellow-400">Games</h2>

            <div className="space-y-2">
              {games.map((game) => (
                <button
                  key={game.id}
                  onClick={() => setSelectedGame(game.id)}
                  className={`w-full text-left px-4 py-3 rounded transition ${
                    selectedGame === game.id
                      ? 'bg-yellow-600 text-white font-bold'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  <div className="font-semibold">{game.name}</div>
                  <div className="text-xs text-gray-400">RTP: {game.rtp}%</div>
                </button>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="p-4 border-t border-gray-700">
            <h3 className="font-bold mb-3 text-yellow-400">Session Stats</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Bets Placed</span>
                <span className="text-white">{stats.totalBets}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Wins</span>
                <span className="text-green-400">{stats.totalWins}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Losses</span>
                <span className="text-red-400">{stats.totalLosses}</span>
              </div>
              <div className="flex justify-between border-t border-gray-700 pt-2 mt-2">
                <span className="text-gray-400">Win Rate</span>
                <span className="text-blue-400">
                  {stats.winRate > 0 ? stats.winRate.toFixed(1) : 0}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Game Area */}
        <div className="col-span-5">
          <GameContainer
            gameType={selectedGame}
            onGameStateChange={handleGameStateChange}
            minBet={0.01}
            maxBet={10000}
          />
        </div>
      </div>

      {/* Info Toast */}
      <div className="fixed bottom-4 right-4 bg-blue-900 border border-blue-600 rounded p-4 text-sm max-w-xs">
        <p className="text-blue-100">
          💡 Server-authoritative: All game results validated server-side.
          Current demo uses client-side prediction only.
        </p>
      </div>
    </div>
  );
};

export default GamePlay;
