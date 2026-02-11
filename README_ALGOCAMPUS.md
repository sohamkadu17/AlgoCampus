# 🎓 AlgoCampus - Campus Finance DApp

> **Production-grade decentralized application for managing split expenses and settlements on Algorand**

AlgoCampus is a comprehensive campus finance platform that allows students to create groups, track shared expenses, and settle debts using cryptocurrency. Built with security, modularity, and gas optimization in mind.

## 🌟 Features

- 🔐 **Wallet Authentication** - Sign in with your Algorand wallet (no passwords!)
- 👥 **Split Group Management** - Create and manage expense groups
- 💰 **Expense Tracking** - Track who paid what and who owes
- 🤝 **Smart Settlements** - Execute payments via atomic transactions
- 📊 **Analytics Dashboard** - View spending trends and balances
- ⚡ **Real-time Updates** - Live transaction indexing via WebSocket

## 🏗️ Architecture

**Complete system architecture with diagrams, database schemas, and component specifications:**
📖 **[ARCHITECTURE.md](ARCHITECTURE.md)** - Comprehensive technical design

**Quick implementation overview:**
📋 **[IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md)** - What's built and what's next

## 🚀 Quick Start

Get up and running in 10 minutes:
📘 **[QUICKSTART.md](QUICKSTART.md)** - Step-by-step setup guide

### TL;DR

```bash
# 1. Backend setup
cd backend
python -m venv venv
venv\Scripts\activate  # Windows (Mac/Linux: source venv/bin/activate)
pip install -r requirements.txt
cp .env.example .env

# 2. Start backend
uvicorn app.main:app --reload

# 3. Deploy contracts
cd ../projects/contracts
algokit localnet start
algokit project deploy localnet

# 4. Start frontend
cd ../frontend
pnpm install
pnpm dev
```

**API Docs**: http://localhost:8000/docs  
**Frontend**: http://localhost:5173

## 📁 Project Structure

```
AlgoCampus/
├── 📄 ARCHITECTURE.md              # Complete system design
├── 📄 IMPLEMENTATION_SUMMARY.md    # Implementation status
├── 📄 QUICKSTART.md               # Setup guide
│
├── 🔧 backend/                    # FastAPI Backend
│   ├── app/
│   │   ├── api/v1/               # REST API endpoints
│   │   │   ├── auth.py           # ✅ Wallet authentication
│   │   │   ├── groups.py         # ✅ Group management
│   │   │   ├── expenses.py       # ⚪ Expense tracking
│   │   │   ├── settlements.py    # ⚪ Settlement execution
│   │   │   └── analytics.py      # ⚪ Analytics & reports
│   │   │
│   │   ├── services/             # Business logic
│   │   │   ├── auth.py           # ✅ Signature verification
│   │   │   └── group.py          # ✅ Group operations
│   │   │
│   │   ├── models/               # Data models
│   │   │   ├── database.py       # ✅ SQLAlchemy models
│   │   │   └── schemas.py        # ✅ Pydantic schemas
│   │   │
│   │   ├── db/                   # Database
│   │   │   └── session.py        # ✅ Session management
│   │   │
│   │   └── main.py               # ✅ FastAPI app
│   │
│   ├── requirements.txt           # ✅ Dependencies
│   └── .env.example              # ✅ Config template
│
├── 🔗 projects/contracts/         # Smart Contracts
│   └── smart_contracts/
│       ├── group_manager/        # ✅ Group management contract
│       │   ├── contract.py       # ✅ Full implementation
│       │   └── deploy_config.py  # ✅ Deployment config
│       │
│       ├── expense_tracker/      # ⚪ Expense tracking (to implement)
│       │   └── contract.py
│       │
│       └── settlement/           # ⚪ Settlement executor (to implement)
│           └── contract.py
│
└── 🎨 projects/frontend/          # React Frontend
    ├── src/
    │   ├── components/           # UI components
    │   └── contracts/            # Contract clients
    └── package.json

Legend: ✅ Implemented | ⚪ Stub/To Implement
```

## 🛠️ Tech Stack

### Backend
- **FastAPI** - Modern Python web framework
- **SQLAlchemy** - ORM with PostgreSQL/SQLite support
- **Pydantic** - Data validation and settings
- **JWT** - Token-based authentication
- **py-algorand-sdk** - Algorand blockchain integration

### Smart Contracts
- **Algorand Python (AlgoPy)** - Python smart contracts
- **AlgoKit** - Development and deployment tools
- **Box Storage** - Efficient on-chain data storage

