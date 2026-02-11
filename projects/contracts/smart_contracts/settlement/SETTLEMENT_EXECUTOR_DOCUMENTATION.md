# SettlementExecutor Smart Contract - Technical Documentation

**Version:** 1.0.0  
**Author:** AlgoCampus Team  
**Contract Type:** Stateful + Stateless Hybrid  
**Purpose:** Secure peer-to-peer debt settlement with atomic transaction execution

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Atomic Transaction Flows](#atomic-transaction-flows)
3. [Security Model](#security-model)
4. [Data Structures](#data-structures)
5. [Contract Methods](#contract-methods)
6. [Storage Strategy](#storage-strategy)
7. [Gas Optimization](#gas-optimization)
8. [Integration Guide](#integration-guide)
9. [Testing Strategy](#testing-strategy)
10. [Deployment Guide](#deployment-guide)

---

## Architecture Overview

### Hybrid Stateless + Stateful Design

The SettlementExecutor uses a hybrid architecture that combines:

**Stateful Component** (`contract.py`):
- Manages settlement state (initiated → executed)
- Stores settlement records in box storage
- Tracks settlement history for auditing
- Emits events for real-time indexing
- Integrates with ExpenseTracker contract

**Stateless Component** (`payment_validator.py`):
- Validates atomic group structure  
- Verifies payment transaction parameters
- Provides additional replay protection
- Can be used as LogicSig delegate

```
┌─────────────────────────────────────────────────────────┐
│                    Atomic Group                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  [Txn 0] Payment: Debtor → Creditor                   │
│          ├─ Amount: 50 ALGO                            │
│          ├─ Sender: Debtor (signed)                    │
│          └─ Receiver: Creditor                         │
│              │                                          │
│              │ Atomic Link (same group ID)             │
│              ▼                                          │
│  [Txn 1] AppCall: SettlementExecutor                   │
│          ├─ Method: execute_settlement(id)             │
│          ├─ Sender: Debtor (signed)                    │
│          └─ Validates Txn 0 parameters                 │
│                                                         │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
            ┌───────────────────────────┐
            │   SettlementExecutor      │
            │   Stateful Contract       │
            ├───────────────────────────┤
            │ 1. Load settlement record │
            │ 2. Verify not executed    │
            │ 3. Validate Txn 0 params  │
            │ 4. Mark executed          │
            │ 5. Call ExpenseTracker    │
            │ 6. Emit event             │
            └───────────────────────────┘
```

### Key Security Properties

1. **Atomicity**: Payment and verification happen in single atomic group
2. **Double-Payment Prevention**: Settlement can only be executed once
3. **Replay Protection**: Unique settlement IDs, expiration mechanism
4. **Signature Verification**: Debtor must sign both transactions
5. **Amount Validation**: Payment amount must match exactly
6. **Receiver Validation**: Payment receiver must match creditor

---

## Atomic Transaction Flows

### Flow 1: Successful Settlement Execution

```
Step 1: Initiate Settlement
───────────────────────────
Debtor calls: initiate_settlement(
    expense_id=123,
    group_id=5,
    debtor="DEBTOR_ADDR",
    creditor="CREDITOR_ADDR",
    amount=50_000_000,  # 50 ALGO
    note="Dinner split"
)

Contract Actions:
├─ Validate: debtor == Txn.sender ✓
├─ Validate: amount > 0 ✓
├─ Validate: debtor != creditor ✓
├─ Generate settlement_id = 42
├─ Store SettlementInfo in box storage
├─ Set expires_at = now + 24 hours
└─ Return settlement_id = 42

Result: Settlement created, pending execution


Step 2: Build Atomic Group
──────────────────────────
Frontend/Backend builds:

payment_txn = PaymentTxn(
    sender=debtor_address,
    receiver=creditor_address,
    amt=50_000_000,
    sp=suggested_params,
)

app_call_txn = ApplicationCallTxn(
    sender=debtor_address,
    index=settlement_app_id,
    app_args=["execute_settlement", 42],
    sp=suggested_params,
)

# Assign group ID  
gid = calculate_group_id([payment_txn, app_call_txn])
payment_txn.group = gid
app_call_txn.group = gid


Step 3: Sign and Submit
───────────────────────
signed_payment = payment_txn.sign(debtor_private_key)
signed_app_call = app_call_txn.sign(debtor_private_key)

txid = algod.send_transactions([
    signed_payment,
    signed_app_call
])


Step 4: Contract Execution
──────────────────────────
SettlementExecutor.execute_settlement(42):

├─ Verify: Txn.group_index == 1 ✓
├─ Load settlement from box storage
├─ Verify: not executed ✓
├─ Verify: not cancelled ✓
├─ Verify: not expired ✓
│
├─ Validate gtxn[0] (Payment):
│  ├─ sender == settlement.debtor ✓
│  ├─ receiver == settlement.creditor ✓
│  └─ amount == settlement.amount ✓
│
├─ Mark settlement.executed = True
├─ Store payment_txn_id
├─ Update box storage
│
├─ [Optional] Call ExpenseTracker.mark_expense_settled(123)
│
└─ Emit SettlementEvent to logs


Step 5: Result
─────────────
✅ Payment confirmed: 50 ALGO transferred
✅ Settlement marked executed  
✅ Expense marked settled (if integrated)
✅ Event emitted for indexing
✅ Both debtor and creditor can query settlement

Blockchain State:
├─ Debtor balance: -50 ALGO
├─ Creditor balance: +50 ALGO
└─ Settlement record: executed = True
```

### Flow 2: Settlement Cancellation

```
Before Execution:
────────────────
Debtor calls: cancel_settlement(settlement_id=42)

Contract Actions:
├─ Verify: Txn.sender == settlement.debtor ✓
├─ Verify: not executed ✓
├─ Verify: not cancelled ✓
├─ Set settlement.cancelled = True
└─ Update box storage

Result: Settlement cancelled, cannot be executed
```

### Flow 3: Expired Settlement Cleanup

```
After Expiration (24 hours):
────────────────────────────
Anyone calls: cleanup_expired_settlement(settlement_id=42)

Contract Actions:
├─ Verify: current_time > expires_at ✓
├─ Verify: not executed ✓
├─ Delete settlement box
└─ Reclaim MBR storage funds

Result: Storage freed, MBR returned to contract
```

---

## Security Model

### Threat Model

| Threat | Mitigation | Implementation |
|--------|-----------|----------------|
| **Double Payment** | Settlement can only be executed once | `assert not settlement.executed` |
| **Replay Attack** | Unique settlement IDs, expiration | Unique counter + expires_at check |
| **Amount Manipulation** | Exact amount verification | `assert payment.amount == settlement.amount` |
| **Receiver Substitution** | Creditor address validation | `assert payment.receiver == settlement.creditor` |
| **Sender Spoofing** | Signature verification | `assert payment.sender == settlement.debtor` |
| **Atomic Group Breaking** | Group index verification | `assert Txn.group_index == 1` |
| **Unauthorized Initiation** | Only debtor can initiate | `assert Txn.sender == debtor` |
| **Expired Settlement Execution** | Expiration check | `assert current_time <= expires_at` |
| **Cancelled Settlement Execution** | Cancellation check | `assert not settlement.cancelled` |
| **Rekey Attack** | No rekey allowed in payment | `assert Txn.rekey_to == zero_address` |
| **Close Remainder Attack** | No close allowed | `assert Txn.close_remainder_to == zero_address` |

### Security Validation Flow

```
execute_settlement(settlement_id):
│
├─ ATOMIC GROUP VALIDATION
│  ├─ Check: Is Txn 1 in group? ✓
│  ├─ Check: Group has 2 transactions? ✓
│  └─ Check: Txn 0 is Payment? ✓
│
├─ STATE VALIDATION
│  ├─ Check: Settlement exists? ✓
│  ├─ Check: Not executed? ✓
│  ├─ Check: Not cancelled? ✓
│  └─ Check: Not expired? ✓
│
├─ PAYMENT VALIDATION
│  ├─ Check: payment.sender == debtor? ✓
│  ├─ Check: payment.receiver == creditor? ✓
│  ├─ Check: payment.amount == settlement.amount? ✓
│  └─ Check: Debtor signed both txns? ✓
│
├─ STATE UPDATE
│  ├─ Set executed = True
│  ├─ Store payment_txn_id
│  ├─ Set executed_at = now
│  └─ Save to box storage
│
└─ POST-EXECUTION
   ├─ Mark expense settled (if integrated)
   └─ Emit settlement event
```

### Double-Payment Prevention

**Problem**: What if someone tries to execute the same settlement twice?

**Solution**: Three-layer protection:

```python
# Layer 1: Check executed flag BEFORE any state changes
assert not settlement.executed.native, "Settlement already executed"

# Layer 2: Atomic state update (no race conditions)
settlement.executed = arc4.Bool(True)
op.Box.put(box_key, settlement.bytes)

# Layer 3: Immutable transaction ID storage
settlement.payment_txn_id = arc4.StaticArray(...)

# Result: Second attempt will fail at Layer 1 ✓
```

**Attack Scenario**:
1. Attacker executes legitimate settlement ✓
2. Attacker tries to re-execute with different payment (hoping for double payout)
3. Contract loads settlement: `executed = True`
4. Assertion fails: "Settlement already executed" ❌
5. Attack prevented, no funds lost ✓

### Replay Protection

**Problem**: Could an attacker replay the same atomic group?

**Solution**: Four-layer protection:

```python
# Layer 1: Unique settlement IDs (monotonic counter)
settlement_id = self.settlement_counter  # Unique per settlement
self.settlement_counter += 1

# Layer 2: Executed flag (prevents re-execution)
assert not settlement.executed.native

# Layer 3: Expiration mechanism
assert Global.latest_timestamp <= settlement.expires_at.native

# Layer 4: Algorand transaction uniqueness
# Same transaction bytes cannot be submitted twice (blockchain consensus)
```

**Attack Scenario**:
1. Attacker records atomic group [Payment, AppCall]
2. Attacker tries to replay group after expiration
3. Contract checks: `current_time > expires_at`
4. Assertion fails: "Settlement expired" ❌
5. Even if not expired, `executed = True` prevents replay ✓

### Signature Verification

**Problem**: How do we ensure only the debtor authorizes the settlement?

**Solution**: Three-layer verification:

```python
# Layer 1: Only debtor can initiate
assert Txn.sender == debtor, "Only debtor can initiate"

# Layer 2: Payment must be signed by debtor (Algorand runtime enforces)
# Algorand blockchain rejects unsigned transactions automatically

# Layer 3: Both transactions must have same sender
assert payment_txn.sender == app_call_txn.sender, "Debtor must sign both"
```

**Attack Scenario**:
1. Malicious creditor tries to execute settlement without debtor's signature
2. Either:
   - Payment lacks valid signature → Rejected by Algorand node ❌
   - Or payment has wrong sender → Contract validation fails ❌
3. Settlement cannot be executed without debtor's private key ✓

---

## Data Structures

### SettlementInfo

Complete settlement record stored in box storage.

```python
class SettlementInfo(arc4.Struct):
    settlement_id: arc4.UInt64      # 8 bytes - Unique identifier
    expense_id: arc4.UInt64         # 8 bytes - Associated expense (or 0)
    group_id: arc4.UInt64           # 8 bytes - Associated group (or 0)
    debtor: arc4.Address            # 32 bytes - Who owes money
    creditor: arc4.Address          # 32 bytes - Who is owed money
    amount: arc4.UInt64             # 8 bytes - Settlement amount (microAlgos)
    initiated_at: arc4.UInt64       # 8 bytes - Creation timestamp
    executed_at: arc4.UInt64        # 8 bytes - Execution timestamp (0 if pending)
    executed: arc4.Bool             # 1 byte - Execution status
    payment_txn_id: [32]arc4.Byte   # 32 bytes - Payment transaction ID
    cancelled: arc4.Bool            # 1 byte - Cancellation status
    expires_at: arc4.UInt64         # 8 bytes - Expiration timestamp
    note: arc4.String               # Variable - Description (max 200 chars)

Total Size: ~200 bytes (note size varies)
```

**Field Purposes**:

- `settlement_id`: Unique identifier for deduplication and querying
- `expense_id`: Links settlement to ExpenseTracker expense (0 for standalone)
- `group_id`: Links to expense group for analytics
- `debtor`: Address that must sign payment transaction
- `creditor`: Address that receives payment
- `amount`: Exact payment amount (must match payment txn)
- `initiated_at`: When settlement was created (for tracking)
- `executed_at`: When payment was verified (0 if pending)
- `executed`: Flag for double-payment prevention
- `payment_txn_id`: Blockchain transaction ID for audit trail
- `cancelled`: If settlement was cancelled before execution
- `expires_at`: Timeout for cleanup (prevents indefinite pending)
- `note`: Human-readable description for UX

### SettlementEvent

Event data emitted to transaction logs for indexing.

```python
class SettlementEvent(arc4.Struct):
    settlement_id: arc4.UInt64      # 8 bytes
    debtor: arc4.Address            # 32 bytes
    creditor: arc4.Address          # 32 bytes
    amount: arc4.UInt64             # 8 bytes
    timestamp: arc4.UInt64          # 8 bytes
    payment_txn_id: [32]arc4.Byte   # 32 bytes

Total Size: 120 bytes
```

**Usage**: Backend indexer listens for these events to:
- Update settlement status in database
- Send real-time notifications to users
- Trigger webhook callbacks
- Update balance displays

---

## Contract Methods

### Administrative Methods

#### create_application()

**Purpose**: Initialize contract on deployment  
**Access**: CreateApplication only  
**Gas Cost**: ~0.001 ALGO  

```python
def create_application(self) -> None:
    """Initialize contract and set deployer as admin."""
```

**State Changes**:
- Sets `contract_admin` to deployer address
- Initializes `settlement_counter` to 0
- Sets `expense_tracker_app_id` to 0 (not configured)

---

#### set_expense_tracker(app_id)

**Purpose**: Configure ExpenseTracker integration  
**Access**: Admin only  
**Gas Cost**: ~0.001 ALGO  

```python
def set_expense_tracker(self, app_id: UInt64) -> None:
    """Set ExpenseTracker app ID for integration."""
```

**Parameters**:
- `app_id`: Application ID of deployed ExpenseTracker

**Usage**:
```bash
algokit goal app call \
  --app-id $SETTLEMENT_APP_ID \
  --from $ADMIN_ADDR \
  --app-arg "str:set_expense_tracker" \
  --app-arg "int:$EXPENSE_TRACKER_APP_ID"
```

---

#### set_admin(new_admin)

**Purpose**: Transfer admin privileges  
**Access**: Current admin only  
**Gas Cost**: ~0.001 ALGO  

```python
def set_admin(self, new_admin: Account) -> None:
    """Transfer admin to new address."""
```

---

### Core Settlement Methods

#### initiate_settlement(...)

**Purpose**: Create a settlement intent  
**Access**: Debtor only (sender must be debtor)  
**Gas Cost**: ~0.001 ALGO  
**Storage Cost**: ~0.08 ALGO (200 bytes)  

```python
def initiate_settlement(
    self,
    expense_id: UInt64,      # Associated expense (0 if standalone)
    group_id: UInt64,        # Associated group (0 if standalone)
    debtor: Account,         # Who owes money (must be sender)
    creditor: Account,       # Who is owed money
    amount: UInt64,          # Amount in microAlgos
    note: String,            # Description (max 200 chars)
) -> UInt64:                 # Returns: settlement_id
    """Create settlement record."""
```

**Validation**:
- ✅ `amount > 0`
- ✅ `debtor != creditor`
- ✅ `len(note) <= 200`
- ✅ `Txn.sender == debtor`

**Returns**: Unique `settlement_id` for execution

**Example**:
```python
from algosdk import transaction

# Create settlement
txn = transaction.ApplicationCallTxn(
    sender=debtor_address,
    index=settlement_app_id,
    app_args=[
        "initiate_settlement",
        123,  # expense_id
        5,    # group_id
        debtor_address,
        creditor_address,
        50_000_000,  # 50 ALGO
        "Dinner split settlement"
    ],
    sp=algod.suggested_params(),
)

signed = txn.sign(debtor_private_key)
txid = algod.send_transaction(signed)
result = transaction.wait_for_confirmation(algod, txid)

# Extract settlement_id from logs
settlement_id = int.from_bytes(result["logs"][0], "big")
```

---

#### execute_settlement(settlement_id)

**Purpose**: Execute settlement via atomic group  
**Access**: Debtor only (must be in atomic group with payment)  
**Gas Cost**: ~0.002 ALGO (includes inner txn if ExpenseTracker configured)  

**CRITICAL**: Must be called in atomic group with payment transaction.

```python
def execute_settlement(self, settlement_id: UInt64) -> None:
    """Execute settlement by verifying payment in atomic group."""
```

**Atomic Group Structure**:
```
[Txn 0] Payment: debtor → creditor (amount)
[Txn 1] AppCall: execute_settlement(settlement_id) ← THIS METHOD
```

**Validation**:
- ✅ `Txn.group_index == 1`
- ✅ `not settlement.executed`
- ✅ `not settlement.cancelled`
- ✅ `current_time <= expires_at`
- ✅ `gtxn[0].sender == settlement.debtor`
- ✅ `gtxn[0].receiver == settlement.creditor`
- ✅ `gtxn[0].amount == settlement.amount`

**State Changes**:
- Sets `executed = True`
- Sets `executed_at = current_timestamp`
- Stores `payment_txn_id`
- Calls ExpenseTracker (if configured)
- Emits SettlementEvent

**Complete Example**:
```python
from algosdk import transaction
from algosdk.atomic_transaction_composer import AtomicTransactionComposer

# Step 1: Create payment transaction
payment_txn = transaction.PaymentTxn(
    sender=debtor_address,
    receiver=creditor_address,
    amt=50_000_000,  # Must match settlement amount exactly
    sp=algod.suggested_params(),
)

# Step 2: Create app call transaction
app_call_txn = transaction.ApplicationCallTxn(
    sender=debtor_address,
    index=settlement_app_id,
    app_args=["execute_settlement", settlement_id],
    sp=algod.suggested_params(),
)

# Step 3: Create atomic group
gid = transaction.calculate_group_id([payment_txn, app_call_txn])
payment_txn.group = gid
app_call_txn.group = gid

# Step 4: Sign both transactions
signed_payment = payment_txn.sign(debtor_private_key)
signed_app_call = app_call_txn.sign(debtor_private_key)

# Step 5: Send atomic group
txid = algod.send_transactions([signed_payment, signed_app_call])

# Step 6: Wait for confirmation
result = transaction.wait_for_confirmation(algod, txid, 4)
print(f"Settlement executed in block {result['confirmed-round']}")
```

---

#### cancel_settlement(settlement_id)

**Purpose**: Cancel pending settlement before execution  
**Access**: Debtor only  
**Gas Cost**: ~0.001 ALGO  

```python
def cancel_settlement(self, settlement_id: UInt64) -> None:
    """Cancel settlement before execution."""
```

**Validation**:
- ✅ `Txn.sender == settlement.debtor`
- ✅ `not settlement.executed`
- ✅ `not settlement.cancelled`

**Use Cases**:
- Wrong amount entered
- Changed mind about settlement
- Want to batch multiple settlements

---

#### cleanup_expired_settlement(settlement_id)

**Purpose**: Remove expired settlement to reclaim storage  
**Access**: Anyone (after expiration)  
**Gas Cost**: ~0.001 ALGO  
**MBR Reclaimed**: ~0.08 ALGO  

```python
def cleanup_expired_settlement(self, settlement_id: UInt64) -> None:
    """Delete expired settlement and reclaim MBR."""
```

**Validation**:
- ✅ `current_time > expires_at`
- ✅ `not settlement.executed`

**Note**: Executed settlements cannot be cleaned up (audit trail).

---

### Query Methods (FREE)

All query methods are read-only and have **zero gas cost**.

#### verify_settlement_state(settlement_id)

```python
def verify_settlement_state(self, settlement_id: UInt64) -> arc4.Bool:
    """Check if settlement has been executed."""
```

**Returns**: `True` if executed, `False` otherwise

---

#### get_settlement_details(settlement_id)

```python
def get_settlement_details(self, settlement_id: UInt64) -> SettlementInfo:
    """Get complete settlement information."""
```

**Returns**: Full `SettlementInfo` struct

---

#### get_debtor_settlements(debtor)

```python
def get_debtor_settlements(self, debtor: Account) -> arc4.DynamicArray[arc4.UInt64]:
    """Get all settlement IDs where address is debtor."""
```

**Returns**: Array of settlement IDs

---

#### get_creditor_settlements(creditor)

```python
def get_creditor_settlements(self, creditor: Account) -> arc4.DynamicArray[arc4.UInt64]:
    """Get all settlement IDs where address is creditor."""
```

**Returns**: Array of settlement IDs

---

## Storage Strategy

### Global State (48 bytes)

Minimal global state for gas efficiency:

```
┌─────────────────────────────────────────┐
│ Global State (48 bytes total)          │
├─────────────────────────────────────────┤
│ contract_admin (32 bytes)               │
│ └─ Account                              │
│                                         │
│ expense_tracker_app_id (8 bytes)        │
│ └─ UInt64                               │
│                                         │
│ settlement_counter (8 bytes)            │
│ └─ UInt64 (next settlement ID)          │
└─────────────────────────────────────────┘
```

### Box Storage

All variable-length data uses box storage for gas optimization:

```
Box Keys:
├─ settlement_{id}           → SettlementInfo (~200 bytes)
├─ debtor_{address}          → Array of settlement IDs
└─ creditor_{address}        → Array of settlement IDs
```

**Storage Cost Calculation**:

```
Box MBR = 2,500 microAlgos + (400 microAlgos × box_size)

Settlement box (200 bytes):
= 2,500 + (400 × 200)
= 2,500 + 80,000
= 82,500 microAlgos
= 0.0825 ALGO
≈ 0.08 ALGO

Debtor/Creditor lists (10 settlements = 80 bytes):
= 2,500 + (400 × 80)
= 2,500 + 32,000
= 34,500 microAlgos
≈ 0.035 ALGO
```

**Production Estimate** (1000 settlements):
- Settlement boxes: 1000 × 0.08 = **80 ALGO**
- Debtor/Creditor lists: ~100 users × 0.035 × 2 = **7 ALGO**
- **Total storage: ~87 ALGO**

---

## Gas Optimization

### Transaction Cost Breakdown

| Operation | Gas Cost | Notes |
|-----------|----------|-------|
| initiate_settlement | 0.001 ALGO | Single transaction |
| execute_settlement | 0.002 ALGO | Atomic group (2 txns) |
| cancel_settlement | 0.001 ALGO | Single transaction |
| cleanup_expired_settlement | 0.001 ALGO | Recoups storage MBR |
| Query methods | FREE | Read-only, no gas |

### Optimization Techniques

1. **Box Storage Instead of Global State**
   - Global state: 2,500 + 25,000 per entry = expensive
   - Box storage: 2,500 + 400 per byte = **90% cheaper**

2. **Minimal Global State**
   - Only 48 bytes total (3 fields)
   - Reduces contract deployment cost

3. **Packed Data Structures**
   - `SettlementInfo`: Efficiently packed (~200 bytes)
   - No wasted padding or alignment

4. **Single Atomic Group Verification**
   - All validations in one pass
   - No redundant box reads

5. **Optional ExpenseTracker Integration**
   - Only calls if configured
   - Saves gas for standalone settlements

6. **Lazy Cleanup**
   - Expired settlements can be cleaned by anyone
   - Distributes cleanup costs

---

## Integration Guide

### Backend Integration (Python)

#### Initialize Settlement

```python
from algosdk import transaction
from algosdk.v2client import algod

def create_settlement(
    algod_client: algod.AlgodClient,
    settlement_app_id: int,
    debtor_address: str,
    debtor_private_key: str,
    creditor_address: str,
    amount: int,  # microAlgos
    expense_id: int = 0,
    group_id: int = 0,
    note: str = "",
) -> int:
    """
    Create a settlement intent.
    
    Returns:
        settlement_id: Unique identifier for the settlement
    """
    sp = algod_client.suggested_params()
    
    txn = transaction.ApplicationCallTxn(
        sender=debtor_address,
        index=settlement_app_id,
        on_complete=transaction.OnComplete.NoOpOC,
        app_args=[
            "initiate_settlement",
            expense_id,
            group_id,
            debtor_address,
            creditor_address,
            amount,
            note,
        ],
        sp=sp,
    )
    
    signed_txn = txn.sign(debtor_private_key)
    tx_id = algod_client.send_transaction(signed_txn)
    
    result = transaction.wait_for_confirmation(algod_client, tx_id, 4)
    
    # Extract settlement_id from logs
    if "logs" in result and len(result["logs"]) > 0:
        settlement_id = int.from_bytes(
            base64.b64decode(result["logs"][0]), "big"
        )
        return settlement_id
    
    raise ValueError("No settlement ID returned")
```

#### Execute Settlement (Atomic Group)

```python
def execute_settlement(
    algod_client: algod.AlgodClient,
    settlement_app_id: int,
    settlement_id: int,
    debtor_address: str,
    debtor_private_key: str,
    creditor_address: str,
    amount: int,  # microAlgos
) -> str:
    """
    Execute settlement via atomic transaction group.
    
    Returns:
        tx_id: Transaction ID of atomic group
    """
    sp = algod_client.suggested_params()
    
    # Transaction 0: Payment
    payment_txn = transaction.PaymentTxn(
        sender=debtor_address,
        receiver=creditor_address,
        amt=amount,
        sp=sp,
    )
    
    # Transaction 1: App Call
    app_call_txn = transaction.ApplicationCallTxn(
        sender=debtor_address,
        index=settlement_app_id,
        on_complete=transaction.OnComplete.NoOpOC,
        app_args=["execute_settlement", settlement_id],
        sp=sp,
    )
    
    # Create atomic group
    gid = transaction.calculate_group_id([payment_txn, app_call_txn])
    payment_txn.group = gid
    app_call_txn.group = gid
    
    # Sign both transactions
    signed_payment = payment_txn.sign(debtor_private_key)
    signed_app_call = app_call_txn.sign(debtor_private_key)
    
    # Send atomic group
    tx_id = algod_client.send_transactions([signed_payment, signed_app_call])
    
    # Wait for confirmation
    result = transaction.wait_for_confirmation(algod_client, tx_id, 4)
    
    print(f"Settlement executed in block {result['confirmed-round']}")
    return tx_id
```

#### Query Settlement Status

```python
def get_settlement_status(
    algod_client: algod.AlgodClient,
    settlement_app_id: int,
    settlement_id: int,
) -> dict:
    """
    Query settlement details.
    
    Returns:
        Settlement information dictionary
    """
    # Call get_settlement_details (read-only)
    txn = transaction.ApplicationCallTxn(
        sender="ANY_ADDRESS",  # Can be any address for queries
        index=settlement_app_id,
        on_complete=transaction.OnComplete.NoOpOC,
        app_args=["get_settlement_details", settlement_id],
        sp=algod_client.suggested_params(),
    )
    
    # For read-only calls, can use dryrun
    dryrun_result = algod_client.dryrun(txn)
    
    # Parse SettlementInfo from result
    # (Implementation depends on ABI parsing)
    
    return {
        "settlement_id": settlement_id,
        "executed": True,  # Parse from result
        "amount": 50_000_000,  # Parse from result
        # ... other fields
    }
```

---

### Frontend Integration (TypeScript)

#### Create and Execute Settlement

```typescript
import algosdk from "algosdk";

async function executeFullSettlement(
  algodClient: algosdk.Algodv2,
  settlementAppId: number,
  debtorAccount: algosdk.Account,
  creditorAddress: string,
  amount: number,  // microAlgos
  expenseId: number = 0,
  groupId: number = 0,
  note: string = ""
): Promise<{settlementId: number, txId: string}> {
  
  // Step 1: Initiate settlement
  const sp = await algodClient.getTransactionParams().do();
  
  const initTxn = algosdk.makeApplicationNoOpTxn(
    debtorAccount.addr,
    sp,
    settlementAppId,
    [
      new Uint8Array(Buffer.from("initiate_settlement")),
      algosdk.encodeUint64(expenseId),
      algosdk.encodeUint64(groupId),
      algosdk.decodeAddress(debtorAccount.addr).publicKey,
      algosdk.decodeAddress(creditorAddress).publicKey,
      algosdk.encodeUint64(amount),
      new Uint8Array(Buffer.from(note)),
    ]
  );
  
  const signedInitTxn = initTxn.signTxn(debtorAccount.sk);
  const {txId: initTxId} = await algodClient.sendRawTransaction(signedInitTxn).do();
  
  const initResult = await algosdk.waitForConfirmation(algodClient, initTxId, 4);
  const settlementId = Number(
    Buffer.from(initResult.logs[0], "base64").readBigUInt64BE()
  );
  
  console.log(`Settlement initiated: ID = ${settlementId}`);
  
  // Step 2: Execute settlement (atomic group)
  const sp2 = await algodClient.getTransactionParams().do();
  
  // Payment transaction
  const paymentTxn = algosdk.makePaymentTxnWithSuggestedParams(
    debtorAccount.addr,
    creditorAddress,
    amount,
    undefined,
    undefined,
    sp2
  );
  
  // App call transaction
  const appCallTxn = algosdk.makeApplicationNoOpTxn(
    debtorAccount.addr,
    sp2,
    settlementAppId,
    [
      new Uint8Array(Buffer.from("execute_settlement")),
      algosdk.encodeUint64(settlementId),
    ]
  );
  
  // Create atomic group
  const txns = [paymentTxn, appCallTxn];
  algosdk.assignGroupID(txns);
  
  // Sign both
  const signedPayment = paymentTxn.signTxn(debtorAccount.sk);
  const signedAppCall = appCallTxn.signTxn(debtorAccount.sk);
  
  // Send atomic group
  const {txId: execTxId} = await algodClient
    .sendRawTransaction([signedPayment, signedAppCall])
    .do();
  
  await algosdk.waitForConfirmation(algodClient, execTxId, 4);
  
  console.log(`Settlement executed: TX = ${execTxId}`);
  
  return {settlementId, txId: execTxId};
}
```

---

## Testing Strategy

### Unit Tests

Test individual contract methods in isolation:

```python
# test_settlement_executor.py

class TestSettlementInitiation:
    def test_initiate_valid_settlement(self):
        """Test creating a valid settlement."""
        
    def test_initiate_zero_amount_fails(self):
        """Test that zero amount is rejected."""
        
    def test_initiate_same_debtor_creditor_fails(self):
        """Test that debtor == creditor fails."""
        
    def test_initiate_non_debtor_sender_fails(self):
        """Test that only debtor can initiate."""

class TestSettlementExecution:
    def test_execute_valid_settlement(self):
        """Test successful atomic group execution."""
        
    def test_execute_wrong_amount_fails(self):
        """Test that amount mismatch fails."""
        
    def test_execute_wrong_receiver_fails(self):
        """Test that receiver mismatch fails."""
        
    def test_execute_double_execution_fails(self):
        """Test double-payment prevention."""
        
    def test_execute_cancelled_settlement_fails(self):
        """Test that cancelled settlements cannot execute."""
        
    def test_execute_expired_settlement_fails(self):
        """Test that expired settlements fail."""

class TestSettlementCancellation:
    def test_cancel_valid_settlement(self):
        """Test cancelling pending settlement."""
        
    def test_cancel_executed_settlement_fails(self):
        """Test that executed settlements cannot cancel."""
        
    def test_cancel_non_debtor_fails(self):
        """Test that only debtor can cancel."""

class TestSettlementQueries:
    def test_verify_executed_settlement(self):
        """Test querying executed settlement status."""
        
    def test_get_settlement_details(self):
        """Test retrieving full settlement info."""
        
    def test_get_debtor_settlements(self):
        """Test listing debtor's settlements."""
        
    def test_get_creditor_settlements(self):
        """Test listing creditor's settlements."""
```

### Integration Tests

Test full end-to-end workflows:

```python
class TestIntegrationScenarios:
    def test_complete_settlement_flow(self):
        """Test: initiate → execute → verify."""
        
    def test_settlement_with_expense_tracker(self):
        """Test ExpenseTracker integration."""
        
    def test_multiple_settlements_same_expense(self):
        """Test multiple settlements for one expense."""
        
    def test_concurrent_settlements(self):
        """Test multiple settlements in parallel."""
        
    def test_expired_settlement_cleanup(self):
        """Test cleanup after expiration."""
```

### Security Tests

Test attack scenarios:

```python
class TestSecurityScenarios:
    def test_replay_attack_prevention(self):
        """Test that same atomic group cannot replay."""
        
    def test_double_payment_prevention(self):
        """Test that settlement executes only once."""
        
    def test_amount_manipulation_prevention(self):
        """Test that payment amount must match exactly."""
        
    def test_receiver_substitution_prevention(self):
        """Test that payment receiver cannot be changed."""
        
    def test_atomic_group_breaking_prevention(self):
        """Test that execute_settlement fails outside atomic group."""
        
    def test_unauthorized_initiation_prevention(self):
        """Test that non-debtor cannot initiate."""
```

---

## Deployment Guide

### Step 1: Build Contract

```bash
cd projects/contracts
algokit project run build
```

**Output**: `settlement_executor.approval.teal`, `settlement_executor.clear.teal`

---

### Step 2: Deploy to LocalNet

```bash
# Start LocalNet
algokit localnet start

# Deploy contract
algokit project deploy localnet

# Save app ID
SETTLEMENT_APP_ID=<app_id_from_output>
```

---

### Step 3: Fund Contract

```bash
# Fund contract for box storage (50 ALGO for production)
algokit goal clerk send \
  --from <your-account> \
  --to <settlement-contract-address> \
  --amount 50000000 \
  --ledger /path/to/localnet
```

---

### Step 4: Configure ExpenseTracker Integration

```bash
# Set ExpenseTracker app ID
algokit goal app call \
  --app-id $SETTLEMENT_APP_ID \
  --from <deployer-address> \
  --app-arg "str:set_expense_tracker" \
  --app-arg "int:$EXPENSE_TRACKER_APP_ID" \
  --ledger /path/to/localnet
```

---

### Step 5: Test Settlement

```bash
# Python test script
python scripts/test_settlement.py
```

---

### Step 6: Deploy to TestNet

```bash
# Deploy to TestNet
algokit project deploy testnet

# Update backend/.env
SETTLEMENT_EXECUTOR_APP_ID=<testnet_app_id>
EXPENSE_TRACKER_APP_ID=<testnet_app_id>
```

---

## Monitoring & Analytics

### Key Metrics

Monitor these metrics in production:

1. **Settlement Volume**
   - Total settlements initiated
   - Total settlements executed
   - Total settlements cancelled
   - Success rate: executed / initiated

2. **Financial Metrics**
   - Total volume settled (in ALGO)
   - Average settlement amount
   - Largest settlement
   - Settlement velocity (per day)

3. **Performance Metrics**
   - Average time from initiation to execution
   - Expiration rate (expired / initiated)
   - Gas costs per transaction
   - Storage costs per settlement

4. **Security Metrics**
   - Failed execution attempts
   - Cancellation rate
   - Replay attack attempts (should be 0)
   - Double-payment attempts (should all fail)

### Query Examples

```sql
-- Settlement success rate
SELECT 
  COUNT(*) as total_initiated,
  SUM(CASE WHEN executed = true THEN 1 ELSE 0 END) as executed,
  SUM(CASE WHEN cancelled = true THEN 1 ELSE 0 END) as cancelled,
  ROUND(100.0 * SUM(CASE WHEN executed = true THEN 1 ELSE 0 END) / COUNT(*), 2) as success_rate
FROM settlements;

-- Top debtors by volume
SELECT 
  debtor,
  COUNT(*) as settlement_count,
  SUM(amount) as total_amount_settled
FROM settlements
WHERE executed = true
GROUP BY debtor
ORDER BY total_amount_settled DESC
LIMIT 10;

-- Average settlement metrics
SELECT 
  AVG(amount) as avg_amount,
  AVG(executed_at - initiated_at) as avg_time_to_execute_seconds,
  MIN(amount) as min_amount,
  MAX(amount) as max_amount
FROM settlements
WHERE executed = true;
```

---

## Security Audit Checklist

Before production deployment, verify:

- [ ] All unit tests pass (100% coverage)
- [ ] Integration tests pass
- [ ] Security tests pass (all attack scenarios prevented)
- [ ] Double-payment prevention verified
- [ ] Replay protection verified
- [ ] Atomic group validation verified
- [ ] Signature verification tested
- [ ] Amount validation tested
- [ ] Receiver validation tested
- [ ] Expiration mechanism tested
- [ ] ExpenseTracker integration tested
- [ ] Event logging tested
- [ ] Box storage costs calculated
- [ ] Gas costs measured
- [ ] Contract funded adequately
- [ ] Admin controls tested
- [ ] Emergency procedures documented

---

**End of Technical Documentation**

For user-facing documentation, see [README.md](README.md).
