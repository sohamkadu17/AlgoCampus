"""
GroupManager Smart Contract - Comprehensive Test Suite

Tests all functionality including:
- Group creation
- Member management
- QR invite generation
- QR joining
- Access control
- Edge cases
- Security features
"""

import pytest
import time
from algopy_testing import AlgopyTestContext, algopy_testing_context
from algosdk import account, transaction
from algosdk.v2client import algod

from smart_contracts.group_manager.contract_enhanced import GroupManager


class TestGroupCreation:
    """Test group creation functionality"""
    
    def test_create_group_success(self, context: AlgopyTestContext):
        """Test successful group creation"""
        # Setup
        admin = context.any_account()
        contract = GroupManager()
        
        # Execute
        with context.txn.sender(admin):
            group_id = contract.create_group(
                name="Apartment Roommates",
                description="Shared apartment expenses"
            )
        
        # Assert
        assert group_id.native == 0  # First group
        
        # Verify metadata
        info = contract.get_group_info(group_id)
        assert info.name.native == "Apartment Roommates"
        assert info.admin.bytes == admin.bytes
        assert info.member_count.native == 1
        assert info.active.native is True
        
        # Verify creator is first member
        members = contract.get_members(group_id)
        assert len(members) == 1
        assert members[0].bytes == admin.bytes
        
    def test_create_group_incremental_ids(self, context: AlgopyTestContext):
        """Test group IDs increment correctly"""
        admin = context.any_account()
        contract = GroupManager()
        
        with context.txn.sender(admin):
            id1 = contract.create_group("Group 1", "Desc 1")
            id2 = contract.create_group("Group 2", "Desc 2")
            id3 = contract.create_group("Group 3", "Desc 3")
        
        assert id1.native == 0
        assert id2.native == 1
        assert id3.native == 2
        
    def test_create_group_empty_name_fails(self, context: AlgopyTestContext):
        """Test empty name is rejected"""
        admin = context.any_account()
        contract = GroupManager()
        
        with pytest.raises(AssertionError, match="Name cannot be empty"):
            with context.txn.sender(admin):
                contract.create_group(name="", description="Test")
                
    def test_create_group_name_too_long_fails(self, context: AlgopyTestContext):
        """Test name length validation"""
        admin = context.any_account()
        contract = GroupManager()
        
        long_name = "A" * 101  # 101 chars (max is 100)
        
        with pytest.raises(AssertionError, match="Name too long"):
            with context.txn.sender(admin):
                contract.create_group(name=long_name, description="Test")
                
    def test_create_group_description_too_long_fails(self, context: AlgopyTestContext):
        """Test description length validation"""
        admin = context.any_account()
        contract = GroupManager()
        
        long_desc = "A" * 501  # 501 chars (max is 500)
        
        with pytest.raises(AssertionError, match="Description too long"):
            with context.txn.sender(admin):
                contract.create_group(name="Test", description=long_desc)


