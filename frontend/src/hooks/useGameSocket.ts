import { useEffect, useRef, useCallback, useState } from 'react';
import { io, Socket } from 'socket.io-client';

export interface GameResult {
  sessionId: string;
  userId: string;
  gameType: string;
  result: string;
  payout: number;
  serverSeed: string;
  timestamp: Date;
}

export interface UseGameSocketOptions {
  userId: string;
  onGameResult?: (result: GameResult) => void;
  onError?: (error: string) => void;
}

/**
 * Hook for real-time game communication via WebSocket
 */
export const useGameSocket = (options: UseGameSocketOptions) => {
  const { userId, onGameResult, onError } = options;
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  // Stable refs so socket effect doesn't re-run when parent re-renders
  const onGameResultRef = useRef(onGameResult);
  const onErrorRef = useRef(onError);
  useEffect(() => { onGameResultRef.current = onGameResult; }, [onGameResult]);
  useEffect(() => { onErrorRef.current = onError; }, [onError]);

  // Initialize socket connection - runs ONCE per userId
  useEffect(() => {
    const wsUrl = import.meta.env.VITE_WS_URL || 'http://localhost:3001';
    const socket = io(wsUrl, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 3,
      timeout: 5000,
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
      console.log('[Socket] Connected to game server');
      setIsConnected(true);
    });

    socket.on('disconnect', (reason) => {
      console.log('[Socket] Disconnected:', reason);
      setIsConnected(false);
    });

    socket.on('connect_error', (error) => {
      console.warn('[Socket] Connection error:', error.message);
      onErrorRef.current?.(`Connection error: ${error.message}`);
    });

    socket.on('game:result', (data: GameResult) => {
      console.log('[Socket] Game result received:', data);
      setIsPlaying(false);
      onGameResultRef.current?.(data);
    });

    socketRef.current = socket;

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
    };
  }, [userId]);

  /**
   * Place bet on game
   */
  const placeBet = useCallback(
    (
      gameType: string,
      amount: number,
      prediction: string
    ): Promise<{ sessionId: string; payout: number; newBalance: number }> => {
      return new Promise((resolve, reject) => {
        if (!socketRef.current) {
          reject(new Error('Not connected to server'));
          return;
        }

        setIsPlaying(true);

        socketRef.current.emit(
          'game:placeBet',
          {
            gameType,
            userId,
            amount,
            prediction,
          },
          (response: any) => {
            if (response.error) {
              setIsPlaying(false);
              reject(new Error(response.error));
            } else {
              resolve({
                sessionId: response.sessionId,
                payout: response.payout,
                newBalance: response.newBalance,
              });
            }
          }
        );
      });
    },
    [userId]
  );

  /**
   * Join game room
   */
  const joinGame = useCallback((gameType: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (!socketRef.current) {
        reject(new Error('Not connected to server'));
        return;
      }

      socketRef.current.emit(
        'game:join',
        { gameType, userId },
        (response: any) => {
          if (response.error) {
            reject(new Error(response.error));
          } else {
            resolve();
          }
        }
      );
    });
  }, [userId]);

  /**
   * Verify game seed
   */
  const verifySeed = useCallback(
    (sessionId: string, serverSeed: string, clientSeed: string): Promise<boolean> => {
      return new Promise((resolve, reject) => {
        if (!socketRef.current) {
          reject(new Error('Not connected to server'));
          return;
        }

        socketRef.current.emit(
          'game:verifySeed',
          { sessionId, serverSeed, clientSeed },
          (response: any) => {
            if (response.error) {
              reject(new Error(response.error));
            } else {
              resolve(response.isValid);
            }
          }
        );
      });
    },
    []
  );

  /**
   * Get game history
   */
  const getHistory = useCallback(
    (gameType?: string, limit: number = 20): Promise<any[]> => {
      return new Promise((resolve, reject) => {
        if (!socketRef.current) {
          reject(new Error('Not connected to server'));
          return;
        }

        socketRef.current.emit(
          'game:history',
          { userId, gameType, limit },
          (response: any) => {
            if (response.error) {
              reject(new Error(response.error));
            } else {
              resolve(response.history);
            }
          }
        );
      });
    },
    [userId]
  );

  return {
    isConnected,
    isPlaying,
    placeBet,
    joinGame,
    verifySeed,
    getHistory,
    socket: socketRef.current,
  };
};
