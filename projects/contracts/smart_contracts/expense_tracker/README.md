# ExpenseTracker Smart Contract

Production-grade Algorand smart contract for expense tracking and automated settlement calculation with **precise integer arithmetic** and **signed balance tracking**.

## 🎯 Features

- ✅ **Add Expenses**: Record expenses with automatic per-person split calculation
- ✅ **Precise Arithmetic**: Nofloat precision loss - pure integer math
- ✅ **Balance Tracking**: Credit/debit system with signed integers
- ✅ **Auto-Split Calculation**: Equal splits with fair remainder distribution
- ✅ **Gas Optimized**: Box storage, packed arrays, minimal global state
- ✅ **Overflow Protection**: Safe arithmetic with ±2^62 limit
- ✅ **Scalable**: Supports 1000+ expenses per group

## 📋 Contract Methods

### Core Operations

```python
# Add expense with automatic split
expense_id = add_expense(
    group_id: UInt64,
    amount: UInt64,          # Total amount in microAlgos
    note: String,            # Description (max 100 chars)
    split_with: Bytes        # Packed array of member addresses
) -> UInt64

# Recalculate all balances from scratch
calculate_shares(group_id: UInt64) -> None

# Alias for calculate_shares
update_user_balances(group_id: UInt64) -> None
```

### Query Methods (Read-Only, FREE)

```python
# Get user's net balance in group
balance = get_user_balance(
    group_id: UInt64,
    wallet: Account
) -> UInt64  # Encoded: <2^63 = positive, ≥2^63 = negative

# Get expense details
details = get_expense_details(expense_id: UInt64) -> Bytes

# Count expenses in group
count = get_group_expenses_count(group_id: UInt64) -> UInt64
```

### Admin Methods

```python
# Mark expense as settled (payer only)
mark_expense_settled(expense_id: UInt64) -> None

# Set GroupManager App ID (admin only, once)
set_group_manager(app_id: UInt64) -> None
```

## 🔢 Signed Integer Encoding

**Challenge**: Algorand TEAL doesn't support signed integers. We need both positive (owed) and negative (owes) balances.

**Solution**: Encode signed values in unsigned UInt64:

```python
# Encoding
+100 ALGO → stored as: 100_000_000
-50 ALGO  → stored as: 9,223,372,036,854,775,858 (2^63 + 50_000_000)

# Decoding
if value < 2^63:
    balance = +value  # Positive (user is owed money)
else:
    balance = -(value - 2^63)  # Negative (user owes money)
```

**Benefits**:
- ✅ No precision loss (pure integer arithmetic)
- ✅ Simple encoding/decoding
- ✅ Overflow protection
- ✅ Efficient storage (8 bytes)

## 💡 Precise Split Calculation

**Problem**: Split 100 ALGO among 3 people = 33.333... ALGO each

**Solution**: Integer division with remainder distribution

```python
amount = 100_000_000  # 100 ALGO in microAlgos
split_count = 3

base_share = amount / split_count  # = 33,333,333
remainder = amount % split_count   # = 1

# Distribution:
# Person 0: 33,333,333 + 1 = 33,333,334  (gets remainder)
# Person 1: 33,333,333
# Person 2: 33,333,333
# Total: 100,000,000 ✓ (exact)
```

**Guarantees**:
- ✅ Sum of shares = exact amount (verified)
- ✅ No precision loss
- ✅ Fair distribution (difference ≤ 1 microAlgo)
- ✅ Deterministic

## 🚀 Quick Start

### Prerequisites

```bash
# Install AlgoKit
brew install algokit  # macOS
# or
pipx install algokit  # Other platforms

# Install dependencies
cd projects/contracts
poetry install
```

### 1. Deploy GroupManager First

ExpenseTracker requires GroupManager for membership verification.

```bash
# Build and deploy GroupManager
cd projects/contracts
algokit project run build
algokit project deploy localnet

# Save the GroupManager App ID
GROUP_MANAGER_APP_ID=<app-id>
```

### 2. Deploy ExpenseTracker

```bash
# Deploy
algokit project deploy localnet

# Save the ExpenseTracker App ID
EXPENSE_TRACKER_APP_ID=<app-id>
```

### 3. Fund the Contract

```bash
# Send 20 ALGO for box storage
algokit goal clerk send \
  --from <your-account> \
  --to <expense-tracker-address> \
  --amount 20000000
```

### 4. Configure GroupManager Integration

```bash
# Set GroupManager App ID
algokit goal app call \
  --app-id $EXPENSE_TRACKER_APP_ID \
  --from <deployer> \
  --app-arg "str:set_group_manager" \
  --app-arg "int:$GROUP_MANAGER_APP_ID"
```

### 5. Test the Contract

