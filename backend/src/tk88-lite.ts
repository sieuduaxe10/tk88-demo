/**
 * TK88 Lite Backend — SQLite + Express + JWT
 * Standalone demo server, independent of the Postgres backend.
 * Run: npx tsx src/tk88-lite.ts
 */
import express, { type Request, type Response, type NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import Database from 'better-sqlite3';
import { randomUUID } from 'crypto';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = process.env.TK88_DB || path.join(__dirname, '..', 'tk88-lite.db');
// Railway injects PORT; fall back to TK88_LITE_PORT for local dev.
const PORT = Number(process.env.PORT || process.env.TK88_LITE_PORT || 3002);
const JWT_SECRET = process.env.TK88_JWT_SECRET || 'tk88-demo-secret-change-me';
const JWT_REFRESH_SECRET = process.env.TK88_REFRESH_SECRET || 'tk88-refresh-secret-change-me';
const ADMIN_TOKEN = process.env.TK88_ADMIN_TOKEN || 'admin123';
// Comma-separated list of allowed frontend origins. Empty = allow all (dev mode).
const CORS_ORIGINS = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);
const ACCESS_TTL = '15m';
const REFRESH_TTL = '7d';

// ─── DB ──────────────────────────────────────────────────────────────────
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  vip_level INTEGER DEFAULT 1,
  balance INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL,
  amount INTEGER NOT NULL,
  method TEXT,
  status TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
