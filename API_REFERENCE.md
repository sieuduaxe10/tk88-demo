# TK88 Gaming Platform - API Reference

**Base URL**: `http://localhost:3000`  
**WebSocket URL**: `ws://localhost:3000`  
**Authentication**: Bearer token in Authorization header

---

## Authentication Endpoints

### Register User
```http
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "username": "username",
  "password": "SecurePass123",
  "phone": "1234567890",
  "telegram": "@username"
}

Response: 201 Created
{
  "success": true,
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "message": "Registration successful"
}
```

### Login User
```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123"
}

Response: 200 OK
{
  "success": true,
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "username": "username",
    "kyc_status": "pending",
    "is_verified": false
  },
  "message": "Login successful"
}
```

### Verify Token
```http
POST /auth/verify
Content-Type: application/json

{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}

Response: 200 OK
{
  "success": true,
  "userId": "550e8400-e29b-41d4-a716-446655440000"
}
```

### Get User Profile (Protected)
```http
GET /auth/profile
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

Response: 200 OK
{
  "success": true,
  "profile": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "username": "username",
    "phone": "1234567890",
    "telegram": "@username",
    "kyc_status": "pending",
    "is_verified": false,
    "is_active": true,
    "is_banned": false,
    "created_at": "2026-04-16T10:30:00Z",
    "updated_at": "2026-04-16T10:30:00Z",
    "last_login": "2026-04-16T12:45:00Z"
  }
}
```

### Change Password (Protected)
```http
POST /auth/change-password
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "oldPassword": "SecurePass123",
  "newPassword": "NewSecurePass456"
}

Response: 200 OK
{
  "success": true,
  "message": "Password changed successfully"
}
```

---

## Admin Endpoints (Protected - Requires Authentication)

### List All Users
```http
GET /admin/users?limit=20&offset=0
Authorization: Bearer {token}

Response: 200 OK
{
  "success": true,
  "users": [
    {
      "id": "user-123",
      "email": "user@example.com",
      "username": "username",
      "phone": "1234567890",
      "telegram": "@username",
      "kyc_status": "pending",
      "is_verified": false,
      "is_active": true,
      "is_banned": false,
      "created_at": "2026-04-16T10:30:00Z",
      "last_login": "2026-04-16T12:45:00Z",
      "balance": 1000.50,
      "total_games": 45,
      "total_wagered": 4500.00
    },
    ...
  ],
  "pagination": {
    "limit": 20,
    "offset": 0,
    "total": 150,
    "pages": 8
  }
}
```

### Get User Details
```http
GET /admin/users/:userId
Authorization: Bearer {token}

Response: 200 OK
{
  "success": true,
  "user": { ... },
  "wallet": {
    "id": "wallet-123",
    "user_id": "user-123",
    "balance": 1000.50,
    "currency": "USD",
    "total_deposit": 5000.00,
    "total_withdrawn": 1000.00,
    "total_wagered": 4500.00,
    "total_won": 1500.50,
    "created_at": "2026-04-16T10:30:00Z",
    "updated_at": "2026-04-16T12:45:00Z"
  },
  "stats": {
    "user_id": "user-123",
    "username": "username",
    "total_games": 45,
    "completed_games": 45,
    "wins": 28,
    "losses": 17,
    "draws": 0,
    "total_wagered": 4500.00,
    "net_profit": 500.50,
    "win_rate_percent": 62.22,
    "current_balance": 1000.50
  },
  "recentGames": [ ... ],
  "transactions": [ ... ]
}
```

### Get User Game History
```http
GET /admin/games/:userId?gameType=taiXiu&limit=50
Authorization: Bearer {token}

Response: 200 OK
{
  "success": true,
  "games": [
    {
      "id": "game-123",
      "user_id": "user-123",
      "game_id": "taiXiu",
      "bet_amount": 10.00,
      "prediction": "tai",
      "server_seed": "user-123-1713312000000-0.456",
      "client_seed": null,
      "result": "win - 3,5,4 = 12",
      "payout": 19.50,
      "status": "settled",
      "ip_address": "127.0.0.1",
      "user_agent": "Mozilla/5.0...",
      "created_at": "2026-04-16T12:45:00Z",
      "settled_at": "2026-04-16T12:45:05Z",
      "verified_at": null
    },
    ...
  ],
  "count": 50
}
```

### Get Daily Revenue Report
```http
GET /admin/revenue?days=30
Authorization: Bearer {token}

Response: 200 OK
{
  "success": true,
  "revenue": [
    {
      "date": "2026-04-16",
      "unique_players": 42,
      "total_games": 156,
      "total_wagered": 15600.00,
      "total_payout": 14820.00,
      "house_profit": 780.00
    },
    {
      "date": "2026-04-15",
      "unique_players": 38,
      "total_games": 142,
      "total_wagered": 14200.00,
      "total_payout": 13510.00,
      "house_profit": 690.00
    },
    ...
  ],
  "totals": {
    "totalWagered": 468000.00,
    "totalPayout": 446400.00,
    "houseProfit": 21600.00,
    "uniquePlayers": 892,
    "totalGames": 4680
  },
  "days": 30
}
```

### Get User Transactions
```http
GET /admin/transactions/:userId?limit=50
Authorization: Bearer {token}

Response: 200 OK
{
  "success": true,
  "transactions": [
    {
      "id": "txn-123",
      "user_id": "user-123",
      "type": "bet",
      "amount": 10.00,
      "currency": "USD",
      "status": "completed",
      "reference": null,
      "game_session_id": "game-123",
      "description": "Bet on game game-123",
      "ip_address": "127.0.0.1",
      "created_at": "2026-04-16T12:45:00Z",
      "completed_at": "2026-04-16T12:45:00Z",
      "failed_at": null,
      "failed_reason": null
    },
    ...
  ],
  "count": 50
}
```