class TestMemberManagement:
    """Test member add/remove functionality"""
    
    def test_add_member_success(self, context: AlgopyTestContext):
        """Test admin can add members"""
        admin = context.any_account()
        member = context.any_account()
        contract = GroupManager()
        
        # Create group
        with context.txn.sender(admin):
            group_id = contract.create_group("Test", "Test")
        
        # Add member
        with context.txn.sender(admin):
            contract.add_member(group_id, member)
        
        # Verify
        members = contract.get_members(group_id)
        assert len(members) == 2
        assert member.bytes in [m.bytes for m in members]
        
        info = contract.get_group_info(group_id)
        assert info.member_count.native == 2
        
    def test_add_member_non_admin_fails(self, context: AlgopyTestContext):
        """Test non-admin cannot add members"""
        admin = context.any_account()
        non_admin = context.any_account()
        new_member = context.any_account()
        contract = GroupManager()
        
        with context.txn.sender(admin):
            group_id = contract.create_group("Test", "Test")
        
        # Non-admin tries to add member
        with pytest.raises(AssertionError, match="Only admin"):
            with context.txn.sender(non_admin):
                contract.add_member(group_id, new_member)
                
    def test_add_duplicate_member_fails(self, context: AlgopyTestContext):
        """Test cannot add same member twice"""
        admin = context.any_account()
        member = context.any_account()
        contract = GroupManager()
        
        with context.txn.sender(admin):
            group_id = contract.create_group("Test", "Test")
            contract.add_member(group_id, member)
            
            # Try adding again
            with pytest.raises(AssertionError, match="Already a member"):
                contract.add_member(group_id, member)
                
    def test_add_member_to_inactive_group_fails(self, context: AlgopyTestContext):
        """Test cannot add members to inactive group"""
        admin = context.any_account()
        member = context.any_account()
        contract = GroupManager()
        
        with context.txn.sender(admin):
            group_id = contract.create_group("Test", "Test")
            contract.deactivate_group(group_id)
            
            with pytest.raises(AssertionError, match="not active"):
                contract.add_member(group_id, member)
                
    def test_remove_member_success(self, context: AlgopyTestContext):
        """Test admin can remove members"""
        admin = context.any_account()
        member1 = context.any_account()
        member2 = context.any_account()
        contract = GroupManager()
        
        with context.txn.sender(admin):
            group_id = contract.create_group("Test", "Test")
            contract.add_member(group_id, member1)
            contract.add_member(group_id, member2)
            
            # Remove member1
            contract.remove_member(group_id, member1)
        
        # Verify
        members = contract.get_members(group_id)
        assert len(members) == 2  # Admin + member2
        assert member1.bytes not in [m.bytes for m in members]
        assert member2.bytes in [m.bytes for m in members]
        
    def test_remove_admin_fails(self, context: AlgopyTestContext):
        """Test cannot remove admin"""
        admin = context.any_account()
        contract = GroupManager()
        
        with context.txn.sender(admin):
            group_id = contract.create_group("Test", "Test")
            
            with pytest.raises(AssertionError, match="Cannot remove admin"):
                contract.remove_member(group_id, admin)
                
    def test_remove_non_member_fails(self, context: AlgopyTestContext):
        """Test cannot remove non-member"""
        admin = context.any_account()
        non_member = context.any_account()
        contract = GroupManager()
        
        with context.txn.sender(admin):
            group_id = contract.create_group("Test", "Test")
            
            with pytest.raises(AssertionError, match="Not a member"):
                contract.remove_member(group_id, non_member)


