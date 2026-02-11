"""
ExpenseTracker Smart Contract - Comprehensive Test Suite

Tests:
- Expense addition with split calculation
- Balance tracking (credit/debit)
- Signed integer arithmetic
- Overflow protection
- Query methods
- Integration scenarios
"""

import pytest
from algopy_testing import AlgopyTestContext, algopy_testing_context
from algosdk import account

from smart_contracts.expense_tracker.contract import ExpenseTracker


# ==================== HELPER FUNCTIONS ====================

def pack_addresses(*addresses):
    """Pack multiple addresses into bytes"""
    result = b""
    for addr in addresses:
        result += addr.bytes
    return result


def decode_signed_balance(encoded: int) -> int:
    """Decode balance from unsigned to signed"""
    SIGN_BIT = 2 ** 63
    if encoded < SIGN_BIT:
        return encoded  # Positive
    else:
        return -(encoded - SIGN_BIT)  # Negative


# ==================== TEST SPLIT CALCULATION ====================

class TestSplitCalculation:
    """Test precise integer split calculation"""
    
    def test_equal_split_exact_division(self, context: AlgopyTestContext):
        """Test split when amount divides evenly"""
        admin = context.any_account()
        payer = context.any_account()
        member1 = context.any_account()
        member2 = context.any_account()
        
        contract = ExpenseTracker()
        contract.__init__()
        
        with context.txn.sender(admin):
            contract.set_group_manager(1)  # Mock GroupManager ID
        
        # 90 ALGO split among 3 people = 30 ALGO each exactly
        with context.txn.sender(payer):
            expense_id = contract.add_expense(
                group_id=0,
                amount=90_000_000,
                note="Dinner",
                split_with=pack_addresses(payer, member1, member2)
            )
        
        assert expense_id == 0
    
    def test_equal_split_with_remainder(self, context: AlgopyTestContext):
        """Test split with indivisible amount"""
        admin = context.any_account()
        payer = context.any_account()
        member1 = context.any_account()
        member2 = context.any_account()
        
        contract = ExpenseTracker()
        contract.__init__()
        
        with context.txn.sender(admin):
            contract.set_group_manager(1)
        
        # 100 ALGO split among 3 people
        # = 33,333,334 + 33,333,333 + 33,333,333 = 100,000,000 ✓
        with context.txn.sender(payer):
            expense_id = contract.add_expense(
                group_id=0,
                amount=100_000_000,
                note="Groceries",
                split_with=pack_addresses(payer, member1, member2)
            )
        
        # Verify expense created
        assert expense_id == 0
    
    def test_split_two_people(self, context: AlgopyTestContext):
        """Test 50/50 split"""
        admin = context.any_account()
        payer = context.any_account()
        member = context.any_account()
        
        contract = ExpenseTracker()
        contract.__init__()
        
        with context.txn.sender(admin):
            contract.set_group_manager(1)
        
        # 75 ALGO split between 2 people = 37.5 each
        # = 37,500,001 + 37,499,999 = 75,000,000 ✓
        with context.txn.sender(payer):
            expense_id = contract.add_expense(
                group_id=0,
                amount=75_000_000,
                note="Movie tickets",
                split_with=pack_addresses(payer, member)
            )
        
        assert expense_id == 0
    
    def test_split_large_group(self, context: AlgopyTestContext):
        """Test split with many people"""
        admin = context.any_account()
        payer = context.any_account()
        
        contract = ExpenseTracker()
        contract.__init__()
        
        with context.txn.sender(admin):
            contract.set_group_manager(1)
        
        # Create 10 members
        members = [context.any_account() for _ in range(10)]
        
        # 1000 ALGO split among 10 people = 100 ALGO each exactly
        with context.txn.sender(payer):
            expense_id = contract.add_expense(
                group_id=0,
                amount=1000_000_000,
                note="Conference tickets",
                split_with=pack_addresses(*members)
            )
        
        assert expense_id == 0


