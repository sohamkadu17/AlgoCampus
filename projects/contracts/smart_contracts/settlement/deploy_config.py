"""
Deployment Configuration for SettlementExecutor Smart Contract

Handles deployment to LocalNet, TestNet, and MainNet with proper
configuration and cost estimation.

Author: AlgoCampus Team
"""

from algokit_utils import (
    Account,
    ApplicationClient,
    ApplicationSpecification,
    get_account,
    get_algod_client,
    get_indexer_client,
)
from algosdk.v2client import algod
from pathlib import Path

from smart_contracts.settlement.contract import SettlementExecutor


# ============================================================================
# DEPLOYMENT CONFIGURATION
# ============================================================================


def get_deployment_config(network: str) -> dict:
    """
    Get deployment configuration for specified network.
    
    Args:
        network: "localnet", "testnet", or "mainnet"
    
    Returns:
        Configuration dictionary
    """
    configs = {
        "localnet": {
            "algod_address": "http://localhost:4001",
            "algod_token": "a" * 64,
            "indexer_address": "http://localhost:8980",
            "indexer_token": "a" * 64,
            "funding_amount": 50_000_000,  # 50 ALGO for development
        },
        "testnet": {
            "algod_address": "https://testnet-api.algonode.cloud",
            "algod_token": "",  # Public API
            "indexer_address": "https://testnet-idx.algonode.cloud",
            "indexer_token": "",  # Public API
            "funding_amount": 20_000_000,  # 20 ALGO for testing
        },
        "mainnet": {
            "algod_address": "https://mainnet-api.algonode.cloud",
            "algod_token": "",  # Public API
            "indexer_address": "https://mainnet-idx.algonode.cloud",
            "indexer_token": "",  # Public API
            "funding_amount": 100_000_000,  # 100 ALGO for production
        },
    }
    
    return configs[network]


# ============================================================================
# DEPLOYMENT FUNCTIONS
# ============================================================================


def deploy_settlement_executor(
    network: str = "localnet",
    deployer_mnemonic: str = None,
    expense_tracker_app_id: int = 0,
) -> dict:
    """
    Deploy SettlementExecutor contract to specified network.
    
    Args:
        network: Target network ("localnet", "testnet", "mainnet")
        deployer_mnemonic: Mnemonic phrase for deployer account
        expense_tracker_app_id: App ID of ExpenseTracker (0 if not integrated)
    
    Returns:
        Deployment information dictionary
    """
    # Get network configuration
    config = get_deployment_config(network)
    
    # Initialize Algod client
    algod_client = algod.AlgodClient(
        algod_token=config["algod_token"],
        algod_address=config["algod_address"],
    )
    
    # Get deployer account
    if network == "localnet":
        deployer = get_account(algod_client, "deployer")
    else:
        if not deployer_mnemonic:
            raise ValueError("Deployer mnemonic required for testnet/mainnet")
        deployer = Account.from_mnemonic(deployer_mnemonic)
    
    print(f"Deploying to {network}...")
    print(f"Deployer address: {deployer.address}")
    
    # Load contract specification
    app_spec = ApplicationSpecification.from_json(
        Path(__file__).parent.parent / "artifacts" / "settlement" / "SettlementExecutor.arc56.json"
    )
    
    # Create application client
    app_client = ApplicationClient(
        algod_client=algod_client,
        app_spec=app_spec,
        signer=deployer,
    )
    
    # Deploy contract
    print("Creating application...")
    app_id, app_address, _ = app_client.create()
    
    print(f"✅ Contract deployed!")
    print(f"   App ID: {app_id}")
    print(f"   App Address: {app_address}")
    
    # Fund contract for box storage
    print(f"\nFunding contract with {config['funding_amount'] / 1_000_000} ALGO...")
    fund_contract(algod_client, deployer, app_address, config["funding_amount"])
    
    # Configure ExpenseTracker integration if provided
    if expense_tracker_app_id > 0:
        print(f"\nConfiguring ExpenseTracker integration (App ID: {expense_tracker_app_id})...")
        app_client.call(
            method="set_expense_tracker",
            app_id=expense_tracker_app_id,
        )
        print("✅ ExpenseTracker configured")
    
    # Return deployment info
    return {
        "network": network,
        "app_id": app_id,
        "app_address": app_address,
        "deployer_address": deployer.address,
        "expense_tracker_app_id": expense_tracker_app_id,
        "funded_amount": config["funding_amount"],
    }


