# GroupManager Smart Contract

Production-grade Algorand smart contract for expense split group management with QR invite functionality.

## 🎯 Features

- ✅ **Group Creation**: Create expense split groups with name and description
- ✅ **Member Management**: Add/remove members (admin-only)
- ✅ **QR Invite System**: Generate cryptographic invite hashes for easy joining
- ✅ **Access Control**: Role-based permissions (admin vs members)
- ✅ **Security**: Replay protection, expiration checks, one-time use enforcement
- ✅ **Gas Optimized**: Box storage for scalability, packed byte arrays

## 📋 Contract Methods

### Core Operations

```python
# Create a new group
group_id = create_group(name: String, description: String) -> UInt64

# Add member to group (admin only)
add_member(group_id: UInt64, new_member: Account) -> None

# Remove member from group (admin only, cannot remove admin)
remove_member(group_id: UInt64, member: Account) -> None
```

### QR Invite System

```python
# Generate invite hash (admin only, max 30 days validity)
invite_hash = generate_qr_invite_hash(
    group_id: UInt64,
    validity_seconds: UInt64
) -> Bytes[32]

# Join group via invite (anyone with valid hash)
group_id = join_group_via_qr(invite_hash: Bytes[32]) -> UInt64
```

### Query Methods (Read-Only, Free)

```python
get_group_info(group_id: UInt64) -> GroupInfo
get_group_description(group_id: UInt64) -> String
get_members(group_id: UInt64) -> List[Account]
is_member(group_id: UInt64, address: Account) -> Bool
is_admin(group_id: UInt64, address: Account) -> Bool
```

### Admin Methods

```python
deactivate_group(group_id: UInt64) -> None
reactivate_group(group_id: UInt64) -> None
```

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

### 1. Build the Contract

```bash
cd projects/contracts
algokit project run build
```

This compiles the contract to TEAL bytecode.

### 2. Deploy to LocalNet

```bash
# Start LocalNet
algokit localnet start

# Deploy
algokit project deploy localnet

# Or use the deployment script
python scripts/deploy_group_manager.py --network localnet
```

### 3. Deploy to TestNet

```bash
# Set your deployer mnemonic
export DEPLOYER_MNEMONIC="your 25 word mnemonic here"

# Deploy
algokit project deploy testnet

# Or use the script
python scripts/deploy_group_manager.py --network testnet
```

### 4. Fund the Contract

After deployment, you'll get an App ID and contract address. Fund it for box storage:

```bash
# Send 1 ALGO to cover storage
algokit goal clerk send \
  --from <your-account> \
  --to <contract-address> \
  --amount 1000000
```

### 5. Update Backend Configuration

```bash
# Edit backend/.env
GROUP_MANAGER_APP_ID=<your-app-id>
```

### 6. Run Tests

```bash
pytest tests/test_group_manager_enhanced.py -v
```

## 📊 Storage & Costs

### Storage Requirements (Minimum Balance)

Each data structure requires funding (MBR = 2500 + 400 × box_size microAlgos):

| Item | Size | Cost |
|------|------|------|
| Group metadata | ~100 bytes | ~0.043 ALGO |
| Group description | ~500 bytes | ~0.203 ALGO |
| Members (per 10) | 320 bytes | ~0.131 ALGO |
| Invite | ~56 bytes | ~0.025 ALGO |

**Example**: 100 groups with avg 5 members = ~40 ALGO storage

### Gas Costs per Transaction

| Operation | Cost | Notes |
|-----------|------|-------|
| `create_group` | ~0.001 ALGO | One-time per group |
| `add_member` | ~0.001 ALGO | Per member added |
| `remove_member` | ~0.001 ALGO | Per member removed |
| `generate_qr_invite` | ~0.001 ALGO | Per invite generated |
| `join_via_qr` | ~0.001 ALGO | Per user joining |
| Query methods | FREE | No transaction needed |

**Production estimate**: 10,000 transactions = ~10 ALGO in fees

## 🔒 Security Features

### Access Control

- ✅ Only authenticated users can create groups
- ✅ Only group admin can add/remove members
- ✅ Only group admin can generate invites
- ✅ Cannot remove the group admin
- ✅ All mutations verified via transaction sender

### Invite Security

- ✅ **Cryptographic hashing**: SHA512_256(group_id || nonce || timestamp || admin)
- ✅ **Expiration**: Max 30 days validity
- ✅ **One-time use**: Marked as used after first redemption
- ✅ **Replay protection**: Unique nonce per invite prevents replay attacks
- ✅ **Duplicate prevention**: Cannot join if already a member

### Data Integrity

- ✅ **Atomic operations**: Member count updates atomically with member changes
- ✅ **Input validation**: Name/description length checks
- ✅ **State consistency**: Cannot operate on inactive groups
- ✅ **Immutable audit trail**: All operations recorded on-chain

## 🧪 Testing

### Run Full Test Suite

```bash
pytest tests/test_group_manager_enhanced.py -v
```

### Test Categories

- ✅ **Group Creation**: Valid/invalid inputs, ID increments
- ✅ **Member Management**: Add/remove, access control, duplicate prevention
- ✅ **QR Invites**: Generation, expiration, one-time use, replay protection
- ✅ **Access Control**: Admin vs member permissions
- ✅ **Security**: Edge cases, attack vectors
- ✅ **Performance**: Large groups (50+ members)

### Example Test Output

