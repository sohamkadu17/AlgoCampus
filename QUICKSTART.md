# AlgoCampus - Quick Start Guide

## 🚀 Getting Started

This guide will help you set up the AlgoCampus backend in minutes.

### Prerequisites

- Python 3.11+
- Node.js 18+ (for frontend)
- AlgoKit installed (`pipx install algokit`)
- Git

### Step 1: Clone & Setup

```bash
cd AlgoCampus

# Install backend dependencies
cd backend
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On Unix/Mac:
source venv/bin/activate

# Install packages
pip install -r requirements.txt
```

### Step 2: Configure Environment

```bash
# Copy example env file
cp .env.example .env

# Edit .env with your settings
# For hackathon, defaults work fine!
```

### Step 3: Deploy Smart Contracts

```bash
cd ../projects/contracts

# Build contracts
algokit project run build

# Start LocalNet (for testing)
algokit localnet start

# Deploy to LocalNet
algokit project deploy localnet

# Note the App IDs printed - add them to backend/.env
```

### Step 4: Start Backend

```bash
cd ../../backend

# Run migrations (creates database)
python -c "from app.db.session import engine; from app.models.database import Base; import asyncio; asyncio.run(Base.metadata.create_all(bind=engine))"

# Start FastAPI server
uvicorn app.main:app --reload
```

Backend running at: http://localhost:8000

API docs: http://localhost:8000/docs

### Step 5: Start Frontend

```bash
cd ../projects/frontend

# Install dependencies
pnpm install

# Start dev server
pnpm dev
```

Frontend running at: http://localhost:5173

---

## 📋 Quick Testing

### 1. Check Backend Health

```bash
curl http://localhost:8000/health
```

### 2. Test Authentication Flow

```bash
# Get challenge
curl -X POST http://localhost:8000/api/v1/auth/challenge \
  -H "Content-Type: application/json" \
  -d '{"wallet_address":"YOUR_ALGO_ADDRESS"}'

# Sign the message with your wallet
# Then verify:
curl -X POST http://localhost:8000/api/v1/auth/verify \
  -H "Content-Type: application/json" \
  -d '{
    "wallet_address":"YOUR_ALGO_ADDRESS",
    "signature":"BASE64_SIGNATURE",
    "nonce":"NONCE_FROM_CHALLENGE"
  }'
```

### 3. Create a Group

```bash
curl -X POST http://localhost:8000/api/v1/groups \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "name":"Apartment Roommates",
    "description":"Shared expenses for apartment"
  }'
```

---

## 🗂️ Project Structure

```
AlgoCampus/
├── ARCHITECTURE.md          # Complete architecture docs
├── backend/                 # FastAPI backend
│   ├── app/
│   │   ├── api/            # API endpoints
│   │   ├── services/       # Business logic
│   │   ├── models/         # Database & schemas
│   │   └── main.py         # App entry point
│   ├── requirements.txt
│   └── .env.example
├── projects/
│   ├── contracts/          # Smart contracts
│   │   └── smart_contracts/
│   │       ├── group_manager/
│   │       ├── expense_tracker/
│   │       └── settlement/
│   └── frontend/           # React frontend
└── README.md
```

---

## 🔧 Common Tasks

### Run Tests

```bash
# Backend tests
cd backend
pytest tests/

# Contract tests
cd projects/contracts
pytest tests/
```

### Reset Database

```bash
cd backend
rm algocampus.db
python -c "from app.db.session import engine; from app.models.database import Base; import asyncio; asyncio.run(Base.metadata.create_all(bind=engine))"
```

### Deploy to Testnet

```bash
cd projects/contracts

# Deploy to TestNet
algokit project deploy testnet

# Update backend/.env with new App IDs
```

---

## 📚 Next Steps

1. **Read ARCHITECTURE.md** - Understand the system design
2. **Implement remaining contracts** - ExpenseTracker and SettlementExecutor
3. **Complete API endpoints** - expenses.py, settlements.py, analytics.py
4. **Build indexer service** - Real-time transaction monitoring
5. **Frontend integration** - Connect React to API
6. **Testing** - Write comprehensive tests

---

## 🆘 Troubleshooting

### Port already in use

```bash
# Kill process on port 8000
# Windows:
netstat -ano | findstr :8000
taskkill /PID <PID> /F

# Unix/Mac:
lsof -ti:8000 | xargs kill
```

### Database errors

```bash
# Reset database
rm algocampus.db
# Re-run migrations
```

### Algorand connection errors

```bash
# Check AlgoKit
algokit --version

# Start LocalNet
algokit localnet start
algokit localnet status
```

---

## 📞 Support

- Architecture questions: See ARCHITECTURE.md
- AlgoKit docs: https://developer.algorand.org/docs/get-started/algokit/
- FastAPI docs: https://fastapi.tiangolo.com/

---

**Happy Building! 🚀**
