import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { GameBase } from '../games/base/GameBase';
import { TaiXiuGame } from '../games/taiXiu/TaiXiuGame';
import { XocDiaGame } from '../games/xocDia/XocDiaGame';
import { BaccaratGame } from '../games/baccarat/BaccaratGame';
import { LongHoGame } from '../games/longHo/LongHoGame';
import { RouletteGame } from '../games/roulette/RouletteGame';
import { useGameSocket, GameResult } from '../hooks/useGameSocket';

type GameType = 'taiXiu' | 'xocDia' | 'baccarat' | 'longHo' | 'roulette';

interface GameContainerServerProps {
  gameType: GameType;
  userId: string;
  userBalance: number;
  onBalanceChange?: (newBalance: number) => void;
  minBet?: number;
  maxBet?: number;
}

type PredictionOption = { value: string; label: string; color: string };

const PREDICTIONS: Record<GameType, PredictionOption[]> = {
  taiXiu: [
    { value: 'tai', label: 'Tài (>10)', color: 'bg-blue-600' },
    { value: 'xiu', label: 'Xỉu (<11)', color: 'bg-red-600' },
  ],
  xocDia: [
    { value: 'even', label: 'Chẵn', color: 'bg-emerald-600' },
    { value: 'odd', label: 'Lẻ', color: 'bg-orange-600' },
  ],
  baccarat: [
    { value: 'player', label: 'Player', color: 'bg-blue-600' },
    { value: 'banker', label: 'Banker', color: 'bg-red-600' },
    { value: 'tie', label: 'Tie (8:1)', color: 'bg-yellow-600' },
  ],
  longHo: [
    { value: 'dragon', label: '🐉 Long', color: 'bg-red-600' },
    { value: 'tiger', label: '🐯 Hổ', color: 'bg-yellow-600' },
    { value: 'tie', label: 'Hòa (8:1)', color: 'bg-purple-600' },
  ],
  roulette: [
    { value: 'red', label: '🔴 Đỏ', color: 'bg-red-600' },
    { value: 'black', label: '⚫ Đen', color: 'bg-gray-800' },
    { value: 'even', label: 'Chẵn', color: 'bg-emerald-600' },
    { value: 'odd', label: 'Lẻ', color: 'bg-orange-600' },
  ],
};

const DEFAULT_PREDICTION: Record<GameType, string> = {
  taiXiu: 'tai',
  xocDia: 'even',
  baccarat: 'player',
  longHo: 'dragon',
  roulette: 'red',
};

