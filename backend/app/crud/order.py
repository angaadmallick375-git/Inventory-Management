from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
import uuid
from app.models.order import Order, OrderItem, OrderStatus
from app.models.inventory import Inventory, InventoryTransaction
from app.models.product import Product
from app.schemas.order import OrderCreate, OrderUpdate
from fastapi import HTTPException


def generate_order_number() -> str:
    return f"ORD-{uuid.uuid4().hex[:8].upper()}"


def get_order(db: Session, order_id: int) -> Optional[Order]:
    return db.query(Order).filter(Order.id == order_id).first()


def get_orders(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    customer_id: Optional[int] = None,
    status: Optional[OrderStatus] = None,
) -> List[Order]:
    query = db.query(Order)
    if customer_id:
        query = query.filter(Order.customer_id == customer_id)
    if status:
        query = query.filter(Order.status == status)
    return query.order_by(Order.created_at.desc()).offset(skip).limit(limit).all()


def create_order(db: Session, order: OrderCreate) -> Order:
    """
    Create an order with full business-rule validation:
      1. Product must exist.
      2. Sufficient stock must be available (product.quantity_in_stock).
      3. Stock deducted atomically from both Product and Inventory records.
      4. Total amount calculated automatically from qty × unit_price.
    """
    total_amount = 0.0
    validated_items = []  # (item, subtotal, product, inventory_or_None)

    # ── Pass 1: validate ALL items before writing anything ────────────────
    for item in order.items:
        product = db.query(Product).filter(Product.id == item.product_id).first()
        if not product:
            raise HTTPException(
                status_code=404,
                detail=f"Product with id={item.product_id} not found",
            )
        if product.quantity_in_stock < item.quantity:
            raise HTTPException(
                status_code=400,
                detail=(
                    f"Insufficient stock for '{product.name}' (SKU: {product.sku}). "
                    f"Available: {product.quantity_in_stock}, Requested: {item.quantity}"
                ),
            )
        subtotal = item.quantity * item.unit_price
        total_amount += subtotal
        # Also look up inventory record for transaction logging
        inventory = db.query(Inventory).filter(
            Inventory.product_id == item.product_id
        ).first()
        validated_items.append((item, subtotal, product, inventory))

    # ── Pass 2: write order, items, stock deductions ──────────────────────
    db_order = Order(
        order_number=generate_order_number(),
        customer_id=order.customer_id,
        notes=order.notes,
        shipping_address=order.shipping_address,
        total_amount=total_amount,
        status=OrderStatus.pending,
    )
    db.add(db_order)
    db.flush()  # get order id

    for item, subtotal, product, inventory in validated_items:
        db.add(OrderItem(
            order_id=db_order.id,
            product_id=item.product_id,
            quantity=item.quantity,
            unit_price=item.unit_price,
            subtotal=subtotal,
        ))

        # Deduct from product.quantity_in_stock (primary source of truth)
        product.quantity_in_stock -= item.quantity

        # Mirror deduction in Inventory record + log transaction
        if inventory:
            inventory.quantity_in_stock = product.quantity_in_stock
            db.add(InventoryTransaction(
                inventory_id=inventory.id,
                transaction_type="out",
                quantity=item.quantity,
                reason="Order placed",
                reference_id=db_order.order_number,
            ))

    db.commit()
    db.refresh(db_order)
    return db_order


def update_order(db: Session, order_id: int, order: OrderUpdate) -> Optional[Order]:
    db_order = get_order(db, order_id)
    if not db_order:
        return None
    for field, value in order.model_dump(exclude_unset=True).items():
        setattr(db_order, field, value)
    db.commit()
    db.refresh(db_order)
    return db_order


def delete_order(db: Session, order_id: int) -> bool:
    db_order = get_order(db, order_id)
    if not db_order:
        return False
    db.delete(db_order)
    db.commit()
    return True


def count_orders(db: Session) -> int:
    return db.query(Order).count()