```bash
pytest tests/test_expense_tracker.py -v
```

## 📊 Storage & Costs

### Storage Requirements (Minimum Balance)

| Item | Size | Cost (ALGO) |
|------|------|-------------|
| Expense metadata | ~120 bytes | ~0.05 |
| Expense splits (5 people) | 200 bytes | ~0.08 |
| Expense splits (10 people) | 400 bytes | ~0.16 |
| Group balances (10 people) | 400 bytes | ~0.17 |

**Production Estimates**:
- 100 expenses (avg 5 members): ~20 ALGO
- 1,000 expenses: ~200 ALGO
- 10,000 expenses: ~2,000 ALGO

### Gas Costs per Transaction

| Operation | Members | Gas Cost |
|-----------|---------|----------|
| `add_expense` | 2 | 0.001 ALGO |
| `add_expense` | 5 | 0.0012 ALGO |
| `add_expense` | 10 | 0.0015 ALGO |
| `add_expense` | 50 | 0.003 ALGO |
| `calculate_shares` | - | ~0.01 ALGO |
| `get_user_balance` | - | FREE |

## 🔒 Security Features

### Arithmetic Safety

- ✅ **No Float Precision Loss**: Pure integer arithmetic
- ✅ **Overflow Protection**: Balance magnitude < 2^62 (~4.6M ALGO)
- ✅ **Split Verification**: Sum of shares = total (assertion)
- ✅ **Zero-Sum Invariant**: All balances sum to zero (closed system)

### Input Validation

- ✅ Amount > 0
- ✅ Note length ≤ 100 chars
- ✅ Split count > 0 and ≤ 100
- ✅ Split addresses 32-byte aligned
- ✅ Total calculation verification

### Access Control

- ✅ GroupManager integration for membership verification
- ✅ Only payer can mark expense as settled
- ✅ Only admin can set GroupManager App ID

## 🧪 Testing

### Run Full Test Suite

```bash
pytest tests/test_expense_tracker.py -v
```

### Test Categories

- ✅ **Split Calculation**: Equal splits, remainders, large groups
- ✅ **Balance Tracking**: Single/multiple expenses, three+ people
- ✅ **Signed Arithmetic**: Positive/negative, sign transitions
- ✅ **Input Validation**: Zero amount, long notes, invalid formats
- ✅ **Query Methods**: Nonexistent groups/users, expense counts
- ✅ **Integration**: Complete workflows, multi-group isolation

### Example Test Output

```
tests/test_expense_tracker.py::TestSplitCalculation::test_equal_split_with_remainder PASSED
tests/test_expense_tracker.py::TestBalanceTracking::test_single_expense_balances PASSED
tests/test_expense_tracker.py::TestSignedArithmetic::test_balance_flip_positive_to_negative PASSED
```

## 📖 API Integration

### Python (Backend)

```python
from algosdk import transaction, account
from algosdk.v2client import algod

algod_client = algod.AlgodClient(algod_token, algod_address)
expense_tracker_app_id = 123456

# Add expense
def add_expense(payer_pk, group_id, amount, note, member_addresses):
    """
    Add expense to blockchain
    
    Args:
        payer_pk: Private key of payer
        group_id: Group ID
        amount: Amount in microAlgos
        note: Description
        member_addresses: List of wallet addresses
    """
    # Pack member addresses (32 bytes each)
    split_with = b"".join([
        account.decode_address(addr) for addr in member_addresses
    ])
    
    params = algod_client.suggested_params()
    txn = transaction.ApplicationNoOpTxn(
        sender=account.address_from_private_key(payer_pk),
        sp=params,
        index=expense_tracker_app_id,
        app_args=[
            "add_expense",
            group_id,
            amount,
            note,
            split_with,
        ],
    )
    
    signed = txn.sign(payer_pk)
    txid = algod_client.send_transaction(signed)
    result = transaction.wait_for_confirmation(algod_client, txid, 4)
    
    # Extract expense_id from logs
    expense_id = int.from_bytes(result["logs"][0], "big")
    return expense_id

# Get balance
def get_user_balance(group_id, user_address):
    """
    Query user balance (read-only, no transaction needed)
    """
    result = algod_client.application_call(
        expense_tracker_app_id,
        app_args=["get_user_balance", group_id, user_address],
    )
    
    encoded_balance = int.from_bytes(result["return_value"], "big")
    
    # Decode signed balance
    SIGN_BIT = 2 ** 63
    if encoded_balance < SIGN_BIT:
        return +encoded_balance  # Positive (owed)
    else:
        return -(encoded_balance - SIGN_BIT)  # Negative (owes)

# Example usage
payer_pk = "your_private_key"
expense_id = add_expense(
    payer_pk=payer_pk,
    group_id=0,
    amount=100_000_000,  # 100 ALGO
    note="Dinner at restaurant",
    member_addresses=["ALICE...", "BOB...", "CAROL..."]
)

alice_balance = get_user_balance(group_id=0, user_address="ALICE...")
print(f"Alice balance: {alice_balance / 1_000_000:.2f} ALGO")
```