### Verify Game Outcome
```http
POST /admin/verify-game/:sessionId
Authorization: Bearer {token}
Content-Type: application/json

{
  "serverSeed": "user-123-1713312000000-0.456",
  "clientSeed": "client-seed-123"
}

Response: 200 OK
{
  "success": true,
  "sessionId": "game-123",
  "verified": true,
  "session": { ... }
}
```

### Get Platform Statistics
```http
GET /admin/stats
Authorization: Bearer {token}

Response: 200 OK
{
  "success": true,
  "stats": {
    "totalUsers": 892,
    "totalGames": 4680,
    "totalWagered": "468000.00",
    "totalPayout": "446400.00",
    "houseProfit": "21600.00",
    "rtp": "95.39"
  }
}
```

---

## WebSocket Events (Game Events)

### Join Game Room
```javascript
// Client → Server
socket.emit('game:join', {
  gameType: 'taiXiu',
  userId: 'user-123',
  token: 'eyJhbGc...'
}, (response) => {
  console.log(response);
  // { success: true, message: 'Joined game' }
});
```

### Place Bet
```javascript
// Client → Server
socket.emit('game:placeBet', {
  gameType: 'taiXiu',
  userId: 'user-123',
  amount: 10,
  prediction: 'tai'
}, (response) => {
  console.log(response);
  // {
  //   success: true,
  //   sessionId: 'game-123',
  //   result: 'win - 3,5,4 = 12',
  //   payout: 19.50,
  //   newBalance: 1009.50,
  //   serverSeed: 'user-123-1713312000000-0.456'
  // }
});

// Server → All Players in Room
socket.on('game:result', (data) => {
  // {
  //   sessionId: 'game-123',
  //   userId: 'user-123',
  //   gameType: 'taiXiu',
  //   result: 'win - 3,5,4 = 12',
  //   payout: 19.50,
  //   serverSeed: 'user-123-1713312000000-0.456',
  //   timestamp: '2026-04-16T12:45:00Z'
  // }
});
```

### Get Game History
```javascript
// Client → Server
socket.emit('game:history', {
  userId: 'user-123',
  gameType: 'taiXiu',
  limit: 20
}, (response) => {
  console.log(response);
  // {
  //   success: true,
  //   history: [ ... ],
  //   count: 20
  // }
});
```

### Verify Seed
```javascript
// Client → Server
socket.emit('game:verifySeed', {
  sessionId: 'game-123',
  serverSeed: 'user-123-1713312000000-0.456',
  clientSeed: 'client-seed-123'
}, (response) => {
  console.log(response);
  // {
  //   success: true,
  //   isValid: true,
  //   combinedSeed: 'user-123-1713312000000-0.456:client-seed-123',
  //   reproducedResult: 'win - 3,5,4 = 12',
  //   expectedPayout: 19.50,
  //   actualPayout: 19.50
  // }
});
```

---

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "error": "Invalid bet amount"
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "error": "Invalid or expired token"
}
```

### 404 Not Found
```json
{
  "success": false,
  "error": "User not found"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "error": "Registration failed"
}
```

---

## Rate Limiting

**Default**: 100 requests per 15 minutes per IP

```
RateLimit-Limit: 100
RateLimit-Remaining: 95
RateLimit-Reset: 1713312600
```

---

## CORS

**Allowed Origins**: `localhost:5173` (configurable via `CORS_ORIGIN`)  
**Allowed Methods**: `GET, POST, PUT, DELETE, OPTIONS`  
**Credentials**: Allowed

---

## Authentication Headers

All protected endpoints require:

```
Authorization: Bearer {jwt_token}
```

Token is valid for 7 days (configurable via `JWT_EXPIRY`).

---

## Games Supported

| Game ID | Name | Type | RTP |
|---------|------|------|-----|
| `taiXiu` | Tài Xỉu | Dice | 98.5% |
| `xocDia` | Xóc Đĩa | Coins | 98.0% |
| `baccarat` | Baccarat | Cards | 98.6% |
| `longHo` | Long Hổ | Cards | 98.5% |
| `roulette` | Roulette | Wheel | 97.3% |

---

## Response Time Guidelines

| Endpoint | Expected | Notes |
|----------|----------|-------|
| Authentication | < 100ms | Password hashing adds ~10ms |
| Game Execution | < 50ms | Server-side RNG instant |
| Admin Queries | < 500ms | Depends on data volume |
| WebSocket Broadcast | < 20ms | Real-time event delivery |

---

## Common Workflows

### 1. New User Registration & First Game
```bash
# 1. Register
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "username": "username",
    "password": "SecurePass123"
  }'
# Response: { token, userId }

# 2. In Frontend:
# socket.emit('game:join', {gameType: 'taiXiu', userId, token})

# 3. Place Bet:
# socket.emit('game:placeBet', {gameType, amount, prediction})

# 4. Receive Result:
# socket.on('game:result', (result) => { ... })
```

### 2. Admin View Platform Status
```bash
# Get overall stats
curl -X GET http://localhost:3000/admin/stats \
  -H "Authorization: Bearer {admin-token}"

# Get revenue for last 30 days
curl -X GET "http://localhost:3000/admin/revenue?days=30" \
  -H "Authorization: Bearer {admin-token}"

# View specific user
curl -X GET http://localhost:3000/admin/users/user-123 \
  -H "Authorization: Bearer {admin-token}"
```

---

**Last Updated**: April 16, 2026  
**Version**: 1.0 (Phase 3 Complete)