export const GameContainerServer: React.FC<GameContainerServerProps> = ({
  gameType,
  userId,
  userBalance,
  onBalanceChange,
  minBet = 1,
  maxBet = 10000,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<GameBase | null>(null);
  const [betAmount, setBetAmount] = useState(10);
  const [prediction, setPrediction] = useState<string>(DEFAULT_PREDICTION[gameType]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [lastResult, setLastResult] = useState<GameResult | null>(null);
  const [isSettlingBet, setIsSettlingBet] = useState(false);
  const [demoMode, setDemoMode] = useState(false);

  useEffect(() => {
    setPrediction(DEFAULT_PREDICTION[gameType]);
    setError('');
    setLastResult(null);
  }, [gameType]);

  const { isConnected, isPlaying, placeBet, joinGame } = useGameSocket({
    userId,
    onGameResult: (result: GameResult) => {
      setLastResult(result);
      setIsSettlingBet(false);
      const newBalance = userBalance - betAmount + result.payout;
      onBalanceChange?.(newBalance);
      if (gameRef.current) {
        gameRef.current.getState().payout = result.payout;
        gameRef.current.getState().result = result.result;
      }
    },
    onError: (errMsg: string) => {
      setError(errMsg);
      setIsSettlingBet(false);
    },
  });

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const syncCanvasSize = () => {
      const width = Math.floor(canvas.clientWidth);
      const height = Math.floor(canvas.clientHeight);
      if (width > 0 && height > 0 && (canvas.width !== width || canvas.height !== height)) {
        canvas.width = width;
        canvas.height = height;
        if (gameRef.current?.engine) {
          try { gameRef.current.engine.resize(); } catch { /* ignore */ }
        }
      }
    };

    setTimeout(syncCanvasSize, 0);
    const handleResize = () => syncCanvasSize();
    window.addEventListener('resize', handleResize);
    const resizeObserver = new ResizeObserver(() => syncCanvasSize());
    const parent = canvas.parentElement;
    if (parent) resizeObserver.observe(parent);

    return () => {
      window.removeEventListener('resize', handleResize);
      resizeObserver.disconnect();
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const initGame = async () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      try {
        setLoading(true);
        setError('');

        const width = Math.floor(canvas.clientWidth) || 800;
        const height = Math.floor(canvas.clientHeight) || 500;
        canvas.width = width;
        canvas.height = height;

        let game: GameBase;
        switch (gameType) {
          case 'taiXiu': game = new TaiXiuGame(canvas); break;
          case 'xocDia': game = new XocDiaGame(canvas); break;
          case 'baccarat': game = new BaccaratGame(canvas); break;
          case 'longHo': game = new LongHoGame(canvas); break;
          case 'roulette': game = new RouletteGame(canvas); break;
          default: throw new Error(`Unknown game type: ${gameType}`);
        }

        await game.initialize();
        if (cancelled) {
          game.dispose();
          return;
        }
        gameRef.current = game;

        try { game.engine.resize(); } catch { /* ignore */ }
        setLoading(false);

        joinGame(gameType).catch(() => { /* demo mode fallback */ });
      } catch (err) {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : 'Failed to load game';
        setError(message);
        setLoading(false);
      }
    };

    initGame();

    return () => {
      cancelled = true;
      if (gameRef.current) {
        gameRef.current.dispose();
        gameRef.current = null;
      }
    };
  }, [gameType]);

  useEffect(() => {
    if (!isConnected && !loading) {
      const timer = setTimeout(() => setDemoMode(true), 2000);
      return () => clearTimeout(timer);
    } else if (isConnected) {
      setDemoMode(false);
    }
  }, [isConnected, loading]);

  const canPlay = !isPlaying && !isSettlingBet && !loading && betAmount > 0;

  const handleServerBet = async () => {
    if (betAmount > userBalance) { setError('Không đủ số dư'); return; }
    if (betAmount < minBet || betAmount > maxBet) {
      setError(`Cược phải từ ${minBet} đến ${maxBet}`);
      return;
    }

    try {
      setError('');
      setIsSettlingBet(true);

      if (isConnected) {
        await placeBet(gameType, betAmount, prediction);
        if (gameRef.current) gameRef.current.setBetAmount(betAmount);
      } else {
        // Demo / offline mode - run animation locally and settle from game state
        if (!gameRef.current) throw new Error('Game chưa sẵn sàng');
        gameRef.current.setBetAmount(betAmount);
        await gameRef.current.placeBet(betAmount, prediction);

        const state = gameRef.current.getState();
        const payout = state.payout || 0;
        const newBalance = userBalance - betAmount + payout;
        const isWin = payout > betAmount;

        setLastResult({
          sessionId: `demo-${Date.now()}`,
          userId,
          gameType,
          result: state.result || (isWin ? 'WIN' : 'LOSE'),
          payout,
          serverSeed: 'demo-offline-mode',
          timestamp: new Date(),
        });
        onBalanceChange?.(newBalance);
        setIsSettlingBet(false);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Bet failed';
      setError(message);
      setIsSettlingBet(false);
    }
  };

  const predictionOptions = PREDICTIONS[gameType];

  return (
    <div className="flex flex-col w-full h-full bg-gray-900">
      <div className="relative flex-1 min-h-[280px]">
        <canvas
          ref={canvasRef}
          style={{ width: '100%', height: '100%', display: 'block' }}
        />
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900/80">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto mb-4" />
              <p className="text-white text-lg">Loading 3D scene…</p>
              <p className="text-gray-400 text-sm mt-2">Khởi tạo Babylon.js engine</p>
            </div>
          </div>
        )}
        {(isPlaying || isSettlingBet) && !loading && (
          <div className="absolute top-3 right-3 bg-yellow-500/90 text-black text-sm font-bold px-3 py-1 rounded shadow">
            ⏳ Đang quay…
          </div>
        )}
      </div>

      <div className="bg-gray-800 border-t border-gray-700 p-4 max-h-[55%] overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          <div className="mb-3 p-2 bg-gray-700 rounded text-xs flex items-center gap-2">
            <span className={`inline-block w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-blue-500'}`} />
            <span className="text-white">
              {isConnected ? 'Đã kết nối server' : demoMode ? 'Chế độ Demo (offline)' : 'Đang kết nối…'}
            </span>
          </div>

          {error && (
            <div className="mb-3 p-2 bg-red-900 border border-red-600 rounded text-red-100 text-sm">
              ⚠️ {error}
            </div>
          )}

          {lastResult && (
            <div className={`mb-3 p-3 rounded border ${lastResult.payout > betAmount ? 'bg-green-900/60 border-green-500' : 'bg-red-900/60 border-red-500'}`}>
              <div className="font-bold text-base">
                {lastResult.payout > betAmount ? '🎉 THẮNG!' : lastResult.payout === betAmount ? '🤝 HÒA' : '❌ THUA'}
              </div>
              <div className="text-sm text-gray-200">{lastResult.result}</div>
              <div className="text-sm text-yellow-300 font-bold">Payout: ${lastResult.payout.toFixed(2)}</div>
            </div>
          )}

          <div className="grid grid-cols-3 gap-3 mb-3">
            <div className="bg-gray-700 p-2 rounded">
              <div className="text-xs text-gray-400">Số dư</div>
              <div className="text-lg font-bold text-green-400">${userBalance.toFixed(2)}</div>
            </div>
            <div className="bg-gray-700 p-2 rounded">
              <div className="text-xs text-gray-400">Tiền cược</div>
              <div className="text-lg font-bold text-white">${betAmount.toFixed(2)}</div>
            </div>
            <div className="bg-gray-700 p-2 rounded">
              <div className="text-xs text-gray-400">Cửa chọn</div>
              <div className="text-sm font-bold text-yellow-400 truncate">
                {predictionOptions.find(p => p.value === prediction)?.label || prediction}
              </div>
            </div>
          </div>

          <div className="mb-3">
            <label className="block text-sm text-gray-300 mb-2 font-semibold">Chọn cửa cược</label>
            <div className={`grid gap-2 ${predictionOptions.length > 2 ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-2'}`}>
              {predictionOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setPrediction(opt.value)}
                  disabled={!canPlay}
                  className={`py-2 rounded font-bold text-sm transition ${
                    prediction === opt.value
                      ? `${opt.color} text-white ring-2 ring-yellow-400`
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-sm text-gray-300 mb-1">Tiền cược</label>
              <input
                type="number"
                min={minBet}
                max={maxBet}
                step="1"
                value={betAmount}
                onChange={(e) => setBetAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                disabled={!canPlay}
                className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 disabled:opacity-50"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={handleServerBet}
                disabled={!canPlay || betAmount > userBalance}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-bold py-2 rounded transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSettlingBet || isPlaying ? 'Đang xử lý…' : `Đặt cược ${isConnected ? '' : '(Demo)'}`}
              </button>
            </div>
          </div>

          <div className="flex gap-2 flex-wrap">
            {[10, 50, 100, 500, 1000].map((amount) => (
              <button
                key={amount}
                onClick={() => setBetAmount(amount)}
                disabled={!canPlay || amount > userBalance}
                className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ${amount}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameContainerServer;