class TestQRInviteSystem:
    """Test QR invite generation and joining"""
    
    def test_generate_invite_success(self, context: AlgopyTestContext):
        """Test admin can generate invites"""
        admin = context.any_account()
        contract = GroupManager()
        
        with context.txn.sender(admin):
            group_id = contract.create_group("Test", "Test")
            
            # Generate invite (valid for 24 hours)
            invite_hash = contract.generate_qr_invite_hash(
                group_id=group_id,
                validity_seconds=86400
            )
        
        # Verify hash is 32 bytes
        assert len(invite_hash.bytes) == 32
        
    def test_generate_invite_non_admin_fails(self, context: AlgopyTestContext):
        """Test non-admin cannot generate invites"""
        admin = context.any_account()
        non_admin = context.any_account()
        contract = GroupManager()
        
        with context.txn.sender(admin):
            group_id = contract.create_group("Test", "Test")
        
        with pytest.raises(AssertionError, match="Only admin"):
            with context.txn.sender(non_admin):
                contract.generate_qr_invite_hash(group_id, 3600)
                
    def test_generate_invite_zero_validity_fails(self, context: AlgopyTestContext):
        """Test validity must be positive"""
        admin = context.any_account()
        contract = GroupManager()
        
        with context.txn.sender(admin):
            group_id = contract.create_group("Test", "Test")
            
            with pytest.raises(AssertionError, match="must be positive"):
                contract.generate_qr_invite_hash(group_id, 0)
                
    def test_generate_invite_max_validity_enforced(self, context: AlgopyTestContext):
        """Test max validity is 30 days"""
        admin = context.any_account()
        contract = GroupManager()
        
        with context.txn.sender(admin):
            group_id = contract.create_group("Test", "Test")
            
            # 31 days
            with pytest.raises(AssertionError, match="Max validity"):
                contract.generate_qr_invite_hash(group_id, 31 * 86400)
                
    def test_join_via_qr_success(self, context: AlgopyTestContext):
        """Test user can join via QR invite"""
        admin = context.any_account()
        new_user = context.any_account()
        contract = GroupManager()
        
        # Admin creates group and invite
        with context.txn.sender(admin):
            group_id = contract.create_group("Test", "Test")
            invite_hash = contract.generate_qr_invite_hash(group_id, 86400)
        
        # New user joins via QR
        with context.txn.sender(new_user):
            joined_group_id = contract.join_group_via_qr(invite_hash)
        
        # Verify
        assert joined_group_id.native == group_id.native
        
        members = contract.get_members(group_id)
        assert len(members) == 2
        assert new_user.bytes in [m.bytes for m in members]
        
    def test_join_via_qr_invalid_hash_fails(self, context: AlgopyTestContext):
        """Test invalid invite hash fails"""
        user = context.any_account()
        contract = GroupManager()
        
        # Random hash (not generated)
        fake_hash = bytes([0] * 32)
        
        with pytest.raises(AssertionError, match="Invalid invite"):
            with context.txn.sender(user):
                contract.join_group_via_qr(fake_hash)
                
    def test_join_via_qr_expired_fails(self, context: AlgopyTestContext):
        """Test expired invites are rejected"""
        admin = context.any_account()
        user = context.any_account()
        contract = GroupManager()
        
        with context.txn.sender(admin):
            group_id = contract.create_group("Test", "Test")
            
            # Generate invite with 1 second validity
            invite_hash = contract.generate_qr_invite_hash(group_id, 1)
        
        # Simulate time passing (advance blockchain timestamp)
        context.advance_time(2)
        
        with pytest.raises(AssertionError, match="expired"):
            with context.txn.sender(user):
                contract.join_group_via_qr(invite_hash)
                
    def test_join_via_qr_one_time_use(self, context: AlgopyTestContext):
        """Test invite can only be used once"""
        admin = context.any_account()
        user1 = context.any_account()
        user2 = context.any_account()
        contract = GroupManager()
        
        with context.txn.sender(admin):
            group_id = contract.create_group("Test", "Test")
            invite_hash = contract.generate_qr_invite_hash(group_id, 86400)
        
        # First use - succeeds
        with context.txn.sender(user1):
            contract.join_group_via_qr(invite_hash)
        
        # Second use - fails
        with pytest.raises(AssertionError, match="already used"):
            with context.txn.sender(user2):
                contract.join_group_via_qr(invite_hash)
                
    def test_join_via_qr_already_member_fails(self, context: AlgopyTestContext):
        """Test cannot join if already member"""
        admin = context.any_account()
        member = context.any_account()
        contract = GroupManager()
        
        with context.txn.sender(admin):
            group_id = contract.create_group("Test", "Test")
            contract.add_member(group_id, member)
            
            # Generate new invite
            invite_hash = contract.generate_qr_invite_hash(group_id, 86400)
        
        # Member tries to join again via QR
        with pytest.raises(AssertionError, match="Already a member"):
            with context.txn.sender(member):
                contract.join_group_via_qr(invite_hash)


class TestAccessControl:
    """Test access control and permissions"""
    
    def test_is_member_check(self, context: AlgopyTestContext):
        """Test is_member query"""
        admin = context.any_account()
        member = context.any_account()
        non_member = context.any_account()
        contract = GroupManager()
        
        with context.txn.sender(admin):
            group_id = contract.create_group("Test", "Test")
            contract.add_member(group_id, member)
        
        # Check membership
        assert contract.is_member(group_id, admin).native is True
        assert contract.is_member(group_id, member).native is True
        assert contract.is_member(group_id, non_member).native is False
        
    def test_is_admin_check(self, context: AlgopyTestContext):
        """Test is_admin query"""
        admin = context.any_account()
        member = context.any_account()
        contract = GroupManager()
        
        with context.txn.sender(admin):
            group_id = contract.create_group("Test", "Test")
            contract.add_member(group_id, member)
        
        # Check admin status
        assert contract.is_admin(group_id, admin).native is True
        assert contract.is_admin(group_id, member).native is False


