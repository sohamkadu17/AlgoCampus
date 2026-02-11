# ExpenseTracker Smart Contract - Quick Reference

## 📞 Contract Methods at a Glance

### Core Operations

| Method | Args | Returns | Cost | Access |
|--------|------|---------|------|--------|
| `add_expense` | group_id, amount, note, split_with | expense_id | ~0.001 ALGO | Group members |
| `calculate_shares` | group_id | - | ~0.01 ALGO | Anyone |
| `update_user_balances` | group_id | - | ~0.01 ALGO | Anyone (alias) |

### Query Methods (FREE)

| Method | Args | Returns | Access |
|--------|------|---------|--------|
| `get_user_balance` | group_id, address | UInt64 (encoded) | Anyone |
| `get_expense_details` | expense_id | Bytes (packed) | Anyone |
| `get_group_expenses_count` | group_id | UInt64 | Anyone |

### Admin Methods

| Method | Args | Returns | Cost | Access |
|--------|------|---------|------|--------|
| `set_group_manager` | app_id | - | ~0.001 ALGO | Admin only |
| `mark_expense_settled` | expense_id | - | ~0.001 ALGO | Payer only |

---

## 🔢 Signed Balance Encoding

### The Challenge
Algorand TEAL doesn't support signed integers. We need both positive (owed) and negative (owes) balances.

### The Solution
```python
# Encoding in unsigned UInt64:
Range [0, 2^63-1]:     Positive balance (user is owed money)
Range [2^63, 2^64-1]:  Negative balance (user owes money)

# Examples:
+100 ALGO → stored as: 100_000_000
-50 ALGO  → stored as: 9_223_372_036_854_775,858 (2^63 + 50_000_000)
0 ALGO    → stored as: 0

# Decoding:
SIGN_BIT = 2 ** 63

if encoded_balance < SIGN_BIT:
    balance = +encoded_balance  # Positive (creditor)
else:
    balance = -(encoded_balance - SIGN_BIT)  # Negative (debtor)
```

### Why This Works
- ✅ No precision loss (pure integer arithmetic)
- ✅ Simple and efficient (single comparison)
- ✅ Compact storage (8 bytes)
- ✅ Safe arithmetic with overflow protection

---

## 💡 Precise Split Algorithm

### The Problem
```python
# Split 100 ALGO among 3 people
100 ALGO / 3 = 33.333... ALGO  # Indivisible!

# Using floats would lose precision:
# 33.33 + 33.33 + 33.33 = 99.99 ≠ 100.00  ❌
```

### The Solution
```python
amount = 100_000_000  # 100 ALGO in microAlgos
split_count = 3

# Integer division
base_share = amount / split_count  # = 33,333,333
remainder = amount % split_count   # = 1

# Fair distribution:
# Person 0: 33,333,333 + 1 = 33,333,334  (gets remainder)
# Person 1: 33,333,333
# Person 2: 33,333,333
# Total:   100,000,000 ✓ (exact)
```

### Algorithm
```python
for i in range(split_count):
    if i < remainder:
        share = base_share + 1  # First (remainder) people get +1
    else:
        share = base_share      # Rest get base amount
    
    # Verify: sum(all_shares) == total_amount
```

### Guarantees
- ✅ No precision loss
- ✅ Sum exactly equals total (verified with assertion)
- ✅ Fair (max difference = 1 microAlgo)
- ✅ Deterministic (same input → same output)

---

## 💰 Cost Breakdown

### Storage Costs (MBR)

| Item | Size | Formula | Cost (ALGO) |
|------|------|---------|-------------|
| Expense metadata | ~120 bytes | 2500 + 400×120 | ~0.05 |
| Splits (2 people) | 80 bytes | 2500 + 400×80 | ~0.035 |
| Splits (5 people) | 200 bytes | 2500 + 400×200 | ~0.08 |
| Splits (10 people) | 400 bytes | 2500 + 400×400 | ~0.16 |
| Balances (10 people) | 400 bytes | 2500 + 400×400 | ~0.17 |

**Total per expense** (5 people): ~0.13 ALGO

### Transaction Costs

