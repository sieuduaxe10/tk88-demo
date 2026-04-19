# TK88 Gaming Platform - Quick Reference Card

**Version**: Phase 3 Complete (100%)  
**Last Updated**: April 16, 2026

---

## 🚀 Quick Start

```bash
# Terminal 1: Start Backend
npm --prefix backend run dev

# Terminal 2: Start Frontend  
npm --prefix frontend run dev

# Terminal 3: Open in browser
# http://localhost:5173
```

---

## 🔐 Authentication Flow

```bash
# 1. Register
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "username": "username",
    "password": "SecurePass123"
  }'
# Returns: { token, userId }

# 2. Login
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123"
  }'
# Returns: { token, userId, user }

# 3. Use token for protected endpoints
curl -X GET http://localhost:3000/auth/profile \
  -H "Authorization: Bearer {token}"
```

---

## 💰 Payment Flow

```bash
# Get Limits
curl -X GET http://localhost:3000/payment/limits

# Deposit
curl -X POST http://localhost:3000/payment/deposit \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"amount": 50, "paymentMethod": "stripe_card"}'
# Returns: { orderId }

# Withdraw
curl -X POST http://localhost:3000/payment/withdrawal \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"amount": 100, "paymentMethod": "bank_transfer"}'
# Returns: { orderId }

# Check History
curl -X GET "http://localhost:3000/payment/history?limit=20" \
  -H "Authorization: Bearer {token}"
```

---

## 🎯 Affiliate Flow

```bash
# Get Affiliate Code
curl -X GET http://localhost:3000/affiliate/code \
  -H "Authorization: Bearer {affiliate-token}"
# Returns: { code, commissionRate, shareUrl }

# Register Referral
curl -X POST http://localhost:3000/affiliate/register \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "new-user-id",
    "affiliateCode": "REF1234567ABCDE"
  }'

# Check Stats
curl -X GET http://localhost:3000/affiliate/stats \
  -H "Authorization: Bearer {token}"

# Get Referrals
curl -X GET "http://localhost:3000/affiliate/referrals?limit=50" \
  -H "Authorization: Bearer {token}"

# Request Payout
curl -X POST http://localhost:3000/affiliate/payout-request \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"amount": 500, "paymentMethod": "bank_transfer"}'
```

---

## 🎮 Game WebSocket Events

```javascript
// Connect
const socket = io('http://localhost:3000');

// Join Game
socket.emit('game:join', {
  gameType: 'taiXiu',
  userId: 'user-id',
  token: 'jwt-token'
}, (response) => {
  console.log(response);
});

// Place Bet
socket.emit('game:placeBet', {
  gameType: 'taiXiu',
  userId: 'user-id',
  amount: 10,
  prediction: 'tai'
}, (response) => {
  // { success, sessionId, payout, newBalance, serverSeed }
});

// Listen for Results
socket.on('game:result', (data) => {
  console.log('Result:', data);
  // { sessionId, userId, result, payout, serverSeed, timestamp }
});

// Get History
socket.emit('game:history', {
  userId: 'user-id',
  gameType: 'taiXiu',
  limit: 20
}, (response) => {
  // { success, history, count }
});

// Verify Seed
socket.emit('game:verifySeed', {
  sessionId: 'game-123',
  serverSeed: 'seed...',
  clientSeed: 'client-seed...'
}, (response) => {
  // { success, isValid, reproducedResult, expectedPayout, actualPayout }
});
```

---

## 👨‍💼 Admin Dashboard

```bash
# List Users
curl -X "GET" "http://localhost:3000/admin/users?limit=20&offset=0" \
  -H "Authorization: Bearer {admin-token}"

# User Details
curl -X GET http://localhost:3000/admin/users/user-123 \
  -H "Authorization: Bearer {admin-token}"

# User Game History
curl -X "GET" "http://localhost:3000/admin/games/user-123?limit=50" \
  -H "Authorization: Bearer {admin-token}"

# Platform Revenue
curl -X "GET" "http://localhost:3000/admin/revenue?days=30" \
  -H "Authorization: Bearer {admin-token}"

# Verify Game
curl -X POST http://localhost:3000/admin/verify-game/session-123 \
  -H "Authorization: Bearer {admin-token}" \
  -H "Content-Type: application/json" \
  -d '{
    "serverSeed": "...",
    "clientSeed": "..."
  }'

# Platform Stats
curl -X GET http://localhost:3000/admin/stats \
  -H "Authorization: Bearer {admin-token}"
```

---

## 🎲 Game Types

```
taiXiu    - Roll 3 dice (High/Low bet)
xocDia    - Flip 3 coins (Even/Odd bet)
baccarat  - Card game (Player/Banker/Tie)
longHo    - Card game (Dragon/Tiger/Tie)
roulette  - Spin wheel (Number/Color/Even/Odd)
```

---

## 💾 Database Quick Reference

