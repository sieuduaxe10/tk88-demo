-- TK88 Gaming Platform - PostgreSQL Schema

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(100) UNIQUE NOT NULL,
  phone VARCHAR(20),
  telegram VARCHAR(100),
  password_hash VARCHAR(255) NOT NULL,
  kyc_status VARCHAR(20) DEFAULT 'pending', -- pending, verified, rejected
  is_verified BOOLEAN DEFAULT false,
  is_banned BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP
);

-- User wallets table
CREATE TABLE IF NOT EXISTS wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  balance DECIMAL(18, 8) DEFAULT 0,
  currency VARCHAR(3) DEFAULT 'USD',
  total_deposit DECIMAL(18, 8) DEFAULT 0,
  total_withdrawn DECIMAL(18, 8) DEFAULT 0,
  total_wagered DECIMAL(18, 8) DEFAULT 0,
  total_won DECIMAL(18, 8) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Games table (game definitions)
CREATE TABLE IF NOT EXISTS games (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  type VARCHAR(20) NOT NULL, -- physics, cards
  description TEXT,
  min_bet DECIMAL(10, 2) DEFAULT 0.01,
  max_bet DECIMAL(10, 2) DEFAULT 10000,
  rtp DECIMAL(5, 2) DEFAULT 98.5, -- Return to Player %
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Game sessions (game rounds)
CREATE TABLE IF NOT EXISTS game_sessions (
  id VARCHAR(100) PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  game_id VARCHAR(50) NOT NULL REFERENCES games(id),
  bet_amount DECIMAL(18, 8) NOT NULL,
  prediction VARCHAR(100) NOT NULL,
  server_seed VARCHAR(255) NOT NULL,
  client_seed VARCHAR(255),
  result VARCHAR(255),
  payout DECIMAL(18, 8) NOT NULL DEFAULT 0,
  status VARCHAR(20) NOT NULL, -- playing, settled, cancelled
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  settled_at TIMESTAMP,
  verified_at TIMESTAMP
);

-- Transactions ledger (immutable)
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL, -- deposit, withdrawal, bet, payout, refund
  amount DECIMAL(18, 8) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  status VARCHAR(20) NOT NULL, -- pending, completed, failed, cancelled
  reference VARCHAR(255), -- stripe ID, txn ID, etc
  game_session_id VARCHAR(100) REFERENCES game_sessions(id),
  description TEXT,
  ip_address INET,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP,
  failed_at TIMESTAMP,
  failed_reason TEXT
);

-- Create index: never UPDATE transactions (append-only)
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_created ON transactions(created_at);

-- Create index on game sessions
CREATE INDEX IF NOT EXISTS idx_game_sessions_user_id ON game_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_game_sessions_game_id ON game_sessions(game_id);
CREATE INDEX IF NOT EXISTS idx_game_sessions_status ON game_sessions(status);
CREATE INDEX IF NOT EXISTS idx_game_sessions_created ON game_sessions(created_at);

-- Create index on wallets
CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON wallets(user_id);

-- Create index on users
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_created ON users(created_at);

-- Insert default games
INSERT INTO games (id, name, type, description, min_bet, max_bet, rtp)
VALUES
  ('taiXiu', 'Tài Xỉu', 'physics', 'Roll 3 dice - bet High or Low', 0.01, 10000, 98.5),
  ('xocDia', 'Xóc Đĩa', 'physics', 'Flip 3 coins - bet Even or Odd', 0.01, 10000, 98),
  ('baccarat', 'Baccarat', 'cards', 'Player vs Banker card comparison', 0.01, 10000, 98.6),
  ('longHo', 'Long Hổ', 'cards', 'Dragon vs Tiger card comparison', 0.01, 10000, 98.5),
  ('roulette', 'Roulette', 'physics', 'Spin wheel - bet on numbers/colors', 0.01, 10000, 97.3)
ON CONFLICT DO NOTHING;

-- View: User game statistics
CREATE OR REPLACE VIEW user_game_stats AS
SELECT
  u.id AS user_id,
  u.username,
  COUNT(DISTINCT gs.id) AS total_games,
  COUNT(CASE WHEN gs.status = 'settled' THEN 1 END) AS completed_games,
  COALESCE(SUM(CASE WHEN gs.status = 'settled' AND gs.payout > gs.bet_amount THEN 1 END), 0) AS wins,
  COALESCE(SUM(CASE WHEN gs.status = 'settled' AND gs.payout < gs.bet_amount THEN 1 END), 0) AS losses,
  COALESCE(SUM(CASE WHEN gs.status = 'settled' AND gs.payout = gs.bet_amount THEN 1 END), 0) AS draws,
  COALESCE(SUM(gs.bet_amount), 0) AS total_wagered,
  COALESCE(SUM(gs.payout - gs.bet_amount), 0) AS net_profit,
  CASE
    WHEN COUNT(DISTINCT gs.id) = 0 THEN 0
    ELSE ROUND(
      100.0 * COUNT(CASE WHEN gs.status = 'settled' AND gs.payout > gs.bet_amount THEN 1 END) /
      COUNT(DISTINCT CASE WHEN gs.status = 'settled' THEN gs.id END),
      2
    )
  END AS win_rate_percent,
  w.balance AS current_balance
