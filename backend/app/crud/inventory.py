from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from datetime import datetime
from app.models.inventory import Inventory, InventoryTransaction
from app.models.product import Product
from app.schemas.inventory import InventoryCreate, InventoryUpdate, InventoryTransactionCreate


def get_inventory(db: Session, inventory_id: int) -> Optional[Inventory]:
    return db.query(Inventory).options(
        joinedload(Inventory.transactions)
    ).filter(Inventory.id == inventory_id).first()


def get_inventory_by_product(db: Session, product_id: int) -> Optional[Inventory]:
    return db.query(Inventory).filter(Inventory.product_id == product_id).first()


def get_all_inventory(db: Session, skip: int = 0, limit: int = 100) -> List[Inventory]:
    return db.query(Inventory).offset(skip).limit(limit).all()


def create_inventory(db: Session, inventory: InventoryCreate) -> Inventory:
    db_inventory = Inventory(**inventory.model_dump())
    db.add(db_inventory)
    db.commit()
    db.refresh(db_inventory)
    return db_inventory


def update_inventory(
    db: Session, inventory_id: int, inventory: InventoryUpdate
) -> Optional[Inventory]:
    db_inventory = get_inventory(db, inventory_id)
    if not db_inventory:
        return None
    update_data = inventory.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_inventory, field, value)
    db.commit()
    db.refresh(db_inventory)
    return db_inventory


def add_stock(
    db: Session, inventory_id: int, txn: InventoryTransactionCreate
) -> Inventory:
    db_inventory = get_inventory(db, inventory_id)
    if not db_inventory:
        return None

    if txn.transaction_type == "in":
        db_inventory.quantity_in_stock += txn.quantity
        db_inventory.last_restocked_at = datetime.utcnow()
    elif txn.transaction_type == "out":
        db_inventory.quantity_in_stock = max(0, db_inventory.quantity_in_stock - txn.quantity)
    elif txn.transaction_type == "adjustment":
        db_inventory.quantity_in_stock = txn.quantity

    db_txn = InventoryTransaction(
        inventory_id=inventory_id,
        transaction_type=txn.transaction_type,
        quantity=txn.quantity,
        reason=txn.reason,
        reference_id=txn.reference_id,
    )
    db.add(db_txn)
    db.commit()
    db.refresh(db_inventory)
    return db_inventory


def get_low_stock_items(db: Session):
    return (
        db.query(Inventory, Product)
        .join(Product, Inventory.product_id == Product.id)
        .filter(Inventory.quantity_in_stock <= Inventory.reorder_level)
        .all()
    )


def get_transactions(
    db: Session, inventory_id: int
) -> List[InventoryTransaction]:
    return (
        db.query(InventoryTransaction)
        .filter(InventoryTransaction.inventory_id == inventory_id)
        .order_by(InventoryTransaction.created_at.desc())
        .all()
    )
