# Architecture - TK88 Gaming Platform

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│  Client Layer (Browser / Mobile)                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ React + Babylon.js 3D Gaming Interface              │  │
│  │ - Game rendering (3D canvas)                        │  │
│  │ - UI Components (Sidebar, Chat, Stats)             │  │
│  │ - State Management (Zustand)                       │  │
│  └──────────────────────────────────────────────────────┘  │
│           ↓ REST API + WebSocket (Socket.IO)                │
├─────────────────────────────────────────────────────────────┤
│  API Gateway / Load Balancer                                │
│  - CORS enforcement                                         │
│  - Rate limiting                                            │
│  - Request logging                                          │
├─────────────────────────────────────────────────────────────┤
│  Backend Service (Node.js + Express)                        │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ API Routes (REST)                                   │  │
│  │ /api/auth         - Login, signup, JWT             │  │
│  │ /api/games        - Game list, info                │  │
│  │ /api/wallet       - Balance, transactions          │  │
│  │ /api/admin        - User management, stats         │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ WebSocket Server (Socket.IO + Colyseus)            │  │
│  │ - Real-time game state sync                        │  │
│  │ - Client prediction + server reconciliation        │  │
│  │ - Game action validation                           │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Business Logic Services                            │  │
│  │ - Authentication (JWT + Sessions)                  │  │
│  │ - Game Engine (RNG, fairness validation)           │  │
│  │ - Payment Processing (Stripe integration)          │  │
│  │ - User Management                                  │  │
│  │ - Affiliate System                                 │  │
│  │ - Fraud Detection                                  │  │
│  └──────────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│  Data Layer                                                  │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────┐  │
│  │ PostgreSQL       │  │ Redis            │  │ MongoDB  │  │
│  │ (ACID Storage)   │  │ (Cache/Sessions) │  │ (Logs)   │  │
│  │ - Users          │  │ - Session tokens │  │ - Events │  │
│  │ - Transactions   │  │ - Game state     │  │ - Audit  │  │
│  │ - KYC/AML        │  │ - Leaderboards   │  │ - Fraud  │  │
│  │ - Audit logs     │  │ - Rate limits    │  │          │  │
│  └──────────────────┘  └──────────────────┘  └──────────┘  │
├─────────────────────────────────────────────────────────────┤
│  External Services                                           │
│  - Stripe (Payment gateway)                                 │
│  - Email service (Sendgrid/Mailgun)                         │
│  - Analytics (Mixpanel/Amplitude)                           │
│  - Monitoring (New Relic/DataDog)                           │
└─────────────────────────────────────────────────────────────┘
```

---

## Component Architecture

### Frontend (React + Babylon.js)

```
src/
├── pages/
│   ├── Login.tsx              # Auth page
│   ├── GameLobby.tsx          # Game selection
│   ├── GamePlay.tsx           # 3D game view
│   ├── Dashboard.tsx          # User stats
│   └── Admin/                 # Admin panel
│       ├── UserManagement.tsx
│       ├── Analytics.tsx
│       └── Reports.tsx
│
├── components/
│   ├── GameContainer.tsx      # Babylon.js renderer
│   ├── BetPanel.tsx           # Betting UI
│   ├── ChatBox.tsx            # Real-time chat
│   └── Admin/
│       ├── UserTable.tsx
│       ├── TransactionChart.tsx
│       └── AffiliatePanel.tsx
│
├── hooks/
│   ├── useGame.ts             # Game logic hook
│   ├── useSocket.ts           # WebSocket hook
│   ├── useAuth.ts             # Auth context
│   └── useWallet.ts           # Wallet state
│
├── store/
│   └── index.ts               # Zustand state (auth, wallet, UI)
│
├── utils/
│   ├── api.ts                 # Axios setup
│   ├── babylon.ts             # Babylon.js helpers
│   └── formatters.ts          # UI formatters
│
└── App.tsx
```

### Backend (Node.js + Express)

```
src/
├── server.ts                  # Express app + Socket.IO setup
│
├── config/
│   ├── database.ts            # PostgreSQL, Redis, MongoDB
│   ├── env.ts                 # Environment validation
│   └── stripe.ts              # Payment gateway
│
├── middleware/
│   ├── auth.ts                # JWT verification
│   ├── rateLimit.ts           # Rate limiting
│   ├── errorHandler.ts        # Error catching
│   └── logging.ts             # Request logging
│
├── routes/
│   ├── auth.ts                # POST /login, /signup, /logout
│   ├── games.ts               # GET /games, POST /games/join
│   ├── wallet.ts              # GET /balance, POST /deposit
│   ├── admin.ts               # Admin endpoints
│   ├── affiliate.ts           # Affiliate tracking
│   └── payments.ts            # Stripe webhooks
│
├── socket/
│   ├── handlers.ts            # Game action handlers
│   ├── gameEngine.ts          # Server-side game logic
│   └── validators.ts          # Input validation
│
├── services/
│   ├── auth.ts                # JWT, sessions, KYC
│   ├── game.ts                # Game state, rules
│   ├── payment.ts             # Stripe, transactions
│   ├── rng.ts                 # Fair random generation
│   ├── user.ts                # User management
│   ├── affiliate.ts           # Affiliate tracking
│   └── fraud.ts               # Fraud detection
│
├── db/
│   ├── schema.sql             # PostgreSQL schema
│   ├── migrations/            # Schema versions
│   └── seeders/               # Test data
│
├── types/
│   └── index.ts               # TypeScript types
│
└── utils/
    ├── logger.ts              # Winston logging
    └── validators.ts          # Input validation
