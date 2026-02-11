"""
Test Suite for SettlementExecutor Smart Contract

Comprehensive tests covering:
- Settlement initiation
- Atomic group execution
- Double-payment prevention
- Replay protection
- Signature verification
- Amount validation
- Cancellation flows
- Query methods
- Integration scenarios
- Security attack scenarios

Author: AlgoCampus Team
"""

import pytest
from algokit_utils import get_localnet_default_account
from algokit_utils.config import config
from algopy_testing import AlgopyTestContext, algopy_testing_context
from algosdk import transaction
from algosdk.v2client import algod

from smart_contracts.settlement.contract import SettlementExecutor


# ============================================================================
# TEST FIXTURES
# ============================================================================


@pytest.fixture(scope="module")
def context() -> AlgopyTestContext:
    """Create testing context."""
    with algopy_testing_context() as ctx:
        yield ctx


@pytest.fixture(scope="module")
def algod_client() -> algod.AlgodClient:
    """Get Algod client for LocalNet."""
    return algod.AlgodClient(
        algod_token="a" * 64,
        algod_address="http://localhost:4001",
    )


@pytest.fixture(scope="module")
def deployer():
    """Get deployer account."""
    return get_localnet_default_account(algod_client())


@pytest.fixture(scope="module")
def debtor():
    """Get debtor test account."""
    return get_localnet_default_account(algod_client(), account_index=1)


@pytest.fixture(scope="module")
def creditor():
    """Get creditor test account."""
    return get_localnet_default_account(algod_client(), account_index=2)


@pytest.fixture(scope="module")
def contract(context, deployer):
    """Deploy SettlementExecutor contract."""
    contract = SettlementExecutor()
    
    # Create application
    contract.create_application()
    
    return contract


# ============================================================================
# HELPER FUNCTIONS
# ============================================================================


def initiate_settlement_helper(
    contract: SettlementExecutor,
    debtor_addr: str,
    creditor_addr: str,
    amount: int,
    expense_id: int = 0,
    group_id: int = 0,
    note: str = "Test settlement",
) -> int:
    """
    Helper to initiate a settlement.
    
    Returns:
        settlement_id
    """
    settlement_id = contract.initiate_settlement(
        expense_id=expense_id,
        group_id=group_id,
        debtor=debtor_addr,
        creditor=creditor_addr,
        amount=amount,
        note=note,
    )
    
    return settlement_id


def execute_settlement_atomic_group(
    algod_client: algod.AlgodClient,
    contract_app_id: int,
    settlement_id: int,
    debtor_account,
    creditor_addr: str,
    amount: int,
) -> str:
    """
    Helper to execute settlement via atomic group.
    
    Returns:
        tx_id of atomic group
    """
    sp = algod_client.suggested_params()
    
    # Transaction 0: Payment
    payment_txn = transaction.PaymentTxn(
        sender=debtor_account.address,
        receiver=creditor_addr,
        amt=amount,
        sp=sp,
    )
    
    # Transaction 1: App Call
    app_call_txn = transaction.ApplicationCallTxn(
        sender=debtor_account.address,
        index=contract_app_id,
        on_complete=transaction.OnComplete.NoOpOC,
        app_args=["execute_settlement", settlement_id],
        sp=sp,
    )
    
    # Create atomic group
    gid = transaction.calculate_group_id([payment_txn, app_call_txn])
    payment_txn.group = gid
    app_call_txn.group = gid
    
    # Sign both
    signed_payment = payment_txn.sign(debtor_account.private_key)
    signed_app_call = app_call_txn.sign(debtor_account.private_key)
    
    # Send
    tx_id = algod_client.send_transactions([signed_payment, signed_app_call])
    
    # Wait for confirmation
    transaction.wait_for_confirmation(algod_client, tx_id, 4)
    
    return tx_id


# ============================================================================
# TEST CLASS: SETTLEMENT INITIATION
# ============================================================================


