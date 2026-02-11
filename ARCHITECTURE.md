# AlgoCampus - Campus Finance DApp Architecture

## 🏗️ System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend Layer                            │
│  React + TypeScript + TailwindCSS + Algorand Wallet Integration │
└────────────────────────┬────────────────────────────────────────┘
                         │ REST API / WebSocket
┌────────────────────────┴────────────────────────────────────────┐
│                      Backend API Layer                           │
│                   FastAPI / Node.js Express                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │   Auth       │  │  Transaction │  │   Indexer    │         │
│  │   Service    │  │   Service    │  │   Service    │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
└────────┬───────────────────┬──────────────────┬────────────────┘
         │                   │                  │
         │ Write Txns        │ Read State       │ Index Events
         │                   │                  │
┌────────▼───────────────────▼──────────────────▼────────────────┐
│                    Algorand Blockchain Layer                     │
│  ┌─────────────┐  ┌─────────────┐  ┌──────────────┐           │
│  │   Group     │  │   Expense   │  │  Settlement  │           │
│  │  Contract   │  │  Contract   │  │   Contract   │           │
│  └─────────────┘  └─────────────┘  └──────────────┘           │
└────────┬────────────────────────────────────────────────────────┘
         │
         │ Events & State
         │
┌────────▼────────────────────────────────────────────────────────┐
│                      Data Layer                                  │
│  ┌──────────────────┐         ┌──────────────────┐             │
│  │  SQLite/Postgres │         │  Algorand Indexer│             │
│  │   (Off-chain)    │         │   (On-chain)     │             │
│  └──────────────────┘         └──────────────────┘             │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔐 Smart Contract Architecture

### **1. GroupManager Contract** (`smart_contracts/group_manager/contract.py`)

**Responsibilities:**
- Create and manage split groups
- Add/remove members
- Set group metadata (name, description)
- Track group state and membership

**State Schema:**
```python
# Global State
group_counter: UInt64        # Total groups created
admin: Address               # Contract admin

# Local State (per user)
groups_joined: UInt64        # Number of groups user is in

# Box Storage (per group)
group_{id}_name: String      # Group name
group_{id}_members: List     # Member addresses (packed)
group_{id}_admin: Address    # Group admin
group_{id}_active: Bool      # Group status
group_{id}_created: UInt64   # Timestamp
```

**Key Methods:**
```python
@external
def create_group(name: String, description: String) -> UInt64:
    """Creates a new group, returns group_id"""
    
@external
def add_member(group_id: UInt64, member: Address) -> None:
    """Add member to group (only admin)"""
    
@external
def remove_member(group_id: UInt64, member: Address) -> None:
    """Remove member from group (only admin)"""
    
@external
def get_group_info(group_id: UInt64) -> Tuple:
    """Returns group metadata and members"""
```

**Gas Optimization:**
- Use box storage for variable-length data (members list)
- Bitmap encoding for membership status
- Lazy deletion (mark inactive vs delete)

---

### **2. ExpenseTracker Contract** (`smart_contracts/expense_tracker/contract.py`)

**Responsibilities:**
- Record expenses within a group
- Track who paid and who owes
- Calculate split distribution
- Support equal/custom split types

**State Schema:**
```python
# Global State
total_expenses: UInt64       # Total expenses recorded
contract_version: UInt64     # For upgradability

# Box Storage (per expense)
expense_{id}_group_id: UInt64
expense_{id}_amount: UInt64        # In microAlgos
expense_{id}_payer: Address        # Who paid
expense_{id}_description: String
expense_{id}_timestamp: UInt64
expense_{id}_split_type: UInt64    # 0=equal, 1=custom
expense_{id}_splits: Bytes         # Packed split ratios
expense_{id}_settled: Bool
```

