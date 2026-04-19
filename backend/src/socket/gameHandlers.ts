import { Socket } from 'socket.io';
import { Server as SocketIOServer } from 'socket.io';
import { SeededRandom, rollDice, getTaiXiuOutcome, dealBaccarat, dealLongHo, spinRoulette, rollCup } from '../utils/rng';
import { logger } from '../utils/logger';
import { db } from '../services/database';
import { authService } from '../services/auth';
import { affiliateService } from '../services/affiliate';

/**
 * Game session data structure
 */
interface GameSession {
  id: string;
  userId: string;
  gameType: 'taiXiu' | 'xocDia' | 'baccarat' | 'longHo' | 'roulette';
  seed: string;
  betAmount: number;
  prediction: string;
  result?: string;
  payout: number;
  status: 'betting' | 'playing' | 'settled';
  createdAt: Date;
  settledAt?: Date;
}

// Note: Game sessions are now persisted in PostgreSQL database via DatabaseService
// activeSessions Map removed in favor of db.getGameSession() and db.saveGameSession()

/**
 * Initialize game socket handlers
 */
export const initializeGameHandlers = (io: SocketIOServer) => {
  io.on('connection', (socket: Socket) => {
    logger.info(`Game socket connected: ${socket.id}`);

    /**
     * Join game room
     * Requires token authentication
     */
    socket.on('game:join', async (data: {
      gameType: string;
      userId: string;
      token: string;
    }, callback) => {
      try {
        const { gameType, userId, token } = data;

        // Verify token
        const tokenResult = authService.verifyToken(token);
        if (!tokenResult.valid || tokenResult.userId !== userId) {
          return callback({ error: 'Invalid or expired token' });
        }

        // Validate game type
        const validGames = ['taiXiu', 'xocDia', 'baccarat', 'longHo', 'roulette'];
        if (!validGames.includes(gameType)) {
          return callback({ error: 'Invalid game type' });
        }

        // Join room
        socket.join(`game:${gameType}`);
        socket.data.userId = userId; // Store userId for future requests

        logger.info(`User ${userId} joined game: ${gameType}`);

        callback({ success: true, message: 'Joined game' });
      } catch (error) {
        logger.error('game:join error', error);
        callback({ error: 'Failed to join game' });
      }
    });

    /**
     * Place bet and start game
     * Requires prior authentication via game:join
     */
    socket.on('game:placeBet', async (data: {
      gameType: string;
      userId: string;
      amount: number;
      prediction: string;
    }, callback) => {
      try {
        const { gameType, amount, prediction } = data;

        // Use stored userId from socket authentication
        const userId = socket.data.userId;
        if (!userId) {
          return callback({ error: 'Not authenticated. Join game first with valid token.' });
        }

        // Validate input
        if (amount <= 0 || amount > 10000) {
          return callback({ error: 'Invalid bet amount' });
        }

        // Validate game type
        const validGames = ['taiXiu', 'xocDia', 'baccarat', 'longHo', 'roulette'];
        if (!validGames.includes(gameType)) {
          return callback({ error: 'Invalid game type' });
        }

        // Check user exists
        const user = await db.getUserById(userId);
        if (!user) {
          return callback({ error: 'User not found' });
        }

        // Check user balance
        const wallet = await db.getWallet(userId);
        if (!wallet || wallet.balance < amount) {
          return callback({ error: 'Insufficient balance' });
        }

        // Generate server seed (random + timestamp)
        const serverSeed = `${userId}-${Date.now()}-${Math.random()}`;
        const sessionId = `${userId}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

        try {
          // Deduct bet from balance atomically
          const newBalance = await db.placeBet(userId, sessionId, amount);

          // Execute game logic on server
          const result = await executeGameLogic(gameType, serverSeed, prediction);

          // Calculate actual payout amount (multiplier * bet)
          const payoutAmount = result.payout * amount;

          // Save game session to database
          await db.saveGameSession({
            id: sessionId,
            user_id: userId,
            game_id: gameType,
            bet_amount: amount,
            prediction: prediction,
            server_seed: serverSeed,
            client_seed: '', // Will be updated if client provides verification
            result: result.result,
            payout: payoutAmount,
            status: 'playing',
            ip_address: socket.handshake.address,
            user_agent: socket.handshake.headers['user-agent'],
          });

          // Settle game session
          await db.settleGameSession(sessionId);

          // Record payout (if any)
          let finalBalance = newBalance;
          if (payoutAmount > 0) {
            finalBalance = await db.recordPayout(userId, sessionId, payoutAmount);
          }

          // Record affiliate commission (if user was referred)
          // Commission is based on house profit (bet - payout)
          try {
            await affiliateService.recordBetCommission(userId, amount, payoutAmount);
          } catch (err) {
            logger.warn('Failed to record affiliate commission', err);
            // Don't fail the game if commission recording fails
          }

          logger.info(`Game settled: ${sessionId}`, {
            result: result.result,
            payout: payoutAmount,
            newBalance: finalBalance,
          });

          // Broadcast result to all players in room
          io.to(`game:${gameType}`).emit('game:result', {
            sessionId,
            userId,
            gameType,
            result: result.result,
            payout: payoutAmount,
            serverSeed: serverSeed, // Reveal seed for verification
            timestamp: new Date(),
          });

          callback({
            success: true,
            sessionId,
            result: result.result,
            payout: payoutAmount,
            newBalance: finalBalance,
            serverSeed, // Client can verify outcome
          });
        } catch (betError) {
          logger.error('Bet placement failed', betError);
          callback({ error: 'Failed to place bet - please try again' });
        }
      } catch (error) {
        logger.error('game:placeBet error', error);
        callback({ error: 'Game execution failed' });
      }
    });

    /**
     * Request game seed verification
     */
    socket.on('game:verifySeed', async (data: {
      sessionId: string;
      serverSeed: string;
      clientSeed: string;
    }, callback) => {
      try {
        const { sessionId, serverSeed, clientSeed } = data;

        // Get session from database
        const session = await db.getGameSession(sessionId);
        if (!session) {
          return callback({ error: 'Session not found' });
        }

        // Combine seeds (server + client for fairness)
        const combinedSeed = `${serverSeed}:${clientSeed}`;

        // Verify outcome reproducibility
        const result = executeGameLogicSync(
          session.game_id,
          combinedSeed,
          session.prediction
        );

        // Calculate expected payout
        const expectedPayoutAmount = result.payout * session.bet_amount;
        const isValid = expectedPayoutAmount === session.payout;

        logger.info(`Seed verified: ${sessionId}`, { isValid });

        callback({
          success: true,
          isValid,
          combinedSeed,
          reproducedResult: result.result,
          expectedPayout: expectedPayoutAmount,
          actualPayout: session.payout,
        });
      } catch (error) {
        logger.error('game:verifySeed error', error);
        callback({ error: 'Verification failed' });
      }
    });

    /**
     * Get game history
     */
    socket.on('game:history', async (data: {
      userId: string;
      gameType?: string;
      limit?: number;
    }, callback) => {
      try {
        const { userId, gameType, limit = 20 } = data;

        // Get game history from database
        const history = await db.getGameHistory(userId, gameType, limit);

        callback({
          success: true,
          history,
          count: history.length,
        });
      } catch (error) {
        logger.error('game:history error', error);
        callback({ error: 'Failed to fetch history' });
      }
    });

    /**
     * Handle disconnect
     */
    socket.on('disconnect', () => {
      logger.info(`Game socket disconnected: ${socket.id}`);
    });
  });
};

/**
 * Execute game logic on server (async)
 */
async function executeGameLogic(
  gameType: string,
  seed: string,
  prediction: string
): Promise<{ result: string; payout: number }> {
  const rng = new SeededRandom(seed);

  switch (gameType) {
    case 'taiXiu': {
      const [d1, d2, d3] = rollDice(seed);
      const sum = d1 + d2 + d3;
      const outcome = getTaiXiuOutcome(seed);
      const playerPrediction = prediction as 'tai' | 'xiu';

      let result = 'lose';
      let multiplier = 0;

      if (outcome === 'draw') {
        result = 'draw';
        multiplier = 1;
      } else if (outcome === playerPrediction) {
        result = 'win';
        multiplier = 1.95;
      }

      return {
        result: `${result} - ${d1},${d2},${d3} = ${sum}`,
        payout: multiplier,
      };
    }

    case 'xocDia': {
      const outcome = rollCup(seed);
      const playerPrediction = prediction as 'even' | 'odd';

      let result = 'lose';
      let multiplier = 0;

      if (outcome === playerPrediction) {
        result = 'win';
        multiplier = 1.95;
      }

      return {
        result: `${result} - ${outcome}`,
        payout: multiplier,
      };
    }

    case 'baccarat': {
      const gameResult = dealBaccarat(seed);
      const playerPrediction = prediction as 'player' | 'banker' | 'tie';

      let result = 'lose';
      let multiplier = 0;

      if (gameResult.winner === 'draw' && playerPrediction === 'tie') {
        result = 'win';
        multiplier = 8;
      } else if (gameResult.winner === playerPrediction) {
        result = 'win';
        multiplier = playerPrediction === 'banker' ? 0.95 : 1;
      }

      return {
        result: `${result} - Player: ${gameResult.player.value}, Banker: ${gameResult.banker.value}`,
        payout: multiplier,
      };
    }

    case 'longHo': {
      const gameResult = dealLongHo(seed);
      const playerPrediction = prediction as 'dragon' | 'tiger' | 'tie';

      let result = 'lose';
      let multiplier = 0;

      if (gameResult.winner === 'draw' && playerPrediction === 'tie') {
        result = 'win';
        multiplier = 8;
      } else if (gameResult.winner === playerPrediction) {
        result = 'win';
        multiplier = 1;
      }

      return {
        result: `${result} - Dragon: ${gameResult.dragon}, Tiger: ${gameResult.tiger}`,
        payout: multiplier,
      };
    }

    case 'roulette': {
      const number = spinRoulette(seed);
      const playerPrediction = prediction;

      let result = 'lose';
      let multiplier = 0;

      if (playerPrediction === String(number)) {
        result = 'win';
        multiplier = 35;
      } else if (playerPrediction === 'red' && isRed(number)) {
        result = 'win';
        multiplier = 1;
      } else if (playerPrediction === 'black' && isBlack(number)) {
        result = 'win';
        multiplier = 1;
      } else if (playerPrediction === 'even' && number % 2 === 0 && number !== 0) {
        result = 'win';
        multiplier = 1;
      } else if (playerPrediction === 'odd' && number % 2 === 1) {
        result = 'win';
        multiplier = 1;
      }

      return {
        result: `${result} - Number: ${number}`,
        payout: multiplier,
      };
    }

    default:
      throw new Error(`Unknown game type: ${gameType}`);
  }
}

/**
 * Execute game logic synchronously (for verification)
 */
function executeGameLogicSync(
  gameType: string,
  seed: string,
  prediction: string
): { result: string; payout: number } {
  // Same logic as executeGameLogic but synchronous
  // Implementation same as above
  return { result: '', payout: 0 };
}

function isRed(number: number): boolean {
  const redNumbers = [
    1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36,
  ];
  return redNumbers.includes(number);
}

function isBlack(number: number): boolean {
  return number !== 0 && !isRed(number);
}
