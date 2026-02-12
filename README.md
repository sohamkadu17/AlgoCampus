<p align="center">
  <img src="https://img.shields.io/badge/Algorand-Testnet-blue?style=for-the-badge&logo=algorand" alt="Algorand Testnet" />
  <img src="https://img.shields.io/badge/FastAPI-0.110-009688?style=for-the-badge&logo=fastapi" alt="FastAPI" />
  <img src="https://img.shields.io/badge/React-18.3-61DAFB?style=for-the-badge&logo=react" alt="React" />
  <img src="https://img.shields.io/badge/Python-3.11+-3776AB?style=for-the-badge&logo=python" alt="Python" />
  <img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" alt="License" />
</p>

# 🎓 CampusPay — Split Expenses on Algorand

**CampusPay (AlgoCampus)** is a decentralized campus finance application built on the Algorand blockchain. It enables students to create groups, track shared expenses, and settle debts using transparent, atomic on-chain transactions — no banks, no trust issues.

> Built for the **Hackspiration Hackathon** using AlgoKit + Pera Wallet.

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| **Wallet Auth** | Ed25519 challenge-response login via Pera Wallet — no passwords |
| **Group Management** | Create/join groups, add/remove members, QR invite codes |
| **Expense Tracking** | Split bills equally, by percentage, or custom amounts |
| **On-Chain Settlement** | Pay debts via atomic Algorand transactions (all-or-nothing) |
| **Smart Contracts** | 3 production-grade ARC4 contracts (~2000+ lines of Algorand Python) |
| **Real-Time Balances** | Who owes whom, auto-calculated with microAlgo precision |
| **Dashboard & Analytics** | Visual spending insights with charts |
| **Dark/Light Mode** | Polished UI with motion animations |

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                     React Frontend (Vite)                     │
│           Pera Wallet · TailwindCSS · Recharts                │
└────────────────────────┬─────────────────────────────────────┘
                         │ REST API (JWT Auth)
┌────────────────────────▼─────────────────────────────────────┐
│                   FastAPI Backend (Python)                     │
│        SQLite/PostgreSQL · Rate Limiting · CORS               │
└────────────────────────┬─────────────────────────────────────┘
                         │ py-algorand-sdk
┌────────────────────────▼─────────────────────────────────────┐
│                 Algorand Blockchain (Testnet)                  │
│   GroupManager · ExpenseTracker · SettlementExecutor           │
└──────────────────────────────────────────────────────────────┘
```

---

## 📂 Project Structure

```
AlgoCampus/
├── backend/                        # FastAPI REST API
│   ├── app/
│   │   ├── api/v1/                 # Route handlers (auth, groups, expenses, settlements)
│   │   ├── services/               # Business logic layer
│   │   ├── models/                 # SQLAlchemy models + Pydantic schemas
│   │   ├── db/                     # Database session management
│   │   ├── utils/                  # Error handling, retry logic
│   │   ├── config.py               # Environment configuration
│   │   └── main.py                 # App entry point
│   ├── requirements.txt
│   └── .env.example
│
├── projects/
│   ├── contracts/                  # Algorand smart contracts (Poetry)
│   │   ├── smart_contracts/
│   │   │   ├── group_manager/      # Group CRUD, QR invites (~850 lines)
│   │   │   ├── expense_tracker/    # Splits, balances (~650 lines)
│   │   │   └── settlement/         # Atomic payments, security (~500 lines)
│   │   ├── scripts/                # Deployment scripts
│   │   └── tests/                  # Contract test suites
│   │
│   └── frontend/                   # React + Vite + TailwindCSS
│       └── src/app/
│           ├── components/         # 35+ UI components
│           ├── context/            # React context (wallet, app state)
│           ├── services/           # API client layer
│           └── styles/             # Global styles
│
└── SETUP_GUIDE.md                  # Full setup instructions
```

---

## 🛠️ Tech Stack

### Backend
- **FastAPI** 0.110 — async Python web framework
- **SQLAlchemy** 2.0 — async ORM (SQLite dev / PostgreSQL prod)
- **py-algorand-sdk** 2.6 — Algorand blockchain interaction
- **python-jose** — JWT authentication
- **PyNaCl** — Ed25519 signature verification
- **SlowAPI** — rate limiting

### Frontend
- **React** 18.3 + **Vite** 6.3
- **TailwindCSS** 4.1 + **MUI** 7.3 + **Radix UI**
- **Pera Wallet Connect** — wallet integration
- **Recharts** — analytics charts
- **Motion** (Framer) — animations

### Smart Contracts
- **Algorand Python** (AlgoPy) 2.0 — ARC4 contract development
- **PuyaPy** — compiler to TEAL
- **AlgoKit** — project tooling & deployment

---

## 🚀 Quick Start

```bash
# Clone the repository
git clone https://github.com/sohamkadu17/AlgoCampus.git
cd AlgoCampus

