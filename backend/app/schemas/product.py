from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class ProductBase(BaseModel):
    name:              str   = Field(..., min_length=1, max_length=255)
    sku:               str   = Field(..., min_length=1, max_length=100)
    description:       Optional[str]   = None
    category:          Optional[str]   = None
    price:             float = Field(..., gt=0, description="Selling price, must be > 0")
    cost_price:        Optional[float] = Field(None, gt=0)
    # Assessment requirement: quantity in stock, must be >= 0
    quantity_in_stock: int   = Field(0, ge=0, description="Stock quantity, must be >= 0")
    is_active:         bool  = True


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    name:              Optional[str]   = Field(None, min_length=1, max_length=255)
    description:       Optional[str]   = None
    category:          Optional[str]   = None
    price:             Optional[float] = Field(None, gt=0)
    cost_price:        Optional[float] = Field(None, gt=0)
    # Allow updating quantity; validates non-negative
    quantity_in_stock: Optional[int]   = Field(None, ge=0)
    is_active:         Optional[bool]  = None


class ProductResponse(ProductBase):
    id:         int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