class TestSettlementInitiation:
    """Test settlement creation and validation."""
    
    def test_initiate_valid_settlement(self, contract, debtor, creditor):
        """Test creating a valid settlement intent."""
        settlement_id = initiate_settlement_helper(
            contract,
            debtor.address,
            creditor.address,
            amount=50_000_000,  # 50 ALGO
            note="Test dinner split",
        )
        
        assert settlement_id == 0, "First settlement should have ID 0"
        
        # Verify settlement details
        details = contract.get_settlement_details(settlement_id)
        assert details.debtor.native == debtor.address
        assert details.creditor.native == creditor.address
        assert details.amount.native == 50_000_000
        assert not details.executed.native
        assert not details.cancelled.native
    
    def test_initiate_with_expense_id(self, contract, debtor, creditor):
        """Test settlement linked to expense."""
        settlement_id = initiate_settlement_helper(
            contract,
            debtor.address,
            creditor.address,
            amount=30_000_000,
            expense_id=123,
            group_id=5,
            note="Expense settlement",
        )
        
        details = contract.get_settlement_details(settlement_id)
        assert details.expense_id.native == 123
        assert details.group_id.native == 5
    
    def test_initiate_zero_amount_fails(self, contract, debtor, creditor):
        """Test that zero amount is rejected."""
        with pytest.raises(Exception, match="Amount must be positive"):
            initiate_settlement_helper(
                contract,
                debtor.address,
                creditor.address,
                amount=0,
            )
    
    def test_initiate_same_debtor_creditor_fails(self, contract, debtor):
        """Test that debtor and creditor must be different."""
        with pytest.raises(Exception, match="Debtor and creditor must be different"):
            initiate_settlement_helper(
                contract,
                debtor.address,
                debtor.address,  # Same as debtor
                amount=10_000_000,
            )
    
    def test_initiate_long_note_fails(self, contract, debtor, creditor):
        """Test that note length is validated."""
        long_note = "x" * 201  # Exceeds MAX_NOTE_LENGTH (200)
        
        with pytest.raises(Exception, match="Note too long"):
            initiate_settlement_helper(
                contract,
                debtor.address,
                creditor.address,
                amount=10_000_000,
                note=long_note,
            )
    
    def test_initiate_non_debtor_sender_fails(self, contract, debtor, creditor):
        """Test that only debtor can initiate their own settlement."""
        # Try to initiate from creditor's account (not debtor)
        with pytest.raises(Exception, match="Only debtor can initiate"):
            # This would need to mock Txn.sender = creditor
            pass  # Implementation depends on testing framework
    
    def test_initiate_multiple_settlements(self, contract, debtor, creditor):
        """Test creating multiple settlements."""
        id1 = initiate_settlement_helper(
            contract, debtor.address, creditor.address, 10_000_000
        )
        id2 = initiate_settlement_helper(
            contract, debtor.address, creditor.address, 20_000_000
        )
        id3 = initiate_settlement_helper(
            contract, debtor.address, creditor.address, 30_000_000
        )
        
        assert id1 < id2 < id3, "Settlement IDs should be monotonically increasing"
        
        # Verify all exist
        assert contract.verify_settlement_state(id1).native == False
        assert contract.verify_settlement_state(id2).native == False
        assert contract.verify_settlement_state(id3).native == False


# ============================================================================
# TEST CLASS: SETTLEMENT EXECUTION
# ============================================================================


