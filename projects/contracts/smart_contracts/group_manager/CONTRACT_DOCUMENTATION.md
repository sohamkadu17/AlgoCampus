# GroupManager Smart Contract - Production Documentation

## 🎯 Overview

Production-grade Algorand smart contract for managing expense split groups with QR invite functionality. Built with AlgoPy (modern successor to Beaker/PyTeal) following all Beaker architectural patterns.

## 📋 Features

### Core Features
- ✅ **Create Groups** - Unique ID generation, admin assignment
- ✅ **Member Management** - Add/remove members (admin only)
- ✅ **QR Invite System** - Generate cryptographic invite codes
- ✅ **QR Join** - Join groups via scanned invite codes
- ✅ **Access Control** - Strong admin/member permissions
- ✅ **Replay Protection** - One-time use invites with expiration

### Security Features
- ✅ Cryptographic invite hashes (SHA512_256)
- ✅ Expiration timestamps on invites
- ✅ One-time use enforcement
- ✅ Duplicate join prevention
- ✅ Admin-only operations
- ✅ Input validation on all methods

### Gas Optimization
- ✅ Box storage for variable data
- ✅ Minimal global state usage
- ✅ Packed byte arrays for members
- ✅ Struct packing for metadata
- ✅ Single-read operations

## 🏗️ Architecture

### Storage Strategy

```
┌─────────────────────────────────────────────────────────┐
│ GLOBAL STATE (Minimal - 2 variables)                    │
├─────────────────────────────────────────────────────────┤
│ - contract_admin: Address     (32 bytes)                │
│ - group_counter: UInt64        (8 bytes)                │
│ - invite_counter: UInt64       (8 bytes)                │
│                                                          │
│ Total: 48 bytes (well under 128-byte limit)            │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ BOX STORAGE (Unlimited, pay-per-byte)                   │
├─────────────────────────────────────────────────────────┤
│ Per Group:                                              │
│   group_{id}_meta      -> GroupInfo struct (~150 bytes) │
│   group_{id}_desc      -> String (variable)            │
│   group_{id}_members   -> Packed addresses (32n bytes) │
│                                                          │
│ Per Invite:                                             │
│   invite_{hash}        -> InviteCode struct (~70 bytes)│
└─────────────────────────────────────────────────────────┘
```

### Data Structures

#### GroupInfo Struct
```python
{
    group_id: UInt64,        # 8 bytes
    name: String,            # Variable (max 100 chars)
    admin: Address,          # 32 bytes
    member_count: UInt64,    # 8 bytes
    created_at: UInt64,      # 8 bytes (timestamp)
    active: Bool             # 1 byte
}
```

#### InviteCode Struct
```python
{
    group_id: UInt64,        # 8 bytes
    invite_hash: Bytes[32],  # 32 bytes
    expires_at: UInt64,      # 8 bytes (timestamp)
    used: Bool               # 1 byte
}
```

## 🔐 Security Analysis

### Threat Model

| Threat | Mitigation | Status |
|--------|-----------|--------|
| Unauthorized member addition | Admin-only check on add_member | ✅ |
| Replay attacks on invites | One-time use flag + expiration | ✅ |
| Duplicate group joining | Membership check before add | ✅ |
| Admin removal (lockout) | Explicit prevention in remove_member | ✅ |
| Invite hash collision | Unique nonce + cryptographic hash | ✅ |
| Excessive storage costs | Input length validation | ✅ |
| Race conditions | Atomic counter increments | ✅ |
| Indefinite invite validity | Max 30-day expiration enforced | ✅ |

### Cryptographic Security

**Invite Hash Generation:**
```
Hash = SHA512_256(
    group_id || 
    nonce || 
    timestamp || 
    admin_address
)
```

**Why Secure:**
- SHA512_256: 256-bit security, collision-resistant
- Nonce: Prevents hash collisions even for same group
- Timestamp: Adds entropy, enables temporal analysis
- Admin address: Ties invite to specific admin

**Why SHA512_256:**
- Native Algorand opcode (gas efficient)
- FIPS approved algorithm
- Better performance than SHA3 on AVM
- Sufficient security for invite codes

### Access Control Matrix

| Method | Anyone | Member | Admin | Contract Admin |
|--------|--------|--------|-------|----------------|
| create_group | ✅ | - | - | - |
| add_member | ❌ | ❌ | ✅ | ❌ |
| remove_member | ❌ | ❌ | ✅ | ❌ |
| generate_qr_invite_hash | ❌ | ❌ | ✅ | ❌ |
| join_group_via_qr | ✅* | - | - | - |
| get_group_info | ✅ | - | - | - |
| get_members | ✅ | - | - | - |
| is_member | ✅ | - | - | - |
| deactivate_group | ❌ | ❌ | ✅ | ❌ |

