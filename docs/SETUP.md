# Setup Guide - TK88 Gaming Platform

## Prerequisites

- **Node.js**: 20+ LTS ([download](https://nodejs.org/))
- **Docker & Docker Compose**: ([install](https://docs.docker.com/get-docker/))
- **Git**: ([install](https://git-scm.com/))
- **VS Code** (optional): ([download](https://code.visualstudio.com/))

### System Requirements
- **CPU**: Dual-core or higher
- **RAM**: 4GB minimum, 8GB recommended
- **Disk**: 5GB free space
- **OS**: Windows (WSL2), macOS, or Linux

---

## 1. Clone & Initial Setup

```bash
# Clone repository
git clone <repository-url>
cd tk88-gaming

# Create environment files
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
```

---

## 2. Using Docker (Recommended)

### Start all services
```bash
docker-compose up -d
```

This starts:
- **PostgreSQL** (port 5432)
- **Redis** (port 6379)
- **MongoDB** (port 27017)
- **Backend API** (port 3000)

### View logs
```bash
docker-compose logs -f backend
docker-compose logs -f postgres
```

### Stop services
```bash
docker-compose down
```

### Clean everything (reset databases)
```bash
docker-compose down -v
docker-compose up -d
```

---

## 3. Local Development (Without Docker)

### Install dependencies

**Backend:**
```bash
cd backend
npm install
```

**Frontend:**
```bash
cd ../frontend
npm install
```

### Setup databases

**PostgreSQL**
```bash
# macOS (using Homebrew)
brew install postgresql
brew services start postgresql

# Linux
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql

# Windows
# Download from https://www.postgresql.org/download/windows/
```

**Redis**
```bash
# macOS
brew install redis
brew services start redis

# Linux
sudo apt install redis-server
sudo systemctl start redis-server

# Windows
# Download from https://github.com/microsoftarchive/redis/releases
```

**MongoDB**
```bash
# macOS
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community

# Linux
# Follow https://docs.mongodb.com/manual/administration/install-on-linux/

# Windows
# Download from https://www.mongodb.com/try/download/community
```

### Run services locally

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
# Output: 🎮 TK88 Gaming Backend running on http://0.0.0.0:3000
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
# Output: ➜  Local:   http://localhost:5173/
```

---

## 4. Environment Configuration

### Backend (.env)

```env
# Server
NODE_ENV=development
PORT=3000
FRONTEND_URL=http://localhost:5173

# Database
DB_HOST=localhost      # or 'postgres' if using Docker
DB_PORT=5432
DB_NAME=tk88_gaming
DB_USER=tk88_user
DB_PASSWORD=change_me

# Redis
REDIS_HOST=localhost   # or 'redis' if using Docker
REDIS_PORT=6379

# MongoDB
MONGODB_URI=mongodb://localhost:27017/tk88_gaming
# Or with auth: mongodb://tk88_user:password@mongo:27017/tk88_gaming?authSource=admin

# JWT
JWT_SECRET=your_jwt_secret_at_least_32_chars_long

# Stripe (optional for now)
STRIPE_SECRET_KEY=sk_test_your_key
```

### Frontend (.env.local)

```env
VITE_API_URL=http://localhost:3000
VITE_WS_URL=ws://localhost:3000
```

---

## 5. Database Initialization

### Create PostgreSQL database

```bash
# Using psql
psql -U postgres
CREATE DATABASE tk88_gaming;
CREATE USER tk88_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE tk88_gaming TO tk88_user;
\q
```

### Run migrations (when available)
```bash
npm --prefix backend run migrate
```

---

## 6. Access Points

| Service | URL | Port |
|---------|-----|------|
| **Frontend** | http://localhost:5173 | 5173 |
| **Backend API** | http://localhost:3000 | 3000 |
| **Backend Health** | http://localhost:3000/health | 3000 |
| **PostgreSQL** | localhost | 5432 |
| **Redis** | localhost | 6379 |
| **MongoDB** | localhost | 27017 |

---

## 7. Common Commands

### Backend
```bash
npm --prefix backend run dev      # Development mode
npm --prefix backend run build    # Compile TypeScript
npm --prefix backend run test     # Run tests
npm --prefix backend run lint     # Check code style
npm --prefix backend run format   # Auto-format code
```

### Frontend
```bash
npm --prefix frontend run dev     # Development server
npm --prefix frontend run build   # Build for production
npm --prefix frontend run preview # Preview production build
npm --prefix frontend run test    # Run tests
npm --prefix frontend run lint    # Check code style
npm --prefix frontend run type-check  # Type checking
```

---

## 8. Troubleshooting

### Port already in use
```bash
# Find process using port
lsof -i :3000         # macOS/Linux
netstat -ano | findstr :3000  # Windows

# Kill process
kill -9 <PID>         # macOS/Linux
taskkill /PID <PID> /F  # Windows
```

### Docker issues
```bash
# Rebuild images
docker-compose build --no-cache

# Remove all containers
docker-compose down -v

# View logs
docker-compose logs --tail=100 backend
```

### Database connection errors
```bash
# Check PostgreSQL is running
psql -U postgres -c "SELECT 1"

# Check Redis is running
redis-cli ping

# Check MongoDB is running
mongosh
```

### npm module errors
```bash
# Clean cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

---

## 9. IDE Setup (VS Code)

### Recommended Extensions
- **ES7+ React/Redux/React-Native snippets**
- **ESLint**
- **Prettier - Code formatter**
- **Thunder Client** (API testing)
- **REST Client**
- **MongoDB for VS Code**

### Settings (.vscode/settings.json)
```json
{
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "[typescript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  }
}
```

---

## 10. Next Steps

1. ✅ Follow steps 1-9
2. ✅ Verify frontend loads at http://localhost:5173
3. ✅ Verify backend API responds at http://localhost:3000/health
4. ✅ Check logs for errors
5. ➡️ Read [ARCHITECTURE.md](./ARCHITECTURE.md) to understand system design
6. ➡️ Read [API.md](./API.md) for API documentation
7. ➡️ Check [SECURITY.md](./SECURITY.md) for security guidelines

---

**Last Updated**: April 2026 | **Maintained by**: TK88 Team