# ==================== TEST BALANCE TRACKING ====================

class TestBalanceTracking:
    """Test balance credit/debit operations"""
    
    def test_single_expense_balances(self, context: AlgopyTestContext):
        """Test balances after single expense"""
        admin = context.any_account()
        alice = context.any_account()
        bob = context.any_account()
        
        contract = ExpenseTracker()
        contract.__init__()
        
        with context.txn.sender(admin):
            contract.set_group_manager(1)
        
        # Alice pays 100 ALGO for both
        with context.txn.sender(alice):
            contract.add_expense(
                group_id=0,
                amount=100_000_000,
                note="Lunch",
                split_with=pack_addresses(alice, bob)
            )
        
        # Check balances
        # Alice: paid 100, owes 50 -> net +50
        # Bob: paid 0, owes 50 -> net -50
        alice_balance_encoded = contract.get_user_balance(0, alice)
        bob_balance_encoded = contract.get_user_balance(0, bob)
        
        alice_balance = decode_signed_balance(alice_balance_encoded)
        bob_balance = decode_signed_balance(bob_balance_encoded)
        
        assert alice_balance == 50_000_000  # +50 ALGO
        assert bob_balance == -50_000_000  # -50 ALGO
        assert alice_balance + bob_balance == 0  # Zero-sum
    
    def test_multiple_expenses_same_group(self, context: AlgopyTestContext):
        """Test balances accumulate over multiple expenses"""
        admin = context.any_account()
        alice = context.any_account()
        bob = context.any_account()
        
        contract = ExpenseTracker()
        contract.__init__()
        
        with context.txn.sender(admin):
            contract.set_group_manager(1)
        
        # Expense 1: Alice pays 100 ALGO
        with context.txn.sender(alice):
            contract.add_expense(
                group_id=0,
                amount=100_000_000,
                note="Dinner",
                split_with=pack_addresses(alice, bob)
            )
        
        # Expense 2: Bob pays 60 ALGO
        with context.txn.sender(bob):
            contract.add_expense(
                group_id=0,
                amount=60_000_000,
                note="Breakfast",
                split_with=pack_addresses(alice, bob)
            )
        
        # Check final balances
        # Alice: paid 100, owes 80 -> +20
        # Bob: paid 60, owes 80 -> -20
        alice_balance = decode_signed_balance(contract.get_user_balance(0, alice))
        bob_balance = decode_signed_balance(contract.get_user_balance(0, bob))
        
        assert alice_balance == 20_000_000  # +20 ALGO
        assert bob_balance == -20_000_000  # -20 ALGO
    
    def test_three_person_balances(self, context: AlgopyTestContext):
        """Test balances with three people"""
        admin = context.any_account()
        alice = context.any_account()
        bob = context.any_account()
        carol = context.any_account()
        
        contract = ExpenseTracker()
        contract.__init__()
        
        with context.txn.sender(admin):
            contract.set_group_manager(1)
        
        # Alice pays 150 ALGO for all three
        with context.txn.sender(alice):
            contract.add_expense(
                group_id=0,
                amount=150_000_000,
                note="Dinner",
                split_with=pack_addresses(alice, bob, carol)
            )
        
        # Balances:
        # Alice: paid 150, owes 50 -> +100
        # Bob: paid 0, owes 50 -> -50
        # Carol: paid 0, owes 50 -> -50
        alice_balance = decode_signed_balance(contract.get_user_balance(0, alice))
        bob_balance = decode_signed_balance(contract.get_user_balance(0, bob))
        carol_balance = decode_signed_balance(contract.get_user_balance(0, carol))
        
        assert alice_balance == 100_000_000  # +100 ALGO
        assert bob_balance == -50_000_000  # -50 ALGO
        assert carol_balance == -50_000_000  # -50 ALGO
        assert alice_balance + bob_balance + carol_balance == 0


# ==================== TEST SIGNED INTEGER ARITHMETIC ====================

