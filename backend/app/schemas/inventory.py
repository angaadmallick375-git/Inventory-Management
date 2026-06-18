from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class InventoryBase(BaseModel):
    product_id: int
    quantity_in_stock: int = Field(0, ge=0)
    reorder_level: int = Field(10, ge=0)
    reorder_quantity: int = Field(50, ge=1)
    location: Optional[str] = None


class InventoryCreate(InventoryBase):
    pass


class InventoryUpdate(BaseModel):
    quantity_in_stock: Optional[int] = Field(None, ge=0)
    reorder_level: Optional[int] = Field(None, ge=0)
    reorder_quantity: Optional[int] = Field(None, ge=1)
    location: Optional[str] = None


class InventoryTransactionCreate(BaseModel):
    transaction_type: str = Field(..., pattern="^(in|out|adjustment)$")
    quantity: int = Field(..., gt=0)
    reason: Optional[str] = None
    reference_id: Optional[str] = None


class InventoryTransactionResponse(BaseModel):
    id: int
    inventory_id: int
    transaction_type: str
    quantity: int
    reason: Optional[str] = None
    reference_id: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class InventoryResponse(InventoryBase):
    id: int
    last_restocked_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    transactions: List[InventoryTransactionResponse] = []

    class Config:
        from_attributes = True


class LowStockResponse(BaseModel):
    product_id: int
    product_name: str
    sku: str
    quantity_in_stock: int
    reorder_level: int
    reorder_quantity: int