**Key Methods:**
```python
@external
def add_expense(
    group_id: UInt64,
    amount: UInt64,
    description: String,
    split_type: UInt64,
    splits: Bytes  # Encoded split ratios
) -> UInt64:
    """Record new expense, returns expense_id"""
    # Validates caller is group member
    # Validates splits sum to 100%
    
@external
def get_expense(expense_id: UInt64) -> Tuple:
    """Returns expense details"""
    
@external
def get_group_expenses(group_id: UInt64, offset: UInt64, limit: UInt64) -> List:
    """Paginated expense list for a group"""
    
@external
def calculate_balances(group_id: UInt64) -> Bytes:
    """Returns packed balance array for all members"""
```

**Gas Optimization:**
- Batch balance calculations
- Store splits as packed bytes (not individual entries)
- Event emission for indexing (avoid repeated reads)

---

### **3. SettlementExecutor Contract** (`smart_contracts/settlement/contract.py`)

**Responsibilities:**
- Execute debt settlements
- Verify payment completion
- Update expense settled status
- Handle atomic group transactions

**State Schema:**
```python
# Global State
total_settlements: UInt64
settlement_fee: UInt64       # Platform fee (in microAlgos)
fee_collector: Address

# Box Storage (per settlement)
settlement_{id}_from: Address
settlement_{id}_to: Address
settlement_{id}_amount: UInt64
settlement_{id}_expense_id: UInt64
settlement_{id}_txn_id: Bytes
settlement_{id}_timestamp: UInt64
settlement_{id}_confirmed: Bool
```

**Key Methods:**
```python
@external
def initiate_settlement(
    expense_id: UInt64,
    debtor: Address,
    creditor: Address,
    amount: UInt64
) -> UInt64:
    """Initiate settlement, returns settlement_id"""
    
@external
def execute_settlement(settlement_id: UInt64, payment_txn: Txn) -> None:
    """
    Atomic group transaction:
    [0] Payment from debtor to creditor
    [1] This method call
    Verifies payment and marks expense as settled
    """
    # Verify payment transaction
    # Update expense status in ExpenseTracker
    # Record settlement
    
@external
def verify_settlement(settlement_id: UInt64) -> Bool:
    """Check if settlement completed"""
```

**Gas Optimization:**
- Atomic group transactions (no multi-step state)
- Minimal state updates
- Event-driven architecture

---

## 🌐 Backend API Architecture

### **Tech Stack Choice: FastAPI (Recommended)**

**Why FastAPI:**
- Native async/await support
- Auto-generated OpenAPI docs
- Type validation with Pydantic
- WebSocket support for real-time updates
- Better performance than Node.js for I/O operations