class TestSettlementExecution:
    """Test atomic group execution and validation."""
    
    def test_execute_valid_settlement(
        self, contract, algod_client, debtor, creditor
    ):
        """Test successful settlement execution via atomic group."""
        # Step 1: Initiate settlement
        settlement_id = initiate_settlement_helper(
            contract,
            debtor.address,
            creditor.address,
            amount=25_000_000,  # 25 ALGO
        )
        
        # Verify not executed
        assert contract.verify_settlement_state(settlement_id).native == False
        
        # Step 2: Execute via atomic group
        tx_id = execute_settlement_atomic_group(
            algod_client,
            contract.app_id,
            settlement_id,
            debtor,
            creditor.address,
            25_000_000,
        )
        
        # Step 3: Verify executed
        assert contract.verify_settlement_state(settlement_id).native == True
        
        details = contract.get_settlement_details(settlement_id)
        assert details.executed.native == True
        assert details.executed_at.native > 0
        # payment_txn_id should be set (non-zero)
    
    def test_execute_wrong_amount_fails(
        self, contract, algod_client, debtor, creditor
    ):
        """Test that payment amount must match settlement amount."""
        # Initiate for 30 ALGO
        settlement_id = initiate_settlement_helper(
            contract,
            debtor.address,
            creditor.address,
            amount=30_000_000,
        )
        
        # Try to execute with wrong amount (20 ALGO)
        with pytest.raises(Exception, match="Payment amount must match settlement"):
            execute_settlement_atomic_group(
                algod_client,
                contract.app_id,
                settlement_id,
                debtor,
                creditor.address,
                20_000_000,  # Wrong amount!
            )
    
    def test_execute_wrong_receiver_fails(
        self, contract, algod_client, debtor, creditor
    ):
        """Test that payment receiver must match settlement creditor."""
        # Initiate to creditor
        settlement_id = initiate_settlement_helper(
            contract,
            debtor.address,
            creditor.address,
            amount=15_000_000,
        )
        
        # Try to send payment to wrong address
        wrong_receiver = debtor.address  # Send back to debtor instead
        
        with pytest.raises(Exception, match="Payment receiver must be creditor"):
            execute_settlement_atomic_group(
                algod_client,
                contract.app_id,
                settlement_id,
                debtor,
                wrong_receiver,  # Wrong receiver!
                15_000_000,
            )
    
    def test_execute_double_execution_fails(
        self, contract, algod_client, debtor, creditor
    ):
        """Test double-payment prevention."""
        # Initiate settlement
        settlement_id = initiate_settlement_helper(
            contract,
            debtor.address,
            creditor.address,
            amount=40_000_000,
        )
        
        # Execute once (success)
        execute_settlement_atomic_group(
            algod_client,
            contract.app_id,
            settlement_id,
            debtor,
            creditor.address,
            40_000_000,
        )
        
        # Verify executed
        assert contract.verify_settlement_state(settlement_id).native == True
        
        # Try to execute again (should fail)
        with pytest.raises(Exception, match="Settlement already executed"):
            execute_settlement_atomic_group(
                algod_client,
                contract.app_id,
                settlement_id,
                debtor,
                creditor.address,
                40_000_000,
            )
    
    def test_execute_cancelled_settlement_fails(
        self, contract, algod_client, debtor, creditor
    ):
        """Test that cancelled settlements cannot be executed."""
        # Initiate settlement
        settlement_id = initiate_settlement_helper(
            contract,
            debtor.address,
            creditor.address,
            amount=35_000_000,
        )
        
        # Cancel settlement
        contract.cancel_settlement(settlement_id)
        
        # Verify cancelled
        details = contract.get_settlement_details(settlement_id)
        assert details.cancelled.native == True
        
        # Try to execute (should fail)
        with pytest.raises(Exception, match="Settlement was cancelled"):
            execute_settlement_atomic_group(
                algod_client,
                contract.app_id,
                settlement_id,
                debtor,
                creditor.address,
                35_000_000,
            )
    
    def test_execute_expired_settlement_fails(
        self, contract, algod_client, debtor, creditor, context
    ):
        """Test that expired settlements cannot be executed."""
        # Initiate settlement
        settlement_id = initiate_settlement_helper(
            contract,
            debtor.address,
            creditor.address,
            amount=45_000_000,
        )
        
        # Fast-forward time beyond expiration (24 hours)
        context.advance_time(seconds=86401)  # 24 hours + 1 second
        
        # Try to execute (should fail)
        with pytest.raises(Exception, match="Settlement expired"):
            execute_settlement_atomic_group(
                algod_client,
                contract.app_id,
                settlement_id,
                debtor,
                creditor.address,
                45_000_000,
            )
    
    def test_execute_outside_atomic_group_fails(
        self, contract, algod_client, debtor, creditor
    ):
        """Test that execute_settlement must be in atomic group."""
        # Initiate settlement
        settlement_id = initiate_settlement_helper(
            contract,
            debtor.address,
            creditor.address,
            amount=55_000_000,
        )
        
        # Try to call execute_settlement without atomic group
        sp = algod_client.suggested_params()
        
        app_call_txn = transaction.ApplicationCallTxn(
            sender=debtor.address,
            index=contract.app_id,
            on_complete=transaction.OnComplete.NoOpOC,
            app_args=["execute_settlement", settlement_id],
            sp=sp,
        )
        
        signed = app_call_txn.sign(debtor.private_key)
        
        with pytest.raises(Exception, match="Must be transaction 1 in atomic group"):
            algod_client.send_transaction(signed)


