import winston from 'winston';
import path from 'path';

/**
 * Winston logger configuration
 */
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'tk88-backend' },
  transports: [
    // Console transport
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ timestamp, level, message, ...meta }) => {
          const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
          return `${timestamp} [${level}]: ${message} ${metaStr}`;
        })
      ),
    }),

    // File transports
    new winston.transports.File({
      filename: path.join('logs', 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    new winston.transports.File({
      filename: path.join('logs', 'combined.log'),
      maxsize: 5242880,
      maxFiles: 10,
    }),
  ],
});

/**
 * Log game events
 */
export const logGameEvent = (event: string, data: any) => {
  logger.info(`GAME_EVENT: ${event}`, data);
};

/**
 * Log transactions
 */
export const logTransaction = (type: string, userId: string, data: any) => {
  logger.info(`TRANSACTION: ${type}`, { userId, ...data });
};

/**
 * Log security events
 */
export const logSecurityEvent = (event: string, userId: string, data: any) => {
  logger.warn(`SECURITY: ${event}`, { userId, ...data });
};