class TestGroupDeactivation:
    """Test group activation/deactivation"""
    
    def test_deactivate_group_success(self, context: AlgopyTestContext):
        """Test admin can deactivate group"""
        admin = context.any_account()
        contract = GroupManager()
        
        with context.txn.sender(admin):
            group_id = contract.create_group("Test", "Test")
            contract.deactivate_group(group_id)
        
        info = contract.get_group_info(group_id)
        assert info.active.native is False
        
    def test_deactivate_non_admin_fails(self, context: AlgopyTestContext):
        """Test non-admin cannot deactivate"""
        admin = context.any_account()
        non_admin = context.any_account()
        contract = GroupManager()
        
        with context.txn.sender(admin):
            group_id = contract.create_group("Test", "Test")
        
        with pytest.raises(AssertionError, match="Only admin"):
            with context.txn.sender(non_admin):
                contract.deactivate_group(group_id)
                
    def test_reactivate_group_success(self, context: AlgopyTestContext):
        """Test admin can reactivate group"""
        admin = context.any_account()
        contract = GroupManager()
        
        with context.txn.sender(admin):
            group_id = contract.create_group("Test", "Test")
            contract.deactivate_group(group_id)
            contract.reactivate_group(group_id)
        
        info = contract.get_group_info(group_id)
        assert info.active.native is True


class TestQueryMethods:
    """Test read-only query methods"""
    
    def test_get_group_info(self, context: AlgopyTestContext):
        """Test get_group_info returns correct data"""
        admin = context.any_account()
        contract = GroupManager()
        
        with context.txn.sender(admin):
            group_id = contract.create_group("Test Group", "Test Description")
        
        info = contract.get_group_info(group_id)
        assert info.name.native == "Test Group"
        assert info.admin.bytes == admin.bytes
        assert info.member_count.native == 1
        assert info.active.native is True
        
    def test_get_group_description(self, context: AlgopyTestContext):
        """Test get_group_description returns description"""
        admin = context.any_account()
        contract = GroupManager()
        
        with context.txn.sender(admin):
            group_id = contract.create_group("Test", "My Description")
        
        desc = contract.get_group_description(group_id)
        assert desc.native == "My Description"
        
    def test_get_members(self, context: AlgopyTestContext):
        """Test get_members returns all members"""
        admin = context.any_account()
        member1 = context.any_account()
        member2 = context.any_account()
        contract = GroupManager()
        
        with context.txn.sender(admin):
            group_id = contract.create_group("Test", "Test")
            contract.add_member(group_id, member1)
            contract.add_member(group_id, member2)
        
        members = contract.get_members(group_id)
        assert len(members) == 3
        
        member_addresses = [m.bytes for m in members]
        assert admin.bytes in member_addresses
        assert member1.bytes in member_addresses
        assert member2.bytes in member_addresses


class TestSecurityFeatures:
    """Test security features and edge cases"""
    
    def test_invite_hash_uniqueness(self, context: AlgopyTestContext):
        """Test each invite generates unique hash"""
        admin = context.any_account()
        contract = GroupManager()
        
        with context.txn.sender(admin):
            group_id = contract.create_group("Test", "Test")
            
            # Generate multiple invites
            hash1 = contract.generate_qr_invite_hash(group_id, 3600)
            hash2 = contract.generate_qr_invite_hash(group_id, 3600)
            hash3 = contract.generate_qr_invite_hash(group_id, 3600)
        
        # All should be unique (due to nonce)
        assert hash1.bytes != hash2.bytes
        assert hash2.bytes != hash3.bytes
        assert hash1.bytes != hash3.bytes
        
    def test_cannot_manipulate_member_count(self, context: AlgopyTestContext):
        """Test member count stays accurate"""
        admin = context.any_account()
        member = context.any_account()
        contract = GroupManager()
        
        with context.txn.sender(admin):
            group_id = contract.create_group("Test", "Test")
            
            # Add member
            contract.add_member(group_id, member)
            info = contract.get_group_info(group_id)
            assert info.member_count.native == 2
            
            # Remove member
            contract.remove_member(group_id, member)
            info = contract.get_group_info(group_id)
            assert info.member_count.native == 1