```

---

## Database Schema

### PostgreSQL (Financial Core)

**Users Table**
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR UNIQUE NOT NULL,
  phone VARCHAR,
  telegram VARCHAR,
  username VARCHAR UNIQUE NOT NULL,
  password_hash VARCHAR NOT NULL,
  kyc_status ENUM('pending', 'verified', 'rejected'),
  is_verified BOOLEAN DEFAULT false,
  is_banned BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Wallets Table**
```sql
CREATE TABLE wallets (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  balance DECIMAL(18,8) DEFAULT 0,
  currency VARCHAR DEFAULT 'USD',
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Transactions Table (Immutable Ledger)**
```sql
CREATE TABLE transactions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  type ENUM('deposit', 'withdrawal', 'bet', 'payout'),
  amount DECIMAL(18,8),
  status ENUM('pending', 'completed', 'failed'),
  stripe_id VARCHAR,
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);
-- IMPORTANT: Never UPDATE this table. Only INSERT.
```

**Bets Table**
```sql
CREATE TABLE bets (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  game_id VARCHAR,
  amount DECIMAL(18,8),
  multiplier DECIMAL(8,2),
  result ENUM('win', 'loss', 'pending'),
  payout DECIMAL(18,8),
  placed_at TIMESTAMP DEFAULT NOW(),
  settled_at TIMESTAMP
);
```

### Redis (Real-time State)

```
tk88:session:{sessionId}         → User session data (TTL: 24h)
tk88:game:{gameId}:{playerId}    → Active game state (TTL: 1h)
tk88:wallet:{userId}             → Current balance (cached)
tk88:rate_limit:{ip}             → Request count (TTL: 1m)
```

### MongoDB (Event Logs)

```javascript
{
  _id: ObjectId,
  type: 'game_action' | 'transaction' | 'login' | 'fraud_flag',
  userId: UUID,
  data: {
    gameId: string,
    action: string,
    amount: decimal,
    result: string
  },
  timestamp: ISODate,
  ipAddress: string,
  userAgent: string
}
```

---

## Data Flow: User Places a Bet

```
1. Client (Frontend)
   └─ User clicks "Place Bet" button
   └─ Emit WebSocket: {type: 'place_bet', gameId, amount}

2. Server (WebSocket Handler)
   └─ Validate user is authenticated (check Redis session)
   └─ Validate bet amount (min/max constraints)
   └─ Deduct amount from wallet (PostgreSQL: UPDATE wallets)
   └─ Record bet in DB (INSERT into bets table)
   └─ Emit game action to game engine

3. Game Engine (Server-Side)
   └─ Run certified RNG with seed
   └─ Determine outcome (win/loss)
   └─ Calculate payout
   └─ Record in PostgreSQL (settled_at timestamp)

4. Response to Client
   └─ Broadcast result to all players in game
   └─ Update client wallet (WebSocket message)
   └─ Log event to MongoDB (async)

5. Monitoring
   └─ Record transaction in audit log
   └─ Check for fraud patterns
   └─ Update player stats
```

---

## Real-Time Synchronization (Colyseus)

```
Game Room (Colyseus)
├─ State: {
│    gameId,
│    players: [
│      {id, username, bet, status},
│      ...
│    ],
│    gamePhase: 'betting' | 'rolling' | 'result',
│    result: {outcome, winners, payouts}
│  }
│
└─ Client receives patches (delta updates)
   └─ Update local state
   └─ Animate UI changes
```

---

## Security Layers

```
┌─────────────────────────────────────┐
│ Transport Security (TLS 1.3)        │
│ - All traffic encrypted             │
│ - HSTS headers enforced             │
├─────────────────────────────────────┤
│ Application Security                │
│ - JWT token validation              │
│ - CORS enforcement                  │
│ - CSRF protection                   │
│ - Rate limiting                     │
├─────────────────────────────────────┤
│ Business Logic Security             │
│ - Server-authoritative game logic   │
│ - Input validation (Zod)            │
│ - SQL injection prevention          │
│ - XSS protection                    │
├─────────────────────────────────────┤
│ Financial Security                  │
│ - PCI-compliant payment handling    │
│ - Immutable audit logs              │
│ - Fraud detection ML                │
│ - AML/KYC screening                 │
├─────────────────────────────────────┤
│ Monitoring & Response               │
│ - Real-time alerting                │
│ - Incident logging                  │
│ - Automated response (account lock) │
└─────────────────────────────────────┘
```

---

## Deployment Architecture (Production)

```
┌─────────────────────────────────────────────────────────┐
│  CDN (CloudFront)                                       │
│  - Static assets (JS, CSS, 3D models)                  │
│  - Geographic distribution                            │
└─────────────────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────────────────┐
│  Load Balancer (AWS ALB / NLB)                          │
│  - HTTPS termination                                    │
│  - Health checks                                        │
└─────────────────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────────────────┐
│  Auto-Scaling Group (ECS / Kubernetes)                 │
│  - Multiple backend instances                          │
│  - Horizontal scaling (CPU-based)                      │
│  - Rolling deployments                                 │
└─────────────────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────────────────┐
│  Managed Databases                                      │
│  - PostgreSQL (RDS): Primary + Read Replica           │
│  - Redis (ElastiCache): Cluster mode                  │
│  - MongoDB (Atlas): Replica set                       │
└─────────────────────────────────────────────────────────┘
```

---

## Performance Targets

| Metric | Target | Monitoring |
|--------|--------|------------|
| **API Response Time** | <200ms p95 | New Relic APM |
| **WebSocket Latency** | <100ms | Custom metrics |
| **Game Load Time** | <2s | Synthetic monitoring |
| **Database Query** | <50ms p95 | CloudWatch |
| **Uptime** | 99.9% | PagerDuty |
| **Error Rate** | <0.5% | Sentry |

---

## Next Steps

- See [SETUP.md](./SETUP.md) for local development
- See [API.md](./API.md) for API specifications
- See [SECURITY.md](./SECURITY.md) for security guidelines

---

**Last Updated**: April 2026
