#!/usr/bin/env python3
"""
Quick deployment script for GroupManager smart contract

Usage:
    python scripts/deploy_group_manager.py --network localnet
    python scripts/deploy_group_manager.py --network testnet
    python scripts/deploy_group_manager.py --network mainnet
"""

import argparse
import sys
import os
from pathlib import Path

# Add project root to path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

try:
    from algosdk.v2client import algod
    from algosdk import account, mnemonic
    from algosdk.transaction import PaymentTxn, wait_for_confirmation
    import logging
except ImportError:
    print("❌ Error: Required packages not installed")
    print("Run: pip install py-algorand-sdk")
    sys.exit(1)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


# Network configurations
NETWORKS = {
    "localnet": {
        "algod_address": "http://localhost:4001",
        "algod_token": "a" * 64,
        "indexer_address": "http://localhost:8980",
    },
    "testnet": {
        "algod_address": "https://testnet-api.algonode.cloud",
        "algod_token": "",
        "indexer_address": "https://testnet-idx.algonode.cloud",
    },
    "mainnet": {
        "algod_address": "https://mainnet-api.algonode.cloud",
        "algod_token": "",
        "indexer_address": "https://mainnet-idx.algonode.cloud",
    },
}


def get_algod_client(network: str) -> algod.AlgodClient:
    """Get Algorand client for network"""
    config = NETWORKS[network]
    return algod.AlgodClient(
        config["algod_token"],
        config["algod_address"],
    )


def get_deployer_account(network: str):
    """Get deployer account from environment or generate new one"""
    
    if network == "localnet":
        # Use default LocalNet account
        mnemonic_phrase = os.getenv(
            "LOCALNET_MNEMONIC",
            # Default LocalNet dispenser account (available in sandbox)
            "auction inquiry lava second expand liberty glass involve ginger illness length room item discover ahead table doctor term tackle cement bonus profit right above catch"
        )
    else:
        # Use environment variable for TestNet/MainNet
        mnemonic_phrase = os.getenv("DEPLOYER_MNEMONIC")
        if not mnemonic_phrase:
            logger.error(f"❌ DEPLOYER_MNEMONIC not set for {network}")
            logger.error("Set it in your environment or .env file")
            sys.exit(1)
    
    try:
        private_key = mnemonic.to_private_key(mnemonic_phrase)
        address = account.address_from_private_key(private_key)
        return private_key, address
    except Exception as e:
        logger.error(f"❌ Invalid mnemonic: {e}")
        sys.exit(1)


def check_account_balance(client: algod.AlgodClient, address: str, network: str):
    """Check if account has sufficient balance"""
    try:
        account_info = client.account_info(address)
        balance_algos = account_info["amount"] / 1_000_000
        
        logger.info(f"📊 Deployer balance: {balance_algos:.6f} ALGO")
        
        # Require at least 2 ALGO for deployment + funding
        required = 2.0
        if balance_algos < required:
            logger.error(f"❌ Insufficient balance (need {required} ALGO)")
            if network == "localnet":
                logger.info("For LocalNet, fund from dispenser:")
                logger.info(f"  algokit goal clerk send --from <dispenser> --to {address} --amount 10000000")
            sys.exit(1)
            
        return balance_algos
    except Exception as e:
        logger.error(f"❌ Could not check balance: {e}")
        sys.exit(1)


def deploy_contract(network: str, auto_fund: bool = True):
    """Deploy GroupManager contract"""
    
    print("\n" + "=" * 70)
    print(f"🚀 Deploying GroupManager to {network.upper()}")
    print("=" * 70 + "\n")
    
    # Get client and deployer
    client = get_algod_client(network)
    private_key, deployer_address = get_deployer_account(network)
    
    logger.info(f"📍 Deployer address: {deployer_address}")
    
    # Check balance
    balance = check_account_balance(client, deployer_address, network)
    
    # Deploy using AlgoKit (requires algokit installed)
    try:
        logger.info("Building contract...")
        os.chdir(project_root)
        
        # Build
        build_result = os.system("algokit project run build")
        if build_result != 0:
            logger.error("❌ Build failed")
            sys.exit(1)
        
        logger.info("✅ Build successful")
        
        # Deploy
        logger.info(f"Deploying to {network}...")
        deploy_result = os.system(f"algokit project deploy {network}")
        if deploy_result != 0:
            logger.error("❌ Deployment failed")
            sys.exit(1)
        
        logger.info("✅ Deployment successful!")
        
        # Note: AlgoKit will print the App ID
        print("\n" + "=" * 70)
        print("📋 Copy the App ID from above and:")
        print("1. Update backend/.env: GROUP_MANAGER_APP_ID=<app_id>")
        print("2. Fund the contract (see instructions above)")
        print("3. Run tests: pytest tests/test_group_manager_enhanced.py -v")
        print("=" * 70 + "\n")
        
    except Exception as e:
        logger.error(f"❌ Deployment error: {e}")
        logger.info("\nManual deployment:")
        logger.info("1. cd projects/contracts")
        logger.info("2. algokit project run build")
        logger.info(f"3. algokit project deploy {network}")
        sys.exit(1)


def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(
        description="Deploy GroupManager smart contract"
    )
    parser.add_argument(
        "--network",
        choices=["localnet", "testnet", "mainnet"],
        default="localnet",
        help="Target network (default: localnet)"
    )
    parser.add_argument(
        "--no-auto-fund",
        action="store_true",
        help="Don't automatically fund the contract"
    )
    
    args = parser.parse_args()
    
    # Confirm mainnet deployment
    if args.network == "mainnet":
        print("⚠️  WARNING: You are about to deploy to MAINNET")
        response = input("Are you sure? (yes/no): ")
        if response.lower() != "yes":
            print("Deployment cancelled")
            sys.exit(0)
    
    # Deploy
    deploy_contract(
        network=args.network,
        auto_fund=not args.no_auto_fund
    )


if __name__ == "__main__":
    main()
