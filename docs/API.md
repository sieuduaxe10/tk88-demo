# API Documentation - TK88 Gaming Platform

## Base URL

```
Production:  https://api.tk88.com/api/v1
Development: http://localhost:3000/api/v1
WebSocket:   ws://localhost:3000
```

---

## Authentication

### Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}

Response 200:
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "username": "player1"
  }
}
```

### Signup
```http
POST /auth/signup
Content-Type: application/json

{
  "email": "newuser@example.com",
  "username": "player1",
  "password": "securepassword123",
  "phone": "+84123456789",
  "telegram": "@player1"
}

Response 201:
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "newuser@example.com",
  "username": "player1"
}
```

### Enable MFA
```http
POST /auth/mfa/enable
Authorization: Bearer {token}

{
  "method": "totp"  // "totp", "sms", or "email"
}

Response 200:
{
  "secret": "JBSWY3DPEBLW64TMMQ======",
  "qrCode": "data:image/png;base64,..."
}
```

---

## Games

### Get Games List
```http
GET /games
Authorization: Bearer {token}

Response 200:
{
  "games": [
    {
      "id": "tai-xiu",
      "name": "Tài Xỉu",
      "type": "3d",
      "description": "Dice rolling game",
      "minBet": 0.01,
      "maxBet": 10000,
      "rtp": 98.5
    },
    ...
  ]
}
```

### Join Game
```http
POST /games/{gameId}/join
Authorization: Bearer {token}
Content-Type: application/json

{
  "amount": 10.50
}

Response 200:
{
  "sessionId": "session-550e8400",
  "gameId": "tai-xiu",
  "players": [
    { "id": "player-1", "username": "player1", "balance": 1000 },
    ...
  ]
}
```

---

## Wallet

### Get Balance
```http
GET /wallet/balance
Authorization: Bearer {token}

Response 200:
{
  "balance": 1050.50,
  "currency": "USD",
  "lastUpdated": "2024-04-16T10:30:00Z"
}
```

### Get Transactions
```http
GET /wallet/transactions?page=1&limit=20
Authorization: Bearer {token}

Response 200:
{
  "transactions": [
    {
      "id": "tx-123",
      "type": "deposit",
      "amount": 100,
      "status": "completed",
      "createdAt": "2024-04-16T10:00:00Z"
    },
    ...
  ],
  "page": 1,
  "total": 45
}
```

### Deposit
```http
POST /wallet/deposit
Authorization: Bearer {token}
Content-Type: application/json

{
  "amount": 100,
  "method": "card",  // "card", "crypto", "bank_transfer"
  "currency": "USD"
}

Response 201:
{
  "transactionId": "tx-456",
  "stripeUrl": "https://checkout.stripe.com/...",
  "status": "pending"
}
```

### Withdraw
```http
POST /wallet/withdraw
Authorization: Bearer {token}
Content-Type: application/json

{
  "amount": 50,
  "method": "bank_transfer",  // "bank_transfer", "crypto", "e_wallet"
  "destination": "0x742d35Cc6634C0532925a3b844Bc9e7595f-"
}

Response 201:
{
  "transactionId": "tx-789",
  "status": "pending",
  "estimatedCompletion": "2024-04-17T10:00:00Z"
}
```

---

## Admin API

### Get Users
```http
GET /admin/users?page=1&limit=50&search=john&sort=createdAt
Authorization: Bearer {adminToken}

Response 200:
{
  "users": [
    {
      "id": "user-1",
      "email": "john@example.com",
      "username": "john_player",
      "phone": "+84123456789",
      "telegram": "@john",
      "createdAt": "2024-04-15T08:00:00Z",
      "lastLogin": "2024-04-16T15:30:00Z",
      "kycStatus": "verified",
      "isBanned": false,
      "totalDeposit": 5000,
      "totalBets": 15000,
      "totalWinnings": 12000,
      "currentBalance": 2000
    },
    ...
  ],
  "total": 1250,
  "page": 1,
  "pageSize": 50
}
```

### Get User Details
```http
GET /admin/users/{userId}
Authorization: Bearer {adminToken}

Response 200:
{
  "id": "user-1",
  "email": "john@example.com",
  "username": "john_player",
  "phone": "+84123456789",
  "telegram": "@john",
  "kyc": {
    "status": "verified",
    "documentId": "ID123456",
    "verifiedAt": "2024-04-10T12:00:00Z"
  },
  "wallet": {
    "balance": 2000,
    "currency": "USD"
  },
  "stats": {
    "totalDeposit": 5000,
    "totalBets": 15000,
    "totalWinnings": 12000,
    "winRate": 42.5,
    "averageBet": 100,
    "gamesPlayed": 150
  },
  "activity": [
    {
      "type": "login",
      "timestamp": "2024-04-16T15:30:00Z",
      "ipAddress": "203.0.113.45",
      "userAgent": "Mozilla/5.0..."
    },
    ...
  ]
}
```

### Update User (Suspend/Ban)
```http
POST /admin/users/{userId}/suspend
Authorization: Bearer {adminToken}
Content-Type: application/json

