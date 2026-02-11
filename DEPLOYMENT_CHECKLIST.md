# GroupManager Smart Contract - Deployment Checklist

## 🚀 Pre-Deployment Checklist

### Environment Setup
- [ ] AlgoKit installed (`algokit --version`)
- [ ] Python 3.10+ installed
- [ ] Poetry installed (`poetry --version`)
- [ ] Dependencies installed (`cd projects/contracts && poetry install`)
- [ ] Docker running (for LocalNet)

### Account Setup
- [ ] Deployer account funded with at least 2 ALGO
- [ ] Deployer mnemonic saved in `.env` (for TestNet/MainNet)
- [ ] Deployer mnemonic backed up securely
- [ ] Test account created for testing

### Code Verification
- [ ] All tests pass (`pytest tests/test_group_manager_enhanced.py -v`)
- [ ] No linting errors
- [ ] Contract builds successfully (`algokit project run build`)
- [ ] Review security checklist in CONTRACT_DOCUMENTATION.md

---

## 📋 LocalNet Deployment (Development)

### Step 1: Start LocalNet
```bash
# Start LocalNet Docker container
algokit localnet start

# Verify it's running
algokit localnet status
```
- [ ] LocalNet running
- [ ] Algod accessible at http://localhost:4001
- [ ] Indexer accessible at http://localhost:8980

### Step 2: Build Contract
```bash
cd projects/contracts
algokit project run build
```
- [ ] Build successful
- [ ] TEAL files generated in `smart_contracts/artifacts/group_manager/`
- [ ] `.approval.teal` file exists
- [ ] `.clear.teal` file exists

### Step 3: Deploy to LocalNet
```bash
# Option 1: Use AlgoKit
algokit project deploy localnet

# Option 2: Use deployment script
python scripts/deploy_group_manager.py --network localnet
```
- [ ] Deployment successful
- [ ] App ID received (save this)
- [ ] Contract address received (save this)

### Step 4: Fund Contract
```bash
# Send 1 ALGO for box storage
algokit goal clerk send \
  --from <dispenser-account> \
  --to <contract-address> \
  --amount 1000000
```
- [ ] Transaction confirmed
- [ ] Contract balance shows at least 1 ALGO

### Step 5: Verify Deployment
```bash
# Check global state
algokit goal app read --app-id <app-id> --global

# Should show:
# - contract_admin: <deployer-address>
# - group_counter: 0
# - invite_counter: 0
```
- [ ] Global state correct
- [ ] contract_admin matches deployer

### Step 6: Test Contract
```bash
# Run integration tests
pytest tests/test_group_manager_enhanced.py -v

# Test via API (if backend running)
curl -X POST http://localhost:8000/api/v1/groups \
  -H "Authorization: Bearer <token>" \
  -d '{"name": "Test Group", "description": "Test"}'
```
- [ ] All tests pass
- [ ] API integration works
- [ ] Group created successfully

### Step 7: Update Configuration
```bash
# Edit backend/.env
GROUP_MANAGER_APP_ID=<app-id>
ALGORAND_NETWORK=localnet
```
- [ ] App ID added to backend/.env
- [ ] Backend restarted
- [ ] Backend logs show correct App ID

---

## 🧪 TestNet Deployment (Staging)

### Step 1: Setup TestNet Account
```bash
# Create new account (or use existing)
algokit goal account new testnet-deployer

# Fund from dispenser
# Visit: https://bank.testnet.algorand.network/
# Or: https://testnet.algoexplorer.io/dispenser
```
- [ ] TestNet account created
- [ ] Account funded with at least 10 ALGO (5 for deployment + 5 for testing)
- [ ] Mnemonic saved in `.env` as `DEPLOYER_MNEMONIC`
- [ ] Mnemonic backed up securely offline

### Step 2: Verify TestNet Access
```bash
# Check account balance
algokit goal account balance --account <address> --network testnet

# Should show at least 10 ALGO
```
- [ ] TestNet accessible
- [ ] Account balance confirmed
- [ ] Algod node responding

### Step 3: Build Contract (if not already done)
```bash
cd projects/contracts
algokit project run build
```
- [ ] Build successful with latest code
- [ ] TEAL files up-to-date

### Step 4: Deploy to TestNet
```bash
# Set deployer mnemonic
export DEPLOYER_MNEMONIC="your 25 word mnemonic here"

# Deploy
python scripts/deploy_group_manager.py --network testnet

# Or use AlgoKit
algokit project deploy testnet
```
- [ ] Deployment successful
- [ ] App ID received and saved
- [ ] Contract address received and saved
- [ ] Transaction ID saved

