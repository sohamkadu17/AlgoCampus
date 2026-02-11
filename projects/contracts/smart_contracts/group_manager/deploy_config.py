"""
Enhanced Deployment configuration for GroupManager smart contract

Supports:
- LocalNet (local development)
- TestNet (testing)  
- MainNet (production)
- Post-deployment setup
- Storage and gas cost estimates
"""

import logging
from algopy import Account

logger = logging.getLogger(__name__)


def deploy(
    deployer: Account,
    algod_client,
    network: str = "localnet",
) -> dict:
    """
    Deploy GroupManager contract with enhanced configuration
    
    Args:
        deployer: Account deploying the contract
        algod_client: Algorand client
        network: Target network (localnet, testnet, mainnet)
        
    Returns:
        dict with app_id, app_address, and deployment info
    """
    # Import the enhanced contract
    try:
        from smart_contracts.group_manager.contract_enhanced import GroupManager
        logger.info("✅ Using enhanced GroupManager with QR invites")
    except ImportError:
        from smart_contracts.group_manager.contract import GroupManager
        logger.warning("⚠️  Using basic GroupManager (enhanced version not found)")
    
    logger.info(f"Deploying GroupManager to {network}...")
    
    # Deploy contract
    app_client = GroupManager.deploy(
        algod_client=algod_client,
        signer=deployer,
    )
    
    app_id = app_client.app_id
    app_address = app_client.app_address
    
    # Post-deployment information
    print("\n" + "=" * 70)
    print(f"✅ GroupManager deployed successfully to {network.upper()}!")
    print("=" * 70)
    print(f"📋 App ID: {app_id}")
    print(f"📍 App Address: {app_address}")
    print(f"🌐 Network: {network}")
    print("=" * 70)
    
    print("\n⚡ Next Steps:")
    print(f"1. Fund the contract for box storage:")
    print(f"   algokit goal clerk send --from <your-account> --to {app_address} --amount 1000000")
    print(f"   (Sends 1 ALGO to cover Minimum Balance Requirements)")
    
    print(f"\n2. Update backend configuration:")
    print(f"   Edit backend/.env and set:")
    print(f"   GROUP_MANAGER_APP_ID={app_id}")
    
    print(f"\n3. Test the deployment:")
    print(f"   pytest tests/test_group_manager_enhanced.py -v")
    
    print(f"\n4. Verify on AlgoExplorer:")
    if network == "testnet":
        print(f"   https://testnet.algoexplorer.io/application/{app_id}")
    elif network == "mainnet":
        print(f"   https://algoexplorer.io/application/{app_id}")
    
    print("\n" + "=" * 70)
    
    # Print storage and gas estimates
    print_cost_estimates()
    
    return {
        "app_id": app_id,
        "app_address": app_address,
        "network": network,
        "name": "GroupManager",
        "version": "1.0.0-enhanced",
        "features": [
            "create_group",
            "add_member",
            "remove_member",
            "generate_qr_invite_hash",
            "join_group_via_qr",
            "deactivate_group",
            "reactivate_group",
        ],
    }


def print_cost_estimates():
    """Print storage and gas cost estimates"""
    print("\n💰 Cost Estimates:")
    print("=" * 70)
    
    print("Storage Requirements (Minimum Balance):")
    print("  • Each group (metadata + description): ~0.25 ALGO")
    print("  • Each member (32 bytes): ~0.013 ALGO")
    print("  • Each invite: ~0.025 ALGO")
    print("  • 100 groups with avg 5 members: ~40 ALGO")
    
    print("\nGas Costs per Operation:")
    print("  • create_group: ~0.001 ALGO")
    print("  • add_member: ~0.001 ALGO")
    print("  • remove_member: ~0.001 ALGO")
    print("  • generate_qr_invite: ~0.001 ALGO")
    print("  • join_via_qr: ~0.001 ALGO")
    print("  • Query methods (get_*, is_*): FREE (no transaction)")
    
    print("\nProduction Estimates:")
    print("  • 1,000 groups: ~400 ALGO storage + minimal gas")
    print("  • 10,000 transactions: ~10 ALGO in transaction fees")
    
    print("=" * 70)


# Security checklist for deployment
SECURITY_CHECKLIST = [
    "✅ Contract admin is set to deployer address",
    "✅ Only admin can create groups",
    "✅ Only group admin can manage members",
    "✅ Only group admin can generate invites",
    "✅ Invites expire after max 30 days",
    "✅ Invites are one-time use only",
    "✅ Cannot remove group admin",
    "✅ Cannot add duplicate members",
    "✅ Cryptographic invite hashing (SHA512_256)",
    "✅ Replay attack prevention",
]


def print_security_checklist():
    """Print security features"""
    print("\n🔒 Security Features:")
    print("=" * 70)
    for item in SECURITY_CHECKLIST:
        print(f"  {item}")
    print("=" * 70)


if __name__ == "__main__":
    print("GroupManager Deployment Configuration")
    print_security_checklist()
    print_cost_estimates()
