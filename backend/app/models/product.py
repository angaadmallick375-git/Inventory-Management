from sqlalchemy import Column, Integer, String, Float, Text, DateTime, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class Product(Base):
    __tablename__ = "products"

    id             = Column(Integer, primary_key=True, index=True)
    name           = Column(String(255), nullable=False, index=True)
    sku            = Column(String(100), unique=True, nullable=False, index=True)
    description    = Column(Text, nullable=True)
    category       = Column(String(100), nullable=True)
    price          = Column(Float, nullable=False)
    cost_price     = Column(Float, nullable=True)
    # Assessment requirement: "quantity in stock" as a direct product field
    # Validated as >= 0 at schema level. Also mirrored in Inventory for transaction history.
    quantity_in_stock = Column(Integer, default=0, nullable=False)
    is_active      = Column(Boolean, default=True)
    created_at     = Column(DateTime(timezone=True), server_default=func.now())
    updated_at     = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    inventory   = relationship("Inventory", back_populates="product", uselist=False)
    order_items = relationship("OrderItem", back_populates="product")