# Backend
cd backend
python -m venv venv && venv\Scripts\activate  # Windows
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload                 # → http://localhost:8000

# Frontend (in a new terminal)
cd projects/frontend
npm install
npm run dev                                   # → http://localhost:5173

# Smart Contracts (optional — requires Docker)
cd projects/contracts
poetry install
algokit localnet start
algokit project run build
```

> For detailed setup instructions, see **[SETUP_GUIDE.md](SETUP_GUIDE.md)**.

---

## 📜 Smart Contracts

### GroupManager
- Create/deactivate groups with box storage
- Add/remove members with admin access control
- QR invite system using SHA512_256 cryptographic hashes
- Cost: ~0.001 ALGO/operation, ~0.5 ALGO storage per group

### ExpenseTracker
- Record expenses with equal, percentage, or custom splits
- Signed integer balance encoding (TEAL has no signed ints)
- Precise integer division — splits always sum exactly to total
- Cost: ~0.13 ALGO storage per expense (5 members)

### SettlementExecutor
- Atomic transaction groups — payment + app call succeed or fail together
- 6-layer security: atomic validation, replay protection, signature & amount verification
- 24-hour expiration with cleanup
- Cost: 0.0835 ALGO to initiate, 0.003 ALGO to execute

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/auth/challenge` | Get auth challenge for wallet |
| `POST` | `/api/v1/auth/verify` | Verify signature & get JWT |
| `GET` | `/api/v1/groups` | List user's groups |
| `POST` | `/api/v1/groups` | Create a new group |
| `POST` | `/api/v1/groups/{id}/members` | Add member to group |
| `GET` | `/api/v1/expenses?group_id=X` | List group expenses |
| `POST` | `/api/v1/expenses` | Create an expense |
| `GET` | `/api/v1/expenses/group/{id}/balance` | Get balance summary |
| `POST` | `/api/v1/settlements` | Initiate settlement |

> Full interactive docs at `http://localhost:8000/docs` (Swagger UI)

---

## 🔐 Environment Variables

Create `backend/.env` from the example:

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | `sqlite+aiosqlite:///./algocampus.db` | Database connection string |
| `JWT_SECRET_KEY` | — | **Change this!** Secret for JWT signing |
| `ALGORAND_NETWORK` | `testnet` | `localnet` / `testnet` / `mainnet` |
| `ALGORAND_ALGOD_URL` | `https://testnet-api.algonode.cloud` | Algorand node URL |
| `ALGORAND_INDEXER_URL` | `https://testnet-idx.algonode.cloud` | Algorand indexer URL |
| `GROUP_MANAGER_APP_ID` | `0` | Deployed GroupManager contract ID |
| `EXPENSE_TRACKER_APP_ID` | `0` | Deployed ExpenseTracker contract ID |
| `SETTLEMENT_EXECUTOR_APP_ID` | `0` | Deployed SettlementExecutor contract ID |
| `CORS_ORIGINS` | `localhost:3000,5173` | Allowed CORS origins |

---

## 🧪 Testing

```bash
# Smart contract tests
cd projects/contracts
poetry run pytest tests/ -v

# API testing
# Visit http://localhost:8000/docs for interactive Swagger UI
```

---

## 📦 Deployment

### Backend
```bash
# Production with PostgreSQL
DATABASE_URL=postgresql+asyncpg://user:pass@host/db uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### Smart Contracts
```bash
cd projects/contracts
# Deploy to testnet
algokit project deploy testnet
# Or use the deploy script
python scripts/deploy_group_manager.py --network testnet
```

### Frontend
```bash
cd projects/frontend
npm run build    # Output in dist/
```

---

## 🤝 Team

Built with ❤️ for the **Hackspiration Hackathon**.

---

## 📄 License

This project is licensed under the MIT License.