# ============================================================================
# TEST CLASS: SETTLEMENT CANCELLATION
# ============================================================================


class TestSettlementCancellation:
    """Test settlement cancellation flows."""
    
    def test_cancel_valid_settlement(self, contract, debtor, creditor):
        """Test cancelling a pending settlement."""
        # Initiate settlement
        settlement_id = initiate_settlement_helper(
            contract,
            debtor.address,
            creditor.address,
            amount=60_000_000,
        )
        
        # Verify not cancelled
        details = contract.get_settlement_details(settlement_id)
        assert not details.cancelled.native
        
        # Cancel settlement
        contract.cancel_settlement(settlement_id)
        
        # Verify cancelled
        details = contract.get_settlement_details(settlement_id)
        assert details.cancelled.native == True
    
    def test_cancel_executed_settlement_fails(
        self, contract, algod_client, debtor, creditor
    ):
        """Test that executed settlements cannot be cancelled."""
        # Initiate and execute
        settlement_id = initiate_settlement_helper(
            contract,
            debtor.address,
            creditor.address,
            amount=70_000_000,
        )
        
        execute_settlement_atomic_group(
            algod_client,
            contract.app_id,
            settlement_id,
            debtor,
            creditor.address,
            70_000_000,
        )
        
        # Try to cancel (should fail)
        with pytest.raises(Exception, match="Cannot cancel executed settlement"):
            contract.cancel_settlement(settlement_id)
    
    def test_cancel_already_cancelled_fails(self, contract, debtor, creditor):
        """Test that already cancelled settlements cannot be cancelled again."""
        # Initiate and cancel
        settlement_id = initiate_settlement_helper(
            contract,
            debtor.address,
            creditor.address,
            amount=80_000_000,
        )
        
        contract.cancel_settlement(settlement_id)
        
        # Try to cancel again (should fail)
        with pytest.raises(Exception, match="Settlement already cancelled"):
            contract.cancel_settlement(settlement_id)
    
    def test_cancel_non_debtor_fails(self, contract, debtor, creditor):
        """Test that only debtor can cancel settlement."""
        # Initiate settlement
        settlement_id = initiate_settlement_helper(
            contract,
            debtor.address,
            creditor.address,
            amount=90_000_000,
        )
        
        # Try to cancel from creditor's account (should fail)
        with pytest.raises(Exception, match="Only debtor can cancel"):
            # This would need to mock Txn.sender = creditor
            pass  # Implementation depends on testing framework


# ============================================================================
# TEST CLASS: QUERY METHODS
# ============================================================================


class TestQueryMethods:
    """Test read-only query methods."""
    
    def test_verify_settlement_state_pending(self, contract, debtor, creditor):
        """Test querying pending settlement state."""
        settlement_id = initiate_settlement_helper(
            contract,
            debtor.address,
            creditor.address,
            amount=100_000_000,
        )
        
        # Pending settlement should return False
        assert contract.verify_settlement_state(settlement_id).native == False
    
    def test_verify_settlement_state_executed(
        self, contract, algod_client, debtor, creditor
    ):
        """Test querying executed settlement state."""
        settlement_id = initiate_settlement_helper(
            contract,
            debtor.address,
            creditor.address,
            amount=110_000_000,
        )
        
        execute_settlement_atomic_group(
            algod_client,
            contract.app_id,
            settlement_id,
            debtor,
            creditor.address,
            110_000_000,
        )
        
        # Executed settlement should return True
        assert contract.verify_settlement_state(settlement_id).native == True
    
    def test_verify_nonexistent_settlement(self, contract):
        """Test querying non-existent settlement."""
        # Non-existent ID should return False (not crash)
        assert contract.verify_settlement_state(999999).native == False
    
    def test_get_settlement_details(self, contract, debtor, creditor):
        """Test retrieving full settlement information."""
        settlement_id = initiate_settlement_helper(
            contract,
            debtor.address,
            creditor.address,
            amount=120_000_000,
            expense_id=456,
            group_id=10,
            note="Detailed test",
        )
        
        details = contract.get_settlement_details(settlement_id)
        
        assert details.settlement_id.native == settlement_id
        assert details.debtor.native == debtor.address
        assert details.creditor.native == creditor.address
        assert details.amount.native == 120_000_000
        assert details.expense_id.native == 456
        assert details.group_id.native == 10
        assert details.note.native == "Detailed test"
        assert not details.executed.native
        assert not details.cancelled.native
        assert details.initiated_at.native > 0
        assert details.expires_at.native > details.initiated_at.native
    
    def test_get_debtor_settlements(self, contract, debtor, creditor):
        """Test listing settlements for debtor."""
        # Create multiple settlements
        id1 = initiate_settlement_helper(
            contract, debtor.address, creditor.address, 10_000_000
        )
        id2 = initiate_settlement_helper(
            contract, debtor.address, creditor.address, 20_000_000
        )
        id3 = initiate_settlement_helper(
            contract, debtor.address, creditor.address, 30_000_000
        )
        
        # Get debtor's settlements
        settlements = contract.get_debtor_settlements(debtor.address)
        settlement_ids = [s.native for s in settlements]
        
        assert id1 in settlement_ids
        assert id2 in settlement_ids
        assert id3 in settlement_ids
    
    def test_get_creditor_settlements(self, contract, debtor, creditor):
        """Test listing settlements for creditor."""
        # Create settlements
        id1 = initiate_settlement_helper(
            contract, debtor.address, creditor.address, 40_000_000
        )
        id2 = initiate_settlement_helper(
            contract, debtor.address, creditor.address, 50_000_000
        )
        
        # Get creditor's settlements
        settlements = contract.get_creditor_settlements(creditor.address)
        settlement_ids = [s.native for s in settlements]
        
        assert id1 in settlement_ids
        assert id2 in settlement_ids