class TestGasOptimization:
    """Test gas optimization features"""
    
    def test_description_separate_from_metadata(self, context: AlgopyTestContext):
        """Test description is stored separately"""
        admin = context.any_account()
        contract = GroupManager()
        
        # Create group with long description
        long_desc = "A" * 500
        
        with context.txn.sender(admin):
            group_id = contract.create_group("Test", long_desc)
        
        # Get metadata (should be small)
        info = contract.get_group_info(group_id)
        # Description not in struct, fetched separately
        
        desc = contract.get_group_description(group_id)
        assert desc.native == long_desc
        
    def test_member_list_packed_efficiently(self, context: AlgopyTestContext):
        """Test members are stored as packed bytes"""
        admin = context.any_account()
        contract = GroupManager()
        
        with context.txn.sender(admin):
            group_id = contract.create_group("Test", "Test")
            
            # Add 10 members
            for i in range(10):
                member = context.any_account()
                contract.add_member(group_id, member)
        
        # Verify all members stored
        members = contract.get_members(group_id)
        assert len(members) == 11  # Admin + 10 members
        
        info = contract.get_group_info(group_id)
        assert info.member_count.native == 11


# ==================== INTEGRATION TESTS ====================

class TestCompleteWorkflow:
    """Test complete end-to-end workflows"""
    
    def test_full_group_lifecycle(self, context: AlgopyTestContext):
        """Test complete group lifecycle"""
        admin = context.any_account()
        member1 = context.any_account()
        member2 = context.any_account()
        qr_user = context.any_account()
        contract = GroupManager()
        
        # 1. Create group
        with context.txn.sender(admin):
            group_id = contract.create_group(
                "Apartment Roommates",
                "Shared expenses for apartment 5B"
            )
        
        # 2. Add members directly
        with context.txn.sender(admin):
            contract.add_member(group_id, member1)
            contract.add_member(group_id, member2)
        
        assert contract.get_group_info(group_id).member_count.native == 3
        
        # 3. Generate QR invite
        with context.txn.sender(admin):
            invite_hash = contract.generate_qr_invite_hash(group_id, 86400)
        
        # 4. New user joins via QR
        with context.txn.sender(qr_user):
            joined_id = contract.join_group_via_qr(invite_hash)
        
        assert joined_id.native == group_id.native
        assert contract.get_group_info(group_id).member_count.native == 4
        
        # 5. Remove a member
        with context.txn.sender(admin):
            contract.remove_member(group_id, member1)
        
        assert contract.get_group_info(group_id).member_count.native == 3
        
        # 6. Verify final state
        members = contract.get_members(group_id)
        member_addresses = [m.bytes for m in members]
        assert admin.bytes in member_addresses
        assert member2.bytes in member_addresses
        assert qr_user.bytes in member_addresses
        assert member1.bytes not in member_addresses


# ==================== FIXTURES ====================

@pytest.fixture
def context():
    """Test context fixture"""
    with algopy_testing_context() as ctx:
        yield ctx


# ==================== PERFORMANCE BENCHMARKS ====================

class TestPerformance:
    """Benchmark contract performance"""
    
    def test_member_search_performance(self, context: AlgopyTestContext):
        """Test member search with large groups"""
        admin = context.any_account()
        contract = GroupManager()
        
        with context.txn.sender(admin):
            group_id = contract.create_group("Large Group", "Test")
            
            # Add 50 members
            members = []
            for i in range(50):
                member = context.any_account()
                members.append(member)
                contract.add_member(group_id, member)
            
            # Test search for last member (worst case)
            assert contract.is_member(group_id, members[-1]).native is True
            
            # Test search for non-member
            non_member = context.any_account()
            assert contract.is_member(group_id, non_member).native is False


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
