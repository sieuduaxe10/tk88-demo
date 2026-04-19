import React, { useEffect, useRef, useState } from 'react';
import { GameBase, GameState } from '../games/base/GameBase';
import { TaiXiuGame, TaiXiuPrediction } from '../games/taiXiu/TaiXiuGame';
import { XocDiaGame, XocDiaPrediction } from '../games/xocDia/XocDiaGame';
import { BaccaratGame, BaccaratPrediction } from '../games/baccarat/BaccaratGame';
import { LongHoGame, LongHoPrediction } from '../games/longHo/LongHoGame';
import { RouletteGame, RoulettePrediction } from '../games/roulette/RouletteGame';

interface GameContainerProps {
  gameType: 'taiXiu' | 'xocDia' | 'baccarat' | 'longHo' | 'roulette';
  onGameStateChange?: (state: GameState) => void;
  minBet?: number;
  maxBet?: number;
}

export const GameContainer: React.FC<GameContainerProps> = ({
  gameType,
  onGameStateChange,
  minBet = 0.01,
  maxBet = 10000,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<GameBase | null>(null);
  const [gameState, setGameState] = useState<GameState>({
    betAmount: 0,
    payout: 0,
    isPlaying: false,
  });
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [prediction, setPrediction] = useState<string>('tai');

  // Initialize game on mount
  useEffect(() => {
    const initGame = async () => {
      if (!canvasRef.current) return;

      try {
        setLoading(true);

        // Create game instance based on type
        let game: GameBase;

        switch (gameType) {
          case 'taiXiu':
            game = new TaiXiuGame(canvasRef.current);
            break;
          case 'xocDia':
            game = new XocDiaGame(canvasRef.current);
            break;
          case 'baccarat':
            game = new BaccaratGame(canvasRef.current);
            break;
          case 'longHo':
            game = new LongHoGame(canvasRef.current);
            break;
          case 'roulette':
            game = new RouletteGame(canvasRef.current);
            break;
          default:
            throw new Error(`Unknown game type: ${gameType}`);
        }

        await game.initialize();
        gameRef.current = game;

        // Update state every 100ms
        const stateInterval = setInterval(() => {
          const newState = game.getState();
          setGameState(newState);
          onGameStateChange?.(newState);
        }, 100);

        setLoading(false);

        return () => {
          clearInterval(stateInterval);
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load game';
        setError(message);
        setLoading(false);
      }
    };

    initGame();

    // Cleanup on unmount
    return () => {
      if (gameRef.current) {
        gameRef.current.dispose();
        gameRef.current = null;
      }
    };
  }, [gameType, onGameStateChange]);

  // Handle bet placement
  const handlePlaceBet = async (amount: number) => {
    if (!gameRef.current) return;

    try {
      if (amount < minBet || amount > maxBet) {
        setError(
          `Bet must be between ${minBet} and ${maxBet}`
        );
        return;
      }

      setError('');

      // Game-specific bet placement
      const gameCast = gameRef.current as any;

      if (gameType === 'taiXiu') {
        await gameCast.placeBet(amount, prediction as TaiXiuPrediction);
      } else if (gameType === 'xocDia') {
        await gameCast.placeBet(amount, prediction as XocDiaPrediction);
      } else if (gameType === 'baccarat') {
        await gameCast.placeBet(amount, prediction as BaccaratPrediction);
      } else if (gameType === 'longHo') {
        await gameCast.placeBet(amount, prediction as LongHoPrediction);
      } else if (gameType === 'roulette') {
        const numPrediction = isNaN(Number(prediction)) ? prediction : Number(prediction);
        await gameCast.placeBet(amount, numPrediction as RoulettePrediction);
      } else {
        await gameRef.current.placeBet(amount, prediction);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Bet failed';
      setError(message);
    }
  };

  // Handle reset
  const handleReset = () => {
    if (gameRef.current) {
      gameRef.current.reset();
      setGameState({
        betAmount: 0,
        payout: 0,
        isPlaying: false,
      });
      setError('');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center w-full h-screen bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading game...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full h-screen bg-gray-900">
      {/* Game Canvas */}
      <div className="flex-1">
        <canvas
          ref={canvasRef}
          style={{
            width: '100%',
            height: '100%',
            display: 'block',
          }}
        />
      </div>

      {/* Game Controls */}
      <div className="bg-gray-800 border-t border-gray-700 p-4">
        <div className="max-w-6xl mx-auto">
          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-900 border border-red-600 rounded text-red-100">
              {error}
            </div>
          )}

          {/* Game Info */}
          <div className="grid grid-cols-4 gap-4 mb-4">
            <div className="bg-gray-700 p-3 rounded">
              <div className="text-xs text-gray-400">Bet Amount</div>
              <div className="text-xl font-bold text-white">
                ${gameState.betAmount.toFixed(2)}
              </div>
            </div>
            <div className="bg-gray-700 p-3 rounded">
              <div className="text-xs text-gray-400">Payout</div>
              <div className={`text-xl font-bold ${gameState.payout > 0 ? 'text-green-400' : 'text-red-400'}`}>
                ${gameState.payout.toFixed(2)}
              </div>
            </div>
            <div className="bg-gray-700 p-3 rounded">
              <div className="text-xs text-gray-400">Result</div>
              <div className="text-sm text-white truncate">
                {gameState.result || 'Waiting...'}
              </div>
            </div>
            <div className="bg-gray-700 p-3 rounded">
              <div className="text-xs text-gray-400">Status</div>
              <div className={`text-sm font-bold ${gameState.isPlaying ? 'text-yellow-400' : 'text-gray-300'}`}>
                {gameState.isPlaying ? 'Playing...' : 'Ready'}
              </div>
            </div>
          </div>

          {/* Betting Controls */}
          <div className="grid grid-cols-3 gap-4">
            {/* Prediction Select (Game Dependent) */}
            <div className="col-span-1">
              <label className="block text-sm text-gray-300 mb-2">Prediction</label>
              <div className="flex gap-2">
                {gameType === 'taiXiu' && (
                  <>
                    <button
                      onClick={() => setPrediction('tai')}
                      disabled={gameState.isPlaying}
                      className={`flex-1 py-2 rounded font-bold transition ${
                        prediction === 'tai'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      } disabled:opacity-50`}
                    >
                      Tài
                    </button>
                    <button
                      onClick={() => setPrediction('xiu')}
                      disabled={gameState.isPlaying}
                      className={`flex-1 py-2 rounded font-bold transition ${
                        prediction === 'xiu'
                          ? 'bg-red-600 text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      } disabled:opacity-50`}
                    >
                      Xỉu
                    </button>
                  </>
                )}

                {gameType === 'xocDia' && (
                  <>
                    <button
                      onClick={() => setPrediction('even')}
                      disabled={gameState.isPlaying}
                      className={`flex-1 py-2 rounded font-bold transition ${
                        prediction === 'even'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      } disabled:opacity-50`}
                    >
                      Even
                    </button>
                    <button
                      onClick={() => setPrediction('odd')}
                      disabled={gameState.isPlaying}
                      className={`flex-1 py-2 rounded font-bold transition ${
                        prediction === 'odd'
                          ? 'bg-red-600 text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      } disabled:opacity-50`}
                    >
                      Odd
                    </button>
                  </>
                )}

                {gameType === 'baccarat' && (
                  <>
                    <button
                      onClick={() => setPrediction('player')}
                      disabled={gameState.isPlaying}
                      className={`flex-1 py-2 rounded font-bold text-xs transition ${
                        prediction === 'player'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      } disabled:opacity-50`}
                    >
                      Player
                    </button>
                    <button
                      onClick={() => setPrediction('banker')}
                      disabled={gameState.isPlaying}
                      className={`flex-1 py-2 rounded font-bold text-xs transition ${
                        prediction === 'banker'
                          ? 'bg-yellow-600 text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      } disabled:opacity-50`}
                    >
                      Banker
                    </button>
                    <button
                      onClick={() => setPrediction('tie')}
                      disabled={gameState.isPlaying}
                      className={`flex-1 py-2 rounded font-bold text-xs transition ${
                        prediction === 'tie'
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      } disabled:opacity-50`}
                    >
                      Tie
                    </button>
                  </>
                )}

                {gameType === 'longHo' && (
                  <>
                    <button
                      onClick={() => setPrediction('dragon')}
                      disabled={gameState.isPlaying}
                      className={`flex-1 py-2 rounded font-bold transition ${
                        prediction === 'dragon'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      } disabled:opacity-50`}
                    >
                      🐉 Dragon
                    </button>
                    <button
                      onClick={() => setPrediction('tiger')}
                      disabled={gameState.isPlaying}
                      className={`flex-1 py-2 rounded font-bold transition ${
                        prediction === 'tiger'
                          ? 'bg-red-600 text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      } disabled:opacity-50`}
                    >
                      🐯 Tiger
                    </button>
                    <button
                      onClick={() => setPrediction('tie')}
                      disabled={gameState.isPlaying}
                      className={`flex-1 py-2 rounded font-bold transition ${
                        prediction === 'tie'
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      } disabled:opacity-50`}
                    >
                      Tie
                    </button>
                  </>
                )}

                {gameType === 'roulette' && (
                  <>
                    <button
                      onClick={() => setPrediction('red')}
                      disabled={gameState.isPlaying}
                      className={`flex-1 py-2 rounded font-bold transition ${
                        prediction === 'red'
                          ? 'bg-red-600 text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      } disabled:opacity-50`}
                    >
                      Red
                    </button>
                    <button
                      onClick={() => setPrediction('black')}
                      disabled={gameState.isPlaying}
                      className={`flex-1 py-2 rounded font-bold transition ${
                        prediction === 'black'
                          ? 'bg-black text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      } disabled:opacity-50`}
                    >
                      Black
                    </button>
                    <button
                      onClick={() => setPrediction('even')}
                      disabled={gameState.isPlaying}
                      className={`flex-1 py-2 rounded font-bold text-xs transition ${
                        prediction === 'even'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      } disabled:opacity-50`}
                    >
                      Even
                    </button>
                    <button
                      onClick={() => setPrediction('odd')}
                      disabled={gameState.isPlaying}
                      className={`flex-1 py-2 rounded font-bold text-xs transition ${
                        prediction === 'odd'
                          ? 'bg-yellow-600 text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      } disabled:opacity-50`}
                    >
                      Odd
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Bet Amount Input */}
            <div className="col-span-1">
              <label className="block text-sm text-gray-300 mb-2">Bet Amount</label>
              <input
                type="number"
                min={minBet}
                max={maxBet}
                step="0.01"
                value={gameState.betAmount}
                onChange={(e) => gameRef.current?.setBetAmount(parseFloat(e.target.value))}
                disabled={gameState.isPlaying}
                className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 disabled:opacity-50"
                placeholder="Enter amount"
              />
            </div>

            {/* Action Buttons */}
            <div className="col-span-1 flex gap-2 items-end">
              <button
                onClick={() => handlePlaceBet(gameState.betAmount)}
                disabled={gameState.isPlaying || gameState.betAmount <= 0}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2 rounded transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {gameState.isPlaying ? 'Playing...' : 'Place Bet'}
              </button>
              <button
                onClick={handleReset}
                disabled={gameState.isPlaying}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 rounded transition disabled:opacity-50"
              >
                Reset
              </button>
            </div>
          </div>

          {/* Quick Bet Buttons */}
          <div className="mt-4 flex gap-2 flex-wrap">
            {[10, 50, 100, 500, 1000].map((amount) => (
              <button
                key={amount}
                onClick={() => {
                  gameRef.current?.setBetAmount(amount);
                  handlePlaceBet(amount);
                }}
                disabled={gameState.isPlaying}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded transition disabled:opacity-50"
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

export default GameContainer;