### **API Structure**

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py                 # FastAPI app entry
│   ├── config.py               # Environment config
│   ├── dependencies.py         # Dependency injection
│   │
│   ├── api/
│   │   ├── __init__.py
│   │   ├── v1/
│   │   │   ├── __init__.py
│   │   │   ├── auth.py         # Authentication endpoints
│   │   │   ├── groups.py       # Group management
│   │   │   ├── expenses.py     # Expense tracking
│   │   │   ├── settlements.py  # Settlement execution
│   │   │   └── analytics.py    # Stats and reports
│   │
│   ├── services/
│   │   ├── __init__.py
│   │   ├── algorand.py         # Algorand client wrapper
│   │   ├── auth.py             # Wallet authentication
│   │   ├── group.py            # Group business logic
│   │   ├── expense.py          # Expense business logic
│   │   ├── settlement.py       # Settlement business logic
│   │   └── indexer.py          # Transaction indexing
│   │
│   ├── models/
│   │   ├── __init__.py
│   │   ├── database.py         # SQLAlchemy models
│   │   └── schemas.py          # Pydantic schemas
│   │
│   ├── db/
│   │   ├── __init__.py
│   │   ├── session.py          # Database session
│   │   └── migrations/         # Alembic migrations
│   │
│   └── utils/
│       ├── __init__.py
│       ├── security.py         # Auth helpers
│       ├── transactions.py     # Transaction builders
│       └── validators.py       # Input validation
│
├── tests/
│   ├── test_api.py
│   ├── test_services.py
│   └── test_contracts.py
│
├── alembic.ini
├── requirements.txt
└── Dockerfile
```

---

## 📡 API Endpoints

### **Authentication**
```
POST   /api/v1/auth/challenge          # Get nonce for wallet signing
POST   /api/v1/auth/verify              # Verify wallet signature
POST   /api/v1/auth/refresh             # Refresh JWT token
GET    /api/v1/auth/me                  # Get current user info
```

### **Groups**
```
POST   /api/v1/groups                   # Create group
GET    /api/v1/groups                   # List user's groups
GET    /api/v1/groups/{id}              # Get group details
PATCH  /api/v1/groups/{id}              # Update group
DELETE /api/v1/groups/{id}              # Delete/deactivate group
POST   /api/v1/groups/{id}/members      # Add member
DELETE /api/v1/groups/{id}/members/{addr} # Remove member
GET    /api/v1/groups/{id}/balances     # Get member balances
```

### **Expenses**
```
POST   /api/v1/expenses                 # Create expense
GET    /api/v1/expenses                 # List expenses (with filters)
GET    /api/v1/expenses/{id}            # Get expense details
PATCH  /api/v1/expenses/{id}            # Update expense
DELETE /api/v1/expenses/{id}            # Delete expense
GET    /api/v1/expenses/group/{id}      # Get group expenses
```

### **Settlements**
```
POST   /api/v1/settlements/initiate     # Initiate settlement
POST   /api/v1/settlements/execute      # Execute settlement
GET    /api/v1/settlements               # List settlements
GET    /api/v1/settlements/{id}         # Get settlement details
POST   /api/v1/settlements/optimize     # Get optimal settlement plan
```

### **Analytics**
```
GET    /api/v1/analytics/user           # User spending stats
GET    /api/v1/analytics/group/{id}     # Group spending stats
GET    /api/v1/analytics/trends         # Spending trends
```

### **Transactions (Indexer)**
```
GET    /api/v1/transactions             # List transactions
GET    /api/v1/transactions/{id}        # Get transaction details
WS     /api/v1/ws/transactions          # Real-time transaction feed
```

---

## 🗄️ Database Schema

### **SQLite/PostgreSQL Schema**

```sql
-- Users Table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    wallet_address VARCHAR(58) UNIQUE NOT NULL,
    nonce VARCHAR(64) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    last_login TIMESTAMP,
    
    INDEX idx_wallet (wallet_address)
);

-- Groups Table (mirrors on-chain data + metadata)
CREATE TABLE groups (
    id SERIAL PRIMARY KEY,
    chain_group_id BIGINT UNIQUE NOT NULL,  -- On-chain ID
    name VARCHAR(255) NOT NULL,
    description TEXT,
    admin_address VARCHAR(58) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    active BOOLEAN DEFAULT TRUE,
    
    INDEX idx_chain_id (chain_group_id),
    INDEX idx_admin (admin_address)
);

-- Group Members Table
CREATE TABLE group_members (
    id SERIAL PRIMARY KEY,
    group_id INTEGER REFERENCES groups(id),
    wallet_address VARCHAR(58) NOT NULL,
    joined_at TIMESTAMP DEFAULT NOW(),
    role VARCHAR(20) DEFAULT 'member',  -- admin, member
    
    UNIQUE(group_id, wallet_address),
    INDEX idx_group (group_id),
    INDEX idx_wallet (wallet_address)
);

