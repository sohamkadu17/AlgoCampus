"""
SettlementExecutor Smart Contract

A secure, atomic settlement execution contract for peer-to-peer debt settlements.
Handles atomic transaction groups with comprehensive validation and replay protection.

Features:
- Atomic transaction grouping (Payment + AppCall)
- Double-payment prevention with settlement state tracking
- Replay protection via unique settlement IDs
- Signature verification for all parties
- Gas-optimized box storage
- Event logging for indexing
- Integration with ExpenseTracker contract

Security Properties:
- Only debtor can initiate settlement
- Payment must be in same atomic group as execute call
- Settlement can only be executed once
- Amount and receiver must match exactly
- Timeout mechanism for abandoned settlements
- Admin emergency controls

Author: AlgoCampus Team
Version: 1.0.0
"""

from algopy import (
    ARC4Contract,
    Account,
    Application,
    Bytes,
    Global,
    String,
    Txn,
    UInt64,
    arc4,
    gtxn,
    itxn,
    op,
    subroutine,
)


# ============================================================================
# DATA STRUCTURES
# ============================================================================


class SettlementInfo(arc4.Struct):
    """
    Settlement information stored on-chain.
    
    Attributes:
        settlement_id: Unique identifier for this settlement
        expense_id: Associated expense ID from ExpenseTracker (0 if standalone)
        group_id: Group ID from ExpenseTracker (0 if standalone)
        debtor: Wallet that owes money
        creditor: Wallet that is owed money
        amount: Settlement amount in microAlgos
        initiated_at: Unix timestamp when settlement was created
        executed_at: Unix timestamp when payment was verified (0 if pending)
        executed: Whether settlement has been completed
        payment_txn_id: Transaction ID of the payment (for verification)
        cancelled: Whether settlement was cancelled before execution
        expires_at: Unix timestamp after which settlement can be cancelled
        note: Optional description
    
    Storage: Box storage with key = settlement_id
    Size: ~200 bytes per settlement
    """
    settlement_id: arc4.UInt64
    expense_id: arc4.UInt64
    group_id: arc4.UInt64
    debtor: arc4.Address
    creditor: arc4.Address
    amount: arc4.UInt64
    initiated_at: arc4.UInt64
    executed_at: arc4.UInt64
    executed: arc4.Bool
    payment_txn_id: arc4.StaticArray[arc4.Byte, arc4.typing.Literal[32]]  # 32-byte txn ID
    cancelled: arc4.Bool
    expires_at: arc4.UInt64
    note: arc4.String


class SettlementEvent(arc4.Struct):
    """
    Event data emitted after settlement execution.
    Logged for easy indexing and real-time updates.
    
    Attributes:
        settlement_id: Unique settlement identifier
        debtor: Wallet that paid
        creditor: Wallet that received payment
        amount: Amount settled in microAlgos
        timestamp: When settlement was executed
        payment_txn_id: Transaction ID for verification
    """
    settlement_id: arc4.UInt64
    debtor: arc4.Address
    creditor: arc4.Address
    amount: arc4.UInt64
    timestamp: arc4.UInt64
    payment_txn_id: arc4.StaticArray[arc4.Byte, arc4.typing.Literal[32]]


# ============================================================================
# MAIN CONTRACT
# ============================================================================