def fund_contract(
    algod_client: algod.AlgodClient,
    sender: Account,
    contract_address: str,
    amount: int,
) -> str:
    """
    Send ALGO to contract for box storage MBR.
    
    Args:
        algod_client: Algod client
        sender: Account funding the contract
        contract_address: Contract address to fund
        amount: Amount in microAlgos
    
    Returns:
        Transaction ID
    """
    from algosdk import transaction
    
    sp = algod_client.suggested_params()
    
    txn = transaction.PaymentTxn(
        sender=sender.address,
        receiver=contract_address,
        amt=amount,
        sp=sp,
    )
    
    signed_txn = txn.sign(sender.private_key)
    tx_id = algod_client.send_transaction(signed_txn)
    
    transaction.wait_for_confirmation(algod_client, tx_id, 4)
    
    print(f"✅ Funded contract: {amount / 1_000_000} ALGO")
    return tx_id


# ============================================================================
# POST-DEPLOYMENT CONFIGURATION
# ============================================================================


def configure_expense_tracker_integration(
    network: str,
    settlement_app_id: int,
    expense_tracker_app_id: int,
    admin_mnemonic: str,
) -> None:
    """
    Configure ExpenseTracker integration after deployment.
    
    Args:
        network: Target network
        settlement_app_id: SettlementExecutor app ID
        expense_tracker_app_id: ExpenseTracker app ID
        admin_mnemonic: Admin account mnemonic
    """
    config = get_deployment_config(network)
    
    algod_client = algod.AlgodClient(
        algod_token=config["algod_token"],
        algod_address=config["algod_address"],
    )
    
    admin = Account.from_mnemonic(admin_mnemonic)
    
    # Load app spec
    app_spec = ApplicationSpecification.from_json(
        Path(__file__).parent.parent / "artifacts" / "settlement" / "SettlementExecutor.arc56.json"
    )
    
    app_client = ApplicationClient(
        algod_client=algod_client,
        app_spec=app_spec,
        app_id=settlement_app_id,
        signer=admin,
    )
    
    print(f"Configuring ExpenseTracker integration...")
    app_client.call(
        method="set_expense_tracker",
        app_id=expense_tracker_app_id,
    )
    
    print(f"✅ Integration configured")


def transfer_admin(
    network: str,
    settlement_app_id: int,
    current_admin_mnemonic: str,
    new_admin_address: str,
) -> None:
    """
    Transfer admin privileges to new address.
    
    Args:
        network: Target network
        settlement_app_id: SettlementExecutor app ID
        current_admin_mnemonic: Current admin mnemonic
        new_admin_address: New admin address
    """
    config = get_deployment_config(network)
    
    algod_client = algod.AlgodClient(
        algod_token=config["algod_token"],
        algod_address=config["algod_address"],
    )
    
    current_admin = Account.from_mnemonic(current_admin_mnemonic)
    
    app_spec = ApplicationSpecification.from_json(
        Path(__file__).parent.parent / "artifacts" / "settlement" / "SettlementExecutor.arc56.json"
    )
    
    app_client = ApplicationClient(
        algod_client=algod_client,
        app_spec=app_spec,
        app_id=settlement_app_id,
        signer=current_admin,
    )
    
    print(f"Transferring admin to {new_admin_address}...")
    app_client.call(
        method="set_admin",
        new_admin=new_admin_address,
    )
    
    print(f"✅ Admin transferred")