-- Expenses Table
CREATE TABLE expenses (
    id SERIAL PRIMARY KEY,
    chain_expense_id BIGINT UNIQUE NOT NULL,  -- On-chain ID
    group_id INTEGER REFERENCES groups(id),
    amount BIGINT NOT NULL,  -- microAlgos
    description TEXT,
    payer_address VARCHAR(58) NOT NULL,
    split_type VARCHAR(20) NOT NULL,  -- equal, custom
    created_at TIMESTAMP DEFAULT NOW(),
    settled BOOLEAN DEFAULT FALSE,
    transaction_id VARCHAR(52),  -- Algorand txn ID
    
    INDEX idx_chain_id (chain_expense_id),
    INDEX idx_group (group_id),
    INDEX idx_payer (payer_address),
    INDEX idx_settled (settled)
);

-- Expense Splits Table
CREATE TABLE expense_splits (
    id SERIAL PRIMARY KEY,
    expense_id INTEGER REFERENCES expenses(id),
    wallet_address VARCHAR(58) NOT NULL,
    amount BIGINT NOT NULL,  -- microAlgos owed
    settled BOOLEAN DEFAULT FALSE,
    
    INDEX idx_expense (expense_id),
    INDEX idx_wallet (wallet_address)
);

-- Settlements Table
CREATE TABLE settlements (
    id SERIAL PRIMARY KEY,
    chain_settlement_id BIGINT UNIQUE,  -- On-chain ID
    expense_id INTEGER REFERENCES expenses(id),
    from_address VARCHAR(58) NOT NULL,
    to_address VARCHAR(58) NOT NULL,
    amount BIGINT NOT NULL,  -- microAlgos
    transaction_id VARCHAR(52),  -- Algorand txn ID
    status VARCHAR(20) NOT NULL,  -- pending, completed, failed
    created_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP,
    
    INDEX idx_expense (expense_id),
    INDEX idx_from (from_address),
    INDEX idx_to (to_address),
    INDEX idx_status (status)
);

-- Transaction Log (for indexing)
CREATE TABLE transactions (
    id SERIAL PRIMARY KEY,
    transaction_id VARCHAR(52) UNIQUE NOT NULL,
    block_number BIGINT,
    transaction_type VARCHAR(50) NOT NULL,
    sender VARCHAR(58),
    receiver VARCHAR(58),
    amount BIGINT,
    fee BIGINT,
    note TEXT,
    metadata JSONB,  -- Store additional data
    indexed_at TIMESTAMP DEFAULT NOW(),
    
    INDEX idx_txn_id (transaction_id),
    INDEX idx_type (transaction_type),
    INDEX idx_sender (sender),
    INDEX idx_receiver (receiver),
    INDEX idx_block (block_number)
);

-- Balances Cache (for quick access)
CREATE TABLE balances (
    id SERIAL PRIMARY KEY,
    group_id INTEGER REFERENCES groups(id),
    wallet_address VARCHAR(58) NOT NULL,
    balance BIGINT NOT NULL,  -- Net balance (positive = owed, negative = owes)
    updated_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(group_id, wallet_address),
    INDEX idx_group (group_id),
    INDEX idx_wallet (wallet_address)
);
```

### **Indexer Strategy**

```python
# Pseudo-code for indexer service
class TransactionIndexer:
    async def start(self):
        """Start indexing from last known block"""
        last_block = await self.get_last_indexed_block()
        
        while True:
            # Poll for new blocks
            latest_block = await algorand_client.status()
            
            if latest_block > last_block:
                await self.index_blocks(last_block + 1, latest_block)
                last_block = latest_block
            
            await asyncio.sleep(4)  # Algorand block time ~4s
    
    async def index_blocks(self, start: int, end: int):
        """Index transactions in block range"""
        for block in range(start, end + 1):
            txns = await algorand_client.block_info(block)
            
            for txn in txns['transactions']:
                await self.process_transaction(txn)
    
    async def process_transaction(self, txn: dict):
        """Process individual transaction"""
        if self.is_app_call(txn):
            await self.handle_app_call(txn)
        elif self.is_payment(txn):
            await self.handle_payment(txn)
        
        # Store in transaction log
        await self.store_transaction(txn)