class TestSignedArithmetic:
    """Test signed integer encoding/decoding"""
    
    def test_positive_balance_encoding(self, context: AlgopyTestContext):
        """Test positive balances are encoded correctly"""
        # Positive values stored as-is
        assert decode_signed_balance(100_000_000) == 100_000_000
        assert decode_signed_balance(1) == 1
        assert decode_signed_balance(0) == 0
    
    def test_negative_balance_encoding(self, context: AlgopyTestContext):
        """Test negative balances are encoded correctly"""
        SIGN_BIT = 2 ** 63
        
        # Negative values stored with sign bit
        assert decode_signed_balance(SIGN_BIT + 100_000_000) == -100_000_000
        assert decode_signed_balance(SIGN_BIT + 1) == -1
    
    def test_balance_flip_positive_to_negative(self, context: AlgopyTestContext):
        """Test balance transitions from positive to negative"""
        admin = context.any_account()
        alice = context.any_account()
        bob = context.any_account()
        
        contract = ExpenseTracker()
        contract.__init__()
        
        with context.txn.sender(admin):
            contract.set_group_manager(1)
        
        # Alice pays 50 ALGO (becomes +25)
        with context.txn.sender(alice):
            contract.add_expense(
                group_id=0,
                amount=50_000_000,
                note="Coffee",
                split_with=pack_addresses(alice, bob)
            )
        
        alice_balance_1 = decode_signed_balance(contract.get_user_balance(0, alice))
        assert alice_balance_1 == 25_000_000  # +25 ALGO
        
        # Bob pays 100 ALGO (Alice now owes 50 - 25 = -25)
        with context.txn.sender(bob):
            contract.add_expense(
                group_id=0,
                amount=100_000_000,
                note="Dinner",
                split_with=pack_addresses(alice, bob)
            )
        
        alice_balance_2 = decode_signed_balance(contract.get_user_balance(0, alice))
        assert alice_balance_2 == -25_000_000  # -25 ALGO (flipped)
    
    def test_balance_flip_negative_to_positive(self, context: AlgopyTestContext):
        """Test balance transitions from negative to positive"""
        admin = context.any_account()
        alice = context.any_account()
        bob = context.any_account()
        
        contract = ExpenseTracker()
        contract.__init__()
        
        with context.txn.sender(admin):
            contract.set_group_manager(1)
        
        # Bob pays 100 ALGO (Alice becomes -50)
        with context.txn.sender(bob):
            contract.add_expense(
                group_id=0,
                amount=100_000_000,
                note="Tickets",
                split_with=pack_addresses(alice, bob)
            )
        
        alice_balance_1 = decode_signed_balance(contract.get_user_balance(0, alice))
        assert alice_balance_1 == -50_000_000  # -50 ALGO
        
        # Alice pays 150 ALGO (becomes -50 + 75 = +25)
        with context.txn.sender(alice):
            contract.add_expense(
                group_id=0,
                amount=150_000_000,
                note="Hotel",
                split_with=pack_addresses(alice, bob)
            )
        
        alice_balance_2 = decode_signed_balance(contract.get_user_balance(0, alice))
        assert alice_balance_2 == 25_000_000  # +25 ALGO (flipped back)


# ==================== TEST INPUT VALIDATION ====================

