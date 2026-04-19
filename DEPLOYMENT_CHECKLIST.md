# TK88 Gaming Platform - Deployment Checklist

**Version**: Phase 3 Part 3 (85% Complete)  
**Last Updated**: April 16, 2026

---

## 🎯 Pre-Deployment Requirements

### System Requirements
- [ ] Node.js 18+ installed
- [ ] PostgreSQL 14+ running
- [ ] Redis installed (for future caching)
- [ ] Docker & Docker Compose installed (optional but recommended)
- [ ] 2GB+ available disk space
- [ ] 4GB+ RAM recommended

### Software Requirements
```bash
# Check Node version
node --version  # Should be v18+

# Check npm version
npm --version   # Should be 8+

# Check PostgreSQL
psql --version  # Should be 14+
```

---

## 📦 Dependencies Installation

### 1. Backend Dependencies
```bash
cd backend
npm install

# Required packages:
- express
- socket.io
- pg (PostgreSQL client)
- bcrypt
- jsonwebtoken
- winston (logging)
- cors
- helmet
- express-rate-limit
- dotenv
```

### 2. Frontend Dependencies
```bash
cd frontend
npm install

# Required packages:
- react
- babylon.js
- socket.io-client
- vite
- tailwindcss
- typescript
```

### 3. Shared Dependencies
```bash
cd shared
npm install

# Required packages (if exists):
- typescript
```

---

## 🗄️ Database Setup

### 1. Create PostgreSQL Database
```bash
# Login to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE tk88_gaming;

# Create user
CREATE USER tk88_user WITH PASSWORD 'password';

# Grant privileges
GRANT ALL PRIVILEGES ON DATABASE tk88_gaming TO tk88_user;

# Exit
\q
```

### 2. Run Database Schema
```bash
# Navigate to backend
cd backend

# Run schema
psql -U tk88_user -d tk88_gaming -h localhost -f src/db/schema.sql

# Verify tables created
psql -U tk88_user -d tk88_gaming -h localhost -c "\dt"
```

### 3. Verify Database Connection
```bash
# Test connection
npm --prefix backend run test:db

# Or manually:
psql -U tk88_user -d tk88_gaming -h localhost -c "SELECT NOW();"
```

---

## 🔐 Environment Configuration

### 1. Backend .env
```bash
# Create file: backend/.env

# Server
PORT=3000
HOST=0.0.0.0
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=tk88_gaming
DB_USER=tk88_user
DB_PASSWORD=password

# Authentication
JWT_SECRET=your-super-secret-key-change-in-production
JWT_EXPIRY=7d

# CORS
CORS_ORIGIN=http://localhost:5173

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info
```

### 2. Frontend .env.local
```bash
# Create file: frontend/.env.local

VITE_API_URL=http://localhost:3000
VITE_WS_URL=ws://localhost:3000
```

### 3. Generate Secure JWT Secret
```bash
# Generate random secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Copy output to JWT_SECRET in backend/.env
```

---

## 🚀 Running the Application

### Option 1: Local Development (No Docker)

#### Terminal 1: Start Backend
```bash
npm --prefix backend run dev

# Expected output:
# ✅ Database connected successfully
# 🎮 TK88 Gaming Backend running on http://0.0.0.0:3000
# 📊 Environment: development
# 🔌 WebSocket ready on ws://0.0.0.0:3000
```

#### Terminal 2: Start Frontend
```bash
npm --prefix frontend run dev

# Expected output:
# ➜  Local:   http://localhost:5173/
# ➜  press h to show help
```

#### Terminal 3: Monitor Logs (Optional)
```bash
tail -f logs/combined.log
```

### Option 2: Docker Compose

```bash
# Start all services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f backend

# Stop all services
docker-compose down
```

---

## ✅ Verification Checklist

### Backend Health
- [ ] Backend server starts without errors
- [ ] Database connection successful
- [ ] WebSocket server listening on 3000
- [ ] Health endpoint responds: `GET http://localhost:3000/health`
- [ ] Games endpoint returns list: `GET http://localhost:3000/api/v1/games`

### Database
- [ ] All 5 tables created
- [ ] All indexes created
- [ ] All views created
- [ ] Default games inserted
- [ ] Can connect with `psql` command

### Authentication
- [ ] User registration endpoint works
- [ ] User login endpoint works
- [ ] JWT token verification works
- [ ] Protected endpoints require token

### Games
- [ ] All 5 games load in UI
- [ ] Game selection works
- [ ] Can place bets
- [ ] Results received from server
- [ ] Balance updates correctly
- [ ] Server seed visible

### Admin
- [ ] User list endpoint works
- [ ] User details endpoint works
- [ ] Revenue report endpoint works
- [ ] Platform stats endpoint works

---

## 🧪 Test Suite

### Backend Tests
```bash
# Run unit tests
npm --prefix backend run test

# Run integration tests
npm --prefix backend run test:integration

# Check test coverage
npm --prefix backend run test:coverage
```

### Frontend Tests
```bash
# Run unit tests
npm --prefix frontend run test

# Run e2e tests
npm --prefix frontend run test:e2e

# Check test coverage
npm --prefix frontend run test:coverage
```

---

## 🔍 Common Issues & Solutions

### Issue: Database Connection Failed
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```
**Solution**:
- [ ] Verify PostgreSQL is running: `pg_isready`
- [ ] Check DB_HOST in .env is correct
- [ ] Verify DB_USER and DB_PASSWORD are correct
- [ ] Restart PostgreSQL service

### Issue: Port Already in Use
```
Error: listen EADDRINUSE :::3000
```
**Solution**:
```bash
# Find process using port 3000
lsof -i :3000

