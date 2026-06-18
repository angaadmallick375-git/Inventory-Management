from sqlalchemy import Column, Integer, Float, DateTime, ForeignKey, String, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class Inventory(Base):
    __tablename__ = "inventory"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), unique=True, nullable=False)
    quantity_in_stock = Column(Integer, default=0, nullable=False)
    reorder_level = Column(Integer, default=10, nullable=False)
    reorder_quantity = Column(Integer, default=50, nullable=False)
    location = Column(String(100), nullable=True)
    last_restocked_at = Column(DateTime(timezone=True), nullable=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    product = relationship("Product", back_populates="inventory")
    transactions = relationship("InventoryTransaction", back_populates="inventory")


class InventoryTransaction(Base):
    __tablename__ = "inventory_transactions"

    id = Column(Integer, primary_key=True, index=True)
    inventory_id = Column(Integer, ForeignKey("inventory.id"), nullable=False)
    transaction_type = Column(String(20), nullable=False)  # "in", "out", "adjustment"
    quantity = Column(Integer, nullable=False)
    reason = Column(Text, nullable=True)
    reference_id = Column(String(100), nullable=True)  # e.g., order number
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    inventory = relationship("Inventory", back_populates="transactions")