FROM users u
LEFT JOIN game_sessions gs ON u.id = gs.user_id
LEFT JOIN wallets w ON u.id = w.user_id
GROUP BY u.id, u.username, w.balance;

-- View: Daily game revenue
CREATE OR REPLACE VIEW daily_revenue AS
SELECT
  DATE(gs.created_at) AS date,
  COUNT(DISTINCT gs.user_id) AS unique_players,
  COUNT(gs.id) AS total_games,
  COALESCE(SUM(gs.bet_amount), 0) AS total_wagered,
  COALESCE(SUM(gs.payout), 0) AS total_payout,
  COALESCE(SUM(gs.bet_amount - gs.payout), 0) AS house_profit
FROM game_sessions gs
WHERE gs.status = 'settled'
GROUP BY DATE(gs.created_at);

-- Affiliate Codes table
CREATE TABLE IF NOT EXISTS affiliate_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  code VARCHAR(20) UNIQUE NOT NULL,
  commission_rate DECIMAL(5, 2) DEFAULT 10.0, -- % commission per referral
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Affiliate Referrals table (tracks who signed up via affiliate)
CREATE TABLE IF NOT EXISTS affiliate_referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  referred_user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  code VARCHAR(20) NOT NULL,
  status VARCHAR(20) DEFAULT 'active', -- active, suspended, revoked
  commission_earned DECIMAL(18, 8) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Affiliate Payouts table (tracks affiliate earnings)
CREATE TABLE IF NOT EXISTS affiliate_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount DECIMAL(18, 8) NOT NULL,
  status VARCHAR(20) NOT NULL, -- pending, processing, completed, failed
  payment_method VARCHAR(50), -- bank_transfer, crypto, stripe
  reference VARCHAR(255), -- payment ID
  requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP,
  failed_reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Payment Orders table (Stripe, deposit/withdrawal)
CREATE TABLE IF NOT EXISTS payment_orders (
  id VARCHAR(100) PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL, -- deposit, withdrawal
  amount DECIMAL(18, 8) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  status VARCHAR(20) NOT NULL, -- pending, processing, completed, failed
  payment_method VARCHAR(50), -- stripe_card, crypto, bank_transfer
  provider VARCHAR(50), -- stripe, paypal, coinbase
  provider_reference VARCHAR(255), -- Stripe ID, transaction hash
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP,
  failed_at TIMESTAMP,
  failed_reason TEXT
);

-- Create indexes for affiliate system
CREATE INDEX IF NOT EXISTS idx_affiliate_codes_user_id ON affiliate_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_codes_code ON affiliate_codes(code);
CREATE INDEX IF NOT EXISTS idx_affiliate_referrals_affiliate_id ON affiliate_referrals(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_referrals_referred_user_id ON affiliate_referrals(referred_user_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_payouts_affiliate_id ON affiliate_payouts(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_payouts_status ON affiliate_payouts(status);

-- Create indexes for payment orders
CREATE INDEX IF NOT EXISTS idx_payment_orders_user_id ON payment_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_orders_type ON payment_orders(type);
CREATE INDEX IF NOT EXISTS idx_payment_orders_status ON payment_orders(status);
CREATE INDEX IF NOT EXISTS idx_payment_orders_provider_reference ON payment_orders(provider_reference);

-- View: Affiliate Statistics
CREATE OR REPLACE VIEW affiliate_stats AS
SELECT
  u.id AS affiliate_id,
  u.username,
  ac.code,
  ac.commission_rate,
  COUNT(DISTINCT ar.referred_user_id) AS total_referrals,
  COALESCE(SUM(ar.commission_earned), 0) AS total_commission_earned,
  COALESCE(SUM(CASE WHEN ap.status = 'completed' THEN ap.amount ELSE 0 END), 0) AS total_paid_out,
  COALESCE(SUM(CASE WHEN ap.status = 'pending' THEN ap.amount ELSE 0 END), 0) AS pending_payout
FROM users u
LEFT JOIN affiliate_codes ac ON u.id = ac.user_id
LEFT JOIN affiliate_referrals ar ON u.id = ar.affiliate_id
LEFT JOIN affiliate_payouts ap ON u.id = ap.affiliate_id
WHERE ac.id IS NOT NULL
GROUP BY u.id, u.username, ac.code, ac.commission_rate;