### TypeScript (Frontend)

```typescript
import algosdk from "algosdk";

const algodClient = new algosdk.Algodv2(token, server, port);
const expenseTrackerAppId = 123456;

// Add expense
async function addExpense(
  payer: algosdk.Account,
  groupId: number,
  amount: number,
  note: string,
  memberAddresses: string[]
): Promise<number> {
  // Pack member addresses
  const splitWith = new Uint8Array(memberAddresses.length * 32);
  memberAddresses.forEach((addr, i) => {
    const decoded = algosdk.decodeAddress(addr);
    splitWith.set(decoded.publicKey, i * 32);
  });
  
  const params = await algodClient.getTransactionParams().do();
  
  const txn = algosdk.makeApplicationNoOpTxn(
    payer.addr,
    params,
    expenseTrackerAppId,
    [
      new Uint8Array(Buffer.from("add_expense")),
      algosdk.encodeUint64(groupId),
      algosdk.encodeUint64(amount),
      new Uint8Array(Buffer.from(note)),
      splitWith,
    ]
  );
  
  const signedTxn = txn.signTxn(payer.sk);
  const { txId } = await algodClient.sendRawTransaction(signedTxn).do();
  const result = await algosdk.waitForConfirmation(algodClient, txId, 4);
  
  // Extract expense ID
  const expenseId = Number(result.logs[0]);
  return expenseId;
}

// Get balance
async function getUserBalance(
  groupId: number,
  userAddress: string
): Promise<number> {
  const result = await algodClient.applicationCall(
    expenseTrackerAppId,
    ["get_user_balance", groupId, userAddress]
  ).do();
  
  const encodedBalance = BigInt(result.returnValue);
  const SIGN_BIT = 2n ** 63n;
  
  if (encodedBalance < SIGN_BIT) {
    return Number(encodedBalance);  // Positive
  } else {
    return -Number(encodedBalance - SIGN_BIT);  // Negative
  }
}

// Format balance for display
function formatBalance(microAlgos: number): string {
  const algos = microAlgos / 1_000_000;
  if (algos >= 0) {
    return `+${algos.toFixed(2)} ALGO (owed to you)`;
  } else {
    return `${Math.abs(algos).toFixed(2)} ALGO (you owe)`;
  }
}

// Example usage
const expenseId = await addExpense(
  payer,
  groupId,
  100_000_000,  // 100 ALGO
  "Weekend trip",
  ["ALICE...", "BOB...", "CAROL..."]
);

const aliceBalance = await getUserBalance(groupId, "ALICE...");
console.log(formatBalance(aliceBalance));
```

## 🐛 Troubleshooting

### Common Issues

**"Box does not exist" error**
- Expense ID invalid or not created yet
- Solution: Verify expense_id exists

**"Balance overflow" error**
- Balance exceeds ±2^62 microAlgos (~4.6M ALGO)
- Solution: This is extremely rare - indicates data corruption

**"Split calculation error: total mismatch" error**
- Internal assertion (should never happen)
- Solution: Report as bug - arithmetic error detected

**"Amount must be positive" error**
- Tried to add expense with amount ≤ 0
- Solution: Use amount > 0 microAlgos

**"Note too long" error**
- Note exceeds 100 characters
- Solution: Shorten note to ≤ 100 chars

**"Too many people in split" error**
- More than 100 people in split
- Solution: Reduce members or split into multiple expenses

## 📚 Additional Resources

- **Technical Documentation**: [EXPENSE_TRACKER_DOCUMENTATION.md](./EXPENSE_TRACKER_DOCUMENTATION.md)
- **Architecture Overview**: [../../../ARCHITECTURE.md](../../../ARCHITECTURE.md)
- **GroupManager Contract**: [../group_manager/README.md](../group_manager/README.md)
- **Algorand Developer Docs**: [https://developer.algorand.org/](https://developer.algorand.org/)
- **AlgoPy Documentation**: [https://algorandfoundation.github.io/puya/](https://algorandfoundation.github.io/puya/)

## 🤝 Contributing

1. Test changes with full test suite
2. Update documentation for API changes
3. Follow security best practices
4. Verify arithmetic correctness

## 📄 License

MIT License - see LICENSE file for details

---

**Need Help?** Check [EXPENSE_TRACKER_DOCUMENTATION.md](./EXPENSE_TRACKER_DOCUMENTATION.md) for comprehensive technical details including algorithms, security analysis, and deployment guides.