```

---

## 🔐 Security Architecture

### **1. Wallet Authentication**

```python
# JWT-based authentication with wallet signature verification

class AuthService:
    async def generate_challenge(self, wallet_address: str) -> str:
        """Generate nonce for wallet signing"""
        nonce = secrets.token_hex(32)
        
        # Store nonce in cache (Redis) with TTL
        await cache.set(f"auth:nonce:{wallet_address}", nonce, ex=300)
        
        return nonce
    
    async def verify_signature(
        self, 
        wallet_address: str, 
        signature: bytes, 
        nonce: str
    ) -> str:
        """Verify wallet signature and return JWT"""
        # Retrieve stored nonce
        stored_nonce = await cache.get(f"auth:nonce:{wallet_address}")
        
        if not stored_nonce or stored_nonce != nonce:
            raise AuthenticationError("Invalid or expired nonce")
        
        # Verify signature
        message = f"AlgoCampus Login: {nonce}"
        is_valid = self.verify_algorand_signature(
            wallet_address, 
            message, 
            signature
        )
        
        if not is_valid:
            raise AuthenticationError("Invalid signature")
        
        # Delete used nonce
        await cache.delete(f"auth:nonce:{wallet_address}")
        
        # Generate JWT
        token = self.create_jwt(wallet_address)
        
        return token
```

### **2. Smart Contract Security**

**Access Control:**
```python
# Group admin verification
@external
def add_member(group_id: UInt64, member: Address) -> None:
    # Verify caller is group admin
    admin = self.get_group_admin(group_id)
    assert Txn.sender() == admin, "Only admin can add members"
    
    # Add member logic
```

**Input Validation:**
```python
# Validate split ratios
@external
def add_expense(..., splits: Bytes) -> UInt64:
    # Decode splits
    total = UInt64(0)
    for split in decode_splits(splits):
        total = total + split.ratio
    
    # Must sum to 100% (10000 basis points)
    assert total == UInt64(10000), "Splits must sum to 100%"
```

**Reentrancy Protection:**
```python
# Use atomic group transactions
@external
def execute_settlement(settlement_id: UInt64, payment_txn: Txn) -> None:
    # Verify this is in an atomic group
    assert Global.group_size() == UInt64(2), "Must be atomic group"
    
    # Verify payment transaction
    assert Gtxn[0].type_enum() == TxnType.Payment
    assert Gtxn[0].receiver() == self.get_settlement_creditor(settlement_id)
    
    # Update state only after verification
    self.mark_settled(settlement_id)
```

### **3. API Security**

```python
# Rate limiting
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

@app.post("/api/v1/expenses")
@limiter.limit("10/minute")  # Max 10 expenses per minute
async def create_expense(expense: ExpenseCreate, user: User = Depends(get_current_user)):
    pass

# Input validation
from pydantic import BaseModel, validator

class ExpenseCreate(BaseModel):
    group_id: int
    amount: int  # microAlgos
    description: str
    split_type: str
    
    @validator('amount')
    def validate_amount(cls, v):
        if v <= 0:
            raise ValueError("Amount must be positive")
        if v > 1_000_000_000_000:  # 1M ALGO max
            raise ValueError("Amount too large")
        return v
    
    @validator('description')
    def validate_description(cls, v):
        if len(v) > 500:
            raise ValueError("Description too long")
        return v
```

### **4. Contract Upgrade Strategy**

```python
# Upgradable contract pattern
class ExpenseTracker(ARC4Contract):
    version: UInt64 = UInt64(1)
    
    @external
    def upgrade(new_approval: Bytes, new_clear: Bytes) -> None:
        # Only contract creator can upgrade
        assert Txn.sender() == Global.creator_address()
        
        # Update application code
        InnerTxnBuilder.Begin()
        InnerTxnBuilder.SetFields({
            TxnField.type_enum: TxnType.ApplicationCall,
            TxnField.on_completion: OnComplete.UpdateApplication,
            TxnField.approval_program: new_approval,
            TxnField.clear_state_program: new_clear,
        })
        InnerTxnBuilder.Submit()
        
        # Increment version
        self.version = self.version + UInt64(1)
