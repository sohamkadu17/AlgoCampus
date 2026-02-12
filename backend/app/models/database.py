"""
SQLAlchemy database models
"""

from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, BigInteger, Boolean, 
    DateTime, Text, ForeignKey, Index, JSON
)
from sqlalchemy.orm import relationship, declarative_base

Base = declarative_base()


class User(Base):
    """User table - tracks wallet addresses"""
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True)
    wallet_address = Column(String(58), unique=True, nullable=False, index=True)
    nonce = Column(String(64), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    last_login = Column(DateTime)
    
    # Relationships
    groups = relationship("GroupMember", back_populates="user")


class Group(Base):
    """Group table - mirrors on-chain group data"""
    __tablename__ = "groups"
    
    id = Column(Integer, primary_key=True)
    chain_group_id = Column(BigInteger, unique=True, nullable=False, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    admin_address = Column(String(58), nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    active = Column(Boolean, default=True)
    
    # Relationships
    members = relationship("GroupMember", back_populates="group", cascade="all, delete-orphan")
    expenses = relationship("Expense", back_populates="group", cascade="all, delete-orphan")
    balances = relationship("Balance", back_populates="group", cascade="all, delete-orphan")


class GroupMember(Base):
    """Group membership table"""
    __tablename__ = "group_members"
    
    id = Column(Integer, primary_key=True)
    group_id = Column(Integer, ForeignKey("groups.id"), nullable=False)
    wallet_address = Column(String(58), ForeignKey("users.wallet_address"), nullable=False, index=True)
    joined_at = Column(DateTime, default=datetime.utcnow)
    role = Column(String(20), default="member")  # admin, member
    
    # Relationships
    group = relationship("Group", back_populates="members")
    user = relationship("User", back_populates="groups", foreign_keys=[wallet_address])
    
    # Constraints
    __table_args__ = (
        Index("idx_group_member", "group_id", "wallet_address", unique=True),
    )


class Expense(Base):
    """Expense table - tracks group expenses"""
    __tablename__ = "expenses"
    
    id = Column(Integer, primary_key=True)
    chain_expense_id = Column(BigInteger, unique=True, index=True)
    group_id = Column(Integer, ForeignKey("groups.id"), nullable=False, index=True)
    amount = Column(BigInteger, nullable=False)  # microAlgos
    description = Column(Text)
    payer_address = Column(String(58), nullable=False, index=True)
    split_type = Column(String(20), nullable=False)  # equal, custom
    created_at = Column(DateTime, default=datetime.utcnow)
    settled = Column(Boolean, default=False, index=True)
    transaction_id = Column(String(52))  # Algorand txn ID
    
    # Relationships
    group = relationship("Group", back_populates="expenses")
    splits = relationship("ExpenseSplit", back_populates="expense", cascade="all, delete-orphan")


class ExpenseSplit(Base):
    """Expense split table - who owes what"""
    __tablename__ = "expense_splits"
    
    id = Column(Integer, primary_key=True)
    expense_id = Column(Integer, ForeignKey("expenses.id"), nullable=False, index=True)
    wallet_address = Column(String(58), nullable=False, index=True)
    amount = Column(BigInteger, nullable=False)  # microAlgos owed
    settled = Column(Boolean, default=False)
    
    # Relationships
    expense = relationship("Expense", back_populates="splits")


class Settlement(Base):
    """Settlement table - debt settlements"""
    __tablename__ = "settlements"
    
    id = Column(Integer, primary_key=True)
    chain_settlement_id = Column(BigInteger, unique=True, index=True)
    expense_id = Column(Integer, ForeignKey("expenses.id"), index=True)
    from_address = Column(String(58), nullable=False, index=True)
    to_address = Column(String(58), nullable=False, index=True)
    amount = Column(BigInteger, nullable=False)  # microAlgos
    transaction_id = Column(String(52))  # Algorand txn ID
    status = Column(String(20), nullable=False, index=True)  # pending, completed, failed
    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime)
    
    # Relationships
    expense = relationship("Expense")


class Transaction(Base):
    """Transaction log - indexed blockchain transactions"""
    __tablename__ = "transactions"
    
    id = Column(Integer, primary_key=True)
    transaction_id = Column(String(52), unique=True, nullable=False, index=True)
    block_number = Column(BigInteger, index=True)
    transaction_type = Column(String(50), nullable=False, index=True)
    sender = Column(String(58), index=True)
    receiver = Column(String(58), index=True)
    amount = Column(BigInteger)
    fee = Column(BigInteger)
    note = Column(Text)
    tx_metadata = Column(JSON)  # Store additional data (renamed from metadata to avoid SQLAlchemy conflict)
    indexed_at = Column(DateTime, default=datetime.utcnow)


class Balance(Base):
    """Balance cache - quick access to group balances"""
    __tablename__ = "balances"
    
    id = Column(Integer, primary_key=True)
    group_id = Column(Integer, ForeignKey("groups.id"), nullable=False)
    wallet_address = Column(String(58), nullable=False, index=True)
    balance = Column(BigInteger, nullable=False)  # Net balance (+ = owed, - = owes)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    group = relationship("Group", back_populates="balances")
    
    # Constraints
    __table_args__ = (
        Index("idx_group_balance", "group_id", "wallet_address", unique=True),
    )
