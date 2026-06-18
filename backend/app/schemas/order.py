from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from app.models.order import OrderStatus


class OrderItemBase(BaseModel):
    product_id: int
    quantity: int = Field(..., gt=0)
    unit_price: float = Field(..., gt=0)


class OrderItemCreate(OrderItemBase):
    pass


class OrderItemResponse(OrderItemBase):
    id: int
    subtotal: float

    class Config:
        from_attributes = True


class OrderBase(BaseModel):
    customer_id: int
    notes: Optional[str] = None
    shipping_address: Optional[str] = None


class OrderCreate(OrderBase):
    items: List[OrderItemCreate] = Field(..., min_length=1)


class OrderUpdate(BaseModel):
    status: Optional[OrderStatus] = None
    notes: Optional[str] = None
    shipping_address: Optional[str] = None


class OrderResponse(OrderBase):
    id: int
    order_number: str
    status: OrderStatus
    total_amount: float
    items: List[OrderItemResponse] = []
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