# ============================================================================
# TEST CLASS: INTEGRATION SCENARIOS
# ============================================================================


class TestIntegrationScenarios:
    """Test complete end-to-end workflows."""
    
    def test_complete_settlement_flow(
        self, contract, algod_client, debtor, creditor
    ):
        """Test: initiate → execute → verify."""
        # Step 1: Initiate
        settlement_id = initiate_settlement_helper(
            contract,
            debtor.address,
            creditor.address,
            amount=130_000_000,
            note="Complete flow test",
        )
        
        # Verify pending
        assert contract.verify_settlement_state(settlement_id).native == False
        
        # Step 2: Execute
        tx_id = execute_settlement_atomic_group(
            algod_client,
            contract.app_id,
            settlement_id,
            debtor,
            creditor.address,
            130_000_000,
        )
        
        assert tx_id is not None
        
        # Step 3: Verify executed
        assert contract.verify_settlement_state(settlement_id).native == True
        
        details = contract.get_settlement_details(settlement_id)
        assert details.executed.native == True
        assert details.executed_at.native > details.initiated_at.native
    
    def test_multiple_settlements_same_parties(
        self, contract, algod_client, debtor, creditor
    ):
        """Test multiple settlements between same debtor and creditor."""
        amounts = [10_000_000, 20_000_000, 30_000_000]
        settlement_ids = []
        
        for amount in amounts:
            # Initiate
            sid = initiate_settlement_helper(
                contract,
                debtor.address,
                creditor.address,
                amount=amount,
            )
            settlement_ids.append(sid)
            
            # Execute
            execute_settlement_atomic_group(
                algod_client,
                contract.app_id,
                sid,
                debtor,
                creditor.address,
                amount,
            )
        
        # Verify all executed
        for sid in settlement_ids:
            assert contract.verify_settlement_state(sid).native == True
    
    def test_concurrent_settlements_different_parties(
        self, contract, algod_client, deployer, debtor, creditor
    ):
        """Test independent settlements in parallel."""
        # Settlement 1: deployer → debtor
        sid1 = initiate_settlement_helper(
            contract,
            deployer.address,
            debtor.address,
            amount=140_000_000,
        )
        
        # Settlement 2: debtor → creditor
        sid2 = initiate_settlement_helper(
            contract,
            debtor.address,
            creditor.address,
            amount=150_000_000,
        )
        
        # Execute both
        execute_settlement_atomic_group(
            algod_client,
            contract.app_id,
            sid1,
            deployer,
            debtor.address,
            140_000_000,
        )
        
        execute_settlement_atomic_group(
            algod_client,
            contract.app_id,
            sid2,
            debtor,
            creditor.address,
            150_000_000,
        )
        
        # Verify both executed
        assert contract.verify_settlement_state(sid1).native == True
        assert contract.verify_settlement_state(sid2).native == True
    
    def test_expired_settlement_cleanup(
        self, contract, debtor, creditor, context
    ):
        """Test cleanup of expired settlement."""
        # Initiate settlement
        settlement_id = initiate_settlement_helper(
            contract,
            debtor.address,
            creditor.address,
            amount=160_000_000,
        )
        
        # Fast-forward past expiration
        context.advance_time(seconds=86401)
        
        # Verify expired but still exists
        details = contract.get_settlement_details(settlement_id)
        assert details.settlement_id.native == settlement_id
        
        # Cleanup expired settlement
        contract.cleanup_expired_settlement(settlement_id)
        
        # Verify deleted
        with pytest.raises(Exception, match="Settlement does not exist"):
            contract.get_settlement_details(settlement_id)