# Kill process
kill -9 <PID>

# Restart backend
```

### Issue: CORS Errors
```
Access to XMLHttpRequest blocked by CORS policy
```
**Solution**:
- [ ] Check CORS_ORIGIN in backend/.env matches frontend URL
- [ ] Verify frontend is on correct port (5173)
- [ ] Clear browser cache and cookies

### Issue: WebSocket Connection Failed
```
WebSocket connection failed
```
**Solution**:
- [ ] Verify WebSocket server is running
- [ ] Check firewall allows port 3000
- [ ] Verify VITE_WS_URL in frontend .env
- [ ] Check backend logs for errors

### Issue: Authentication Token Expired
```
Invalid or expired token
```
**Solution**:
- [ ] Clear localStorage and login again
- [ ] Check JWT_EXPIRY in backend .env (default 7d)
- [ ] Verify JWT_SECRET is same on all backend instances

---

## 📊 Performance Checklist

### Database Performance
- [ ] All indexes created on foreign keys
- [ ] Query execution time < 100ms for user queries
- [ ] Connection pooling enabled (max: 20)
- [ ] No N+1 query problems

### Server Performance
- [ ] Backend response time < 100ms
- [ ] WebSocket message latency < 50ms
- [ ] CPU usage < 30% at baseline
- [ ] Memory usage stable

### Frontend Performance
- [ ] Initial load < 3 seconds
- [ ] Game interaction responsive (< 100ms)
- [ ] No memory leaks detected
- [ ] Babylon.js rendering 60 FPS

---

## 🔒 Security Checklist

### Authentication
- [ ] Passwords hashed with bcrypt
- [ ] JWT tokens signed
- [ ] Token expiration enforced
- [ ] No tokens logged or exposed

### Database
- [ ] All queries parameterized (no SQL injection)
- [ ] Connection requires authentication
- [ ] Database backups automated
- [ ] Sensitive data encrypted

### API
- [ ] Rate limiting enabled
- [ ] CORS properly configured
- [ ] HTTPS enforced in production
- [ ] Input validation on all endpoints

### Infrastructure
- [ ] Environment variables not committed to git
- [ ] Secret keys rotated regularly
- [ ] Logging configured without secrets
- [ ] Monitoring and alerting enabled

---

## 📈 Scaling Considerations

### Single Server (Current)
- **Capacity**: ~1,000 concurrent users
- **Games/Second**: ~100
- **Database Queries/Second**: ~500

### Multi-Server (Recommended for >5K users)
- [ ] Load balancer (Nginx)
- [ ] Multiple backend instances
- [ ] Redis for session caching
- [ ] PostgreSQL replication
- [ ] CDN for frontend

### Cloud Deployment (AWS Example)
- [ ] EC2 for backend (t3.medium+)
- [ ] RDS for PostgreSQL (db.t3.medium+)
- [ ] ElastiCache for Redis
- [ ] S3 for assets
- [ ] CloudFront for CDN
- [ ] Route 53 for DNS

---

## 🔄 Backup & Recovery

### Database Backups
```bash
# Create backup
pg_dump -U tk88_user -d tk88_gaming > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore backup
psql -U tk88_user -d tk88_gaming < backup_20260416_120000.sql

# Schedule automated backups (crontab)
0 2 * * * pg_dump -U tk88_user -d tk88_gaming > /backups/tk88_$(date +\%Y\%m\%d).sql
```

### Application Recovery
```bash
# Restart backend
npm --prefix backend run dev

# Restart frontend
npm --prefix frontend run dev

# Check health
curl http://localhost:3000/health
```

---

## 📋 Production Deployment Checklist

Before deploying to production:

- [ ] Environment variables configured for production
- [ ] Database backups automated
- [ ] SSL/HTTPS certificates installed
- [ ] Firewall rules configured
- [ ] Monitoring and logging set up
- [ ] Load balancer configured
- [ ] Database replication enabled
- [ ] Backup & recovery procedure documented
- [ ] Security audit completed
- [ ] Performance testing completed
- [ ] Load testing completed (5,000+ concurrent)
- [ ] Disaster recovery plan documented

---

## 🚀 Deployment Command Reference

### Development
```bash
# Start all services
npm --prefix backend run dev &
npm --prefix frontend run dev &

# Monitor logs
tail -f logs/combined.log
```

### Production (Docker)
```bash
# Build images
docker-compose -f docker-compose.prod.yml build

# Start services
docker-compose -f docker-compose.prod.yml up -d

# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Stop services
docker-compose -f docker-compose.prod.yml down
```

### Kubernetes (Recommended for Scale)
```bash
# Create namespace
kubectl create namespace tk88-gaming

# Deploy
kubectl apply -f k8s/ -n tk88-gaming

# Check status
kubectl get pods -n tk88-gaming

# View logs
kubectl logs -f deployment/backend -n tk88-gaming
```

---

## 📞 Support

### Common Commands
```bash
# Check backend is running
curl http://localhost:3000/health

# Check database
psql -U tk88_user -d tk88_gaming -c "SELECT COUNT(*) FROM users;"

# View logs
tail -f logs/combined.log | grep ERROR

# Test WebSocket
npx socket.io-client http://localhost:3000
```

### Getting Help
1. Check `logs/error.log` for errors
2. Review `PHASE3_SUMMARY.md` for architecture
3. Check `API_REFERENCE.md` for endpoint details
4. Review `PHASE3_PART3_AUTHENTICATION.md` for auth issues

---

**Deployment Status**: Ready for development and testing  
**Production Readiness**: 85% complete (Phase 3 Part 4 pending)  
**Last Updated**: April 16, 2026
