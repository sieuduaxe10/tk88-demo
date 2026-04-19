# Phase 3 Quick Start - Server-Based Gaming

## 🚀 Start the Full Stack

### Prerequisites
```bash
# Ensure you're in project root
cd tk88-gaming

# Install all dependencies (if not done)
npm install --prefix backend
npm install --prefix frontend
```

### Terminal 1: Backend Server
```bash
npm --prefix backend run dev
```

Expected output:
```
🎮 TK88 Gaming Backend running on http://0.0.0.0:3000
📊 Environment: development
🔌 WebSocket ready on ws://0.0.0.0:3000
```

### Terminal 2: Frontend Development
```bash
npm --prefix frontend run dev
```

Expected output:
```
➜  Local:   http://localhost:5173/
➜  press h to show help
```

### Terminal 3 (Optional): Monitor Logs
```bash
tail -f logs/combined.log
```

---

## 🎮 Test Server-Based Gameplay

1. **Open Browser**: http://localhost:5173
2. **Check Connection**: Look for "🟢 Connected to server" badge
3. **Select Game**: Choose Tài Xỉu from the game list
4. **Place Bet**:
   - Enter amount: $10
   - Choose prediction: Tài (High) or Xỉu (Low)
   - Click "Place Bet"
5. **View Result**:
   - See outcome (dice roll result)
   - Check payout calculation
   - Notice server seed revealed

---

## 📊 What Happens Behind the Scenes

### Client sends:
```json
{
  "gameType": "taiXiu",
  "userId": "user-123",
  "amount": 10,
  "prediction": "tai"
}
```

### Server processes:
1. Generates seed: `"user-123-1713312000000-0.456"`
2. Executes: `rollDice(seed)` → `[3, 5, 4]`
3. Calculates: Sum = 12, Outcome = "tai" → WIN
4. Calculates: Payout = 10 × 1.95 = 19.50

### Server broadcasts:
```json
{
  "sessionId": "...",
  "result": "win - 3,5,4 = 12",
  "payout": 19.50,
  "serverSeed": "user-123-1713312000000-0.456",
  "timestamp": "2026-04-16T..."
}
```

### Client updates:
- ✅ Balance: 990 → 999.50
- ✅ Result: "WIN"
- ✅ Seed: Visible for verification

---

## 🔍 Verify Outcomes

Each game result shows the **server seed**. You can verify the outcome:

```bash
# In browser console:
import { rollDice, getTaiXiuOutcome } from 'shared/rng'

const serverSeed = "user-123-1713312000000-0.456"
const dice = rollDice(serverSeed)
const outcome = getTaiXiuOutcome(serverSeed)

console.log(dice) // [3, 5, 4]
console.log(outcome) // "tai"
// ✅ Matches server result!
```

---

## 📈 Monitor Multiple Games

**Websocket Events You'll See:**

```
[INFO] Game socket connected: socket-abc123
[INFO] User user-123 joined game: taiXiu
[INFO] Game settled: user-123-1713312000000
  result: win - 3,5,4 = 12
  payout: 19.50
[INFO] GAME_EVENT: bet_placed
  { userId: user-123, amount: 10, ... }
```

---

## 🐛 Troubleshooting

### Backend won't start
```bash
# Check if port 3000 is in use
lsof -i :3000  # macOS/Linux
netstat -ano | findstr :3000  # Windows

# Kill process and retry
kill -9 <PID>
npm --prefix backend run dev
```

### Frontend can't connect
```bash
# Check VITE_WS_URL in frontend/.env.local
# Should be: http://localhost:3000

# Or use browser console:
new WebSocket('ws://localhost:3000')
// Should show: WebSocket connection successful
```

### Games not broadcasting to other players
```bash
# Open 2 browser windows:
# Window 1: http://localhost:5173
# Window 2: http://localhost:5173

# Place bet in Window 1
# Window 2 should receive real-time result

# Check logs for broadcast events:
tail -f logs/combined.log | grep "game:result"
```

---

## 📋 What You Can Test Now

✅ **Server Authority**
- Bet validation
- RNG execution on server
- Outcome calculation

✅ **Real-time Communication**
- WebSocket connection
- Result broadcasting
- Balance updates

✅ **Game Verification**
- Seed revelation
- Outcome reproducibility
- Fairness transparency

✅ **All 5 Games**
- Tài xỉu (dice)
- Xóc đĩa (cups)
- Baccarat (cards)
- Long hổ (cards)
- Roulette (wheel)

---

## 🔄 Multi-player Test

**Test with 2 Players:**

```bash
# Terminal A: Player 1
# Player 1: Place bet on Tài xỉu, bet $10 on "tai"
# Check result

# Terminal B: Open another browser as Player 2
# Player 2: Place bet on Tài xỉu, bet $20 on "xiu"
# Both should see each other's results broadcast

# All players in same game room see all results in real-time
```

---

## 📊 Example Session

```
[Client A] Joins game: taiXiu
[Client B] Joins game: taiXiu
[Client A] Places bet: $10 on "tai"
[Server] Executes: rollDice(seed) → [4, 5, 6] = 15 → "tai" WINS
[Server] Broadcasts: {payout: 19.50, seed: "..."}
[Client A] Receives: Balance updated +19.50
[Client B] Receives: Sees Client A won $19.50
[Client B] Places bet: $50 on "xiu"
[Server] Executes: rollDice(seed) → [2, 3, 4] = 9 → "xiu" WINS
[Server] Broadcasts: {payout: 97.50, seed: "..."}
[Client B] Receives: Balance updated +97.50
[Client A] Receives: Sees Client B won $97.50
```

---

## 🎯 Next Steps

After confirming everything works:

1. **Database Integration** (Phase 3 Part 2)
   - PostgreSQL for user/game data
   - Persist balance
   - Store game history

2. **Admin Dashboard** (Phase 3 Part 3)
   - Verify game outcomes
   - View transaction history
   - Revenue reports

3. **Multi-player Features** (Phase 3 Part 4)
   - Leaderboards
   - Chat system
   - Live statistics

---

**All games now run with SERVER AUTHORITY! 🎉**

**Questions?** Check `PHASE3_PROGRESS.md` for architecture details.
