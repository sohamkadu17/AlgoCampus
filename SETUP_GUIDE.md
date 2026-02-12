# 🛠️ CampusPay — Complete Setup Guide

This guide walks you through setting up the entire CampusPay (AlgoCampus) project from scratch on a fresh machine.

---

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

| Tool | Version | Download |
|------|---------|----------|
| **Python** | 3.11+ | [python.org](https://www.python.org/downloads/) |
| **Node.js** | 18+ | [nodejs.org](https://nodejs.org/) |
| **Git** | Latest | [git-scm.com](https://git-scm.com/) |
| **Docker Desktop** | Latest (for smart contracts only) | [docker.com](https://www.docker.com/products/docker-desktop/) |
| **AlgoKit CLI** | Latest (for smart contracts only) | [Installation guide](https://github.com/algorandfoundation/algokit-cli#install) |
| **Poetry** | Latest (for smart contracts only) | [python-poetry.org](https://python-poetry.org/docs/#installation) |
| **Pera Wallet** | Mobile app | [App Store](https://apps.apple.com/app/pera-algo-wallet/id1459898525) / [Google Play](https://play.google.com/store/apps/details?id=com.algorand.android) |

### Install AlgoKit (if deploying contracts)

```bash
# Windows (winget)
winget install algorandfoundation.algokit

# macOS (brew)
brew install algorandfoundation/tap/algokit

# Verify
algokit --version
```

---

## 🚀 Step 1: Clone the Repository

```bash
git clone https://github.com/sohamkadu17/AlgoCampus.git
cd AlgoCampus
```

---

## 🐍 Step 2: Backend Setup

### 2.1 Create a Virtual Environment

```bash
cd backend

# Windows
python -m venv venv
venv\Scripts\activate

# macOS/Linux
python3 -m venv venv
source venv/bin/activate
```

### 2.2 Install Dependencies

```bash
pip install -r requirements.txt
```

### 2.3 Configure Environment Variables

```bash
# Windows
copy .env.example .env

# macOS/Linux
cp .env.example .env
```

Open `backend/.env` and configure:

```env
# ===== REQUIRED CHANGES =====

# Generate a secure random key (run: python -c "import secrets; print(secrets.token_hex(32))")
JWT_SECRET_KEY=your-secure-random-key-here

# ===== OPTIONAL CHANGES =====

# Database — SQLite works for development, switch to PostgreSQL for production
DATABASE_URL=sqlite+aiosqlite:///./algocampus.db

# Algorand network — use testnet for development
ALGORAND_NETWORK=testnet
ALGORAND_ALGOD_URL=https://testnet-api.algonode.cloud
ALGORAND_INDEXER_URL=https://testnet-idx.algonode.cloud

# Smart contract app IDs (set after deploying contracts, 0 = off-chain mode)
GROUP_MANAGER_APP_ID=0
EXPENSE_TRACKER_APP_ID=0
SETTLEMENT_EXECUTOR_APP_ID=0

# CORS — add your frontend URL if different
CORS_ORIGINS=http://localhost:3000,http://localhost:5173
```

### 2.4 Start the Backend Server

```bash
uvicorn app.main:app --reload
```

You should see:

```
Starting AlgoCampus Backend...
Database initialized
Algorand Network: testnet
INFO:     Application startup complete.
INFO:     Uvicorn running on http://127.0.0.1:8000
```

### 2.5 Verify

- **Health check**: Open http://localhost:8000/health
- **API docs**: Open http://localhost:8000/docs (Swagger UI)
- **ReDoc**: Open http://localhost:8000/redoc

---

## 🎨 Step 3: Frontend Setup

Open a **new terminal** (keep backend running).

### 3.1 Install Dependencies

```bash
cd projects/frontend

# Using npm
npm install

# Or using pnpm (faster)
pnpm install
```

### 3.2 Start the Development Server

```bash
npm run dev
```

You should see:

```
  VITE v6.x.x  ready in XXXms

  ➜  Local:   http://localhost:5173/
```

### 3.3 Connect Your Wallet

1. Open http://localhost:5173 in your browser
2. Click **Connect Wallet**
3. Scan the QR code with the **Pera Wallet** mobile app (set to **Testnet**)
4. Approve the connection

> **Tip**: Get free testnet ALGO from the [Algorand Testnet Dispenser](https://bank.testnet.algorand.network/).

---

## ⛓️ Step 4: Smart Contracts (Optional)

This step is only needed if you want to deploy your own smart contracts. The app works in **off-chain mode** without deployed contracts.

### 4.1 Prerequisites

- Docker Desktop must be running
- AlgoKit CLI must be installed
- Poetry must be installed

### 4.2 Install Contract Dependencies

```bash
cd projects/contracts
poetry install
```

### 4.3 Start Local Algorand Network

```bash
algokit localnet start
```

Verify it's running:

```bash
algokit localnet status
```

### 4.4 Build Smart Contracts

```bash
algokit project run build
```

This compiles the Algorand Python contracts to TEAL and generates:
- `smart_contracts/artifacts/` — compiled TEAL files
- ARC32/ARC56 application specs

### 4.5 Run Contract Tests

```bash
poetry run pytest tests/ -v
```

### 4.6 Deploy Contracts

#### To LocalNet

```bash
algokit project deploy localnet
```

#### To Testnet

```bash
# Set CREATOR_MNEMONIC in backend/.env first
python scripts/deploy_group_manager.py --network testnet
```

After deploying, update the app IDs in `backend/.env`:

```env
GROUP_MANAGER_APP_ID=<deployed-app-id>
EXPENSE_TRACKER_APP_ID=<deployed-app-id>
SETTLEMENT_EXECUTOR_APP_ID=<deployed-app-id>
```

---

## 🧪 Step 5: Testing the Full Flow

### 5.1 Create an Account

1. Open the frontend at http://localhost:5173
2. Connect your Pera Wallet
3. You'll be authenticated automatically via Ed25519 challenge-response

### 5.2 Create a Group

1. Navigate to **Splits** in the sidebar
2. Click **Create New Split**
3. Enter a group name and description
4. The group will be created and you'll be added as admin

### 5.3 Add Members

1. Open the created group
2. Click the **Add Member** button
3. Enter the Algorand wallet address of the member
4. They'll be added to the group

### 5.4 Add an Expense

1. Inside a group, click the **+** button
2. Enter description, amount (in ALGO), and split type
3. Click **Add Expense**
4. The expense will be split among all group members

### 5.5 View Balances

- Balances are shown in the group detail page
- Positive = you are owed money
- Negative = you owe money

---

## 🔧 Troubleshooting

### Backend won't start

```
❌ ModuleNotFoundError: No module named 'app'
```
**Fix**: Make sure you're in the `backend/` directory and the virtual environment is activated.

---

```
❌ Address already in use (port 8000)
```
**Fix**: Kill the existing process:
```bash
# Windows
netstat -ano | findstr :8000
taskkill /PID <PID> /F

# macOS/Linux
lsof -i :8000
kill -9 <PID>
```

---

### Frontend won't connect to backend

```
❌ Network Error / CORS error
```
**Fix**: Ensure `CORS_ORIGINS` in `backend/.env` includes your frontend URL:
```env
CORS_ORIGINS=http://localhost:3000,http://localhost:5173
```

---

### Pera Wallet connection fails

**Fix**: 
- Ensure your Pera Wallet is set to **Testnet** (Settings → Node Settings → TestNet)
- Ensure you have testnet ALGO: https://bank.testnet.algorand.network/

---

### Smart contract build fails

```
❌ Docker is not running
```
**Fix**: Start Docker Desktop before running `algokit localnet start`.

---

## 📁 File Overview

| Path | Purpose |
|------|---------|
| `backend/app/main.py` | FastAPI application entry point |
| `backend/app/config.py` | Environment variable configuration |
| `backend/app/api/v1/` | API route handlers |
| `backend/app/services/` | Business logic (group, expense, settlement) |
| `backend/app/models/database.py` | SQLAlchemy database models |
| `backend/app/models/schemas.py` | Pydantic request/response schemas |
| `projects/frontend/src/app/` | React application source |
| `projects/frontend/src/app/components/` | UI components |
| `projects/frontend/src/app/services/` | API client services |
| `projects/frontend/src/app/context/` | React context providers |
| `projects/contracts/smart_contracts/` | Algorand Python smart contracts |
| `projects/contracts/tests/` | Smart contract test suites |

---

## 🌐 Production Deployment

### Backend

```bash
# Use PostgreSQL instead of SQLite
DATABASE_URL=postgresql+asyncpg://user:password@host:5432/campuspay

# Run with production server
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

### Frontend

```bash
cd projects/frontend
npm run build
# Deploy the dist/ folder to any static hosting (Vercel, Netlify, etc.)
```

### Smart Contracts

```bash
# Deploy to mainnet (use with caution!)
algokit project deploy mainnet
```

---

## 💡 Development Tips

- **API Docs**: Always check http://localhost:8000/docs for the latest API schema
- **Hot Reload**: Both backend (`--reload`) and frontend (`vite dev`) support hot reload
- **Database Reset**: Delete `backend/algocampus.db` and restart the server to reset
- **Contract Artifacts**: After building contracts, check `projects/contracts/smart_contracts/artifacts/`

---

**Happy hacking! 🎓💰**
