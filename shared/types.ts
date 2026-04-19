// User Types
export interface User {
  id: string;
  email: string;
  phone?: string;
  telegram?: string;
  username: string;
  avatar?: string;
  createdAt: Date;
  lastLogin?: Date;
  isVerified: boolean;
  isBanned: boolean;
}

export interface UserProfile extends User {
  totalDeposit: number;
  totalBets: number;
  totalWinnings: number;
  currentBalance: number;
  kycStatus: 'pending' | 'verified' | 'rejected';
}

// Game Types
export interface Game {
  id: string;
  name: string;
  type: '3d';
  description: string;
  minBet: number;
  maxBet: number;
  rtp: number; // Return to Player percentage
}

export interface GameSession {
  id: string;
  gameId: string;
  userId: string;
  status: 'active' | 'completed' | 'cancelled';
  startedAt: Date;
  endedAt?: Date;
}

export interface Bet {
  id: string;
  userId: string;
  gameId: string;
  sessionId: string;
  amount: number;
  multiplier: number;
  payout: number;
  result: 'win' | 'loss' | 'pending';
  placedAt: Date;
  settledAt?: Date;
}

// Transaction Types
export interface Transaction {
  id: string;
  userId: string;
  type: 'deposit' | 'withdrawal' | 'bet' | 'payout' | 'refund';
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  reference?: string;
  createdAt: Date;
  completedAt?: Date;
}

export interface Deposit extends Transaction {
  type: 'deposit';
  method: 'card' | 'crypto' | 'bank_transfer';
  stripeId?: string;
}

export interface Withdrawal extends Transaction {
  type: 'withdrawal';
  destination: string;
  method: 'bank_transfer' | 'crypto' | 'e_wallet';
}

// Admin Types
export interface AdminUser extends User {
  role: 'super_admin' | 'admin' | 'moderator' | 'support';
  permissions: string[];
}

export interface AdminReport {
  id: string;
  userId: string;
  reportType: 'fraud' | 'abuse' | 'bug' | 'other';
  description: string;
  status: 'open' | 'investigating' | 'resolved' | 'closed';
  createdAt: Date;
  resolvedAt?: Date;
}

// Affiliate Types
export interface AffiliateLink {
  id: string;
  userId: string;
  code: string;
  url: string;
  createdAt: Date;
  expiresAt?: Date;
  isActive: boolean;
}

export interface AffiliateCommission {
  id: string;
  affiliateId: string;
  referredUserId: string;
  deposit: number;
  commission: number;
  status: 'pending' | 'approved' | 'paid';
  createdAt: Date;
  paidAt?: Date;
}

// WebSocket Event Types
export interface SocketMessage<T = any> {
  type: string;
  data: T;
  timestamp: number;
}

export interface GameStateUpdate {
  gameId: string;
  state: Record<string, any>;
  timestamp: number;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: number;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}