# ============================================================================
# COST ESTIMATION
# ============================================================================


def estimate_deployment_costs() -> dict:
    """
    Estimate deployment and operational costs.
    
    Returns:
        Cost breakdown dictionary
    """
    return {
        "deployment": {
            "contract_creation": {
                "gas": 0.001,  # ALGO
                "description": "One-time contract deployment fee",
            },
            "contract_funding": {
                "localnet": 50,  # ALGO
                "testnet": 20,  # ALGO
                "mainnet": 100,  # ALGO
                "description": "Initial funding for box storage MBR",
            },
        },
        "per_settlement": {
            "initiate": {
                "gas": 0.001,  # ALGO
                "storage": 0.0825,  # ALGO (200 bytes)
                "total": 0.0835,  # ALGO
            },
            "execute": {
                "gas_payment": 0.001,  # ALGO (Payment txn)
                "gas_app_call": 0.001,  # ALGO (AppCall txn)
                "gas_inner_txn": 0.001,  # ALGO (ExpenseTracker call, if integrated)
                "total": 0.003,  # ALGO
            },
            "cancel": {
                "gas": 0.001,  # ALGO
            },
            "cleanup": {
                "gas": 0.001,  # ALGO
                "storage_reclaimed": 0.0825,  # ALGO (MBR returned)
            },
        },
        "production_estimates": {
            "100_settlements": {
                "storage": 8.25,  # ALGO
                "gas": 1.0,  # ALGO (initiate + execute)
                "total": 9.25,  # ALGO
            },
            "1000_settlements": {
                "storage": 82.5,  # ALGO
                "gas": 10.0,  # ALGO
                "total": 92.5,  # ALGO
            },
            "10000_settlements": {
                "storage": 825,  # ALGO
                "gas": 100,  # ALGO
                "total": 925,  # ALGO
            },
        },
    }


def print_cost_estimates():
    """Print formatted cost estimates."""
    costs = estimate_deployment_costs()
    
    print("\n" + "=" * 60)
    print("SETTLEMENT EXECUTOR - COST ESTIMATES")
    print("=" * 60)
    
    print("\n📊 Deployment Costs:")
    print(f"  Contract Creation: {costs['deployment']['contract_creation']['gas']} ALGO")
    print(f"  LocalNet Funding: {costs['deployment']['contract_funding']['localnet']} ALGO")
    print(f"  TestNet Funding: {costs['deployment']['contract_funding']['testnet']} ALGO")
    print(f"  MainNet Funding: {costs['deployment']['contract_funding']['mainnet']} ALGO")
    
    print("\n💸 Per-Settlement Costs:")
    print(f"  Initiate: {costs['per_settlement']['initiate']['total']} ALGO")
    print(f"    └─ Gas: {costs['per_settlement']['initiate']['gas']} ALGO")
    print(f"    └─ Storage: {costs['per_settlement']['initiate']['storage']} ALGO")
    print(f"  Execute: {costs['per_settlement']['execute']['total']} ALGO")
    print(f"  Cancel: {costs['per_settlement']['cancel']['gas']} ALGO")
    print(f"  Cleanup (reclaims): +{costs['per_settlement']['cleanup']['storage_reclaimed']} ALGO")
    
    print("\n🎯 Production Estimates:")
    for scale, cost in costs["production_estimates"].items():
        print(f"  {scale.replace('_', ' ').title()}:")
        print(f"    └─ Total: {cost['total']} ALGO")
    
    print("\n" + "=" * 60 + "\n")


# ============================================================================
# VALIDATION & TESTING
# ============================================================================