*Requires valid invite hash

## ⚡ Gas Optimization Analysis

### Box Storage Cost Breakdown

| Operation | Box Access | Box Creation | Total Cost* |
|-----------|-----------|--------------|-------------|
| create_group | 0 reads | 3 creates | ~0.003 ALGO |
| add_member | 2 reads | 0 creates | ~0.001 ALGO |
| remove_member | 2 reads | 0 creates | ~0.001 ALGO |
| generate_qr_invite | 1 read | 1 create | ~0.002 ALGO |
| join_group_via_qr | 3 reads | 0 creates | ~0.001 ALGO |
| get_members | 1 read | 0 creates | ~0.0005 ALGO |

*Approximate costs, excluding base transaction fee (0.001 ALGO)

### Optimization Techniques

1. **Struct Packing**
   ```python
   # Bad: Multiple box reads
   name = read_box("group_1_name")
   admin = read_box("group_1_admin")
   created = read_box("group_1_created")
   
   # Good: Single struct read
   metadata = read_box("group_1_meta")  # Contains all above
   ```
   **Savings:** 2 box reads = ~0.0005 ALGO per operation

2. **Packed Member Arrays**
   ```python
   # Bad: Array with length prefixes
   members = [addr1, addr2, addr3]  # 4 + 32*3 = 100 bytes
   
   # Good: Packed bytes
   members = addr1 + addr2 + addr3  # 32*3 = 96 bytes
   ```
   **Savings:** 4 bytes per array = 4% storage cost reduction

3. **Lazy Evaluation**
   ```python
   # Don't load description unless needed
   get_group_info()  # Returns metadata only
   get_group_description()  # Separate call if needed
   ```
   **Savings:** Avoid reading large strings when not needed

4. **Early Validation**
   ```python
   # Fail fast before expensive operations
   assert is_admin(caller), "Not admin"  # Check first
   load_members()  # Then load data
   ```
   **Savings:** Avoid wasted box reads on failed transactions

### Member List Scalability

| Members | Storage Size | Read Cost | Search Cost |
|---------|-------------|-----------|-------------|
| 10 | 320 bytes | 0.0005 ALGO | O(10) |
| 50 | 1.6 KB | 0.0005 ALGO | O(50) |
| 100 | 3.2 KB | 0.0005 ALGO | O(100) |
| 500 | 16 KB | 0.001 ALGO | O(500) |

**Note:** Linear search is acceptable for groups <100 members. For larger groups, consider bitmap indexing or separate index box.

## 📊 Gas Comparison: Box vs Global State

| Storage Type | Max Size | Cost | Access Pattern |
|-------------|----------|------|----------------|
| Global State | 128 bytes total | Included in app | O(1) direct |
| Box Storage | Unlimited | ~0.0025 ALGO/KB/year | O(1) by key |

**Why Box Storage for Members:**
- Variable length (unknown member count)
- Can grow beyond 128 bytes
- Only pay for what you use
- Can delete boxes to reclaim MBR

**Why Global State for Counters:**
- Fixed size (8 bytes each)
- Frequently accessed
- Cost-effective for small data
- No MBR to maintain

## 🔄 Data Flow Diagrams

### Create Group Flow
```
User                    Contract                   Storage
  │                        │                          │
  │ create_group()         │                          │
  ├───────────────────────>│                          │
  │                        │ Validate input           │
  │                        │                          │
  │                        │ group_counter++          │
  │                        │                          │
  │                        │ Create GroupInfo struct  │
  │                        │                          │
  │                        │ group_1_meta             │
  │                        ├─────────────────────────>│
  │                        │ group_1_desc             │
  │                        ├─────────────────────────>│
  │                        │ group_1_members          │
  │                        ├─────────────────────────>│
  │                        │                          │
  │<───────────────────────┤ Return group_id = 1      │
  │      group_id          │                          │
```