```

---

## 🔄 Data Flow Diagrams

### **Create Expense Flow**

```
User (Frontend)
    │
    │ 1. POST /api/v1/expenses
    │    {group_id, amount, description, splits}
    ▼
Backend API
    │
    │ 2. Validate input & auth
    │ 3. Build transaction
    ▼
Algorand SDK
    │
    │ 4. Call ExpenseTracker.add_expense()
    ▼
Smart Contract
    │
    │ 5. Validate caller is group member
    │ 6. Store expense in box storage
    │ 7. Emit event
    │ 8. Return expense_id
    ▼
Backend API
    │
    │ 9. Store in database (expense + splits)
    │ 10. Update balance cache
    ▼
Response to User
    {expense_id, transaction_id}
    │
    │ 11. Indexer picks up transaction
    ▼
Transaction Indexer
    │
    │ 12. Update transaction log
    │ 13. Emit WebSocket event
    ▼
Frontend (Real-time Update)
```

### **Settlement Flow**

```
User A (Debtor)
    │
    │ 1. Request optimal settlement plan
    │    GET /api/v1/settlements/optimize?group_id=1
    ▼
Backend API
    │
    │ 2. Fetch all unsettled expenses
    │ 3. Calculate net balances
    │ 4. Compute minimal transactions
    │ 5. Return settlement plan
    ▼
User A
    │
    │ 6. Approve settlement
    │    POST /api/v1/settlements/execute
    ▼
Backend API
    │
    │ 7. Build atomic group transaction:
    │    [0] Payment(A → B, amount)
    │    [1] AppCall(SettlementExecutor.execute_settlement)
    ▼
User A (Signs transaction)
    │
    │ 8. Submit signed group to network
    ▼
Algorand Network
    │
    │ 9. Atomic execution:
    │    - Verify payment
    │    - Update settlement state
    │    - Mark expenses as settled
    ▼
Backend API
    │
    │ 10. Update database
    │ 11. Update balance cache
    │ 12. Notify participants
    ▼
User B (Creditor)
    │
    │ 13. Receives payment + notification