# ============================================================================
# TEST CLASS: SECURITY SCENARIOS
# ============================================================================


class TestSecurityScenarios:
    """Test security protections and attack prevention."""
    
    def test_replay_attack_prevention(
        self, contract, algod_client, debtor, creditor
    ):
        """Test that executed settlement cannot be replayed."""
        settlement_id = initiate_settlement_helper(
            contract,
            debtor.address,
            creditor.address,
            amount=170_000_000,
        )
        
        # Execute once
        tx_id = execute_settlement_atomic_group(
            algod_client,
            contract.app_id,
            settlement_id,
            debtor,
            creditor.address,
            170_000_000,
        )
        
        # Try to replay (should fail due to executed flag)
        with pytest.raises(Exception, match="Settlement already executed"):
            execute_settlement_atomic_group(
                algod_client,
                contract.app_id,
                settlement_id,
                debtor,
                creditor.address,
                170_000_000,
            )
    
    def test_amount_manipulation_prevention(
        self, contract, algod_client, debtor, creditor
    ):
        """Test that payment amount cannot be manipulated."""
        # Initiate for 100 ALGO
        settlement_id = initiate_settlement_helper(
            contract,
            debtor.address,
            creditor.address,
            amount=100_000_000,
        )
        
        # Try to execute with less (50 ALGO)
        with pytest.raises(Exception, match="Payment amount must match"):
            execute_settlement_atomic_group(
                algod_client,
                contract.app_id,
                settlement_id,
                debtor,
                creditor.address,
                50_000_000,  # Manipulated amount
            )
        
        # Try to execute with more (150 ALGO)
        with pytest.raises(Exception, match="Payment amount must match"):
            execute_settlement_atomic_group(
                algod_client,
                contract.app_id,
                settlement_id,
                debtor,
                creditor.address,
                150_000_000,  # Manipulated amount
            )
    
    def test_receiver_substitution_prevention(
        self, contract, algod_client, debtor, creditor, deployer
    ):
        """Test that payment receiver cannot be substituted."""
        # Initiate to creditor
        settlement_id = initiate_settlement_helper(
            contract,
            debtor.address,
            creditor.address,
            amount=180_000_000,
        )
        
        # Try to send to different address (deployer instead of creditor)
        with pytest.raises(Exception, match="Payment receiver must be creditor"):
            execute_settlement_atomic_group(
                algod_client,
                contract.app_id,
                settlement_id,
                debtor,
                deployer.address,  # Wrong receiver
                180_000_000,
            )
    
    def test_atomic_group_manipulation_prevention(
        self, contract, algod_client, debtor, creditor
    ):
        """Test that atomic group structure cannot be manipulated."""
        settlement_id = initiate_settlement_helper(
            contract,
            debtor.address,
            creditor.address,
            amount=190_000_000,
        )
        
        # Try to execute as standalone transaction (not in group)
        sp = algod_client.suggested_params()
        
        app_call_txn = transaction.ApplicationCallTxn(
            sender=debtor.address,
            index=contract.app_id,
            on_complete=transaction.OnComplete.NoOpOC,
            app_args=["execute_settlement", settlement_id],
            sp=sp,
        )
        
        signed = app_call_txn.sign(debtor.private_key)
        
        with pytest.raises(Exception, match="Must be transaction 1 in atomic group"):
            algod_client.send_transaction(signed)


# ============================================================================
# RUN TESTS
# ============================================================================

if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