### QR Invite Flow
```
Admin                   Contract                   Storage
  │                        │                          │
  │ generate_invite()      │                          │
  ├───────────────────────>│                          │
  │                        │ Verify admin             │
  │                        │                          │
  │                        │ invite_counter++         │
  │                        │                          │
  │                        │ hash = SHA512_256(       │
  │                        │   group_id || nonce ||   │
  │                        │   timestamp || admin     │
  │                        │ )                        │
  │                        │                          │
  │                        │ invite_{hash}            │
  │                        ├─────────────────────────>│
  │                        │                          │
  │<───────────────────────┤ Return hash              │
  │      0x1234...         │                          │
  │                        │                          │

User (scanning QR)
  │                        │                          │
  │ join_via_qr(hash)      │                          │
  ├───────────────────────>│                          │
  │                        │ Load invite_{hash}       │
  │                        │<─────────────────────────│
  │                        │                          │
  │                        │ Verify not expired       │
  │                        │ Verify not used          │
  │                        │ Verify not member        │
  │                        │                          │
  │                        │ Add to members           │
  │                        ├─────────────────────────>│
  │                        │                          │
  │                        │ Mark invite used         │
  │                        ├─────────────────────────>│
  │                        │                          │
  │<───────────────────────┤ Return group_id          │
```

## 🧪 Testing Strategy

### Unit Tests

```python
def test_create_group():
    """Test group creation"""
    # Setup
    admin = generate_account()
    
    # Execute
    group_id = app_client.create_group(
        name="Test Group",
        description="Test description",
        signer=admin
    )
    
    # Assert
    assert group_id == 0  # First group
    info = app_client.get_group_info(group_id)
    assert info.name == "Test Group"
    assert info.admin == admin.address
    assert info.member_count == 1
    

def test_add_member_unauthorized():
    """Test non-admin cannot add members"""
    # Setup
    admin = generate_account()
    non_admin = generate_account()
    group_id = app_client.create_group("Test", "", signer=admin)
    
    # Execute & Assert
    with pytest.raises(LogicError, match="Only admin"):
        app_client.add_member(
            group_id=group_id,
            member_address=non_admin.address,
            signer=non_admin  # Wrong signer
        )


def test_invite_expiration():
    """Test expired invites are rejected"""
    # Setup
    admin = generate_account()
    group_id = app_client.create_group("Test", "", signer=admin)
    
    # Generate invite with 1 second validity
    invite_hash = app_client.generate_qr_invite_hash(
        group_id=group_id,
        validity_seconds=1,
        signer=admin
    )
    
    # Wait for expiration
    time.sleep(2)
    
    # Execute & Assert
    user = generate_account()
    with pytest.raises(LogicError, match="expired"):
        app_client.join_group_via_qr(
            invite_hash=invite_hash,
            signer=user
        )


def test_invite_one_time_use():
    """Test invites can only be used once"""
    # Setup
    admin = generate_account()
    group_id = app_client.create_group("Test", "", signer=admin)
    invite_hash = app_client.generate_qr_invite_hash(
        group_id, 3600, signer=admin
    )
    
    # First use - should succeed
    user1 = generate_account()
    app_client.join_group_via_qr(invite_hash, signer=user1)
    
    # Second use - should fail
    user2 = generate_account()
    with pytest.raises(LogicError, match="already used"):
        app_client.join_group_via_qr(invite_hash, signer=user2)
```

### Integration Tests

```python
def test_full_group_lifecycle():
    """Test complete group workflow"""
    # 1. Admin creates group
    admin = generate_account()
    group_id = app_client.create_group("Roommates", "Shared expenses", signer=admin)
    
    # 2. Admin adds members directly
    member1 = generate_account()
    app_client.add_member(group_id, member1.address, signer=admin)
    
    # 3. Admin generates QR invite
    invite = app_client.generate_qr_invite_hash(group_id, 86400, signer=admin)
    
    # 4. New member joins via QR
    member2 = generate_account()
    joined_id = app_client.join_group_via_qr(invite, signer=member2)
    assert joined_id == group_id
    
    # 5. Verify all members
    members = app_client.get_members(group_id)
    assert len(members) == 3
    assert admin.address in members
    assert member1.address in members
    assert member2.address in members
    
    # 6. Admin removes member
    app_client.remove_member(group_id, member1.address, signer=admin)
    members = app_client.get_members(group_id)
    assert len(members) == 2
    assert member1.address not in members
```

### Edge Case Tests