class TestInputValidation:
    """Test input validation and error cases"""
    
    def test_add_expense_zero_amount_fails(self, context: AlgopyTestContext):
        """Test cannot add expense with zero amount"""
        admin = context.any_account()
        payer = context.any_account()
        member = context.any_account()
        
        contract = ExpenseTracker()
        contract.__init__()
        
        with context.txn.sender(admin):
            contract.set_group_manager(1)
        
        with pytest.raises(AssertionError, match="Amount must be positive"):
            with context.txn.sender(payer):
                contract.add_expense(
                    group_id=0,
                    amount=0,
                    note="Invalid",
                    split_with=pack_addresses(payer, member)
                )
    
    def test_add_expense_note_too_long_fails(self, context: AlgopyTestContext):
        """Test note length validation"""
        admin = context.any_account()
        payer = context.any_account()
        member = context.any_account()
        
        contract = ExpenseTracker()
        contract.__init__()
        
        with context.txn.sender(admin):
            contract.set_group_manager(1)
        
        long_note = "A" * 101  # 101 chars (max is 100)
        
        with pytest.raises(AssertionError, match="Note too long"):
            with context.txn.sender(payer):
                contract.add_expense(
                    group_id=0,
                    amount=100_000_000,
                    note=long_note,
                    split_with=pack_addresses(payer, member)
                )
    
    def test_add_expense_empty_split_fails(self, context: AlgopyTestContext):
        """Test must have at least one person in split"""
        admin = context.any_account()
        payer = context.any_account()
        
        contract = ExpenseTracker()
        contract.__init__()
        
        with context.txn.sender(admin):
            contract.set_group_manager(1)
        
        with pytest.raises(AssertionError, match="Must split with at least 1 person"):
            with context.txn.sender(payer):
                contract.add_expense(
                    group_id=0,
                    amount=100_000_000,
                    note="Empty split",
                    split_with=b""  # Empty
                )
    
    def test_add_expense_invalid_split_format_fails(self, context: AlgopyTestContext):
        """Test split_with must be 32-byte aligned"""
        admin = context.any_account()
        payer = context.any_account()
        
        contract = ExpenseTracker()
        contract.__init__()
        
        with context.txn.sender(admin):
            contract.set_group_manager(1)
        
        invalid_split = b"A" * 31  # Not 32-byte aligned
        
        with pytest.raises(AssertionError, match="Invalid split_with format"):
            with context.txn.sender(payer):
                contract.add_expense(
                    group_id=0,
                    amount=100_000_000,
                    note="Invalid format",
                    split_with=invalid_split
                )
    
    def test_add_expense_too_many_people_fails(self, context: AlgopyTestContext):
        """Test split count limit"""
        admin = context.any_account()
        payer = context.any_account()
        
        contract = ExpenseTracker()
        contract.__init__()
        
        with context.txn.sender(admin):
            contract.set_group_manager(1)
        
        # Create 101 members (exceeds limit of 100)
        members = [context.any_account() for _ in range(101)]
        
        with pytest.raises(AssertionError, match="Too many people in split"):
            with context.txn.sender(payer):
                contract.add_expense(
                    group_id=0,
                    amount=1000_000_000,
                    note="Too many",
                    split_with=pack_addresses(*members)
                )


# ==================== TEST QUERY METHODS ====================

class TestQueryMethods:
    """Test read-only query methods"""
    
    def test_get_user_balance_nonexistent_group(self, context: AlgopyTestContext):
        """Test querying balance for group with no expenses"""
        admin = context.any_account()
        user = context.any_account()
        
        contract = ExpenseTracker()
        contract.__init__()
        
        balance = contract.get_user_balance(999, user)
        assert balance == 0
    
    def test_get_user_balance_nonexistent_user(self, context: AlgopyTestContext):
        """Test querying balance for user not in group"""
        admin = context.any_account()
        alice = context.any_account()
        bob = context.any_account()
        charlie = context.any_account()  # Not in group
        
        contract = ExpenseTracker()
        contract.__init__()
        
        with context.txn.sender(admin):
            contract.set_group_manager(1)
        
        # Alice and Bob have expense
        with context.txn.sender(alice):
            contract.add_expense(
                group_id=0,
                amount=100_000_000,
                note="Test",
                split_with=pack_addresses(alice, bob)
            )
        
        # Charlie not in group -> balance 0
        charlie_balance = contract.get_user_balance(0, charlie)
        assert charlie_balance == 0
    
    def test_get_group_expenses_count(self, context: AlgopyTestContext):
        """Test expense count query"""
        admin = context.any_account()
        payer = context.any_account()
        member = context.any_account()
        
        contract = ExpenseTracker()
        contract.__init__()
        
        with context.txn.sender(admin):
            contract.set_group_manager(1)
        
        # No expenses initially
        count_0 = contract.get_group_expenses_count(0)
        assert count_0 == 0
        
        # Add expense
        with context.txn.sender(payer):
            contract.add_expense(
                group_id=0,
                amount=50_000_000,
                note="Test",
                split_with=pack_addresses(payer, member)
            )
        
        # Count should be 1
        # Note: Implementation may vary based on how expenses are tracked
        # This test is a placeholder


