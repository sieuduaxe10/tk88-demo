# TK88 Gaming Platform 🎮

Professional 3D casino gaming platform with 5 games, real-time multiplayer, and compliance infrastructure.

## 🎯 Features

- **5 3D Games**: Tài xỉu, Xóc đĩa, Long hổ, Baccarat, Roulette
- **Mobile-First UI**: Dark theme, responsive design
- **Real-time Multiplayer**: WebSocket-based synchronization
- **User Dashboard**: Game stats, wallet, transaction history
- **Admin Panel**: User management, KYC/AML, financial tracking, affiliate management
- **Compliance**: Server-authoritative game logic, certified RNG, audit trails
- **Scalable Architecture**: Node.js + PostgreSQL + Redis + MongoDB

## 📂 Project Structure

```
tk88-gaming/
├── frontend/          # React + Babylon.js UI
├── backend/           # Node.js API + WebSocket server
├── shared/            # TypeScript types & constants
├── docker/            # Docker configurations
├── .github/           # CI/CD workflows
└── docs/              # Architecture & setup documentation
```

## 🚀 Quick Start

### Prerequisites
- Node.js 20+ LTS
- Docker & Docker Compose
- Git

### Local Development

```bash
# Clone & setup
git clone <repo>
cd tk88-gaming

# Install dependencies
npm install --prefix backend
npm install --prefix frontend

# Start services (Docker)
docker-compose up -d

# Run backend
npm --prefix backend run dev

# Run frontend (new terminal)
npm --prefix frontend run dev
```

Access:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000
- **Admin Panel**: http://localhost:5173/admin

## 📚 Documentation

- [SETUP.md](./docs/SETUP.md) - Detailed setup instructions
- [ARCHITECTURE.md](./docs/ARCHITECTURE.md) - System architecture & data flow
- [API.md](./docs/API.md) - REST API & WebSocket protocol
- [SECURITY.md](./docs/SECURITY.md) - Security controls & compliance

## 🔧 Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| **Frontend** | React | 18+ |
| **3D Engine** | Babylon.js | 6.x |
| **Backend** | Node.js + Express | 20+ LTS |
| **Real-time** | Socket.IO + Colyseus | 4.x |
| **Databases** | PostgreSQL, Redis, MongoDB | 15, 7, 6+ |
| **Payment** | Stripe API | v1 |
| **Auth** | JWT + Sessions | - |

## 📋 Development Commands

```bash
# Backend
npm --prefix backend run dev      # Start development server
npm --prefix backend run build    # Build TypeScript
npm --prefix backend run test     # Run tests

# Frontend
npm --prefix frontend run dev     # Start dev server
npm --prefix frontend run build   # Build for production
npm --prefix frontend run test    # Run tests
```

## 🔐 Security

- TLS/HTTPS enforced (HSTS headers)
- Rate limiting on all API endpoints
- CORS configured for frontend domain
- Secrets managed via environment variables
- SQL injection prevention (parameterized queries)
- XSS protection (Content-Security-Policy headers)

See [SECURITY.md](./docs/SECURITY.md) for full security guidelines.

## 📊 CI/CD

GitHub Actions automatically:
- Lints code (ESLint)
- Runs tests
- Builds Docker images
- Deploys to staging on PR merge

## 🎮 Game Implementation

Phase 2 will implement:
1. Babylon.js game engine setup
2. Tài xỉu (Dice Game)
3. Xóc đĩa (Saucer Game)
4. Long hổ (Dragon-Tiger)
5. Baccarat (Card Game)
6. Roulette (Wheel Game)

## 📦 Deployment

See [ARCHITECTURE.md](./docs/ARCHITECTURE.md) for cloud deployment (AWS/GCP/Azure).

## 📝 License

Proprietary - All rights reserved

## 🤝 Contributing

See [CONTRIBUTING.md](./docs/CONTRIBUTING.md) for development workflow.

---

**Last Updated**: April 2026 | **Phase**: 1 - Project Setup