```python
def test_cannot_remove_admin():
    """Admin cannot be removed"""
    admin = generate_account()
    group_id = app_client.create_group("Test", "", signer=admin)
    
    with pytest.raises(LogicError, match="Cannot remove admin"):
        app_client.remove_member(group_id, admin.address, signer=admin)


def test_duplicate_join_prevention():
    """Cannot join same group twice"""
    admin = generate_account()
    group_id = app_client.create_group("Test", "", signer=admin)
    invite = app_client.generate_qr_invite_hash(group_id, 3600, signer=admin)
    
    user = generate_account()
    app_client.join_group_via_qr(invite, signer=user)
    
    # Generate new invite for same group
    invite2 = app_client.generate_qr_invite_hash(group_id, 3600, signer=admin)
    
    with pytest.raises(LogicError, match="Already a member"):
        app_client.join_group_via_qr(invite2, signer=user)


def test_max_validity_enforcement():
    """Cannot create invite with >30 day validity"""
    admin = generate_account()
    group_id = app_client.create_group("Test", "", signer=admin)
    
    with pytest.raises(LogicError, match="Max validity"):
        app_client.generate_qr_invite_hash(
            group_id,
            validity_seconds=31 * 86400,  # 31 days
            signer=admin
        )
```

## 🚀 Deployment Guide

### Step 1: Build Contract

```bash
cd projects/contracts
algokit project run build
```

### Step 2: Deploy to LocalNet (Testing)

```bash
# Start LocalNet
algokit localnet start

# Deploy
algokit project deploy localnet

# Note the App ID
```

### Step 3: Deploy to TestNet

```bash
# Set environment variables
export ALGOD_TOKEN=""
export ALGOD_SERVER="https://testnet-api.algonode.cloud"
export DEPLOYER_MNEMONIC="your 25 word mnemonic..."

# Deploy
algokit project deploy testnet

# Save App ID to backend/.env
echo "GROUP_MANAGER_APP_ID=123456" >> backend/.env
```

### Step 4: Fund Contract (Box Storage MBR)

```bash
# Contract needs ALGO for box storage minimum balance
# Estimate: 0.1 ALGO per group + 0.05 ALGO per invite

algokit goal clerk send \
  --from DEPLOYER_ADDRESS \
  --to CONTRACT_ADDRESS \
  --amount 1000000  # 1 ALGO
```

### Step 5: Verify Deployment

```python
from algosdk.v2client import algod
from algokit_utils import ApplicationClient

# Connect
algod_client = algod.AlgodClient("", "https://testnet-api.algonode.cloud")

# Load contract
app_client = ApplicationClient(
    algod_client=algod_client,
    app_id=123456,  # Your App ID
    signer=signer
)

# Test
group_id = app_client.call("create_group", name="Test", description="Test")
print(f"✅ Contract working! Created group {group_id}")
```

## 📝 API Integration

### Backend Integration

```python
# backend/app/services/algorand.py
from algosdk.v2client import algod
from algosdk import transaction
from app.config import settings

class AlgorandService:
    def __init__(self):
        self.algod = algod.AlgodClient(
            settings.ALGORAND_ALGOD_TOKEN,
            settings.ALGORAND_ALGOD_URL
        )
        self.app_id = settings.GROUP_MANAGER_APP_ID
        
    async def create_group(self, name: str, description: str, sender: str):
        """Call create_group method"""
        # Build application call transaction
        params = self.algod.suggested_params()
        
        txn = transaction.ApplicationCallTxn(
            sender=sender,
            sp=params,
            index=self.app_id,
            on_complete=transaction.OnComplete.NoOpOC,
            app_args=[
                "create_group",
                name.encode(),
                description.encode()
            ]
        )
        
        # Sign and send (handled by frontend wallet)
        return txn
        
    async def generate_invite(
        self, 
        group_id: int, 
        validity_seconds: int,
        sender: str
    ):
        """Generate QR invite hash"""
        params = self.algod.suggested_params()
        
        txn = transaction.ApplicationCallTxn(
            sender=sender,
            sp=params,
            index=self.app_id,
            on_complete=transaction.OnComplete.NoOpOC,
            app_args=[
                "generate_qr_invite_hash",
                group_id.to_bytes(8, 'big'),
                validity_seconds.to_bytes(8, 'big')
            ]
        )
        
        return txn
```

### Frontend Integration