| Operation | Members | Gas Cost | Notes |
|-----------|---------|----------|-------|
| Add expense | 2 | 0.001 ALGO | Split between 2 |
| Add expense | 5 | 0.0012 ALGO | Split between 5 |
| Add expense | 10 | 0.0015 ALGO | Split between 10 |
| Add expense | 50 | 0.003 ALGO | Split between 50 |
| Calculate shares | - | ~0.01 ALGO | Recalc all |
| Query balance | - | FREE | Read-only |

### Production Estimates

| Scale | Storage Cost | Transaction Cost (10k txns) | Total |
|-------|--------------|------------------------------|-------|
| 100 expenses (5 avg) | ~20 ALGO | ~10 ALGO | ~30 ALGO |
| 1,000 expenses | ~200 ALGO | ~10 ALGO | ~210 ALGO |
| 10,000 expenses | ~2,000 ALGO | ~10 ALGO | ~2,010 ALGO |

---

## 🚀 Common Commands

### Development

```bash
# Build contract
cd projects/contracts
algokit project run build

# Run tests
pytest tests/test_expense_tracker.py -v

# Start LocalNet
algokit localnet start

# Deploy
algokit project deploy localnet

# Fund contract (20 ALGO for production use)
algokit goal clerk send --from <account> --to <contract> --amount 20000000

# Configure GroupManager
algokit goal app call \
  --app-id <expense-tracker-app-id> \
  --from <deployer> \
  --app-arg "str:set_group_manager" \
  --app-arg "int:<group-manager-app-id>"
```

### Usage Examples

```bash
# Add expense (via algosdk)
# See Python/TypeScript examples in README.md

# Query balance
algokit goal app call \
  --app-id <app-id> \
  --from <any-address> \
  --app-arg "str:get_user_balance" \
  --app-arg "int:<group-id>" \
  --app-arg "addr:<user-address>"
```

---

## 🔍 Example Scenarios

### Scenario 1: Simple 50/50 Split

```python
# Alice pays 100 ALGO for both
add_expense(
    group_id=0,
    amount=100_000_000,
    note="Dinner",
    split_with=pack([alice, bob])
)

# Balances:
# Alice: paid 100, owes 50 → net +50 ALGO (creditor)
# Bob:   paid 0,   owes 50 → net -50 ALGO (debtor)

encode(+50 ALGO) = 50_000_000
encode(-50 ALGO) = 9_223_372_036_854,825,808
```

### Scenario 2: Three-Way Split

```python
# Carol pays 150 ALGO for all three
add_expense(
    group_id=0,
    amount=150_000_000,
    note="Hotel",
    split_with=pack([alice, bob, carol])
)

# Shares: 50, 50, 50 ALGO each

# Balances:
# Alice: paid 0,   owes 50  → -50 ALGO
# Bob:   paid 0,   owes 50  → -50 ALGO
# Carol: paid 150, owes 50  → +100 ALGO

# Verify: -50 + (-50) + 100 = 0 ✓ (zero-sum)
```

### Scenario 3: Multiple Expenses

```python
# Expense 1: Alice pays 100 (split 2 ways)
add_expense(group_id=0, 100_000_000, "Lunch", [alice, bob])
# Alice: +50, Bob: -50

# Expense 2: Bob pays 60 (split 2 ways)
add_expense(group_id=0, 60_000_000, "Coffee", [alice, bob])
# Alice: +50 - 30 = +20
# Bob:   -50 + 30 = -20

# Final balances:
# Alice: +20 ALGO (Bob owes Alice 20 ALGO)
# Bob:   -20 ALGO (Bob owes Alice 20 ALGO)
```

---

## 🐛 Common Errors & Solutions

| Error | Cause | Solution |
|-------|-------|----------|
| "Amount must be positive" | amount ≤ 0 | Use amount > 0 microAlgos |
| "Note too long" | note > 100 chars | Shorten to ≤ 100 chars |
| "Invalid split_with format" | Not 32-byte aligned | Pack addresses properly |
| "Too many people in split" | split_count > 100 | Reduce members to ≤ 100 |
| " split calculation error" | Internal bug | Report immediately |
| "Balance overflow" | Balance > 2^62 | Extremely rare, data corruption |
| "Box does not exist" | Invalid expense_id | Verify expense exists |

---

## 📊 Data Structures