```
tests/test_group_manager_enhanced.py::TestGroupCreation::test_create_group_success PASSED
tests/test_group_manager_enhanced.py::TestMemberManagement::test_add_member_success PASSED
tests/test_group_manager_enhanced.py::TestQRInviteSystem::test_join_via_qr_success PASSED
tests/test_group_manager_enhanced.py::TestSecurity::test_invite_hash_uniqueness PASSED
```

## 🔍 Monitoring

### On-Chain Queries

```python
# Get total groups created
group_counter = app_client.get_global_state()["group_counter"]

# Get group info
info = app_client.call("get_group_info", group_id=0)
print(f"Group: {info.name}, Members: {info.member_count}")

# Check membership
is_member = app_client.call("is_member", group_id=0, address=user_address)
```

### Database Analytics

```sql
-- Most active groups
SELECT group_id, COUNT(*) as member_count
FROM group_members
GROUP BY group_id
ORDER BY member_count DESC
LIMIT 10;

-- Invite usage rate
SELECT 
    COUNT(CASE WHEN used_at IS NOT NULL THEN 1 END) as used,
    COUNT(CASE WHEN expires_at < NOW() AND used_at IS NULL THEN 1 END) as expired,
    COUNT(*) as total
FROM invites;
```

## 📖 API Integration

### Backend Integration (Python)

```python
from algosdk.v2client import algod
from algosdk.transaction import ApplicationCallTxn
from algosdk import account

# Initialize client
algod_client = algod.AlgodClient(algod_token, algod_address)
app_id = 123456  # Your deployed App ID

# Create group
txn = ApplicationCallTxn(
    sender=user_address,
    sp=algod_client.suggested_params(),
    index=app_id,
    on_complete=OnComplete.NoOpOC,
    app_args=["create_group", "Apartment Roommates", "Shared expenses"],
)
signed_txn = txn.sign(private_key)
txn_id = algod_client.send_transaction(signed_txn)
result = wait_for_confirmation(algod_client, txn_id)

# Extract group_id from logs
group_id = result["logs"][0]
```

### Frontend Integration (TypeScript)

```typescript
import algosdk from "algosdk";

const algodClient = new algosdk.Algodv2(token, server, port);
const appId = 123456;

// Create group
const createGroup = async (name: string, description: string): Promise<number> => {
  const suggestedParams = await algodClient.getTransactionParams().do();
  
  const txn = algosdk.makeApplicationNoOpTxn(
    userAddress,
    suggestedParams,
    appId,
    [
      new Uint8Array(Buffer.from("create_group")),
      new Uint8Array(Buffer.from(name)),
      new Uint8Array(Buffer.from(description)),
    ]
  );
  
  const signedTxn = txn.signTxn(privateKey);
  const { txId } = await algodClient.sendRawTransaction(signedTxn).do();
  const result = await algosdk.waitForConfirmation(algodClient, txId, 4);
  
  // Extract group_id from logs
  const groupId = result.logs[0];
  return parseInt(groupId);
};

// Generate QR invite
const generateInvite = async (groupId: number): Promise<string> => {
  const validitySeconds = 86400; // 24 hours
  
  const txn = algosdk.makeApplicationNoOpTxn(
    userAddress,
    suggestedParams,
    appId,
    [
      new Uint8Array(Buffer.from("generate_qr_invite_hash")),
      algosdk.encodeUint64(groupId),
      algosdk.encodeUint64(validitySeconds),
    ]
  );
  
  const signedTxn = txn.signTxn(privateKey);
  const { txId } = await algodClient.sendRawTransaction(signedTxn).do();
  const result = await algosdk.waitForConfirmation(algodClient, txId, 4);
  
  // Extract invite hash (32 bytes)
  const inviteHash = Buffer.from(result.logs[0]).toString("base64");
  return inviteHash;
};

// Generate QR code for invite
const createQRCode = async (inviteHash: string): Promise<string> => {
  const qrData = JSON.stringify({
    app_id: appId,
    invite_hash: inviteHash,
    type: "group_invite",
  });
  
  // Use QR library to generate code
  return await QRCode.toDataURL(qrData);
};
```

## 🐛 Troubleshooting

### Common Issues

**"Insufficient balance" error**
- Fund the contract address for box storage (send at least 1 ALGO)

**"Box does not exist" error**
- Ensure contract is funded before creating groups
- Check that group_id exists using `get_group_info`

**"Not authorized" error**
- Verify transaction sender is the group admin
- Check that user is a group member for member-only operations

**"Invite expired" error**
- Generate a new invite (old one cannot be reused)
- Reduce validity duration if users join quickly

**"Already a member" error**
- User is already in the group, no need to join again

### Debug Mode

Enable verbose logging:

```bash
export ALGOD_DEBUG=1
algokit project deploy localnet
```

Check contract state:

```bash
algokit goal app read --app-id <app-id> --global
algokit goal app box list --app-id <app-id>
```

## 📚 Additional Resources

- [Full Technical Documentation](./CONTRACT_DOCUMENTATION.md)
- [Architecture Overview](../../../ARCHITECTURE.md)
- [Algorand Developer Docs](https://developer.algorand.org/)
- [AlgoPy Documentation](https://algorandfoundation.github.io/puya/)
- [AlgoKit Documentation](https://github.com/algorandfoundation/algokit-cli)

## 🤝 Contributing

1. Test changes thoroughly with full test suite
2. Update documentation for any API changes
3. Follow security best practices (see CONTRACT_DOCUMENTATION.md)
4. Run security checklist before PR

## 📄 License

MIT License - see LICENSE file for details

---

**Need Help?** Check [CONTRACT_DOCUMENTATION.md](./CONTRACT_DOCUMENTATION.md) for comprehensive technical details including security analysis, gas optimization, and deployment guides.