```bash
# Connect
psql -U tk88_user -d tk88_gaming -h localhost

# Check Tables
\dt

# Check Views
\dv

# Check Wallet
SELECT * FROM wallets WHERE user_id = 'user-id';

# Check Game History
SELECT * FROM game_sessions WHERE user_id = 'user-id' ORDER BY created_at DESC LIMIT 10;

# Check Transactions
SELECT * FROM transactions WHERE user_id = 'user-id' ORDER BY created_at DESC LIMIT 20;

# Check User Stats
SELECT * FROM user_game_stats WHERE user_id = 'user-id';

# Check Daily Revenue
SELECT * FROM daily_revenue ORDER BY date DESC LIMIT 30;

# Check Affiliate
SELECT * FROM affiliate_codes WHERE user_id = 'user-id';
SELECT * FROM affiliate_referrals WHERE affiliate_id = 'affiliate-id';
SELECT * FROM affiliate_stats WHERE affiliate_id = 'affiliate-id';
```

---

## 🔧 Environment Variables

```bash
# Backend .env
PORT=3000
HOST=0.0.0.0
NODE_ENV=development
JWT_SECRET=your-secret-key
JWT_EXPIRY=7d
CORS_ORIGIN=http://localhost:5173
DB_HOST=localhost
DB_PORT=5432
DB_NAME=tk88_gaming
DB_USER=tk88_user
DB_PASSWORD=password
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
LOG_LEVEL=info

# Frontend .env.local
VITE_API_URL=http://localhost:3000
VITE_WS_URL=ws://localhost:3000
```

---

## 🎯 API Endpoints Summary

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| POST | /auth/register | ❌ | Create account |
| POST | /auth/login | ❌ | Login |
| GET | /auth/profile | ✅ | Get profile |
| POST | /auth/change-password | ✅ | Change password |
| GET | /payment/limits | ❌ | Get limits |
| POST | /payment/deposit | ✅ | Request deposit |
| POST | /payment/withdrawal | ✅ | Request withdrawal |
| GET | /payment/history | ✅ | Payment history |
| GET | /affiliate/code | ✅ | Get affiliate code |
| GET | /affiliate/stats | ✅ | Affiliate stats |
| GET | /affiliate/referrals | ✅ | Get referrals |
| POST | /affiliate/payout-request | ✅ | Request payout |
| GET | /admin/users | ✅ | List users |
| GET | /admin/stats | ✅ | Platform stats |

---

## 🐛 Troubleshooting

### Backend won't start
```bash
# Check port 3000
lsof -i :3000

# Kill process if needed
kill -9 <PID>

# Check database
psql -U tk88_user -d tk88_gaming -h localhost -c "SELECT 1"
```

### Database connection failed
```bash
# Check PostgreSQL running
pg_isready

# Check credentials
psql -U tk88_user -d tk88_gaming -h localhost

# Check environment variables in backend/.env
```

### CORS errors
```bash
# Check CORS_ORIGIN in backend/.env
# Should match frontend URL (http://localhost:5173)

# Clear browser cache
# Ctrl+Shift+Delete (Chrome/Firefox)
```

### WebSocket connection fails
```bash
# Check WebSocket URL in frontend/.env.local
# VITE_WS_URL=ws://localhost:3000

# Test connection
# Open DevTools → Network → WS
# Look for connection to localhost:3000
```

---

## 📊 Common Queries

### Get User with All Data
```bash
curl -X GET http://localhost:3000/admin/users/user-123 \
  -H "Authorization: Bearer {token}" | jq
```

### Get Last 10 Games for User
```bash
curl -X "GET" "http://localhost:3000/admin/games/user-123?limit=10" \
  -H "Authorization: Bearer {token}" | jq
```

### Get Last 30 Days Revenue
```bash
curl -X "GET" "http://localhost:3000/admin/revenue?days=30" \
  -H "Authorization: Bearer {token}" | jq '.totals'
```

### Get Affiliate Commission Earned
```bash
curl -X GET http://localhost:3000/affiliate/stats \
  -H "Authorization: Bearer {token}" | jq '.stats.total_commission_earned'
```

---

## 🚀 Deployment Checklist

- [ ] Environment variables configured
- [ ] Database created & schema loaded
- [ ] Backend starts without errors
- [ ] Frontend loads at localhost:5173
- [ ] Can register & login
- [ ] Can place bets
- [ ] Can deposit/withdraw
- [ ] Admin dashboard accessible
- [ ] Affiliate system working
- [ ] All tests passing

---

## 📚 Documentation Links

| Document | Purpose |
|----------|---------|
| PHASE3_COMPLETE.md | Full completion report |
| PHASE3_SUMMARY.md | Architecture overview |
| API_REFERENCE.md | Complete API docs |
| DEPLOYMENT_CHECKLIST.md | Deployment guide |
| QUICK_REFERENCE.md | This file |

---

**Ready to launch!** 🚀

For detailed information, refer to respective documentation files.
