"""
Deployment configuration for ExpenseTracker smart contract

Handles deployment to LocalNet, TestNet, and MainNet with proper configuration.
"""

import logging
from algopy import Account

logger = logging.getLogger(__name__)


def deploy(
    deployer: Account,
    algod_client,
    network: str = "localnet",
    group_manager_app_id: int = None,
) -> dict:
    """
    Deploy ExpenseTracker contract with enhanced configuration
    
    Args:
        deployer: Account deploying the contract
        algod_client: Algorand client
        network: Target network (localnet, testnet, mainnet)
        group_manager_app_id: GroupManager App ID (required for integration)
        
    Returns:
        dict with app_id, app_address, and deployment info
    """
    from smart_contracts.expense_tracker.contract import ExpenseTracker
    
    logger.info(f"Deploying ExpenseTracker to {network}...")
    
    # Deploy contract
    app_client = ExpenseTracker.deploy(
        algod_client=algod_client,
        signer=deployer,
    )
    
    app_id = app_client.app_id
    app_address = app_client.app_address
    
    # Post-deployment information
    print("\n" + "=" * 70)
    print(f"✅ ExpenseTracker deployed successfully to {network.upper()}!")
    print("=" * 70)
    print(f"📋 App ID: {app_id}")
    print(f"📍 App Address: {app_address}")
    print(f"🌐 Network: {network}")
    print("=" * 70)
    
    print("\n⚡ Next Steps:")
    print(f"1. Fund the contract for box storage:")
    print(f"   algokit goal clerk send --from <your-account> --to {app_address} --amount 20000000")
    print(f"   (Sends 20 ALGO to cover Minimum Balance Requirements)")
    
    if group_manager_app_id:
        print(f"\n2. Set GroupManager App ID:")
        print(f"   algokit goal app call \\")
        print(f"     --app-id {app_id} \\")
        print(f"     --from <deployer> \\")
        print(f"     --app-arg 'str:set_group_manager' \\")
        print(f"     --app-arg 'int:{group_manager_app_id}'")
    else:
        print(f"\n2. Set GroupManager App ID:")
        print(f"   ⚠️  GroupManager App ID not provided!")
        print(f"   Deploy GroupManager first, then:")
        print(f"   algokit goal app call --app-id {app_id} --from <deployer> \\")
        print(f"     --app-arg 'str:set_group_manager' --app-arg 'int:<group-manager-app-id>'")
    
    print(f"\n3. Update backend configuration:")
    print(f"   Edit backend/.env and set:")
    print(f"   EXPENSE_TRACKER_APP_ID={app_id}")
    if group_manager_app_id:
        print(f"   GROUP_MANAGER_APP_ID={group_manager_app_id}")
    
    print(f"\n4. Test the deployment:")
    print(f"   pytest tests/test_expense_tracker.py -v")
    
    print(f"\n5. Verify on AlgoExplorer:")
    if network == "testnet":
        print(f"   https://testnet.algoexplorer.io/application/{app_id}")
    elif network == "mainnet":
        print(f"   https://algoexplorer.io/application/{app_id}")
    
    print("\n" + "=" * 70)
    
    # Print cost estimates
    print_cost_estimates()
    
    return {
        "app_id": app_id,
        "app_address": app_address,
        "network": network,
        "name": "ExpenseTracker",
        "version": "1.0.0",
        "features": [
            "add_expense",
            "calculate_shares",
            "update_user_balances",
            "get_user_balance",
            "get_expense_details",
            "mark_expense_settled",
        ],
        "group_manager_app_id": group_manager_app_id,
    }


def print_cost_estimates():
    """Print storage and gas cost estimates"""
    print("\n💰 Cost Estimates:")
    print("=" * 70)
    
    print("Storage Requirements (Minimum Balance):")
    print("  • Each expense (metadata): ~0.05 ALGO")
    print("  • Each expense (splits, 5 people): ~0.16 ALGO")
    print("  • Each group (balances, 10 people): ~0.17 ALGO")
    print("  • 100 expenses with avg 5 members: ~20 ALGO")
    print("  • 1000 expenses: ~200 ALGO")
    
    print("\nGas Costs per Operation:")
    print("  • add_expense (2 people): ~0.001 ALGO")
    print("  • add_expense (5 people): ~0.0012 ALGO")
    print("  • add_expense (10 people): ~0.0015 ALGO")
    print("  • calculate_shares (100 expenses): ~0.01 ALGO")
    print("  • get_user_balance: FREE (no transaction)")
    print("  • mark_expense_settled: ~0.001 ALGO")
    
    print("\nProduction Estimates:")
    print("  • 1,000 expenses: ~200 ALGO storage + ~1 ALGO gas")
    print("  • 10,000 transactions: ~10 ALGO in transaction fees")
    print("  • Peak load (100 expenses/day): ~20 ALGO/day storage + minimal gas")
    
    print("=" * 70)