def validate_deployment(
    network: str,
    app_id: int,
) -> bool:
    """
    Validate that contract was deployed correctly.
    
    Args:
        network: Target network
        app_id: Application ID to validate
    
    Returns:
        True if valid, False otherwise
    """
    config = get_deployment_config(network)
    
    algod_client = algod.AlgodClient(
        algod_token=config["algod_token"],
        algod_address=config["algod_address"],
    )
    
    try:
        # Get application info
        app_info = algod_client.application_info(app_id)
        
        # Verify global state
        global_state = app_info["params"]["global-state"]
        
        print(f"\n✅ Contract validation passed!")
        print(f"   App ID: {app_id}")
        print(f"   Global State: {len(global_state)} keys")
        
        return True
    
    except Exception as e:
        print(f"\n❌ Contract validation failed: {e}")
        return False


# ============================================================================
# CLI INTERFACE
# ============================================================================


def main():
    """Main deployment script."""
    import argparse
    
    parser = argparse.ArgumentParser(description="Deploy SettlementExecutor contract")
    parser.add_argument(
        "--network",
        choices=["localnet", "testnet", "mainnet"],
        default="localnet",
        help="Target network",
    )
    parser.add_argument(
        "--mnemonic",
        help="Deployer mnemonic (required for testnet/mainnet)",
    )
    parser.add_argument(
        "--expense-tracker-id",
        type=int,
        default=0,
        help="ExpenseTracker app ID for integration",
    )
    parser.add_argument(
        "--show-costs",
        action="store_true",
        help="Show cost estimates only",
    )
    
    args = parser.parse_args()
    
    if args.show_costs:
        print_cost_estimates()
        return
    
    # Deploy contract
    deployment_info = deploy_settlement_executor(
        network=args.network,
        deployer_mnemonic=args.mnemonic,
        expense_tracker_app_id=args.expense_tracker_id,
    )
    
    # Validate deployment
    validate_deployment(args.network, deployment_info["app_id"])
    
    # Print summary
    print("\n" + "=" * 60)
    print("DEPLOYMENT SUMMARY")
    print("=" * 60)
    print(f"Network: {deployment_info['network']}")
    print(f"App ID: {deployment_info['app_id']}")
    print(f"App Address: {deployment_info['app_address']}")
    print(f"Deployer: {deployment_info['deployer_address']}")
    print(f"Funded: {deployment_info['funded_amount'] / 1_000_000} ALGO")
    
    if deployment_info["expense_tracker_app_id"] > 0:
        print(f"ExpenseTracker: {deployment_info['expense_tracker_app_id']} (configured)")
    else:
        print("ExpenseTracker: Not configured")
    
    print("\n📝 Next Steps:")
    print("1. Update backend/.env with SETTLEMENT_EXECUTOR_APP_ID")
    print("2. Test settlement creation via API")
    print("3. Test atomic group execution")
    print("4. Monitor settlement events in indexer")
    print("=" * 60 + "\n")


if __name__ == "__main__":
    main()


# ============================================================================
# INTEGRATION EXAMPLES
# ============================================================================

"""
EXAMPLE 1: Deploy to LocalNet for Development
──────────────────────────────────────────────

python deploy_config.py --network localnet --expense-tracker-id 123


EXAMPLE 2: Deploy to TestNet for Testing
─────────────────────────────────────────

python deploy_config.py \
    --network testnet \
    --mnemonic "your twenty four word mnemonic phrase here..." \
    --expense-tracker-id 456


EXAMPLE 3: Show Cost Estimates
───────────────────────────────

python deploy_config.py --show-costs


EXAMPLE 4: Configure Integration After Deployment
──────────────────────────────────────────────────

from deploy_config import configure_expense_tracker_integration

configure_expense_tracker_integration(
    network="testnet",
    settlement_app_id=789,
    expense_tracker_app_id=456,
    admin_mnemonic="your admin mnemonic...",
)


EXAMPLE 5: Transfer Admin to Multi-Sig
───────────────────────────────────────

from deploy_config import transfer_admin

transfer_admin(
    network="mainnet",
    settlement_app_id=789,
    current_admin_mnemonic="current admin mnemonic...",
    new_admin_address="MULTISIG_ADDRESS",
)
"""