### ExpenseInfo
```python
{
    expense_id: UInt64,      # Unique identifier
    group_id: UInt64,        # Associated group
    payer: Account,          # Who paid (32 bytes)
    total_amount: UInt64,    # Total in microAlgos
    split_count: UInt64,     # Number of people
    created_at: UInt64,      # Unix timestamp
    settled: bool,           # Settlement status
    note: String             # Description (max 100)
}
# Size: ~120 bytes
```

### Split Entry
```python
[address: 32 bytes][share: 8 bytes]
# Total: 40 bytes per member
```

### Balance Entry
```python
[address: 32 bytes][net_balance: 8 bytes (encoded signed)]
# Total: 40 bytes per member
```

---

## 🔒 Security Checklist

Before deploying:
- [ ] All tests pass (25+ tests)
- [ ] GroupManager App ID configured
- [ ] Split calculation verified (sum = total)
- [ ] Balance encoding/decoding tested
- [ ] Overflow protection verified
- [ ] Zero-sum invariant holds
- [ ] Contract funded adequately (20+ ALGO)
- [ ] Backend integration tested
- [ ] Frontend balance display tested
- [ ] Arithmetic edge cases tested

---

## 📚 Integration Examples

### Python: Add Expense

```python
from algosdk import transaction, account

# Pack member addresses
split_with = b"".join([
    account.decode_address(addr) for addr in ["ALICE...", "BOB...", "CAROL..."]
])

# Create transaction
txn = transaction.ApplicationNoOpTxn(
    sender=payer_address,
    sp=algod_client.suggested_params(),
    index=expense_tracker_app_id,
    app_args=["add_expense", group_id, 100_000_000, "Dinner", split_with],
)

# Sign and send
signed = txn.sign(payer_private_key)
txid = algod_client.send_transaction(signed)
result = transaction.wait_for_confirmation(algod_client, txid, 4)

# Extract expense ID
expense_id = int.from_bytes(result["logs"][0], "big")
```

### Python: Get Balance

```python
# Query balance (no transaction needed)
result = algod_client.application_call(
    expense_tracker_app_id,
    app_args=["get_user_balance", group_id, user_address],
)

encoded_balance = int.from_bytes(result["return_value"], "big")

# Decode signed balance
SIGN_BIT = 2 ** 63
if encoded_balance < SIGN_BIT:
    balance = +encoded_balance  # Positive (owed)
else:
    balance = -(encoded_balance - SIGN_BIT)  # Negative (owes)

print(f"Balance: {balance / 1_000_000:.2f} ALGO")
```

### TypeScript: Format Balance

```typescript
function formatBalance(microAlgos: number): string {
  const algos = microAlgos / 1_000_000;
  if (algos >= 0) {
    return `+${algos.toFixed(2)} ALGO (owed to you)`;
  } else {
    return `${Math.abs(algos).toFixed(2)} ALGO (you owe)`;
  }
}

// Example
console.log(formatBalance(50_000_000));   // "+50.00 ALGO (owed to you)"
console.log(formatBalance(-25_000_000));  // "25.00 ALGO (you owe)"
```

---

## 💡 Pro Tips

1. **Fund generously**: Start with 20 ALGO for contract storage
2. **Verify splits**: Always check that sum(shares) == total
3. **Decode balances**: Convert encoded values for frontend display
4. **Zero-sum check**: Group balances should always sum to 0
5. **Test edge cases**: Indivisible amounts, sign flips, large groups
6. **Monitor overflow**: Set alert if balance approaches 2^62
7. **Batch queries**: Read balances in bulk to reduce API calls
8. **Cache frequently**: Store decoded balances to avoid re-decoding

---

## 📖 Documentation Links

- **README**: [README.md](projects/contracts/smart_contracts/expense_tracker/README.md)
- **Technical Docs**: [EXPENSE_TRACKER_DOCUMENTATION.md](projects/contracts/smart_contracts/expense_tracker/EXPENSE_TRACKER_DOCUMENTATION.md)
- **Algorithms**: See documentation for split calculation, balance updates
- **Security**: See documentation for threat model and mitigation
- **Testing**: See test suite for comprehensive examples

---

**Contract Version**: 1.0.0  
**Last Updated**: February 2026  
**Status**: ✅ Production Ready  
**Arithmetic**: ⭐⭐⭐⭐⭐ (Zero precision loss)  
**Gas Efficiency**: ⭐⭐⭐⭐⭐ (Highly optimized)