```

---

## 🚀 Component Responsibilities

### **Smart Contracts (On-Chain)**
✅ Single source of truth for critical data  
✅ State transitions and validation  
✅ Access control enforcement  
✅ Event emission for indexing  
❌ No complex computations (gas optimization)  
❌ No variable-length iterations  
❌ No off-chain data storage

### **Backend API (Off-Chain)**
✅ Complex business logic  
✅ Data aggregation and caching  
✅ User authentication  
✅ Transaction building and signing  
✅ Real-time notifications  
❌ No critical state storage (use blockchain)  
❌ No fund custody

### **Database (Off-Chain)**
✅ Query optimization and indexing  
✅ Analytics and reporting  
✅ Full-text search  
✅ Relational data queries  
❌ Not source of truth (blockchain is)

### **Indexer Service**
✅ Transaction monitoring  
✅ Event parsing  
✅ Database synchronization  
✅ Real-time updates  

---

## 📋 Contract-to-API Mapping

| Smart Contract Method | API Endpoint | HTTP Method | Purpose |
|----------------------|--------------|-------------|---------|
| `GroupManager.create_group()` | `/api/v1/groups` | POST | Create new group |
| `GroupManager.add_member()` | `/api/v1/groups/{id}/members` | POST | Add member |
| `GroupManager.remove_member()` | `/api/v1/groups/{id}/members/{addr}` | DELETE | Remove member |
| `GroupManager.get_group_info()` | `/api/v1/groups/{id}` | GET | Get group details |
| `ExpenseTracker.add_expense()` | `/api/v1/expenses` | POST | Create expense |
| `ExpenseTracker.get_expense()` | `/api/v1/expenses/{id}` | GET | Get expense |
| `ExpenseTracker.calculate_balances()` | `/api/v1/groups/{id}/balances` | GET | Get balances |
| `SettlementExecutor.initiate_settlement()` | `/api/v1/settlements/initiate` | POST | Start settlement |
| `SettlementExecutor.execute_settlement()` | `/api/v1/settlements/execute` | POST | Execute payment |
| `SettlementExecutor.verify_settlement()` | `/api/v1/settlements/{id}` | GET | Check status |

---

## 🛠️ Implementation Checklist

### Phase 1: Smart Contracts
- [ ] GroupManager contract with box storage
- [ ] ExpenseTracker contract with split logic
- [ ] SettlementExecutor contract with atomic groups
- [ ] Unit tests (PyTest)
- [ ] Gas optimization analysis

### Phase 2: Backend API
- [ ] FastAPI project setup
- [ ] Database models (SQLAlchemy)
- [ ] Migration scripts (Alembic)
- [ ] Authentication service (JWT + wallet signature)
- [ ] CRUD endpoints for groups, expenses, settlements
- [ ] Algorand SDK integration
- [ ] Transaction builder utilities

### Phase 3: Indexer
- [ ] Block polling service
- [ ] Transaction parser
- [ ] Database synchronization
- [ ] WebSocket server for real-time updates

### Phase 4: Testing & Security
- [ ] API integration tests
- [ ] Contract security audit
- [ ] Rate limiting
- [ ] Input validation
- [ ] Error handling

### Phase 5: Deployment
- [ ] Docker containerization
- [ ] Environment configuration
- [ ] CI/CD pipeline
- [ ] Monitoring and logging

---

## 🔧 Gas Optimization Strategies

1. **Box Storage for Variable Data**
   - Use box storage for group members (variable length)
   - Cheaper than global state for large data

2. **Batch Operations**
   - Calculate all balances in one call
   - Use events instead of state reads

3. **Minimal State Updates**
   - Pack split ratios into bytes
   - Use bitmaps for membership

4. **Atomic Groups**
   - Combine payment + settlement in one group
   - No intermediate state

5. **Lazy Deletion**
   - Mark inactive instead of deleting
   - Avoids state refunds

---

## 📚 Development Resources

### AlgoKit Commands
```bash
# Generate client code
algokit generate client contracts/expense_tracker/contract.py --output clients/

# Deploy contracts
algokit deploy

# Test contracts
algokit test
```

### Backend Setup
```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows

# Install dependencies
pip install fastapi uvicorn sqlalchemy alembic py-algorand-sdk pydantic

# Run migrations
alembic upgrade head

# Start server
uvicorn app.main:app --reload
```

### Testing
```bash
# Contract tests
pytest tests/

# API tests
pytest backend/tests/ --cov

# Load testing
locust -f tests/load_test.py
```

---

## 🎯 Success Metrics

- **Hackathon Readiness**: ✅ Modular, can build incrementally
- **Gas Efficiency**: Target <0.01 ALGO per transaction
- **API Performance**: <100ms response time
- **Security**: Zero critical vulnerabilities
- **Scalability**: Support 1000+ concurrent users

---

## 📝 Next Steps

1. **Start with GroupManager contract** - Foundation for all features
2. **Build API authentication** - Critical for all endpoints
3. **Implement ExpenseTracker** - Core business logic
4. **Add Settlement functionality** - Payment execution
5. **Set up Indexer** - Real-time updates
6. **Frontend integration** - Connect React to API
7. **Testing & hardening** - Security audit
8. **Deployment** - Docker + CI/CD

---

**Architecture designed for:** Production-grade security, Hackathon speed, Gas optimization, Modular development

**Ready to implement!** 🚀