CREATE TABLE IF NOT EXISTS refresh_tokens (
  token TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
`);

// ─── Types ───────────────────────────────────────────────────────────────
interface UserRow {
  id: string;
  username: string;
  password_hash: string;
  email: string | null;
  phone: string | null;
  vip_level: number;
  balance: number;
  created_at: string;
}
interface AuthedRequest extends Request {
  userId?: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────
const toPublicUser = (u: UserRow) => ({
  id: u.id,
  username: u.username,
  email: u.email || undefined,
  phone: u.phone || undefined,
  vipLevel: u.vip_level,
  createdAt: u.created_at,
});

const signAccess = (userId: string) =>
  jwt.sign({ sub: userId, typ: 'access' }, JWT_SECRET, { expiresIn: ACCESS_TTL });
const signRefresh = (userId: string) =>
  jwt.sign({ sub: userId, typ: 'refresh' }, JWT_REFRESH_SECRET, { expiresIn: REFRESH_TTL });

const authGuard = (req: AuthedRequest, res: Response, next: NextFunction) => {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) return res.status(401).json({ error: 'unauthorized' });
  try {
    const payload = jwt.verify(auth.slice(7), JWT_SECRET) as { sub: string; typ?: string };
    if (payload.typ !== 'access') return res.status(401).json({ error: 'wrong_token_type' });
    req.userId = payload.sub;
    next();
  } catch {
    return res.status(401).json({ error: 'invalid_token' });
  }
};

// ─── App ─────────────────────────────────────────────────────────────────
const app = express();
app.use(helmet({ contentSecurityPolicy: false }));
app.use(
  cors({
    origin: CORS_ORIGINS.length
      ? (origin, cb) => {
          // Same-origin requests have no origin header (browser doesn't set it);
          // allow them so /tk88/admin served by this server works.
          if (!origin) return cb(null, true);
          cb(null, CORS_ORIGINS.includes(origin));
        }
      : true,
    credentials: true,
  }),
);
app.use(express.json({ limit: '100kb' }));
app.use('/tk88', rateLimit({ windowMs: 60_000, max: 120 }));

app.get('/tk88/health', (_req, res) => res.json({ ok: true, service: 'tk88-lite' }));

// Register
app.post('/tk88/auth/register', async (req, res) => {
  const { username, password, email, phone } = req.body ?? {};
  if (typeof username !== 'string' || username.length < 4)
    return res.status(400).json({ error: 'username_too_short' });
  if (typeof password !== 'string' || password.length < 6)
    return res.status(400).json({ error: 'password_too_short' });

  const exists = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
  if (exists) return res.status(409).json({ error: 'username_taken' });

  const id = randomUUID();
  const hash = await bcrypt.hash(password, 10);
  db.prepare(
    `INSERT INTO users (id, username, password_hash, email, phone, balance) VALUES (?, ?, ?, ?, ?, ?)`,
  ).run(id, username, hash, email ?? null, phone ?? null, 500_000);

  const row = db.prepare('SELECT * FROM users WHERE id = ?').get(id) as UserRow;
  const token = signAccess(id);
  const refreshToken = signRefresh(id);
  db.prepare(
    `INSERT INTO refresh_tokens (token, user_id, expires_at) VALUES (?, ?, datetime('now', '+7 days'))`,
  ).run(refreshToken, id);

  res.json({ user: toPublicUser(row), balance: row.balance, token, refreshToken });
});

// Login
app.post('/tk88/auth/login', async (req, res) => {
  const { username, password } = req.body ?? {};
  if (typeof username !== 'string' || typeof password !== 'string')
    return res.status(400).json({ error: 'invalid_input' });

  const row = db.prepare('SELECT * FROM users WHERE username = ?').get(username) as
    | UserRow
    | undefined;
  if (!row) return res.status(401).json({ error: 'invalid_credentials' });
  const ok = await bcrypt.compare(password, row.password_hash);
  if (!ok) return res.status(401).json({ error: 'invalid_credentials' });

  const token = signAccess(row.id);
  const refreshToken = signRefresh(row.id);
  db.prepare(
    `INSERT INTO refresh_tokens (token, user_id, expires_at) VALUES (?, ?, datetime('now', '+7 days'))`,
  ).run(refreshToken, row.id);

  res.json({ user: toPublicUser(row), balance: row.balance, token, refreshToken });
});

// Refresh
app.post('/tk88/auth/refresh', (req, res) => {
  const { refreshToken } = req.body ?? {};
  if (typeof refreshToken !== 'string') return res.status(400).json({ error: 'invalid_input' });
  try {
    const payload = jwt.verify(refreshToken, JWT_REFRESH_SECRET) as { sub: string; typ?: string };
    if (payload.typ !== 'refresh') return res.status(401).json({ error: 'wrong_token_type' });
    const dbRow = db
      .prepare('SELECT user_id FROM refresh_tokens WHERE token = ?')
      .get(refreshToken);
    if (!dbRow) return res.status(401).json({ error: 'refresh_revoked' });
    res.json({ token: signAccess(payload.sub) });
  } catch {
    res.status(401).json({ error: 'invalid_refresh' });
  }
});

// Me
app.get('/tk88/auth/me', authGuard, (req: AuthedRequest, res) => {
  const row = db.prepare('SELECT * FROM users WHERE id = ?').get(req.userId!) as UserRow;
  if (!row) return res.status(404).json({ error: 'not_found' });
  res.json({ user: toPublicUser(row), balance: row.balance });
});

// Logout
app.post('/tk88/auth/logout', authGuard, (req: AuthedRequest, res) => {
  const { refreshToken } = req.body ?? {};
  if (typeof refreshToken === 'string') {
    db.prepare('DELETE FROM refresh_tokens WHERE token = ?').run(refreshToken);
  }
  res.json({ ok: true });
});

// Deposit — creates PENDING order. Admin must approve before balance is credited.
app.post('/tk88/wallet/deposit', authGuard, (req: AuthedRequest, res) => {
  const { amount, method } = req.body ?? {};
  const amt = Number(amount);
  if (!Number.isFinite(amt) || amt < 50_000)
    return res.status(400).json({ error: 'min_50000' });

  const orderId = randomUUID();
  db.prepare(
    `INSERT INTO transactions (id, user_id, type, amount, method, status) VALUES (?, ?, 'deposit', ?, ?, 'pending')`,
  ).run(orderId, req.userId!, amt, String(method ?? 'unknown'));

  const row = db.prepare('SELECT balance FROM users WHERE id = ?').get(req.userId!) as {
    balance: number;
  };
  const u = db.prepare('SELECT username FROM users WHERE id = ?').get(req.userId!) as
    | { username: string }
    | undefined;
  console.log(
    `[DEPOSIT] pending order=${orderId} user=${u?.username ?? req.userId} amount=${amt} method=${method ?? 'unknown'}`,
  );
  res.json({
    ok: true,
    orderId,
    status: 'pending',
    amount: amt,
    balance: row.balance,
  });
});

// Order status — user polls this while waiting for admin approval
app.get('/tk88/wallet/order/:id', authGuard, (req: AuthedRequest, res) => {
  const row = db
    .prepare('SELECT * FROM transactions WHERE id = ? AND user_id = ?')
    .get(req.params.id, req.userId!) as any;
  if (!row) return res.status(404).json({ error: 'not_found' });
  const bal = db.prepare('SELECT balance FROM users WHERE id = ?').get(req.userId!) as {
    balance: number;
  };
  res.json({
    id: row.id,
    type: row.type,
    amount: row.amount,
    method: row.method,
    status: row.status,
    created_at: row.created_at,
    balance: bal.balance,
  });
});

// User cancels own pending deposit
app.post('/tk88/wallet/order/:id/cancel', authGuard, (req: AuthedRequest, res) => {
  const row = db
    .prepare('SELECT * FROM transactions WHERE id = ? AND user_id = ?')
    .get(req.params.id, req.userId!) as any;
  if (!row) return res.status(404).json({ error: 'not_found' });
  if (row.status !== 'pending') return res.status(400).json({ error: 'not_pending' });
  if (row.type !== 'deposit') return res.status(400).json({ error: 'cannot_cancel' });
  db.prepare(`UPDATE transactions SET status = 'cancelled' WHERE id = ?`).run(row.id);
  res.json({ ok: true });
});

// Withdraw
app.post('/tk88/wallet/withdraw', authGuard, (req: AuthedRequest, res) => {
  const { amount, method } = req.body ?? {};
  const amt = Number(amount);
  if (!Number.isFinite(amt) || amt < 100_000)
    return res.status(400).json({ error: 'min_100000' });

  const user = db.prepare('SELECT balance FROM users WHERE id = ?').get(req.userId!) as
    | { balance: number }
    | undefined;
  if (!user || user.balance < amt) return res.status(400).json({ error: 'insufficient_balance' });

  const trx = db.transaction((uid: string, a: number, m: string) => {
    db.prepare('UPDATE users SET balance = balance - ? WHERE id = ?').run(a, uid);
    db.prepare(
      `INSERT INTO transactions (id, user_id, type, amount, method, status) VALUES (?, ?, 'withdraw', ?, ?, 'pending')`,
    ).run(randomUUID(), uid, a, m);
  });
  trx(req.userId!, amt, String(method ?? 'unknown'));

  const row = db.prepare('SELECT balance FROM users WHERE id = ?').get(req.userId!) as {
    balance: number;
  };
  res.json({ ok: true, balance: row.balance });
});

// Bet — simulate game result server-side, settle atomically
app.post('/tk88/wallet/bet', authGuard, (req: AuthedRequest, res) => {
  const { amount, gameId, prediction, bets } = req.body ?? {};

  // ─── Multi-bet branch (Bầu Cua Tôm Cá) ─────────────────────────────────
  // Body shape: { gameId: 'baucua', bets: [{ prediction, amount }, ...] }
  // One roll, N bets, sum payouts. This matches the street-game behavior
  // where a single toss resolves every chip placed across the 6 symbols.
  if (Array.isArray(bets) && gameId === 'baucua') {
    if (bets.length === 0)
      return res.status(400).json({ error: 'invalid_input' });
    const SYMS = ['bau', 'cua', 'tom', 'ca', 'ga', 'nai'] as const;
    type Sym = (typeof SYMS)[number];
    const LABELS: Record<Sym, string> = {
      bau: 'Bầu', cua: 'Cua', tom: 'Tôm', ca: 'Cá', ga: 'Gà', nai: 'Nai',
    };
    let totalAmt = 0;
    const parsed: { pred: Sym; amount: number }[] = [];
    for (const b of bets) {
      const a = Number(b?.amount);
      const p = b?.prediction;
      if (!Number.isFinite(a) || a < 10_000)
        return res.status(400).json({ error: 'min_10000' });
      if (!SYMS.includes(p))
        return res.status(400).json({ error: 'bad_prediction' });
      totalAmt += a;
      parsed.push({ pred: p, amount: a });
    }
    if (totalAmt > 100_000_000)
      return res.status(400).json({ error: 'max_100000000' });
    const user = db.prepare('SELECT balance FROM users WHERE id = ?').get(req.userId!) as
      | { balance: number }
      | undefined;
    if (!user || user.balance < totalAmt)
      return res.status(400).json({ error: 'insufficient_balance' });

    const symbols: [Sym, Sym, Sym] = [
      SYMS[Math.floor(Math.random() * 6)],
      SYMS[Math.floor(Math.random() * 6)],
      SYMS[Math.floor(Math.random() * 6)],
    ];
    let totalPayout = 0;
    const perBet = parsed.map(({ pred, amount: a }) => {
      const matches = symbols.filter((s) => s === pred).length;
      const mult = matches === 0 ? 0 : matches + 1;
      const payout = Math.floor(a * mult);
      totalPayout += payout;
      return { symbol: pred, amount: a, matches, multiplier: mult, payout };
    });
    const delta = totalPayout - totalAmt;
    const win = totalPayout > totalAmt;

    const trx = db.transaction((uid: string, d: number, w: boolean) => {
      db.prepare('UPDATE users SET balance = balance + ? WHERE id = ?').run(d, uid);
      db.prepare(
        `INSERT INTO transactions (id, user_id, type, amount, method, status) VALUES (?, ?, 'bet', ?, ?, ?)`,
      ).run(randomUUID(), uid, d, 'baucua', w ? 'win' : 'loss');
    });
    trx(req.userId!, delta, win);

    const row = db.prepare('SELECT balance FROM users WHERE id = ?').get(req.userId!) as {
      balance: number;
    };
    const hits = perBet
      .filter((b) => b.matches > 0)
      .map((b) => `${LABELS[b.symbol]} ×${b.multiplier}`)
      .join(', ');
    return res.json({
      ok: true,
      balance: row.balance,
      win,
      payout: totalPayout,
      delta,
      result: {
        label: symbols.map((s) => LABELS[s]).join(' · '),
        detail: hits ? `Trúng: ${hits}` : 'Không trúng con nào',
      },
      reveal: {
        symbols,
        bets: perBet,
        result: symbols[0], // for road history (first symbol as representative)
      },
    });
  }

  const amt = Number(amount);
  if (!Number.isFinite(amt) || amt < 10_000)
    return res.status(400).json({ error: 'min_10000' });
  if (amt > 100_000_000) return res.status(400).json({ error: 'max_100000000' });
  if (typeof gameId !== 'string' || typeof prediction !== 'string')
    return res.status(400).json({ error: 'invalid_input' });

  const user = db.prepare('SELECT balance FROM users WHERE id = ?').get(req.userId!) as
    | { balance: number }
    | undefined;
  if (!user || user.balance < amt) return res.status(400).json({ error: 'insufficient_balance' });

  // RNG outcome — `reveal` is structured data the frontend uses to animate 3D scenes.
  const SUITS = ['♠', '♥', '♦', '♣'];
  const drawCard = () => {
    const rank = 1 + Math.floor(Math.random() * 13); // 1=A, 11=J, 12=Q, 13=K
    const suit = SUITS[Math.floor(Math.random() * 4)];
    return { rank, suit };
  };
  // Baccarat card value: A=1, 2-9=face, 10/J/Q/K=0
  const cardValue = (rank: number) => (rank >= 10 ? 0 : rank);

  let outcome: {
    win: boolean;
    multiplier: number;
    label: string;
    detail: string;
    reveal?: Record<string, unknown>;
  };
  if (gameId === 'taixiu') {
    const dice = [1, 2, 3].map(() => 1 + Math.floor(Math.random() * 6));
    const sum = dice.reduce((a, b) => a + b, 0);
    const isTai = sum >= 11 && sum <= 17;
    const isXiu = sum >= 4 && sum <= 10;
    const label = isTai ? 'TÀI' : isXiu ? 'XỈU' : 'BA ĐỎ';
    const result = isTai ? 'tai' : isXiu ? 'xiu' : 'triple';
    const win =
      (prediction === 'tai' && isTai) || (prediction === 'xiu' && isXiu);
    outcome = {
      win,
      multiplier: win ? 1.95 : 0,
      label,
      detail: `${dice.join('-')} = ${sum}`,
      reveal: { dice, sum, result },
    };
  } else if (gameId === 'xocdia') {
    const coins = [0, 0, 0, 0].map(() => Math.floor(Math.random() * 2));
    const reds = coins.filter((c) => c === 1).length;
    const isChan = reds === 0 || reds === 2 || reds === 4;
    const label = isChan ? 'CHẴN' : 'LẺ';
    const result = isChan ? 'chan' : 'le';
    const win =
      (prediction === 'chan' && isChan) || (prediction === 'le' && !isChan);
    outcome = {
      win,
      multiplier: win ? 1.95 : 0,
      label,
      detail: `${reds} đỏ / ${4 - reds} trắng`,
      reveal: { coins, reds, result },
    };
  } else if (gameId === 'coinflip') {
    const side = Math.random() < 0.5 ? 'head' : 'tail';
    const label = side === 'head' ? 'NGỬA' : 'SẤP';
    const win = prediction === side;
    outcome = {
      win,
      multiplier: win ? 1.95 : 0,
      label,
      detail: label,
      reveal: { side },
    };
  } else if (gameId === 'baccarat') {
    // Simplified "tableau" third-card rules for authentic feel.
    const bankerCards = [drawCard(), drawCard()];
    const playerCards = [drawCard(), drawCard()];
    const sum = (cs: { rank: number }[]) =>
      cs.reduce((t, c) => t + cardValue(c.rank), 0) % 10;
    let bankerTotal = sum(bankerCards);
    let playerTotal = sum(playerCards);

    // Natural 8 or 9 → no one draws.
    const isNatural = bankerTotal >= 8 || playerTotal >= 8;
    if (!isNatural) {
      // Player's rule: stand on 6-7, draw on 0-5.
      let playerThird: { rank: number; suit: string } | null = null;
      if (playerTotal <= 5) {
        playerThird = drawCard();
        playerCards.push(playerThird);
        playerTotal = sum(playerCards);
      }
      // Banker's rule: complex tableau. Use simplified chart.
      if (!playerThird) {
        // Player stood → banker draws on 0-5, stands on 6-7.
        if (bankerTotal <= 5) {
          bankerCards.push(drawCard());
          bankerTotal = sum(bankerCards);
        }
      } else {
        const pt = cardValue(playerThird.rank);
        let bankerDraws = false;
        if (bankerTotal <= 2) bankerDraws = true;
        else if (bankerTotal === 3) bankerDraws = pt !== 8;
        else if (bankerTotal === 4) bankerDraws = pt >= 2 && pt <= 7;
        else if (bankerTotal === 5) bankerDraws = pt >= 4 && pt <= 7;
        else if (bankerTotal === 6) bankerDraws = pt === 6 || pt === 7;
        if (bankerDraws) {
          bankerCards.push(drawCard());
          bankerTotal = sum(bankerCards);
        }
      }
    }

    const result =
      bankerTotal > playerTotal ? 'banker' : playerTotal > bankerTotal ? 'player' : 'tie';
    const label = result === 'banker' ? 'CÁI' : result === 'player' ? 'CON' : 'HÒA';
    const win = prediction === result;
    const multiplier =
      win && result === 'tie' ? 8 : win && result === 'banker' ? 1.95 : win ? 2 : 0;
    outcome = {
      win,
      multiplier,
      label,
      detail: `Con ${playerTotal} vs Cái ${bankerTotal}`,
      reveal: {
        banker: { cards: bankerCards, total: bankerTotal },
        player: { cards: playerCards, total: playerTotal },
        result,
      },
    };
  } else if (gameId === 'longho') {
    const longCard = drawCard();
    const hoCard = drawCard();
    const result =
      longCard.rank > hoCard.rank
        ? 'long'
        : longCard.rank < hoCard.rank
        ? 'ho'
        : 'tie';
    const label = result === 'long' ? 'LONG' : result === 'ho' ? 'HỔ' : 'HÒA';
    const win = prediction === result;
    const multiplier = win && result === 'tie' ? 8 : win ? 1.95 : 0;
    outcome = {
      win,
      multiplier,
      label,
      detail: `Long:${longCard.rank} vs Hổ:${hoCard.rank}`,
      reveal: { long: longCard, ho: hoCard, result },
    };
  } else if (gameId === 'slot') {
    // 3-reel slot. Match 3 = multiplier per symbol. Match 2 adjacent = 1.5x. Else lose.
    const SYMBOLS = ['🍒', '🍋', '🔔', '⭐', '💎', '7️⃣'];
    const MULT: Record<string, number> = {
      '🍒': 5,
      '🍋': 6,
      '🔔': 8,
      '⭐': 12,
      '💎': 25,
      '7️⃣': 50,
    };
    const reels = [0, 1, 2].map(
      () => SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
    );
    const allMatch = reels[0] === reels[1] && reels[1] === reels[2];
    const twoMatch =
      !allMatch &&
      (reels[0] === reels[1] ||
        reels[1] === reels[2] ||
        reels[0] === reels[2]);
    const multiplier = allMatch ? MULT[reels[0]] : twoMatch ? 1.5 : 0;
    outcome = {
      win: multiplier > 0,
      multiplier,
      label: reels.join(' '),
      detail: allMatch
        ? `JACKPOT ×${multiplier}!`
        : twoMatch
        ? 'Hai biểu tượng trùng ×1.5'
        : 'Không trùng',
      reveal: { reels },
    };
  } else if (gameId === 'number') {
    // Pick a number 0-9. Random draw 0-9. Match = 8x.
    const pick = Number(prediction);
    if (!Number.isInteger(pick) || pick < 0 || pick > 9)
      return res.status(400).json({ error: 'bad_prediction' });
    const drawn = Math.floor(Math.random() * 10);
    const win = drawn === pick;
    outcome = {
      win,
      multiplier: win ? 8 : 0,
      label: `Số ${drawn}`,
      detail: win ? `Đoán đúng số ${pick}` : `Bạn chọn ${pick}, trúng ${drawn}`,
      reveal: { drawn, pick },
    };
  } else if (gameId === 'pick2') {
    // Generic 2-option 50/50 (red vs blue). Used by daga/sports/esports skins.
    const side = Math.random() < 0.5 ? 'red' : 'blue';
    const label = side === 'red' ? 'ĐỎ' : 'XANH';
    const win = prediction === side;
    outcome = {
      win,
      multiplier: win ? 1.95 : 0,
      label,
      detail: `Kết quả: ${label}`,
      reveal: { side },
    };
  } else if (gameId === 'baucua') {
    // Bầu Cua Tôm Cá: roll 3 dice with 6 symbols each.
    const SYMS = ['bau', 'cua', 'tom', 'ca', 'ga', 'nai'] as const;
    type Sym = (typeof SYMS)[number];
    const LABELS: Record<Sym, string> = {
      bau: 'Bầu', cua: 'Cua', tom: 'Tôm', ca: 'Cá', ga: 'Gà', nai: 'Nai',
    };
    const symbols: [Sym, Sym, Sym] = [
      SYMS[Math.floor(Math.random() * 6)],
      SYMS[Math.floor(Math.random() * 6)],
      SYMS[Math.floor(Math.random() * 6)],
    ];
    const pred = prediction as Sym;
    if (!SYMS.includes(pred))
      return res.status(400).json({ error: 'bad_prediction' });
    const matches = symbols.filter((s) => s === pred).length;
    // Street rule: 1 match → 2x stake, 2 → 3x, 3 → 4x; 0 → lose.
    const multiplier = matches === 0 ? 0 : matches + 1;
    outcome = {
      win: matches > 0,
      multiplier,
      label: symbols.map((s) => LABELS[s]).join(' · '),
      detail:
        matches === 0
          ? `Bạn chọn ${LABELS[pred]} — không trúng con nào`
          : `${LABELS[pred]} ra ${matches} lần → thắng ${multiplier}x`,
      reveal: { symbols, pick: pred, matches, result: pred },
    };
  } else if (gameId === 'chonga') {
    // Cockfight (Đá gà): red rooster vs blue rooster, 50/50.
    const winner = Math.random() < 0.5 ? 'red' : 'blue';
    const label = winner === 'red' ? 'GÀ ĐỎ' : 'GÀ XANH';
    const win = prediction === winner;
    outcome = {
      win,
      multiplier: win ? 1.95 : 0,
      label,
      detail: `Thắng cuộc: ${label}`,
      reveal: { winner, result: winner },
    };
  } else {
    return res.status(400).json({ error: 'unknown_game' });
  }

  const payout = Math.floor(amt * outcome.multiplier);
  const delta = payout - amt;

  const trx = db.transaction((uid: string, d: number, g: string, o: typeof outcome) => {
    db.prepare('UPDATE users SET balance = balance + ? WHERE id = ?').run(d, uid);
    db.prepare(
      `INSERT INTO transactions (id, user_id, type, amount, method, status) VALUES (?, ?, 'bet', ?, ?, ?)`,
    ).run(randomUUID(), uid, d, g, o.win ? 'win' : 'loss');
  });
  trx(req.userId!, delta, gameId, outcome);

  const row = db.prepare('SELECT balance FROM users WHERE id = ?').get(req.userId!) as {
    balance: number;
  };
  res.json({
    ok: true,
    balance: row.balance,
    win: outcome.win,
    payout,
    delta,
    result: { label: outcome.label, detail: outcome.detail },
    reveal: outcome.reveal ?? null,
  });
});

// History
app.get('/tk88/wallet/history', authGuard, (req: AuthedRequest, res) => {
  const rows = db
    .prepare(
      `SELECT id, type, amount, method, status, created_at FROM transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT 100`,
    )
    .all(req.userId!);
  res.json({ items: rows });
});

// ─── Admin ────────────────────────────────────────────────────────────────
const adminGuard = (req: Request, res: Response, next: NextFunction) => {
  const tok = req.headers['x-admin-token'];
  if (tok !== ADMIN_TOKEN) return res.status(401).json({ error: 'bad_admin_token' });
  next();
};

app.get('/tk88/admin/api/overview', adminGuard, (req, res) => {
  const day = typeof req.query.day === 'string' && req.query.day ? req.query.day : '';
  const type = typeof req.query.type === 'string' && req.query.type ? req.query.type : '';
  const status = typeof req.query.status === 'string' && req.query.status ? req.query.status : '';
  const q = typeof req.query.q === 'string' && req.query.q ? req.query.q.trim() : '';
  const page = Math.max(1, parseInt(String(req.query.page || '1'), 10) || 1);
  const pageSize = Math.min(200, Math.max(5, parseInt(String(req.query.pageSize || '25'), 10) || 25));
  const offset = (page - 1) * pageSize;

  // Build WHERE clause for txns
  const where: string[] = [];
  const args: any[] = [];
  if (day) { where.push(`substr(t.created_at,1,10) = ?`); args.push(day); }
  if (type) { where.push(`t.type = ?`); args.push(type); }
  if (status) { where.push(`t.status = ?`); args.push(status); }
  if (q) { where.push(`u.username LIKE ?`); args.push(`%${q}%`); }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const txnTotalRow = db
    .prepare(
      `SELECT COUNT(*) AS c FROM transactions t LEFT JOIN users u ON u.id = t.user_id ${whereSql}`,
    )
    .get(...args) as { c: number };
  const txns = db
    .prepare(
      `SELECT t.id, t.user_id, u.username, t.type, t.amount, t.method, t.status, t.created_at
       FROM transactions t LEFT JOIN users u ON u.id = t.user_id
       ${whereSql}
       ORDER BY t.created_at DESC LIMIT ? OFFSET ?`,
    )
    .all(...args, pageSize, offset);

  // Day-scoped stats (if day given), else overall
  const dayWhere = day ? `WHERE substr(created_at,1,10) = ?` : '';
  const dayArgs = day ? [day] : [];
  const dayStats = db
    .prepare(
      `SELECT
         COALESCE(SUM(CASE WHEN type='deposit' AND status='success' THEN amount ELSE 0 END),0) AS depositSuccess,
         COALESCE(SUM(CASE WHEN type='deposit' AND status='pending' THEN amount ELSE 0 END),0) AS depositPending,
         COALESCE(SUM(CASE WHEN type='withdraw' AND status='success' THEN amount ELSE 0 END),0) AS withdrawSuccess,
         COALESCE(SUM(CASE WHEN type='withdraw' AND status='pending' THEN amount ELSE 0 END),0) AS withdrawPending,
         COUNT(CASE WHEN type='bet' THEN 1 END) AS betCount
       FROM transactions ${dayWhere}`,
    )
    .get(...dayArgs);

  const users = db
    .prepare(
      `SELECT id, username, email, phone, balance, vip_level, created_at FROM users ORDER BY created_at DESC LIMIT 50`,
    )
    .all();
  const stats = db
    .prepare(
      `SELECT
         (SELECT COUNT(*) FROM users) AS userCount,
         (SELECT COALESCE(SUM(balance),0) FROM users) AS totalBalance,
         (SELECT COUNT(*) FROM transactions WHERE type IN ('deposit','withdraw') AND status='pending') AS pendingCount`,
    )
    .get();

  res.json({
    stats,
    dayStats,
    day,
    users,
    txns,
    pagination: { page, pageSize, total: txnTotalRow.c, pages: Math.max(1, Math.ceil(txnTotalRow.c / pageSize)) },
    filters: { day, type, status, q },
  });
});

// Manual credit — dùng khi user chuyển khoản thật mà chưa tự credit
app.post('/tk88/admin/api/credit', adminGuard, (req, res) => {
  const { userId, amount, note } = req.body ?? {};
  const amt = Number(amount);
  if (!userId || !Number.isFinite(amt) || amt === 0)
    return res.status(400).json({ error: 'invalid_input' });

  const current = db.prepare('SELECT balance, username FROM users WHERE id = ?').get(userId) as
    | { balance: number; username: string }
    | undefined;
  if (!current) return res.status(404).json({ error: 'user_not_found' });
  if (amt < 0 && current.balance + amt < 0)
    return res.status(400).json({
      error: 'insufficient_balance',
      currentBalance: current.balance,
      requested: amt,
    });

  const trx = db.transaction((uid: string, a: number, n: string) => {
    db.prepare('UPDATE users SET balance = balance + ? WHERE id = ?').run(a, uid);
    db.prepare(
      `INSERT INTO transactions (id, user_id, type, amount, method, status) VALUES (?, ?, ?, ?, ?, 'success')`,
    ).run(randomUUID(), uid, a > 0 ? 'deposit' : 'withdraw', Math.abs(a), `admin: ${n}`);
  });
  trx(userId, amt, String(note ?? 'manual'));
  const row = db.prepare('SELECT balance FROM users WHERE id = ?').get(userId) as
    | { balance: number }
    | undefined;
  console.log(
    `[ADMIN-CREDIT] user=${current.username} delta=${amt > 0 ? '+' : ''}${amt} newBalance=${row?.balance ?? 0} note=${note ?? ''}`,
  );
  res.json({ ok: true, balance: row?.balance ?? 0 });
});

// Admin: duyệt / từ chối giao dịch pending — all state transitions
// are performed inside a single SQLite transaction where the status
// guard is part of the UPDATE's WHERE clause. This prevents double-
// approve / approve-vs-cancel races and partial-failure refunds.
app.post('/tk88/admin/api/txn/:id', adminGuard, (req, res) => {
  const id = req.params.id;
  const { action } = req.body ?? {};
  if (action !== 'approve' && action !== 'reject')
    return res.status(400).json({ error: 'bad_action' });

  const row = db.prepare('SELECT * FROM transactions WHERE id = ?').get(id) as any;
  if (!row) return res.status(404).json({ error: 'not_found' });
  if (row.status !== 'pending')
    return res.status(400).json({ error: 'not_pending', currentStatus: row.status });

  try {
    const newStatus = action === 'approve' ? 'success' : 'rejected';
    const trx = db.transaction(() => {
      // Flip status ONLY if still pending — guard against concurrent writers.
      const r = db
        .prepare(`UPDATE transactions SET status = ? WHERE id = ? AND status = 'pending'`)
        .run(newStatus, id);
      if (r.changes === 0) throw new Error('race_already_processed');

      // Side-effect on balance, depending on type + action:
      //  - approve deposit  → credit amount
      //  - reject withdraw  → refund amount (balance was debited at request time)
      //  - approve withdraw / reject deposit → no balance change
      if (action === 'approve' && row.type === 'deposit') {
        db.prepare('UPDATE users SET balance = balance + ? WHERE id = ?').run(
          row.amount,
          row.user_id,
        );
      } else if (action === 'reject' && row.type === 'withdraw') {
        db.prepare('UPDATE users SET balance = balance + ? WHERE id = ?').run(
          row.amount,
          row.user_id,
        );
      }
    });
    trx();
  } catch (e: any) {
    if (e?.message === 'race_already_processed')
      return res.status(409).json({ error: 'already_processed' });
    throw e;
  }
  res.json({ ok: true });
});

// Admin HTML dashboard
app.get('/tk88/admin', (_req, res) => {
  res.type('html').send(ADMIN_HTML);
});

const ADMIN_HTML = `<!DOCTYPE html>
<html lang="vi"><head>
<meta charset="utf-8"/><title>TK88 Admin</title>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:system-ui,-apple-system,sans-serif;background:#0D0D0D;color:#fff;padding:16px;min-height:100vh}
h1{color:#FFD700;font-size:24px;margin-bottom:4px}
h2{color:#FFD700;font-size:14px;text-transform:uppercase;letter-spacing:1px;margin:20px 0 10px}
.sub{color:#999;font-size:12px;margin-bottom:20px}
.login{max-width:400px;margin:80px auto;background:#1F1F1F;padding:24px;border-radius:12px;border:1px solid #333}
.login input{width:100%;padding:10px;background:#000;border:1px solid #444;color:#fff;border-radius:6px;font-size:14px}
.login button{margin-top:12px;width:100%;padding:10px;background:linear-gradient(135deg,#FFD700,#DC143C);color:#000;border:none;border-radius:6px;font-weight:bold;cursor:pointer}
.stats{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:12px;margin-bottom:24px}
.stat{background:#1F1F1F;padding:12px;border-radius:8px;border:1px solid #333}
.stat-label{color:#999;font-size:10px;text-transform:uppercase;letter-spacing:1px}
.stat-val{color:#FFD700;font-size:20px;font-weight:bold;margin-top:4px}
table{width:100%;border-collapse:collapse;background:#1F1F1F;border-radius:8px;overflow:hidden;font-size:12px}
th{background:#000;color:#FFD700;padding:8px;text-align:left;font-size:10px;text-transform:uppercase}
td{padding:8px;border-top:1px solid #2a2a2a}
tr:hover{background:#252525}
.mono{font-family:monospace;font-size:11px;color:#aaa}
.pill{display:inline-block;padding:2px 6px;border-radius:4px;font-size:10px;font-weight:bold}
.pill.success{background:rgba(34,197,94,.2);color:#86efac}
.pill.pending{background:rgba(234,179,8,.2);color:#fde047}
.pill.rejected{background:rgba(239,68,68,.2);color:#fca5a5}
.pill.win{background:rgba(34,197,94,.2);color:#86efac}
.pill.loss{background:rgba(239,68,68,.2);color:#fca5a5}
.pill.deposit{background:rgba(59,130,246,.2);color:#93c5fd}
.pill.withdraw{background:rgba(249,115,22,.2);color:#fdba74}
.pill.bet{background:rgba(168,85,247,.2);color:#d8b4fe}
.pos{color:#86efac;font-weight:bold}
.neg{color:#fca5a5;font-weight:bold}
button.action{background:#FFD700;color:#000;border:none;padding:3px 8px;border-radius:4px;font-size:10px;font-weight:bold;cursor:pointer;margin-right:4px}
button.reject{background:#DC143C;color:#fff}
button.credit{background:#4ade80;color:#000}
.toolbar{display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;flex-wrap:wrap;gap:8px}
.refresh{color:#999;font-size:11px}
.filters{display:flex;gap:6px;flex-wrap:wrap;align-items:center;background:#1F1F1F;border:1px solid #333;padding:8px;border-radius:8px;margin-bottom:10px}
.filters label{color:#999;font-size:10px;text-transform:uppercase;letter-spacing:.5px;display:flex;flex-direction:column;gap:3px}
.filters input,.filters select{background:#000;border:1px solid #444;color:#fff;border-radius:4px;padding:5px 6px;font-size:12px;min-width:110px}
.filters button{background:#FFD700;color:#000;border:none;padding:6px 10px;border-radius:4px;font-size:11px;font-weight:bold;cursor:pointer;align-self:flex-end}
.filters button.ghost{background:#333;color:#ddd}
.pager{display:flex;gap:6px;align-items:center;justify-content:flex-end;margin-top:8px;font-size:12px;color:#999}
.pager button{background:#2a2a2a;color:#fff;border:1px solid #444;border-radius:4px;padding:4px 10px;font-size:12px;cursor:pointer}
.pager button:disabled{opacity:.35;cursor:not-allowed}
.pager .info{margin:0 8px;color:#ccc}
.modal{position:fixed;inset:0;background:rgba(0,0,0,.8);display:flex;align-items:center;justify-content:center;padding:16px}
.modal-body{background:#1F1F1F;border:1px solid #FFD700;border-radius:12px;padding:20px;max-width:400px;width:100%}
.modal input{width:100%;padding:8px;background:#000;border:1px solid #444;color:#fff;border-radius:4px;margin:6px 0;font-size:13px}
.modal h3{color:#FFD700;margin-bottom:12px}
.row{display:flex;gap:8px;margin-top:12px}
.row button{flex:1;padding:8px;border:none;border-radius:6px;font-weight:bold;cursor:pointer}
</style></head>
<body>
<div id="app"></div>
<script>
const fmt = n => new Intl.NumberFormat('vi-VN').format(n) + ' ₫';
const el = document.getElementById('app');
let token = sessionStorage.getItem('tk88_admin_tok') || '';
const todayStr = () => {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
};
const state = { day: todayStr(), type: '', status: '', q: '', page: 1, pageSize: 25 };

async function api(path, opts = {}) {
  const r = await fetch(path, {
    headers: { 'Content-Type': 'application/json', 'x-admin-token': token },
    ...opts,
  });
  return r.json();
}
function buildQuery() {
  const p = new URLSearchParams();
  if (state.day) p.set('day', state.day);
  if (state.type) p.set('type', state.type);
  if (state.status) p.set('status', state.status);
  if (state.q) p.set('q', state.q);
  p.set('page', state.page);
  p.set('pageSize', state.pageSize);
  return p.toString();
}

function renderLogin(err) {
  el.innerHTML = \`
    <div class="login">
      <h1>🔒 TK88 Admin</h1>
      <p class="sub">Nhập admin token để truy cập</p>
      \${err ? '<div style="color:#fca5a5;font-size:12px;margin-bottom:8px">⚠ ' + err + '</div>' : ''}
      <input id="tok" type="password" placeholder="admin token" autofocus/>
      <button onclick="doLogin()">Vào Dashboard</button>
      <p style="color:#555;font-size:10px;margin-top:10px;text-align:center">Default: admin123</p>
    </div>\`;
  document.getElementById('tok').addEventListener('keydown', e => e.key === 'Enter' && doLogin());
}

window.doLogin = async function() {
  token = document.getElementById('tok').value.trim();
  const res = await api('/tk88/admin/api/overview?' + buildQuery());
  if (res.error) return renderLogin('Token sai');
  sessionStorage.setItem('tk88_admin_tok', token);
  render(res);
};

function render(data) {
  const s = data.stats;
  const d = data.dayStats || {};
  const pg = data.pagination || { page:1, pages:1, total:0, pageSize:25 };
  const scope = state.day ? ('ngày ' + state.day) : 'tất cả';
  const html = \`
    <div class="toolbar">
      <div>
        <h1>TK88 Admin</h1>
        <p class="sub">Tự làm mới mỗi 5 giây · <span class="refresh" id="lastUpdate"></span></p>
      </div>
      <button class="action" onclick="sessionStorage.clear();location.reload()">Đăng xuất</button>
    </div>

    <div class="stats">
      <div class="stat"><div class="stat-label">Tổng user</div><div class="stat-val">\${s.userCount}</div></div>
      <div class="stat"><div class="stat-label">Tổng số dư hệ thống</div><div class="stat-val">\${fmt(s.totalBalance)}</div></div>
      <div class="stat"><div class="stat-label">Nạp \${scope}</div><div class="stat-val">\${fmt(d.depositSuccess||0)}</div><div class="stat-label" style="margin-top:2px;color:#fde047">Chờ: \${fmt(d.depositPending||0)}</div></div>
      <div class="stat"><div class="stat-label">Rút \${scope}</div><div class="stat-val">\${fmt(d.withdrawSuccess||0)}</div><div class="stat-label" style="margin-top:2px;color:#fde047">Chờ: \${fmt(d.withdrawPending||0)}</div></div>
      <div class="stat"><div class="stat-label">Pending cần xử lý</div><div class="stat-val" style="color:\${s.pendingCount>0?'#fde047':'#FFD700'}">\${s.pendingCount}</div></div>
      <div class="stat"><div class="stat-label">Cược \${scope}</div><div class="stat-val">\${d.betCount||0}</div></div>
    </div>

    <h2>🔎 Lọc giao dịch</h2>
    <div class="filters">
      <label>Ngày<input type="date" id="f_day" value="\${state.day}"/></label>
      <label>Loại
        <select id="f_type">
          <option value="">Tất cả</option>
          <option value="deposit" \${state.type==='deposit'?'selected':''}>Nạp</option>
          <option value="withdraw" \${state.type==='withdraw'?'selected':''}>Rút</option>
          <option value="bet" \${state.type==='bet'?'selected':''}>Cược</option>
        </select>
      </label>
      <label>Trạng thái
        <select id="f_status">
          <option value="">Tất cả</option>
          <option value="pending" \${state.status==='pending'?'selected':''}>Chờ</option>
          <option value="success" \${state.status==='success'?'selected':''}>Thành công</option>
          <option value="rejected" \${state.status==='rejected'?'selected':''}>Từ chối</option>
          <option value="cancelled" \${state.status==='cancelled'?'selected':''}>Đã hủy</option>
        </select>
      </label>
      <label>User<input type="text" id="f_q" value="\${state.q}" placeholder="username"/></label>
      <label>/trang
        <select id="f_size">
          \${[10,25,50,100].map(n=>\`<option value="\${n}" \${state.pageSize===n?'selected':''}>\${n}</option>\`).join('')}
        </select>
      </label>
      <button onclick="applyFilters()">Áp dụng</button>
      <button class="ghost" onclick="resetFilters()">Hôm nay</button>
      <button class="ghost" onclick="clearFilters()">Xóa lọc</button>
    </div>

    <h2>💸 Giao dịch (\${pg.total} kết quả · trang \${pg.page}/\${pg.pages})</h2>
    <table>
      <thead><tr><th>Thời gian</th><th>User</th><th>Loại</th><th>Kênh</th><th style="text-align:right">Số tiền</th><th>Trạng thái</th><th>Action</th></tr></thead>
      <tbody>
      \${data.txns.length === 0 ? '<tr><td colspan="7" style="text-align:center;color:#666;padding:20px">Không có giao dịch nào khớp bộ lọc</td></tr>' : data.txns.map(t => {
        const signed = (t.type === 'bet' ? t.amount : (t.type === 'deposit' ? t.amount : -t.amount));
        return \`
        <tr>
          <td class="mono">\${t.created_at}</td>
          <td>\${t.username || '—'}</td>
          <td><span class="pill \${t.type}">\${t.type}</span></td>
          <td>\${t.method || '—'}</td>
          <td style="text-align:right" class="\${signed >= 0 ? 'pos' : 'neg'}">\${signed >= 0 ? '+' : ''}\${fmt(signed)}</td>
          <td><span class="pill \${t.status}">\${t.status}</span></td>
          <td>
            \${t.status === 'pending' && (t.type === 'deposit' || t.type === 'withdraw') ? \`
              <button class="action" onclick="txnAction('\${t.id}','approve','\${t.type === 'deposit' ? 'Duyệt nạp (sẽ cộng tiền)' : 'Duyệt rút (xác nhận đã chuyển)'}')">Duyệt</button>
              <button class="action reject" onclick="txnAction('\${t.id}','reject','\${t.type === 'deposit' ? 'Từ chối nạp' : 'Từ chối và hoàn tiền'}')">Từ chối</button>
            \` : ''}
          </td>
        </tr>\`;
      }).join('')}
      </tbody>
    </table>
    <div class="pager">
      <button onclick="gotoPage(1)" \${pg.page<=1?'disabled':''}>« Đầu</button>
      <button onclick="gotoPage(\${pg.page-1})" \${pg.page<=1?'disabled':''}>‹ Trước</button>
      <span class="info">Trang \${pg.page} / \${pg.pages}</span>
      <button onclick="gotoPage(\${pg.page+1})" \${pg.page>=pg.pages?'disabled':''}>Sau ›</button>
      <button onclick="gotoPage(\${pg.pages})" \${pg.page>=pg.pages?'disabled':''}>Cuối »</button>
    </div>

    <h2>👥 Người dùng (\${data.users.length} mới nhất)</h2>
    <table>
      <thead><tr><th>Username</th><th>Phone / Email</th><th>VIP</th><th style="text-align:right">Số dư</th><th>Ngày tạo</th><th>Action</th></tr></thead>
      <tbody>
      \${data.users.map(u => \`
        <tr>
          <td><b>\${u.username}</b><br><span class="mono">\${u.id.slice(0,8)}…</span></td>
          <td>\${u.phone || u.email || '—'}</td>
          <td>V\${u.vip_level}</td>
          <td style="text-align:right" class="pos">\${fmt(u.balance)}</td>
          <td class="mono">\${u.created_at}</td>
          <td><button class="action credit" onclick="openCredit('\${u.id}', '\${u.username}', \${u.balance})">+ / –</button></td>
        </tr>\`).join('')}
      </tbody>
    </table>\`;
  el.innerHTML = html;
  document.getElementById('lastUpdate').textContent = new Date().toLocaleTimeString('vi-VN');
}

window.applyFilters = function() {
  state.day = document.getElementById('f_day').value || '';
  state.type = document.getElementById('f_type').value || '';
  state.status = document.getElementById('f_status').value || '';
  state.q = document.getElementById('f_q').value.trim();
  state.pageSize = parseInt(document.getElementById('f_size').value, 10) || 25;
  state.page = 1;
  refresh();
};
window.resetFilters = function() {
  state.day = todayStr(); state.type=''; state.status=''; state.q=''; state.page=1;
  refresh();
};
window.clearFilters = function() {
  state.day = ''; state.type=''; state.status=''; state.q=''; state.page=1;
  refresh();
};
window.gotoPage = function(p) {
  state.page = Math.max(1, p|0);
  refresh();
};

window.openCredit = function(userId, username, currentBalance) {
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.innerHTML = \`
    <div class="modal-body">
      <h3>Điều chỉnh số dư: \${username}</h3>
      <p style="color:#aaa;font-size:12px;margin:4px 0 10px">Số dư hiện tại: <b style="color:#FFD700">\${fmt(currentBalance)}</b></p>
      <label style="color:#999;font-size:11px">Số tiền (luôn dương)</label>
      <input id="amt" type="number" min="0" step="1000" placeholder="VD: 500000" autofocus/>
      <input id="note" type="text" placeholder="Ghi chú (vd: nạp CK Vietinbank)"/>
      <div class="row" style="gap:6px">
        <button class="reject" onclick="this.closest('.modal').remove()">Hủy</button>
        <button style="background:#ef4444;color:#fff" onclick="submitCredit('\${userId}', -1)">− Trừ tiền</button>
        <button style="background:#4ade80;color:#000" onclick="submitCredit('\${userId}', 1)">+ Cộng tiền</button>
      </div>
    </div>\`;
  document.body.appendChild(modal);
};

window.submitCredit = async function(userId, sign) {
  const raw = Number(document.getElementById('amt').value);
  const note = document.getElementById('note').value;
  if (!raw || raw <= 0) return alert('Nhập số tiền dương');
  const amount = Math.abs(raw) * (sign < 0 ? -1 : 1);
  const res = await api('/tk88/admin/api/credit', {
    method: 'POST',
    body: JSON.stringify({ userId, amount, note }),
  });
  if (res && res.error) {
    if (res.error === 'insufficient_balance')
      return alert('Không đủ số dư. Hiện tại: ' + fmt(res.currentBalance) + ', cần trừ: ' + fmt(Math.abs(res.requested)));
    return alert('Lỗi: ' + res.error);
  }
  document.querySelector('.modal')?.remove();
  refresh();
};

window.txnAction = async function(id, action, message) {
  const fallback = action === 'approve' ? 'Duyệt giao dịch này?' : 'Từ chối và hoàn tiền?';
  if (!confirm((message || fallback) + '?')) return;
  const res = await api('/tk88/admin/api/txn/' + id, { method: 'POST', body: JSON.stringify({ action }) });
  if (res && res.error) alert('Lỗi: ' + res.error);
  refresh();
};

async function refresh() {
  if (!token) return renderLogin();
  const res = await api('/tk88/admin/api/overview?' + buildQuery());
  if (res.error) return renderLogin('Phiên hết hạn');
  render(res);
}

if (token) refresh(); else renderLogin();
setInterval(() => { if (token && !document.querySelector('.modal')) refresh(); }, 5000);
</script>
</body></html>`;

// ─── Start ────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`[tk88-lite] http://localhost:${PORT}  DB: ${DB_PATH}`);
});