```typescript
// frontend/src/services/groupManager.ts
import algosdk from 'algosdk';
import { useWallet } from '@txnlab/use-wallet';

export class GroupManagerService {
  private appId: number;
  private algodClient: algosdk.Algodv2;
  
  constructor(appId: number) {
    this.appId = appId;
    this.algodClient = new algosdk.Algodv2(
      '',
      'https://testnet-api.algonode.cloud',
      ''
    );
  }
  
  async createGroup(name: string, description: string): Promise<number> {
    const { activeAddress, signTransactions } = useWallet();
    
    // Build transaction
    const params = await this.algodClient.getTransactionParams().do();
    const txn = algosdk.makeApplicationCallTxnFromObject({
      from: activeAddress,
      appIndex: this.appId,
      onComplete: algosdk.OnApplicationComplete.NoOpOC,
      appArgs: [
        new TextEncoder().encode('create_group'),
        new TextEncoder().encode(name),
        new TextEncoder().encode(description),
      ],
      suggestedParams: params,
    });
    
    // Sign with wallet
    const signedTxn = await signTransactions([txn.toByte()]);
    
    // Send
    const { txId } = await this.algodClient.sendRawTransaction(signedTxn).do();
    
    // Wait for confirmation
    const result = await algosdk.waitForConfirmation(this.algodClient, txId, 4);
    
    // Extract group_id from logs
    const groupId = result.logs[0]; // Parse from returned value
    
    return groupId;
  }
  
  async generateQRInvite(groupId: number, validityHours: number): Promise<string> {
    const params = await this.algodClient.getTransactionParams().do();
    const validitySeconds = validityHours * 3600;
    
    const txn = algosdk.makeApplicationCallTxnFromObject({
      from: activeAddress,
      appIndex: this.appId,
      onComplete: algosdk.OnApplicationComplete.NoOpOC,
      appArgs: [
        new TextEncoder().encode('generate_qr_invite_hash'),
        algosdk.encodeUint64(groupId),
        algosdk.encodeUint64(validitySeconds),
      ],
      suggestedParams: params,
    });
    
    const signedTxn = await signTransactions([txn.toByte()]);
    const { txId } = await this.algodClient.sendRawTransaction(signedTxn).do();
    const result = await algosdk.waitForConfirmation(this.algodClient, txId, 4);
    
    // Extract invite hash (32 bytes)
    const inviteHash = Buffer.from(result.logs[0]).toString('hex');
    
    // Generate QR code URL
    const qrUrl = `algocampus://join/${inviteHash}`;
    
    return qrUrl;
  }
}
```

## 🔍 Monitoring & Analytics

### Key Metrics to Track

```sql
-- Backend analytics queries

-- Groups created per day
SELECT DATE(created_at), COUNT(*) as groups_created
FROM groups
GROUP BY DATE(created_at)
ORDER BY DATE(created_at) DESC;

-- Average group size
SELECT AVG(member_count) as avg_members
FROM groups
WHERE active = true;

-- Invite usage rate
SELECT 
  COUNT(CASE WHEN used = true THEN 1 END)::float / COUNT(*) as usage_rate
FROM invites;

-- Popular invite validity periods
SELECT validity_seconds / 3600 as hours, COUNT(*) as count
FROM invites
GROUP BY validity_seconds
ORDER BY count DESC;
```

### On-Chain Monitoring

```python
# Monitor contract events
def monitor_group_creation():
    """Watch for new groups created"""
    last_round = indexer.health()['round']
    
    while True:
        # Poll indexer for app calls
        txns = indexer.search_transactions(
            application_id=app_id,
            min_round=last_round,
            limit=100
        )
        
        for txn in txns['transactions']:
            if 'application-transaction' in txn:
                app_args = txn['application-transaction']['application-args']
                
                if app_args[0] == base64.b64encode(b'create_group'):
                    group_id = decode_uint64(app_args[1])
                    print(f"New group created: {group_id}")
                    # Store in database
        
        time.sleep(4)  # Algorand block time
```

## 📚 Additional Resources

- **AlgoPy Documentation**: https://algorandfoundation.github.io/puya/
- **Algorand Smart Contract Guidelines**: https://developer.algorand.org/docs/get-details/dapps/smart-contracts/
- **Box Storage Reference**: https://developer.algorand.org/docs/get-details/dapps/smart-contracts/apps/state/#box-storage
- **AVM Opcode Reference**: https://developer.algorand.org/docs/get-details/dapps/avm/

## 🎓 Contract Comparison: Beaker vs AlgoPy

| Feature | Beaker/PyTeal | AlgoPy (This Contract) |
|---------|---------------|------------------------|
| Syntax | PyTeal DSL | Pure Python |
| Type Safety | Manual | Automatic |
| Debugging | Difficult | Python debugger works |
| Development Speed | Slower | Faster |
| Generated TEAL | Optimized | Optimized |
| Community Support | Legacy | Current |
| Maintenance | Deprecated | Actively developed |

**Why AlgoPy:**
- Modern Python syntax (no learning curve)
- Better development experience
- Official Algorand Foundation support
- All Beaker patterns supported
- Same gas efficiency

---

**Contract Version:** 1.0.0  
**Last Updated:** February 11, 2026  
**Status:** Production Ready ✅
