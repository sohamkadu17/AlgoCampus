"""
GroupManager Smart Contract
Manages split groups for campus finance application
"""

from algopy import (
    ARC4Contract,
    String,
    UInt64,
    Bytes,
    Address,
    Global,
    Txn,
    BoxRef,
    arc4,
    subroutine,
)


class GroupManager(ARC4Contract):
    """
    Smart contract for managing expense split groups
    
    Features:
    - Create groups with name and description
    - Add/remove members (admin only)
    - Track group state using box storage
    - Efficient membership verification
    """
    
    def __init__(self) -> None:
        """Initialize contract state"""
        # Global state
        self.group_counter = UInt64(0)
        self.admin = Global.creator_address
        
    @arc4.abimethod
    def create_group(
        self, 
        name: arc4.String, 
        description: arc4.String
    ) -> UInt64:
        """
        Create a new expense group
        
        Args:
            name: Group name (max 100 chars)
            description: Group description (max 500 chars)
            
        Returns:
            group_id: Unique identifier for the group
            
        Box Storage Created:
            - group_{id}_name: String
            - group_{id}_desc: String  
            - group_{id}_admin: Address
            - group_{id}_members: Packed addresses (starts with creator)
            - group_{id}_active: Bool
            - group_{id}_created: UInt64 (timestamp)
        """
        # Increment counter
        group_id = self.group_counter
        self.group_counter += UInt64(1)
        
        # Validate input
        assert len(name.native) <= 100, "Name too long"
        assert len(description.native) <= 500, "Description too long"
        
        # Create box storage for group metadata
        group_name_key = Bytes(b"group_") + group_id.bytes + Bytes(b"_name")
        BoxRef(key=group_name_key).create(size=len(name.bytes))
        BoxRef(key=group_name_key).put(name.bytes)
        
        group_desc_key = Bytes(b"group_") + group_id.bytes + Bytes(b"_desc")
        BoxRef(key=group_desc_key).create(size=len(description.bytes))
        BoxRef(key=group_desc_key).put(description.bytes)
        
        # Set group admin (creator)
        group_admin_key = Bytes(b"group_") + group_id.bytes + Bytes(b"_admin")
        BoxRef(key=group_admin_key).create(size=32)
        BoxRef(key=group_admin_key).put(Txn.sender.bytes)
        
        # Initialize members list with creator
        group_members_key = Bytes(b"group_") + group_id.bytes + Bytes(b"_members")
        BoxRef(key=group_members_key).create(size=32)  # Start with one member
        BoxRef(key=group_members_key).put(Txn.sender.bytes)
        
        # Set active status
        group_active_key = Bytes(b"group_") + group_id.bytes + Bytes(b"_active")
        BoxRef(key=group_active_key).create(size=1)
        BoxRef(key=group_active_key).put(Bytes(b"\x01"))  # True
        
        # Set creation timestamp
        group_created_key = Bytes(b"group_") + group_id.bytes + Bytes(b"_created")
        BoxRef(key=group_created_key).create(size=8)
        BoxRef(key=group_created_key).put(Global.latest_timestamp.bytes)
        
        return group_id
        
    @arc4.abimethod
    def add_member(self, group_id: UInt64, member: Address) -> None:
        """
        Add a member to a group (admin only)
        
        Args:
            group_id: Group identifier
            member: Address to add
            
        Requires:
            - Caller must be group admin
            - Group must be active
            - Member must not already be in group
        """
        # Verify group is active
        assert self._is_group_active(group_id), "Group not active"
        
        # Verify caller is admin
        assert self._is_group_admin(group_id, Txn.sender), "Only admin can add members"
        
        # Verify member not already in group
        assert not self._is_member(group_id, member), "Already a member"
        
        # Get current members
        group_members_key = Bytes(b"group_") + group_id.bytes + Bytes(b"_members")
        members_box = BoxRef(key=group_members_key)
        current_members = members_box.get()
        
        # Append new member (resize box)
        new_size = len(current_members) + 32
        members_box.resize(new_size)
        members_box.put(current_members + member.bytes)
        
    @arc4.abimethod
    def remove_member(self, group_id: UInt64, member: Address) -> None:
        """
        Remove a member from a group (admin only)
        
        Args:
            group_id: Group identifier
            member: Address to remove
            
        Requires:
            - Caller must be group admin
            - Member must be in group
            - Cannot remove admin
        """
        # Verify caller is admin
        assert self._is_group_admin(group_id, Txn.sender), "Only admin can remove members"
        
        # Verify member is in group
        assert self._is_member(group_id, member), "Not a member"
        
        # Verify not removing admin
        assert not self._is_group_admin(group_id, member), "Cannot remove admin"
        
        # Get current members
        group_members_key = Bytes(b"group_") + group_id.bytes + Bytes(b"_members")
        members_box = BoxRef(key=group_members_key)
        current_members = members_box.get()
        
        # Remove member (rebuild members list without this address)
        new_members = Bytes(b"")
        for i in range(len(current_members) // 32):
            offset = i * 32
            addr_bytes = current_members[offset : offset + 32]
            if addr_bytes != member.bytes:
                new_members = new_members + addr_bytes
        
        # Update box
        members_box.resize(len(new_members))
        members_box.put(new_members)
        
    @arc4.abimethod
    def get_group_info(
        self, 
        group_id: UInt64
    ) -> arc4.Tuple[arc4.String, arc4.String, arc4.Address, arc4.Bool, arc4.UInt64]:
        """
        Get group information
        
        Args:
            group_id: Group identifier
            
        Returns:
            Tuple of (name, description, admin, active, created_timestamp)
        """
        # Read from box storage
        name_key = Bytes(b"group_") + group_id.bytes + Bytes(b"_name")
        name = arc4.String.from_bytes(BoxRef(key=name_key).get())
        
        desc_key = Bytes(b"group_") + group_id.bytes + Bytes(b"_desc")
        description = arc4.String.from_bytes(BoxRef(key=desc_key).get())
        
        admin_key = Bytes(b"group_") + group_id.bytes + Bytes(b"_admin")
        admin = arc4.Address.from_bytes(BoxRef(key=admin_key).get())
        
        active_key = Bytes(b"group_") + group_id.bytes + Bytes(b"_active")
        active_bytes = BoxRef(key=active_key).get()
        active = arc4.Bool(active_bytes == Bytes(b"\x01"))
        
        created_key = Bytes(b"group_") + group_id.bytes + Bytes(b"_created")
        created = arc4.UInt64.from_bytes(BoxRef(key=created_key).get())
        
        return arc4.Tuple((name, description, admin, active, created))
        
    @arc4.abimethod
    def get_members(self, group_id: UInt64) -> arc4.DynamicArray[arc4.Address]:
        """
        Get all members of a group
        
        Args:
            group_id: Group identifier
            
        Returns:
            Array of member addresses
        """
        group_members_key = Bytes(b"group_") + group_id.bytes + Bytes(b"_members")
        members_bytes = BoxRef(key=group_members_key).get()
        
        # Convert bytes to address array
        member_count = len(members_bytes) // 32
        members = arc4.DynamicArray[arc4.Address]()
        
        for i in range(member_count):
            offset = i * 32
            addr_bytes = members_bytes[offset : offset + 32]
            members.append(arc4.Address.from_bytes(addr_bytes))
            
        return members
        
    @arc4.abimethod
    def deactivate_group(self, group_id: UInt64) -> None:
        """
        Deactivate a group (admin only)
        
        Args:
            group_id: Group identifier
            
        Requires:
            - Caller must be group admin
        """
        # Verify caller is admin
        assert self._is_group_admin(group_id, Txn.sender), "Only admin can deactivate"
        
        # Set active to false
        group_active_key = Bytes(b"group_") + group_id.bytes + Bytes(b"_active")
        BoxRef(key=group_active_key).put(Bytes(b"\x00"))  # False
        
    # Helper methods
    
    @subroutine
    def _is_group_admin(self, group_id: UInt64, address: Address) -> bool:
        """Check if address is group admin"""
        admin_key = Bytes(b"group_") + group_id.bytes + Bytes(b"_admin")
        admin_bytes = BoxRef(key=admin_key).get()
        return admin_bytes == address.bytes
        
    @subroutine
    def _is_group_active(self, group_id: UInt64) -> bool:
        """Check if group is active"""
        active_key = Bytes(b"group_") + group_id.bytes + Bytes(b"_active")
        active_bytes = BoxRef(key=active_key).get()
        return active_bytes == Bytes(b"\x01")
        
    @subroutine
    def _is_member(self, group_id: UInt64, address: Address) -> bool:
        """Check if address is a member of the group"""
        members_key = Bytes(b"group_") + group_id.bytes + Bytes(b"_members")
        members_bytes = BoxRef(key=members_key).get()
        
        # Check if address exists in members list
        address_bytes = address.bytes
        member_count = len(members_bytes) // 32
        
        for i in range(member_count):
            offset = i * 32
            if members_bytes[offset : offset + 32] == address_bytes:
                return True
                
        return False
