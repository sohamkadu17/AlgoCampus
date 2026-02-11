"""
Pydantic schemas for API request/response validation
"""

from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, validator
from enum import Enum


# ==================== User Schemas ====================

class UserCreate(BaseModel):
    wallet_address: str


class User(BaseModel):
    wallet_address: str
    created_at: datetime
    last_login: Optional[datetime] = None
    
    class Config:
        from_attributes = True


# ==================== Group Schemas ====================

class GroupCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: str = Field("", max_length=500)


class GroupUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)


class GroupMemberAdd(BaseModel):
    wallet_address: str


class Group(BaseModel):
    id: int
    chain_group_id: int
    name: str
    description: str
    admin_address: str
    created_at: datetime
    updated_at: datetime
    active: bool
    
    class Config:
        from_attributes = True


class GroupWithMembers(Group):
    members: List[str] = []  # List of wallet addresses


class GroupBalance(BaseModel):
    wallet_address: str
    balance: int  # In microAlgos (positive = owed to them, negative = they owe)
    formatted_balance: str  # In ALGO


# ==================== Expense Schemas ====================

class SplitType(str, Enum):
    EQUAL = "equal"
    CUSTOM = "custom"
    PERCENTAGE = "percentage"


class ExpenseSplit(BaseModel):
    wallet_address: str
    amount: int = Field(..., gt=0, description="Amount in microAlgos")
    
    @validator('amount')
    def validate_amount(cls, v):
        if v <= 0:
            raise ValueError("Amount must be positive")
        return v


class ExpenseCreate(BaseModel):
    group_id: int
    amount: int = Field(..., gt=0, description="Total amount in microAlgos")
    description: str = Field(..., min_length=1, max_length=500)
    split_type: SplitType
    splits: Optional[List[ExpenseSplit]] = None  # Required for custom splits
    
    @validator('amount')
    def validate_amount(cls, v):
        if v <= 0:
            raise ValueError("Amount must be positive")
        if v > 1_000_000_000_000:  # 1M ALGO max
            raise ValueError("Amount too large")
        return v
    
    @validator('splits')
    def validate_splits(cls, v, values):
        if values.get('split_type') == SplitType.CUSTOM:
            if not v:
                raise ValueError("Splits required for custom split type")
            
            total = sum(split.amount for split in v)
            if total != values.get('amount'):
                raise ValueError("Splits must sum to total amount")
        
        return v


class ExpenseUpdate(BaseModel):
    description: Optional[str] = Field(None, min_length=1, max_length=500)


class Expense(BaseModel):
    id: int
    chain_expense_id: Optional[int]
    group_id: int
    amount: int
    description: str
    payer_address: str
    split_type: str
    created_at: datetime
    settled: bool
    transaction_id: Optional[str]
    
    class Config:
        from_attributes = True


class ExpenseWithSplits(Expense):
    splits: List[ExpenseSplit] = []


class ExpenseListResponse(BaseModel):
    expenses: List[Expense]
    total: int
    page: int
    page_size: int


# ==================== Settlement Schemas ====================

class SettlementStatus(str, Enum):
    PENDING = "pending"
    COMPLETED = "completed"
    FAILED = "failed"


class SettlementInitiate(BaseModel):
    expense_id: Optional[int] = None
    from_address: str
    to_address: str
    amount: int = Field(..., gt=0)
    
    @validator('amount')
    def validate_amount(cls, v):
        if v <= 0:
            raise ValueError("Amount must be positive")
        return v


class SettlementExecute(BaseModel):
    settlement_id: int
    transaction_id: str  # Algorand transaction ID


class Settlement(BaseModel):
    id: int
    chain_settlement_id: Optional[int]
    expense_id: Optional[int]
    from_address: str
    to_address: str
    amount: int
    transaction_id: Optional[str]
    status: str
    created_at: datetime
    completed_at: Optional[datetime]
    
    class Config:
        from_attributes = True


class SettlementPlan(BaseModel):
    """Optimized settlement plan to minimize transactions"""
    settlements: List[SettlementInitiate]
    total_transactions: int
    total_amount: int


# ==================== Analytics Schemas ====================

class UserStats(BaseModel):
    wallet_address: str
    total_paid: int  # In microAlgos
    total_owed: int
    total_owes: int
    net_balance: int  # positive = owed, negative = owes
    groups_count: int
    expenses_count: int


class GroupStats(BaseModel):
    group_id: int
    total_expenses: int  # In microAlgos
    expenses_count: int
    settled_count: int
    pending_count: int
    member_count: int
    top_spender: Optional[str]


class SpendingTrend(BaseModel):
    date: str  # YYYY-MM-DD
    amount: int
    count: int


# ==================== Transaction Schemas ====================

class TransactionType(str, Enum):
    CREATE_GROUP = "create_group"
    ADD_MEMBER = "add_member"
    REMOVE_MEMBER = "remove_member"
    ADD_EXPENSE = "add_expense"
    SETTLE = "settle"
    PAYMENT = "payment"


class Transaction(BaseModel):
    id: int
    transaction_id: str
    block_number: Optional[int]
    transaction_type: str
    sender: Optional[str]
    receiver: Optional[str]
    amount: Optional[int]
    fee: Optional[int]
    note: Optional[str]
    metadata: Optional[Dict[str, Any]]
    indexed_at: datetime
    
    class Config:
        from_attributes = True


# ==================== Error Schemas ====================

class ErrorResponse(BaseModel):
    detail: str
    error_code: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)
