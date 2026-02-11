"""
Algorand Service - Smart Contract Interactions

Handles all interactions with Algorand blockchain and smart contracts:
- GroupManager contract
- ExpenseTracker contract
- SettlementExecutor contract

Provides transaction simulation, retry logic, and comprehensive error handling.
"""

import base64
import hashlib
import logging
from typing import Optional, Dict, Any, List, Tuple
from dataclasses import dataclass

from algosdk import transaction, account, encoding
from algosdk.v2client import algod, indexer
from algosdk.atomic_transaction_composer import (
    AtomicTransactionComposer,
    TransactionWithSigner,
    AccountTransactionSigner
)

from app.config import settings
from app.utils.retry import retry_with_backoff
from app.utils.errors import (
    AlgorandTransactionError,
    SmartContractError,
    InsufficientFundsError
)

logger = logging.getLogger(__name__)


@dataclass
class TransactionResult:
    """Result of a blockchain transaction"""
    tx_id: str
    confirmed_round: int
    return_value: Optional[Any] = None
    logs: Optional[List[bytes]] = None
    
    def decode_log(self, index: int = 0) -> Optional[int]:
        """Decode a log entry as integer (e.g., settlement_id)"""
        if self.logs and len(self.logs) > index:
            return int.from_bytes(self.logs[index], "big")
        return None