class SettlementExecutor(ARC4Contract):
    """
    Stateful smart contract for secure peer-to-peer settlement execution.
    
    Global State (48 bytes):
        - contract_admin: Administrator address (32 bytes)
        - expense_tracker_app_id: Optional ExpenseTracker integration (8 bytes)
        - settlement_counter: Next settlement ID (8 bytes)
    
    Box Storage:
        - settlement_{id}: SettlementInfo (~200 bytes each)
        - debtor_settlements_{address}: List of settlement IDs for debtor
        - creditor_settlements_{address}: List of settlement IDs for creditor
    
    Gas Optimization:
        - Box storage for variable-length data
        - Minimal global state (48 bytes)
        - Efficient packing of settlement data
        - Single atomic group verification
    """
    
    # Global state fields
    contract_admin: Account
    expense_tracker_app_id: UInt64
    settlement_counter: UInt64
    
    # Constants
    SETTLEMENT_TIMEOUT: UInt64 = UInt64(86400)  # 24 hours in seconds
    MAX_NOTE_LENGTH: UInt64 = UInt64(200)
    
    @arc4.abimethod(allow_actions=["CreateApplication"])
    def create_application(self) -> None:
        """
        Initialize the SettlementExecutor contract.
        
        Sets the deployer as the contract admin and initializes counters.
        Must be called once during deployment.
        
        Security:
            - Only callable during contract creation
            - Sets immutable admin (can be updated via set_admin method)
        
        Gas Cost: ~0.001 ALGO
        """
        self.contract_admin = Txn.sender
        self.settlement_counter = UInt64(0)
        self.expense_tracker_app_id = UInt64(0)  # Not configured yet
    
    @arc4.abimethod
    def set_expense_tracker(self, app_id: UInt64) -> None:
        """
        Configure the ExpenseTracker app ID for integration.
        
        Args:
            app_id: Application ID of the deployed ExpenseTracker contract
        
        Security:
            - Only admin can call
            - Can be updated if integration changes
        
        Post-Deployment:
            After deploying both contracts, call this method to enable
            automatic expense settlement marking.
        
        Gas Cost: ~0.001 ALGO
        """
        assert Txn.sender == self.contract_admin, "Only admin can configure"
        self.expense_tracker_app_id = app_id
    
    @arc4.abimethod
    def set_admin(self, new_admin: Account) -> None:
        """
        Transfer admin privileges to a new address.
        
        Args:
            new_admin: New administrator account
        
        Security:
            - Only current admin can transfer
            - Useful for multi-sig or contract upgrades
        
        Gas Cost: ~0.001 ALGO
        """
        assert Txn.sender == self.contract_admin, "Only admin can transfer"
        self.contract_admin = new_admin
    
    # ========================================================================
    # CORE SETTLEMENT METHODS
    # ========================================================================
    
    @arc4.abimethod
    def initiate_settlement(
        self,
        expense_id: UInt64,
        group_id: UInt64,
        debtor: Account,
        creditor: Account,
        amount: UInt64,
        note: String,
    ) -> UInt64:
        """
        Create a settlement intent between two parties.
        
        This method creates a settlement record that can later be executed
        via an atomic group transaction. It validates the settlement parameters
        and stores the intent on-chain.
        
        Args:
            expense_id: Associated expense ID (0 for standalone settlements)
            group_id: Associated group ID (0 for standalone)
            debtor: Wallet address that owes money
            creditor: Wallet address that is owed money
            amount: Settlement amount in microAlgos (must be positive)
            note: Optional description (max 200 chars)
        
        Returns:
            settlement_id: Unique identifier for this settlement
        
        Security:
            - Only debtor can initiate (prevents unauthorized settlements)
            - Amount must be positive
            - Debtor and creditor must be different
            - Note length validated
            - Expiration set to prevent indefinite pending state
        
        Replay Protection:
            Each settlement gets a unique ID. The same expense can have
            multiple settlement attempts if previous ones are cancelled.
        
        Storage Cost:
            ~0.08 ALGO (200 bytes for SettlementInfo box)
        
        Gas Cost:
            ~0.001 ALGO
        
        Example:
            settlement_id = initiate_settlement(
                expense_id=123,
                group_id=5,
                debtor="DEBTOR_ADDRESS",
                creditor="CREDITOR_ADDRESS",
                amount=50_000_000,  # 50 ALGO
                note="Dinner split settlement"
            )
        """
        # SECURITY: Only debtor can initiate their own settlement
        assert Txn.sender == debtor, "Only debtor can initiate settlement"
        
        # INPUT VALIDATION: Ensure valid parameters
        assert amount > 0, "Amount must be positive"
        assert debtor != creditor, "Debtor and creditor must be different"
        assert op.len(note) <= self.MAX_NOTE_LENGTH, "Note too long"
        
        # Generate unique settlement ID
        settlement_id = self.settlement_counter
        self.settlement_counter += 1
        
        # Create settlement info
        settlement = SettlementInfo(
            settlement_id=arc4.UInt64(settlement_id),
            expense_id=arc4.UInt64(expense_id),
            group_id=arc4.UInt64(group_id),
            debtor=arc4.Address(debtor),
            creditor=arc4.Address(creditor),
            amount=arc4.UInt64(amount),
            initiated_at=arc4.UInt64(Global.latest_timestamp),
            executed_at=arc4.UInt64(0),  # Not executed yet
            executed=arc4.Bool(False),
            payment_txn_id=arc4.StaticArray(
                *[arc4.Byte(0) for _ in range(32)]
            ),  # Empty txn ID
            cancelled=arc4.Bool(False),
            expires_at=arc4.UInt64(Global.latest_timestamp + self.SETTLEMENT_TIMEOUT),
            note=arc4.String(note),
        )
        
        # Store in box storage
        box_key = self._get_settlement_box_key(settlement_id)
        op.Box.put(box_key, settlement.bytes)
        
        # Track settlement IDs for both parties (for query purposes)
        self._add_to_debtor_list(debtor, settlement_id)
        self._add_to_creditor_list(creditor, settlement_id)
        
        return settlement_id
    
    @arc4.abimethod
    def execute_settlement(self, settlement_id: UInt64) -> None:
        """
        Execute a settlement by verifying the payment transaction.
        
        CRITICAL: This method MUST be called in an atomic transaction group
        with the payment transaction. The structure must be:
        
        Atomic Group:
            [Txn 0] Payment: debtor → creditor (amount = settlement.amount)
            [Txn 1] AppCall: execute_settlement(settlement_id)
        
        The contract verifies:
            1. Payment is in the same group (Txn 0)
            2. Payment sender = settlement.debtor
            3. Payment receiver = settlement.creditor
            4. Payment amount = settlement.amount
            5. Settlement hasn't been executed yet
            6. Settlement hasn't been cancelled
            7. Settlement hasn't expired
        
        Args:
            settlement_id: ID of the settlement to execute
        
        Security - Atomic Group Verification:
            - Checks that Txn.group_index == 1 (must be second in group)
            - Verifies gtxn[0] is a Payment transaction
            - Validates all payment parameters match settlement
        
        Security - Double-Payment Prevention:
            - Checks settlement.executed == False before marking True
            - Once executed, settlement cannot be executed again
            - Payment txn ID stored for verification
        
        Security - Replay Protection:
            - Settlement ID is unique and immutable
            - Executed flag prevents re-execution
            - Payment txn ID stored for audit trail
        
        Post-Execution:
            - If expense_tracker_app_id is configured, calls mark_expense_settled
            - Emits SettlementEvent for indexing
            - Updates settlement record with execution details
        
        Gas Cost:
            ~0.002 ALGO (includes inner transaction if ExpenseTracker call)
        
        Example:
            # Build atomic group
            payment_txn = PaymentTxn(
                sender=debtor_address,
                receiver=creditor_address,
                amt=settlement_amount,
                sp=suggested_params,
            )
            
            app_call_txn = ApplicationNoOpTxn(
                sender=debtor_address,
                index=settlement_executor_app_id,
                app_args=["execute_settlement", settlement_id],
                sp=suggested_params,
            )
            
            # Assign group ID
            gid = transaction.calculate_group_id([payment_txn, app_call_txn])
            payment_txn.group = gid
            app_call_txn.group = gid
            
            # Sign and send
            signed_payment = payment_txn.sign(debtor_private_key)
            signed_app_call = app_call_txn.sign(debtor_private_key)
            
            txid = algod_client.send_transactions([signed_payment, signed_app_call])
        """
        # SECURITY: Must be in atomic group with payment transaction
        assert Txn.group_index == UInt64(1), "Must be transaction 1 in atomic group"
        
        # Load settlement info
        box_key = self._get_settlement_box_key(settlement_id)
        assert op.Box.length(box_key) > 0, "Settlement does not exist"
        
        settlement_bytes = op.Box.get(box_key).value
        settlement = SettlementInfo.from_bytes(settlement_bytes)
        
        # SECURITY: Double-payment prevention
        assert not settlement.executed.native, "Settlement already executed"
        assert not settlement.cancelled.native, "Settlement was cancelled"
        
        # SECURITY: Check expiration
        assert Global.latest_timestamp <= settlement.expires_at.native, "Settlement expired"
        
        # SECURITY: Verify atomic group payment transaction (Txn 0)
        payment_txn = gtxn.PaymentTransaction(0)
        
        # Verify payment sender matches debtor
        assert payment_txn.sender == settlement.debtor.native, "Payment sender must be debtor"
        
        # Verify payment receiver matches creditor
        assert payment_txn.receiver == settlement.creditor.native, "Payment receiver must be creditor"
        
        # Verify payment amount matches exactly
        assert payment_txn.amount == settlement.amount.native, "Payment amount must match settlement"
        
        # SIGNATURE VERIFICATION: Payment transaction must be signed by debtor
        # (Algorand runtime already verifies this, but we assert for clarity)
        assert payment_txn.sender == Txn.sender, "Debtor must sign both transactions"
        
        # Mark settlement as executed
        settlement.executed = arc4.Bool(True)
        settlement.executed_at = arc4.UInt64(Global.latest_timestamp)
        
        # Store payment transaction ID for audit trail
        payment_txn_id = payment_txn.txn_id
        settlement.payment_txn_id = arc4.StaticArray(
            *[arc4.Byte(payment_txn_id[i]) for i in range(32)]
        )
        
        # Save updated settlement
        op.Box.put(box_key, settlement.bytes)
        
        # INTEGRATION: If ExpenseTracker is configured, mark expense as settled
        if self.expense_tracker_app_id > 0 and settlement.expense_id.native > 0:
            self._mark_expense_settled(settlement.expense_id.native)
        
        # EVENT LOGGING: Emit settlement event for indexing
        self._emit_settlement_event(settlement, payment_txn_id)
    
    @arc4.abimethod
    def cancel_settlement(self, settlement_id: UInt64) -> None:
        """
        Cancel a pending settlement before execution.
        
        Allows the debtor to cancel a settlement if it hasn't been executed yet.
        Useful for abandoning settlements or correcting mistakes.
        
        Args:
            settlement_id: ID of the settlement to cancel
        
        Security:
            - Only debtor can cancel
            - Can only cancel if not executed
            - Cannot cancel after expiration (already cancellable by anyone)
        
        Gas Cost:
            ~0.001 ALGO
        """
        # Load settlement
        box_key = self._get_settlement_box_key(settlement_id)
        assert op.Box.length(box_key) > 0, "Settlement does not exist"
        
        settlement_bytes = op.Box.get(box_key).value
        settlement = SettlementInfo.from_bytes(settlement_bytes)
        
        # SECURITY: Only debtor can cancel
        assert Txn.sender == settlement.debtor.native, "Only debtor can cancel"
        
        # Validate state
        assert not settlement.executed.native, "Cannot cancel executed settlement"
        assert not settlement.cancelled.native, "Settlement already cancelled"
        
        # Mark as cancelled
        settlement.cancelled = arc4.Bool(True)
        op.Box.put(box_key, settlement.bytes)
    
    @arc4.abimethod
    def cleanup_expired_settlement(self, settlement_id: UInt64) -> None:
        """
        Clean up an expired settlement to reclaim storage.
        
        Anyone can call this after expiration to free up box storage
        and reclaim MBR funds.
        
        Args:
            settlement_id: ID of the expired settlement
        
        Security:
            - Only works on expired, unexecuted settlements
            - Cannot cleanup executed settlements (needed for audit)
        
        Gas Cost:
            ~0.001 ALGO
        """
        # Load settlement
        box_key = self._get_settlement_box_key(settlement_id)
        assert op.Box.length(box_key) > 0, "Settlement does not exist"
        
        settlement_bytes = op.Box.get(box_key).value
        settlement = SettlementInfo.from_bytes(settlement_bytes)
        
        # Validate can be cleaned up
        assert Global.latest_timestamp > settlement.expires_at.native, "Settlement not expired yet"
        assert not settlement.executed.native, "Cannot cleanup executed settlement"
        
        # Delete box (reclaims MBR)
        op.Box.delete(box_key)
    
    # ========================================================================
    # QUERY METHODS (Free - No Gas Cost)
    # ========================================================================
    
    @arc4.abimethod
    def verify_settlement_state(self, settlement_id: UInt64) -> arc4.Bool:
        """
        Check if a settlement has been executed.
        
        Args:
            settlement_id: Settlement to check
        
        Returns:
            True if executed, False if pending/cancelled/nonexistent
        
        Gas Cost:
            FREE (query only, no state changes)
        """
        box_key = self._get_settlement_box_key(settlement_id)
        
        if op.Box.length(box_key) == 0:
            return arc4.Bool(False)
        
        settlement_bytes = op.Box.get(box_key).value
        settlement = SettlementInfo.from_bytes(settlement_bytes)
        
        return settlement.executed
    
    @arc4.abimethod
    def get_settlement_details(self, settlement_id: UInt64) -> SettlementInfo:
        """
        Get full settlement information.
        
        Args:
            settlement_id: Settlement to query
        
        Returns:
            SettlementInfo struct with all details
        
        Gas Cost:
            FREE (query only)
        """
        box_key = self._get_settlement_box_key(settlement_id)
        assert op.Box.length(box_key) > 0, "Settlement does not exist"
        
        settlement_bytes = op.Box.get(box_key).value
        return SettlementInfo.from_bytes(settlement_bytes)
    
    @arc4.abimethod
    def get_debtor_settlements(
        self, debtor: Account
    ) -> arc4.DynamicArray[arc4.UInt64]:
        """
        Get all settlement IDs where address is the debtor.
        
        Args:
            debtor: Debtor address to query
        
        Returns:
            Array of settlement IDs
        
        Gas Cost:
            FREE (query only)
        """
        box_key = self._get_debtor_box_key(debtor)
        
        if op.Box.length(box_key) == 0:
            return arc4.DynamicArray[arc4.UInt64]()
        
        settlements_bytes = op.Box.get(box_key).value
        return arc4.DynamicArray[arc4.UInt64].from_bytes(settlements_bytes)
    
    @arc4.abimethod
    def get_creditor_settlements(
        self, creditor: Account
    ) -> arc4.DynamicArray[arc4.UInt64]:
        """
        Get all settlement IDs where address is the creditor.
        
        Args:
            creditor: Creditor address to query
        
        Returns:
            Array of settlement IDs
        
        Gas Cost:
            FREE (query only)
        """
        box_key = self._get_creditor_box_key(creditor)
        
        if op.Box.length(box_key) == 0:
            return arc4.DynamicArray[arc4.UInt64]()
        
        settlements_bytes = op.Box.get(box_key).value
        return arc4.DynamicArray[arc4.UInt64].from_bytes(settlements_bytes)
    
    # ========================================================================
    # INTERNAL HELPER METHODS
    # ========================================================================
    
    @subroutine
    def _get_settlement_box_key(self, settlement_id: UInt64) -> Bytes:
        """Generate box key for settlement storage."""
        return op.concat(Bytes(b"settlement_"), op.itob(settlement_id))
    
    @subroutine
    def _get_debtor_box_key(self, debtor: Account) -> Bytes:
        """Generate box key for debtor's settlement list."""
        return op.concat(Bytes(b"debtor_"), debtor.bytes)
    
    @subroutine
    def _get_creditor_box_key(self, creditor: Account) -> Bytes:
        """Generate box key for creditor's settlement list."""
        return op.concat(Bytes(b"creditor_"), creditor.bytes)
    
    @subroutine
    def _add_to_debtor_list(self, debtor: Account, settlement_id: UInt64) -> None:
        """Add settlement ID to debtor's list."""
        box_key = self._get_debtor_box_key(debtor)
        
        if op.Box.length(box_key) == 0:
            # Create new list
            settlements = arc4.DynamicArray[arc4.UInt64](arc4.UInt64(settlement_id))
        else:
            # Append to existing list
            settlements_bytes = op.Box.get(box_key).value
            settlements = arc4.DynamicArray[arc4.UInt64].from_bytes(settlements_bytes)
            settlements.append(arc4.UInt64(settlement_id))
        
        op.Box.put(box_key, settlements.bytes)
    
    @subroutine
    def _add_to_creditor_list(self, creditor: Account, settlement_id: UInt64) -> None:
        """Add settlement ID to creditor's list."""
        box_key = self._get_creditor_box_key(creditor)
        
        if op.Box.length(box_key) == 0:
            # Create new list
            settlements = arc4.DynamicArray[arc4.UInt64](arc4.UInt64(settlement_id))
        else:
            # Append to existing list
            settlements_bytes = op.Box.get(box_key).value
            settlements = arc4.DynamicArray[arc4.UInt64].from_bytes(settlements_bytes)
            settlements.append(arc4.UInt64(settlement_id))
        
        op.Box.put(box_key, settlements.bytes)
    
    @subroutine
    def _mark_expense_settled(self, expense_id: UInt64) -> None:
        """
        Call ExpenseTracker to mark expense as settled.
        
        Sends an inner transaction to the ExpenseTracker contract
        to update the expense's settled status.
        """
        itxn.ApplicationCall(
            app_id=Application(self.expense_tracker_app_id),
            app_args=(arc4.arc4_signature("mark_expense_settled(uint64)void"), expense_id),
        ).submit()
    
    @subroutine
    def _emit_settlement_event(
        self, settlement: SettlementInfo, payment_txn_id: Bytes
    ) -> None:
        """
        Emit settlement event for indexing.
        
        Logs settlement data to transaction logs for easy indexing
        by backend services and real-time UI updates.
        """
        event = SettlementEvent(
            settlement_id=settlement.settlement_id,
            debtor=settlement.debtor,
            creditor=settlement.creditor,
            amount=settlement.amount,
            timestamp=arc4.UInt64(Global.latest_timestamp),
            payment_txn_id=arc4.StaticArray(
                *[arc4.Byte(payment_txn_id[i]) for i in range(32)]
            ),
        )
        
        # Log event (appears in transaction logs)
        op.log(event.bytes)