# Security checklist for deployment
SECURITY_CHECKLIST = [
    "✅ Precise integer arithmetic (no float precision loss)",
    "✅ Balance overflow protection (±2^62 limit)",
    "✅ Split calculation verification (sum = total)",
    "✅ Input validation (amount, note, split format)",
    "✅ Access control (GroupManager integration)",
    "✅ Zero-sum balance invariant (closed system)",
    "✅ Signed integer encoding (positive/negative)",
    "✅ Box storage for scalability",
    "✅ Gas optimized operations",
]


def print_security_checklist():
    """Print security features"""
    print("\n🔒 Security Features:")
    print("=" * 70)
    for item in SECURITY_CHECKLIST:
        print(f"  {item}")
    print("=" * 70)


# Integration guide
INTEGRATION_GUIDE = {
    "backend": {
        "language": "Python",
        "example": """
from algosdk import transaction
from algosdk.v2client import algod

# Add expense
def add_expense(payer_pk, group_id, amount, note, members):
    split_with = b"".join([m.encode() for m in members])
    
    txn = transaction.ApplicationNoOpTxn(
        sender=payer_address,
        sp=algod_client.suggested_params(),
        index=expense_tracker_app_id,
        app_args=["add_expense", group_id, amount, note, split_with],
    )
    
    signed = txn.sign(payer_pk)
    txid = algod_client.send_transaction(signed)
    result = transaction.wait_for_confirmation(algod_client, txid, 4)
    
    expense_id = int.from_bytes(result["logs"][0], "big")
    return expense_id

# Get balance
def get_balance(group_id, user_address):
    result = algod_client.application_call(
        expense_tracker_app_id,
        app_args=["get_user_balance", group_id, user_address],
    )
    
    encoded = int.from_bytes(result["return_value"], "big")
    SIGN_BIT = 2 ** 63
    
    if encoded < SIGN_BIT:
        return +encoded  # Positive (owed)
    else:
        return -(encoded - SIGN_BIT)  # Negative (owes)
        """,
    },
    "frontend": {
        "language": "TypeScript",
        "example": """
import algosdk from "algosdk";

// Add expense
async function addExpense(payer, groupId, amount, note, members) {
  const splitWith = new Uint8Array(members.length * 32);
  members.forEach((addr, i) => {
    const decoded = algosdk.decodeAddress(addr);
    splitWith.set(decoded.publicKey, i * 32);
  });
  
  const txn = algosdk.makeApplicationNoOpTxn(
    payer.addr,
    await algodClient.getTransactionParams().do(),
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
  const {txId} = await algodClient.sendRawTransaction(signedTxn).do();
  const result = await algosdk.waitForConfirmation(algodClient, txId, 4);
  
  return Number(result.logs[0]);
}

// Format balance
function formatBalance(microAlgos: number): string {
  const algos = microAlgos / 1_000_000;
  return algos >= 0 
    ? `+${algos.toFixed(2)} ALGO (owed)`
    : `${algos.toFixed(2)} ALGO (owes)`;
}
        """,
    },
}


def print_integration_guide():
    """Print integration examples"""
    print("\n📖 Integration Guide:")
    print("=" * 70)
    
    print("\n🐍 Python Backend:")
    print(INTEGRATION_GUIDE["backend"]["example"])
    
    print("\n📱 TypeScript Frontend:")
    print(INTEGRATION_GUIDE["frontend"]["example"])
    
    print("=" * 70)


if __name__ == "__main__":
    print("ExpenseTracker Deployment Configuration")
    print_security_checklist()
    print_cost_estimates()
    print_integration_guide()