class AlgorandService:
    """Service for interacting with Algorand blockchain and smart contracts"""
    
    def __init__(self):
        self.algod_client = algod.AlgodClient(
            settings.ALGOD_TOKEN,
            settings.ALGOD_ADDRESS
        )
        self.indexer_client = indexer.IndexerClient(
            settings.INDEXER_TOKEN,
            settings.INDEXER_ADDRESS
        )
        
        self.group_manager_app_id = settings.GROUP_MANAGER_APP_ID
        self.expense_tracker_app_id = settings.EXPENSE_TRACKER_APP_ID
        self.settlement_executor_app_id = settings.SETTLEMENT_EXECUTOR_APP_ID
        
        logger.info(f"Algorand Service initialized")
        logger.info(f"GroupManager App ID: {self.group_manager_app_id}")
        logger.info(f"ExpenseTracker App ID: {self.expense_tracker_app_id}")
        logger.info(f"SettlementExecutor App ID: {self.settlement_executor_app_id}")
    
    # ========================================================================
    # WALLET & AUTHENTICATION
    # ========================================================================
    
    def generate_auth_message(self, wallet_address: str, nonce: str) -> str:
        """
        Generate message for wallet signature verification.
        
        Args:
            wallet_address: User's wallet address
            nonce: Random nonce from database
        
        Returns:
            Message to be signed by user's wallet
        """
        return f"AlgoCampus Login\nAddress: {wallet_address}\nNonce: {nonce}"
    
    def verify_signature(
        self,
        wallet_address: str,
        message: str,
        signature: str
    ) -> bool:
        """
        Verify Ed25519 signature from Algorand wallet.
        
        Args:
            wallet_address: Expected signer address
            message: Original message
            signature: Base64-encoded signature
        
        Returns:
            True if signature is valid
        """
        try:
            # Decode signature
            sig_bytes = base64.b64decode(signature)
            
            # Get public key from address
            public_key = encoding.decode_address(wallet_address)
            
            # Verify signature
            message_bytes = message.encode('utf-8')
            is_valid = encoding.verify_bytes(message_bytes, sig_bytes, public_key)
            
            logger.info(f"Signature verification for {wallet_address}: {is_valid}")
            return is_valid
            
        except Exception as e:
            logger.error(f"Signature verification error: {e}")
            return False
    
    # ========================================================================
    # GROUP MANAGER CONTRACT
    # ========================================================================
    
    @retry_with_backoff(max_retries=3, backoff=1.0)
    async def create_group(
        self,
        admin_address: str,
        admin_private_key: str,
        name: str,
        description: str
    ) -> TransactionResult:
        """
        Create a new expense split group on-chain.
        
        Args:
            admin_address: Group admin wallet address
            admin_private_key: Admin's private key for signing
            name: Group name
            description: Group description
        
        Returns:
            TransactionResult with group_id in logs
        
        Raises:
            SmartContractError: If contract call fails
        """
        try:
            sp = self.algod_client.suggested_params()
            
            # Build app call transaction
            txn = transaction.ApplicationCallTxn(
                sender=admin_address,
                sp=sp,
                index=self.group_manager_app_id,
                on_complete=transaction.OnComplete.NoOpOC,
                app_args=[
                    b"create_group",
                    name.encode('utf-8'),
                    description.encode('utf-8')
                ]
            )
            
            # Sign transaction
            signed_txn = txn.sign(admin_private_key)
            
            # Send transaction
            tx_id = self.algod_client.send_transaction(signed_txn)
            logger.info(f"Create group transaction sent: {tx_id}")
            
            # Wait for confirmation
            result = transaction.wait_for_confirmation(self.algod_client, tx_id, 4)
            
            # Extract group_id from logs
            logs = result.get("logs", [])
            decoded_logs = [base64.b64decode(log) for log in logs] if logs else []
            
            return TransactionResult(
                tx_id=tx_id,
                confirmed_round=result["confirmed-round"],
                logs=decoded_logs
            )
            
        except Exception as e:
            logger.error(f"Create group failed: {e}")
            raise SmartContractError(f"Failed to create group: {str(e)}")
    
    @retry_with_backoff(max_retries=3, backoff=1.0)
    async def add_group_member(
        self,
        admin_address: str,
        admin_private_key: str,
        group_id: int,
        member_address: str
    ) -> TransactionResult:
        """
        Add a member to a group.
        
        Args:
            admin_address: Group admin address
            admin_private_key: Admin's private key
            group_id: On-chain group ID
            member_address: Member to add
        
        Returns:
            TransactionResult
        """
        try:
            sp = self.algod_client.suggested_params()
            
            txn = transaction.ApplicationCallTxn(
                sender=admin_address,
                sp=sp,
                index=self.group_manager_app_id,
                on_complete=transaction.OnComplete.NoOpOC,
                app_args=[
                    b"add_member",
                    group_id.to_bytes(8, 'big'),
                    encoding.decode_address(member_address)
                ]
            )
            
            signed_txn = txn.sign(admin_private_key)
            tx_id = self.algod_client.send_transaction(signed_txn)
            
            logger.info(f"Add member transaction sent: {tx_id}")
            
            result = transaction.wait_for_confirmation(self.algod_client, tx_id, 4)
            
            return TransactionResult(
                tx_id=tx_id,
                confirmed_round=result["confirmed-round"]
            )
            
        except Exception as e:
            logger.error(f"Add member failed: {e}")
            raise SmartContractError(f"Failed to add member: {str(e)}")
    
    @retry_with_backoff(max_retries=3, backoff=1.0)
    async def generate_qr_invite(
        self,
        admin_address: str,
        admin_private_key: str,
        group_id: int,
        validity_seconds: int = 86400  # 24 hours
    ) -> Tuple[str, TransactionResult]:
        """
        Generate QR invite hash for a group.
        
        Args:
            admin_address: Group admin address
            admin_private_key: Admin's private key
            group_id: On-chain group ID
            validity_seconds: How long invite is valid
        
        Returns:
            Tuple of (invite_hash, TransactionResult)
        """
        try:
            sp = self.algod_client.suggested_params()
            
            txn = transaction.ApplicationCallTxn(
                sender=admin_address,
                sp=sp,
                index=self.group_manager_app_id,
                on_complete=transaction.OnComplete.NoOpOC,
                app_args=[
                    b"generate_qr_invite_hash",
                    group_id.to_bytes(8, 'big'),
                    validity_seconds.to_bytes(8, 'big')
                ]
            )
            
            signed_txn = txn.sign(admin_private_key)
            tx_id = self.algod_client.send_transaction(signed_txn)
            
            result = transaction.wait_for_confirmation(self.algod_client, tx_id, 4)
            
            # Extract invite hash from logs
            logs = result.get("logs", [])
            invite_hash = base64.b64decode(logs[0]).hex() if logs else ""
            
            return invite_hash, TransactionResult(
                tx_id=tx_id,
                confirmed_round=result["confirmed-round"]
            )
            
        except Exception as e:
            logger.error(f"Generate QR invite failed: {e}")
            raise SmartContractError(f"Failed to generate QR invite: {str(e)}")
    
    @retry_with_backoff(max_retries=3, backoff=1.0)
    async def join_group_via_qr(
        self,
        member_address: str,
        member_private_key: str,
        invite_hash: str
    ) -> TransactionResult:
        """
        Join a group using QR invite hash.
        
        Args:
            member_address: New member's address
            member_private_key: Member's private key
            invite_hash: Invite hash from QR code
        
        Returns:
            TransactionResult
        """
        try:
            sp = self.algod_client.suggested_params()
            
            # Convert hex hash to bytes
            invite_bytes = bytes.fromhex(invite_hash)
            
            txn = transaction.ApplicationCallTxn(
                sender=member_address,
                sp=sp,
                index=self.group_manager_app_id,
                on_complete=transaction.OnComplete.NoOpOC,
                app_args=[
                    b"join_group_via_qr",
                    invite_bytes
                ]
            )
            
            signed_txn = txn.sign(member_private_key)
            tx_id = self.algod_client.send_transaction(signed_txn)
            
            result = transaction.wait_for_confirmation(self.algod_client, tx_id, 4)
            
            return TransactionResult(
                tx_id=tx_id,
                confirmed_round=result["confirmed-round"]
            )
            
        except Exception as e:
            logger.error(f"Join group via QR failed: {e}")
            raise SmartContractError(f"Failed to join group: {str(e)}")
    
    # ========================================================================
 # EXPENSE TRACKER CONTRACT
    # ========================================================================
    
    @retry_with_backoff(max_retries=3, backoff=1.0)
    async def add_expense(
        self,
        payer_address: str,
        payer_private_key: str,
        group_id: int,
        amount: int,
        note: str,
        split_with: List[str]
    ) -> TransactionResult:
        """
        Add an expense to the tracker.
        
        Args:
            payer_address: Who paid
            payer_private_key: Payer's private key
            group_id: Group ID
            amount: Amount in microAlgos
            note: Expense description
            split_with: List of member addresses to split with
        
        Returns:
            TransactionResult with expense_id in logs
        """
        try:
            sp = self.algod_client.suggested_params()
            
            # Pack member addresses (32 bytes each)
            split_bytes = b"".join([
                encoding.decode_address(addr) for addr in split_with
            ])
            
            txn = transaction.ApplicationCallTxn(
                sender=payer_address,
                sp=sp,
                index=self.expense_tracker_app_id,
                on_complete=transaction.OnComplete.NoOpOC,
                app_args=[
                    b"add_expense",
                    group_id.to_bytes(8, 'big'),
                    amount.to_bytes(8, 'big'),
                    note.encode('utf-8'),
                    split_bytes
                ]
            )
            
            signed_txn = txn.sign(payer_private_key)
            tx_id = self.algod_client.send_transaction(signed_txn)
            
            logger.info(f"Add expense transaction sent: {tx_id}")
            
            result = transaction.wait_for_confirmation(self.algod_client, tx_id, 4)
            
            logs = result.get("logs", [])
            decoded_logs = [base64.b64decode(log) for log in logs] if logs else []
            
            return TransactionResult(
                tx_id=tx_id,
                confirmed_round=result["confirmed-round"],
                logs=decoded_logs
            )
            
        except Exception as e:
            logger.error(f"Add expense failed: {e}")
            raise SmartContractError(f"Failed to add expense: {str(e)}")
    
    async def get_user_balance(
        self,
        group_id: int,
        user_address: str
    ) -> int:
        """
        Get user's balance in a group (signed integer).
        
        Args:
            group_id: Group ID
            user_address: User's wallet address
        
        Returns:
            Balance in microAlgos (positive = owed, negative = owes)
        """
        try:
            # This is a read-only call (dryrun)
            sp = self.algod_client.suggested_params()
            
            txn = transaction.ApplicationCallTxn(
                sender=user_address,
                sp=sp,
                index=self.expense_tracker_app_id,
                on_complete=transaction.OnComplete.NoOpOC,
                app_args=[
                    b"get_user_balance",
                    group_id.to_bytes(8, 'big'),
                    encoding.decode_address(user_address)
                ]
            )
            
            # Use dryrun for read-only operation (doesn't cost fees)
            dryrun_result = self.algod_client.dryrun(txn)
            
            # Extract return value
            if dryrun_result and "txns" in dryrun_result:
                app_call_result = dryrun_result["txns"][0]
                if "logs" in app_call_result:
                    # Decode signed balance
                    encoded_balance = int.from_bytes(
                        base64.b64decode(app_call_result["logs"][0]),
                        "big"
                    )
                    
                    # Decode signed integer (as per ExpenseTracker contract)
                    SIGN_BIT = 2 ** 63
                    if encoded_balance < SIGN_BIT:
                        return encoded_balance  # Positive
                    else:
                        return -(encoded_balance - SIGN_BIT)  # Negative
            
            return 0
            
        except Exception as e:
            logger.error(f"Get user balance failed: {e}")
            return 0
    
    # ========================================================================
    # SETTLEMENT EXECUTOR CONTRACT
    # ========================================================================
    
    @retry_with_backoff(max_retries=3, backoff=1.0)
    async def initiate_settlement(
        self,
        debtor_address: str,
        debtor_private_key: str,
        expense_id: int,
        group_id: int,
        creditor_address: str,
        amount: int,
        note: str
    ) -> TransactionResult:
        """
        Initiate a settlement intent.
        
        Args:
            debtor_address: Who owes money
            debtor_private_key: Debtor's private key
            expense_id: Related expense ID (0 for standalone)
            group_id: Group ID (0 for standalone)
            creditor_address: Who is owed money
            amount: Amount in microAlgos
            note: Settlement description
        
        Returns:
            TransactionResult with settlement_id in logs
        """
        try:
            sp = self.algod_client.suggested_params()
            
            txn = transaction.ApplicationCallTxn(
                sender=debtor_address,
                sp=sp,
                index=self.settlement_executor_app_id,
                on_complete=transaction.OnComplete.NoOpOC,
                app_args=[
                    b"initiate_settlement",
                    expense_id.to_bytes(8, 'big'),
                    group_id.to_bytes(8, 'big'),
                    encoding.decode_address(debtor_address),
                    encoding.decode_address(creditor_address),
                    amount.to_bytes(8, 'big'),
                    note.encode('utf-8')
                ]
            )
            
            signed_txn = txn.sign(debtor_private_key)
            tx_id = self.algod_client.send_transaction(signed_txn)
            
            logger.info(f"Initiate settlement transaction sent: {tx_id}")
            
            result = transaction.wait_for_confirmation(self.algod_client, tx_id, 4)
            
            logs = result.get("logs", [])
            decoded_logs = [base64.b64decode(log) for log in logs] if logs else []
            
            return TransactionResult(
                tx_id=tx_id,
                confirmed_round=result["confirmed-round"],
                logs=decoded_logs
            )
            
        except Exception as e:
            logger.error(f"Initiate settlement failed: {e}")
            raise SmartContractError(f"Failed to initiate settlement: {str(e)}")
    
    @retry_with_backoff(max_retries=3, backoff=1.0)
    async def execute_settlement(
        self,
        debtor_address: str,
        debtor_private_key: str,
        settlement_id: int,
        creditor_address: str,
        amount: int
    ) -> TransactionResult:
        """
        Execute settlement via atomic transaction group.
        
        CRITICAL: Creates atomic group [Payment, AppCall]
        
        Args:
            debtor_address: Debtor wallet address
            debtor_private_key: Debtor's private key
            settlement_id: Settlement ID to execute
            creditor_address: Creditor wallet address
            amount: Amount in microAlgos
        
        Returns:
            TransactionResult
        """
        try:
            sp = self.algod_client.suggested_params()
            
            # Transaction 0: Payment
            payment_txn = transaction.PaymentTxn(
                sender=debtor_address,
                receiver=creditor_address,
                amt=amount,
                sp=sp
            )
            
            # Transaction 1: AppCall
            app_call_txn = transaction.ApplicationCallTxn(
                sender=debtor_address,
                sp=sp,
                index=self.settlement_executor_app_id,
                on_complete=transaction.OnComplete.NoOpOC,
                app_args=[
                    b"execute_settlement",
                    settlement_id.to_bytes(8, 'big')
                ]
            )
            
            # Create atomic group
            gid = transaction.calculate_group_id([payment_txn, app_call_txn])
            payment_txn.group = gid
            app_call_txn.group = gid
            
            # Sign both transactions
            signed_payment = payment_txn.sign(debtor_private_key)
            signed_app_call = app_call_txn.sign(debtor_private_key)
            
            # Send atomic group
            tx_id = self.algod_client.send_transactions([signed_payment, signed_app_call])
            
            logger.info(f"Execute settlement atomic group sent: {tx_id}")
            
            # Wait for confirmation
            result = transaction.wait_for_confirmation(self.algod_client, tx_id, 4)
            
            return TransactionResult(
                tx_id=tx_id,
                confirmed_round=result["confirmed-round"]
            )
            
        except Exception as e:
            logger.error(f"Execute settlement failed: {e}")
            raise SmartContractError(f"Failed to execute settlement: {str(e)}")
    
    async def get_settlement_status(
        self,
        settlement_id: int
    ) -> bool:
        """
        Check if a settlement has been executed.
        
        Args:
            settlement_id: Settlement ID to check
        
        Returns:
            True if executed, False otherwise
        """
        try:
            # Read-only call
            sp = self.algod_client.suggested_params()
            
            # We need a dummy sender for dryrun
            dummy_sender = "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAY5HFKQ"
            
            txn = transaction.ApplicationCallTxn(
                sender=dummy_sender,
                sp=sp,
                index=self.settlement_executor_app_id,
                on_complete=transaction.OnComplete.NoOpOC,
                app_args=[
                    b"verify_settlement_state",
                    settlement_id.to_bytes(8, 'big')
                ]
            )
            
            dryrun_result = self.algod_client.dryrun(txn)
            
            if dryrun_result and "txns" in dryrun_result:
                app_call_result = dryrun_result["txns"][0]
                if "logs" in app_call_result:
                    # First byte: 0 = False, 1 = True
                    executed = base64.b64decode(app_call_result["logs"][0])[0] == 1
                    return executed
            
            return False
            
        except Exception as e:
            logger.error(f"Get settlement status failed: {e}")
            return False
    
    # ========================================================================
    # TRANSACTION SIMULATION & VALIDATION
    # ========================================================================
    
    async def simulate_transaction(
        self,
        unsigned_txn: transaction.Transaction
    ) -> Dict[str, Any]:
        """
        Simulate a transaction without actually sending it.
        
        Args:
            unsigned_txn: Unsigned transaction to simulate
        
        Returns:
            Simulation result with cost, status, etc.
        """
        try:
            dryrun_result = self.algod_client.dryrun(unsigned_txn)
            
            return {
                "success": True,
                "result": dryrun_result,
                "cost": dryrun_result.get("txns", [{}])[0].get("cost", 0)
            }
            
        except Exception as e:
            logger.error(f"Transaction simulation failed: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    async def check_account_balance(self, address: str) -> int:
        """
        Get account balance in microAlgos.
        
        Args:
            address: Wallet address to check
        
        Returns:
            Balance in microAlgos
        """
        try:
            account_info = self.algod_client.account_info(address)
            return account_info.get("amount", 0)
            
        except Exception as e:
            logger.error(f"Check account balance failed: {e}")
            return 0
    
    # ========================================================================
    # INDEXER QUERIES
    # ========================================================================
    
    async def get_account_transactions(
        self,
        address: str,
        limit: int = 50,
        next_token: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Get transaction history for an account.
        
        Args:
            address: Wallet address
            limit: Number of transactions to fetch
            next_token: Pagination token
        
        Returns:
            Transaction history with pagination
        """
        try:
            params = {"limit": limit}
            if next_token:
                params["next"] = next_token
            
            response = self.indexer_client.search_transactions_by_address(
                address=address,
                **params
            )
            
            return {
                "transactions": response.get("transactions", []),
                "next_token": response.get("next-token"),
                "current_round": response.get("current-round")
            }
            
        except Exception as e:
            logger.error(f"Get account transactions failed: {e}")
            return {
                "transactions": [],
                "next_token": None
            }


# Singleton instance
_algorand_service: Optional[AlgorandService] = None


def get_algorand_service() -> AlgorandService:
    """Get singleton Algorand service instance"""
    global _algorand_service
    if _algorand_service is None:
        _algorand_service = AlgorandService()
    return _algorand_service