### Step 5: Fund Contract on TestNet
```bash
# Send 2 ALGO for box storage (more than LocalNet for safety)
algokit goal clerk send \
  --from <deployer-account> \
  --to <contract-address> \
  --amount 2000000 \
  --network testnet
```
- [ ] Transaction confirmed
- [ ] Contract balance verified on AlgoExplorer

### Step 6: Verify on AlgoExplorer
Visit: `https://testnet.algoexplorer.io/application/<app-id>`

- [ ] Contract visible on explorer
- [ ] Global state shows correct values
- [ ] Contract balance shows 2+ ALGO
- [ ] Creator address matches deployer

### Step 7: Test on TestNet
```bash
# Run tests against TestNet
export ALGORAND_NETWORK=testnet
export GROUP_MANAGER_APP_ID=<app-id>

pytest tests/test_group_manager_enhanced.py -v --testnet
```
- [ ] Tests pass on TestNet
- [ ] Transactions confirmed on-chain
- [ ] Gas costs reasonable (~0.001 ALGO per operation)

### Step 8: Update Staging Backend
```bash
# Edit backend/.env (staging environment)
GROUP_MANAGER_APP_ID=<testnet-app-id>
ALGORAND_NETWORK=testnet
ALGORAND_ALGOD_URL=https://testnet-api.algonode.cloud
ALGORAND_INDEXER_URL=https://testnet-idx.algonode.cloud
```
- [ ] Staging backend updated
- [ ] Backend restarted
- [ ] End-to-end flow tested (frontend → backend → blockchain)

### Step 9: Monitor TestNet Deployment
```bash
# Watch for activity
algokit goal app info --app-id <app-id> --network testnet

# Check logs
tail -f backend/logs/app.log
```
- [ ] No errors in logs
- [ ] Transactions confirming successfully
- [ ] Box storage usage within limits

---

## 🌐 MainNet Deployment (Production)

### ⚠️ Pre-Production Review

- [ ] **CRITICAL**: Full security audit completed
- [ ] All TestNet tests passing for at least 1 week
- [ ] Load testing completed (1000+ groups simulated)
- [ ] Monitoring infrastructure ready
- [ ] Incident response plan documented
- [ ] Backup/recovery procedures tested
- [ ] Team trained on contract operations
- [ ] Legal/compliance review completed (if applicable)

### Step 1: MainNet Account Setup
```bash
# Create dedicated MainNet deployer account
algokit goal account new production-deployer

# CRITICAL: Save mnemonic in secure vault (NOT in .env)
# Use password manager or hardware wallet
```
- [ ] MainNet account created
- [ ] Mnemonic stored in secure vault (not in code)
- [ ] Backup copy stored offline
- [ ] Account funded with sufficient ALGO (20+ for safety)

### Step 2: Final Code Review
```bash
# Review contract one last time
git log --oneline -10
git diff <last-testnet-deploy> HEAD

# Ensure no unexpected changes
```
- [ ] Code matches TestNet version
- [ ] No uncommitted changes
- [ ] Version tagged in git (`git tag v1.0.0-mainnet`)
- [ ] All team members reviewed

### Step 3: Deploy to MainNet
```bash
# IMPORTANT: Triple-check you're deploying correct version
export DEPLOYER_MNEMONIC="<secure-vault-mnemonic>"

# Deploy with confirmation
python scripts/deploy_group_manager.py --network mainnet

# You will be prompted: "Are you sure? (yes/no):"
# Type: yes
```
- [ ] Deployment successful
- [ ] App ID saved in secure location
- [ ] Transaction ID saved
- [ ] Contract address saved

### Step 4: Fund Production Contract
```bash
# Send substantial ALGO for production use
# Estimate: 100 ALGO for 200 groups
algokit goal clerk send \
  --from <deployer-account> \
  --to <contract-address> \
  --amount 100000000 \
  --network mainnet
```
- [ ] Transaction confirmed
- [ ] Contract balance verified on MainNet explorer

### Step 5: Verify on MainNet Explorer
Visit: `https://algoexplorer.io/application/<app-id>`

- [ ] Contract visible
- [ ] Global state correct
- [ ] Contract balance sufficient
- [ ] No suspicious activity

### Step 6: Smoke Tests on MainNet
```bash
# Create ONE test group to verify
# Use deployer account for safety

# 1. Create test group
# 2. Add test member
# 3. Generate invite
# 4. Verify on explorer
# 5. Clean up (deactivate group)
```
- [ ] Test group created successfully
- [ ] Member added successfully
- [ ] Invite generated successfully
- [ ] All operations confirmed on MainNet
- [ ] Gas costs as expected (~0.001 ALGO)

### Step 7: Update Production Backend
```bash
# Edit production backend/.env
GROUP_MANAGER_APP_ID=<mainnet-app-id>
ALGORAND_NETWORK=mainnet
ALGORAND_ALGOD_URL=https://mainnet-api.algonode.cloud
ALGORAND_INDEXER_URL=https://mainnet-idx.algonode.cloud
```
- [ ] Production backend updated
- [ ] Backend deployed to production
- [ ] Health checks passing
- [ ] End-to-end smoke test passed

