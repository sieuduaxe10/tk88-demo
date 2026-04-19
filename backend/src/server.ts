import express, { Express, Request, Response, NextFunction } from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import winston from 'winston';
import { initializeGameHandlers } from './socket/gameHandlers';
import authRoutes from './routes/auth';
import adminRoutes from './routes/admin';
import affiliateRoutes from './routes/affiliate';
import paymentRoutes from './routes/payment';
import { db } from './services/database';

// Load environment variables
dotenv.config();

// Initialize logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'tk88-backend' },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  ]
});

const app: Express = express();
const httpServer = createServer(app);

// CORS configuration - allow any localhost for development
const isDevelopment = process.env.NODE_ENV !== 'production';
const corsOptions = {
  origin: isDevelopment
    ? /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/
    : process.env.CORS_ORIGIN || 'http://localhost:5173',
  methods: ['GET', 'POST'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization']
};

const io = new SocketIOServer(httpServer, {
  cors: corsOptions
});

// Middleware
app.use(helmet());
app.use(cors(corsOptions));

const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  message: 'Too many requests from this IP, please try again later.'
});

app.use(limiter);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info({
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: `${duration}ms`
    });
  });
  next();
});

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Authentication routes
app.use('/auth', authRoutes);

// Admin routes
app.use('/admin', adminRoutes);

// Affiliate routes
app.use('/affiliate', affiliateRoutes);

// Payment routes
app.use('/payment', paymentRoutes);

// API Routes (placeholder)
app.get('/api/v1/games', (req: Request, res: Response) => {
  res.json({
    games: [
      { id: 'taiXiu', name: 'Tài Xỉu', type: '3d' },
      { id: 'xocDia', name: 'Xóc Đĩa', type: '3d' },
      { id: 'longHo', name: 'Long Hổ', type: '3d' },
      { id: 'baccarat', name: 'Baccarat', type: '3d' },
      { id: 'roulette', name: 'Roulette', type: '3d' }
    ]
  });
});

// Initialize game handlers
initializeGameHandlers(io);

// Error handling middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  logger.error({
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method
  });

  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Not found' });
});

const PORT = parseInt(process.env.PORT || '3000');
const HOST = process.env.HOST || '0.0.0.0';

// Initialize database and start server
const startServer = async () => {
  try {
    // Try to initialize database connection
    try {
      await db.initialize();
      logger.info('✅ Database connected successfully');
    } catch (dbError) {
      const isDev = process.env.NODE_ENV === 'development';
      if (isDev) {
        logger.warn('⚠️  Database connection failed - running in demo mode without persistence');
        logger.warn('  Set up PostgreSQL or provide DB credentials in .env to enable full functionality');
      } else {
        throw dbError;
      }
    }

    httpServer.listen(PORT, HOST, () => {
      logger.info(`🎮 TK88 Gaming Backend running on http://${HOST}:${PORT}`);
      logger.info(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`🔌 WebSocket ready on ws://${HOST}:${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start server', error);
    process.exit(1);
  }
};

startServer();

export { app, io, logger };