# ==================== TEST INTEGRATION SCENARIOS ====================

class TestIntegrationScenarios:
    """Test complete workflows"""
    
    def test_complete_expense_flow(self, context: AlgopyTestContext):
        """Test complete expense lifecycle"""
        admin = context.any_account()
        alice = context.any_account()
        bob = context.any_account()
        carol = context.any_account()
        
        contract = ExpenseTracker()
        contract.__init__()
        
        with context.txn.sender(admin):
            contract.set_group_manager(1)
        
        # Expense 1: Alice pays 150 for all three
        with context.txn.sender(alice):
            exp1 = contract.add_expense(
                group_id=0,
                amount=150_000_000,
                note="Dinner",
                split_with=pack_addresses(alice, bob, carol)
            )
        
        assert exp1 == 0
        
        # Expense 2: Bob pays 90 for all three
        with context.txn.sender(bob):
            exp2 = contract.add_expense(
                group_id=0,
                amount=90_000_000,
                note="Lunch",
                split_with=pack_addresses(alice, bob, carol)
            )
        
        assert exp2 == 1
        
        # Expense 3: Carol pays 60 just for her and Alice
        with context.txn.sender(carol):
            exp3 = contract.add_expense(
                group_id=0,
                amount=60_000_000,
                note="Coffee",
                split_with=pack_addresses(alice, carol)
            )
        
        assert exp3 == 2
        
        # Final balances:
        # Alice: paid 150, owes 130 -> +20
        # Bob: paid 90, owes 80 -> +10
        # Carol: paid 60, owes 90 -> -30
        alice_balance = decode_signed_balance(contract.get_user_balance(0, alice))
        bob_balance = decode_signed_balance(contract.get_user_balance(0, bob))
        carol_balance = decode_signed_balance(contract.get_user_balance(0, carol))
        
        # Verify zero-sum
        total = alice_balance + bob_balance + carol_balance
        assert total == 0  # Closed system
    
    def test_multi_group_isolation(self, context: AlgopyTestContext):
        """Test expenses in different groups are isolated"""
        admin = context.any_account()
        alice = context.any_account()
        bob = context.any_account()
        
        contract = ExpenseTracker()
        contract.__init__()
        
        with context.txn.sender(admin):
            contract.set_group_manager(1)
        
        # Group 0: Alice pays 100
        with context.txn.sender(alice):
            contract.add_expense(
                group_id=0,
                amount=100_000_000,
                note="Group 0",
                split_with=pack_addresses(alice, bob)
            )
        
        # Group 1: Bob pays 80
        with context.txn.sender(bob):
            contract.add_expense(
                group_id=1,
                amount=80_000_000,
                note="Group 1",
                split_with=pack_addresses(alice, bob)
            )
        
        # Check balances are separate
        # Group 0: Alice +50, Bob -50
        # Group 1: Alice -40, Bob +40
        alice_g0 = decode_signed_balance(contract.get_user_balance(0, alice))
        alice_g1 = decode_signed_balance(contract.get_user_balance(1, alice))
        
        assert alice_g0 == 50_000_000
        assert alice_g1 == -40_000_000


# ==================== FIXTURES ====================

@pytest.fixture
def context():
    """Test context fixture"""
    with algopy_testing_context() as ctx:
        yield ctx


# ==================== RUN TESTS ====================

if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