{
  "reason": "Suspicious activity detected",
  "duration": 86400  // seconds, null for permanent
}

Response 200:
{
  "userId": "user-1",
  "status": "suspended",
  "suspendedUntil": "2024-04-17T15:30:00Z"
}
```

### Get Affiliate Data
```http
GET /admin/affiliate/stats
Authorization: Bearer {adminToken}

Response 200:
{
  "totalAffiliates": 125,
  "totalCommission": 45000,
  "pendingPayout": 8500,
  "topAffiliates": [
    {
      "affiliateId": "aff-1",
      "username": "influencer1",
      "referrals": 145,
      "totalCommission": 12000,
      "lastPayout": "2024-04-15"
    },
    ...
  ]
}
```

### Get User Financials
```http
GET /admin/users/{userId}/financials
Authorization: Bearer {adminToken}

Response 200:
{
  "deposits": [
    {
      "id": "tx-1",
      "amount": 1000,
      "method": "card",
      "status": "completed",
      "createdAt": "2024-04-10T10:00:00Z"
    },
    ...
  ],
  "bets": [
    {
      "id": "bet-1",
      "gameId": "tai-xiu",
      "amount": 10,
      "multiplier": 2,
      "result": "win",
      "payout": 20,
      "placedAt": "2024-04-16T14:30:00Z"
    },
    ...
  ],
  "withdrawals": [...],
  "netProfit": 2000  // Deposits - Payouts + Bet Winnings
}
```

---

## WebSocket Events

### Connection

```javascript
// Client
const socket = io('ws://localhost:3000', {
  auth: {
    token: 'eyJhbGciOiJIUzI1NiIs...'
  }
});

socket.on('connect', () => {
  console.log('Connected to server');
});
```

### Join Game

```javascript
// Client emit
socket.emit('game:join', {
  gameId: 'tai-xiu',
  amount: 10
});

// Server response
socket.on('game:joined', (data) => {
  console.log('Joined game:', data.sessionId);
});
```

### Place Bet

```javascript
// Client emit
socket.emit('game:placeBet', {
  gameId: 'tai-xiu',
  sessionId: 'session-123',
  amount: 10,
  prediction: 'over'  // game-specific
});

// Server response
socket.on('game:betPlaced', (data) => {
  console.log('Bet placed:', data.betId);
});

// Game result
socket.on('game:result', (data) => {
  console.log('Result:', {
    outcome: 'win',
    payout: 20,
    newBalance: 1010
  });
});
```

### Game State Update

```javascript
// Server broadcast to all players
socket.on('game:stateUpdate', (data) => {
  console.log('Game state:', {
    phase: 'rolling',
    players: [...],
    result: null  // null until game ends
  });
});
```

### Chat Message

```javascript
// Client emit
socket.emit('chat:send', {
  gameId: 'tai-xiu',
  sessionId: 'session-123',
  message: 'Good luck everyone!'
});

// Server broadcast
socket.on('chat:message', (data) => {
  console.log(data.username, ':', data.message);
});
```

---

## Error Responses

### 400 Bad Request
```json
{
  "error": "Invalid request",
  "details": {
    "amount": "Must be between 0.01 and 10000"
  }
}
```

### 401 Unauthorized
```json
{
  "error": "Unauthorized",
  "message": "Invalid or expired token"
}
```

### 403 Forbidden
```json
{
  "error": "Forbidden",
  "message": "You don't have permission for this action"
}
```

### 429 Too Many Requests
```json
{
  "error": "Rate limited",
  "retryAfter": 60
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error",
  "timestamp": "2024-04-16T10:30:00Z"
}
```

---

## Testing

### Using cURL

```bash
# Login
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'

# Get games
curl -X GET http://localhost:3000/api/v1/games \
  -H "Authorization: Bearer $TOKEN"
```

### Using Thunder Client / Postman

1. Import: [API Collection](./tk88-gaming.postman_collection.json)
2. Set environment variables:
   - `base_url`: http://localhost:3000/api/v1
   - `token`: (obtained from login)
3. Run tests

---

## Rate Limits

| Endpoint | Limit | Window |
|----------|-------|--------|
| `/auth/login` | 5 requests | 15 min |
| `/auth/signup` | 3 requests | 15 min |
| `*` (general) | 100 requests | 15 min |
| `game:placeBet` (WebSocket) | 10 actions | 1 sec |

---

**Last Updated**: April 2026