### Step 8: Enable Monitoring
```bash
# Start monitoring services
# - Application logs
# - Transaction indexer
# - Contract balance alerts
# - Error rate tracking
```
- [ ] Monitoring dashboard online
- [ ] Alerts configured (balance < 10 ALGO, error rate > 5%)
- [ ] Log aggregation working
- [ ] On-call rotation set up

### Step 9: Gradual Rollout
- [ ] Enable for 10% of users (canary deployment)
- [ ] Monitor for 24 hours
- [ ] Check error rates, transaction success, gas costs
- [ ] Gradually increase to 50%, 100%

### Step 10: Post-Launch Verification
- [ ] Monitor for 7 days continuously
- [ ] Review all transactions on explorer daily
- [ ] Check contract balance trend
- [ ] Verify no security incidents
- [ ] User feedback collected

---

## 📊 Post-Deployment Monitoring

### Daily Checks
- [ ] Contract balance (should decrease slowly)
- [ ] Transaction success rate (>99%)
- [ ] Error logs (should be minimal)
- [ ] Gas costs per operation (should be stable)

### Weekly Reviews
- [ ] Total groups created
- [ ] Active vs inactive groups
- [ ] Average members per group
- [ ] Invite usage rate
- [ ] Box storage usage
- [ ] Top errors (if any)

### Monthly Tasks
- [ ] Security audit log review
- [ ] Performance optimization review
- [ ] Cost analysis (storage + gas)
- [ ] User feedback analysis
- [ ] Plan upgrades/improvements

---

## 🔧 Troubleshooting

### Deployment Failed

**Error**: "Insufficient balance"
- [ ] Check deployer account balance
- [ ] Fund with at least 2 ALGO
- [ ] Retry deployment

**Error**: "Build failed"
- [ ] Check Python version (3.10+)
- [ ] Run `poetry install` again
- [ ] Check for syntax errors in contract code

**Error**: "Network unreachable"
- [ ] Check internet connection
- [ ] Verify Algod URL is correct
- [ ] Check firewall settings

### Contract Not Working

**Error**: "Box does not exist"
- [ ] Fund contract for box storage
- [ ] Check contract balance is >0.1 ALGO
- [ ] Verify group was created successfully

**Error**: "Not authorized"
- [ ] Check transaction sender is group admin
- [ ] Verify account has opted into contract
- [ ] Check group exists and is active

**Error**: "Invite expired"
- [ ] Generate new invite
- [ ] Check system time is correct
- [ ] Verify validity_seconds parameter

---

## 📝 Deployment Record

### LocalNet Deployment
- **Date**: _____________
- **App ID**: _____________
- **Contract Address**: _____________
- **Deployed by**: _____________
- **Version**: _____________

### TestNet Deployment
- **Date**: _____________
- **App ID**: _____________
- **Contract Address**: _____________
- **Deployed by**: _____________
- **Version**: _____________
- **Transaction ID**: _____________
- **AlgoExplorer URL**: _____________

### MainNet Deployment
- **Date**: _____________
- **App ID**: _____________
- **Contract Address**: _____________
- **Deployed by**: _____________
- **Version**: _____________
- **Transaction ID**: _____________
- **AlgoExplorer URL**: _____________
- **Initial Funding**: _____________ ALGO
- **Authorized Operators**: _____________

---

## 🎉 Success Criteria

Deployment is considered successful when:

- [ ] Contract deployed to target network
- [ ] Contract funded for box storage
- [ ] All tests passing
- [ ] Backend integration working
- [ ] Frontend can create groups
- [ ] QR invite flow works end-to-end
- [ ] Monitoring active
- [ ] No critical errors in logs
- [ ] Gas costs within expected range
- [ ] Team trained on operations

---

## 📞 Support Contacts

**Smart Contract Issues**:
- Technical Lead: _____________
- Email: _____________

**Infrastructure Issues**:
- DevOps Team: _____________
- Email: _____________

**Security Issues**:
- Security Team: _____________
- Email: _____________

**Emergency Escalation**:
- On-Call: _____________
- Phone: _____________

---

## 📚 References

- [README.md](projects/contracts/smart_contracts/group_manager/README.md)
- [CONTRACT_DOCUMENTATION.md](projects/contracts/smart_contracts/group_manager/CONTRACT_DOCUMENTATION.md)
- [ARCHITECTURE.md](ARCHITECTURE.md)
- [Algorand Docs](https://developer.algorand.org/)

---

**Last Updated**: [Date]
**Version**: 1.0.0
**Status**: ✅ Ready for Production
