# AlgoCampus Backend

Production-grade backend for campus finance DApp built on Algorand.

## Features

- 🔐 Wallet-based authentication (signature verification)
- 👥 Split group management
- 💰 Expense tracking with custom splits
- 🤝 Settlement execution via smart contracts
- 📊 Analytics and reporting
- ⚡ Real-time transaction indexing

## Tech Stack

- **Backend**: FastAPI + Python 3.11+
- **Database**: SQLite (dev) / PostgreSQL (prod)
- **Blockchain**: Algorand + AlgoKit
- **Smart Contracts**: Python (AlgoPy/Beaker)

## Quick Start

See [QUICKSTART.md](../QUICKSTART.md) for detailed setup instructions.

```bash
# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env

# Start server
uvicorn app.main:app --reload
```

API Documentation: http://localhost:8000/docs

## API Endpoints

### Authentication
- `POST /api/v1/auth/challenge` - Get wallet challenge
- `POST /api/v1/auth/verify` - Verify signature & get JWT
- `GET /api/v1/auth/me` - Get current user

### Groups
- `POST /api/v1/groups` - Create group
- `GET /api/v1/groups` - List user's groups
- `GET /api/v1/groups/{id}` - Get group details
- `POST /api/v1/groups/{id}/members` - Add member
- `GET /api/v1/groups/{id}/balances` - Get balances

### Expenses
- `POST /api/v1/expenses` - Create expense
- `GET /api/v1/expenses` - List expenses
- `GET /api/v1/expenses/{id}` - Get expense details

### Settlements
- `POST /api/v1/settlements/initiate` - Start settlement
- `POST /api/v1/settlements/execute` - Execute payment
- `POST /api/v1/settlements/optimize` - Get optimal plan

### Analytics
- `GET /api/v1/analytics/user` - User stats
- `GET /api/v1/analytics/group/{id}` - Group stats

## Architecture

See [ARCHITECTURE.md](../ARCHITECTURE.md) for complete system design.

## Testing

```bash
pytest tests/
```

## License

MIT