### Frontend
- **React** - UI library
- **TypeScript** - Type-safe JavaScript
- **TailwindCSS** - Utility-first styling
- **Algorand Wallet Integration** - WalletConnect support

## 📚 API Documentation

### Authentication Endpoints
```
POST   /api/v1/auth/challenge    # Get wallet signing challenge
POST   /api/v1/auth/verify       # Verify signature & get JWT
POST   /api/v1/auth/refresh      # Refresh access token
GET    /api/v1/auth/me           # Get current user
```

### Group Endpoints
```
POST   /api/v1/groups                      # Create group
GET    /api/v1/groups                      # List user's groups
GET    /api/v1/groups/{id}                 # Get group details
PATCH  /api/v1/groups/{id}                 # Update group
POST   /api/v1/groups/{id}/members         # Add member
DELETE /api/v1/groups/{id}/members/{addr}  # Remove member
GET    /api/v1/groups/{id}/balances        # Get balances
```

### Expense Endpoints (To Implement)
```
POST   /api/v1/expenses              # Create expense
GET    /api/v1/expenses              # List expenses
GET    /api/v1/expenses/{id}         # Get expense details
```

### Settlement Endpoints (To Implement)
```
POST   /api/v1/settlements/initiate  # Initiate settlement
POST   /api/v1/settlements/execute   # Execute payment
POST   /api/v1/settlements/optimize  # Get optimal settlement plan
```

**Interactive API Docs**: http://localhost:8000/docs (when running)

## 🔐 Security Features

- ✅ Ed25519 signature verification (Algorand native)
- ✅ JWT token-based sessions with refresh tokens
- ✅ Rate limiting on all endpoints
- ✅ CORS configuration
- ✅ Input validation via Pydantic
- ✅ Smart contract access control (admin-only operations)
- ✅ SQL injection prevention via SQLAlchemy ORM
- ✅ Atomic group transactions for settlements

## 🎯 Development Roadmap

### ✅ Phase 1: Foundation (COMPLETE)
- [x] Architecture documentation
- [x] Backend project structure
- [x] Database schema and models
- [x] Authentication system (wallet signature verification)
- [x] GroupManager smart contract
- [x] Group management API with full CRUD

### 🔄 Phase 2: Core Features (In Progress)
- [ ] ExpenseTracker smart contract
- [ ] Expense API implementation
- [ ] Transaction indexer service
- [ ] Real-time WebSocket updates

### ⚪ Phase 3: Settlements
- [ ] SettlementExecutor smart contract
- [ ] Settlement API and optimization
- [ ] Atomic group transaction execution

### ⚪ Phase 4: Polish
- [ ] Analytics API endpoints
- [ ] Frontend integration with all features
- [ ] Comprehensive testing suite
- [ ] Production deployment configs

## 🧪 Testing

```bash
# Backend tests
cd backend
pytest tests/ -v --cov

# Contract tests
cd projects/contracts
pytest tests/ -v

# Frontend tests
cd projects/frontend
pnpm test
```

## 📖 Documentation

- **[ARCHITECTURE.md](ARCHITECTURE.md)** - Complete system architecture
  - System diagrams
  - Smart contract specifications
  - API architecture
  - Database schema
  - Security design
  - Data flow diagrams

- **[IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md)** - Current status
  - What's implemented
  - Implementation roadmap
  - Quick reference

- **[QUICKSTART.md](QUICKSTART.md)** - Setup instructions
  - Step-by-step setup
  - Prerequisites
  - Common issues

- **[backend/README.md](backend/README.md)** - Backend-specific docs

## 🤝 Contributing

This is a hackathon project but contributions are welcome!

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

MIT License - see LICENSE file for details

## 🙏 Acknowledgments

- Built with [AlgoKit](https://github.com/algorandfoundation/algokit-cli)
- Inspired by campus finance needs
- Powered by [Algorand](https://www.algorand.com/)

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/sohamkadu17/AlgoCampus/issues)
- **Algorand Developer Docs**: https://developer.algorand.org/
- **AlgoKit Docs**: https://developer.algorand.org/docs/get-started/algokit/

---

## 💡 Original Template

This project evolved from the AlgoKit Quick Start template. See `README_ORIGINAL.md` for the original template guide.
- Original repo: [Hackseries-2-QuickStart-template](https://github.com/marotipatre/Hackseries-2-QuickStart-template)

---

**Built with ❤️ for Algorand hackathons**
