from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.schemas.inventory import (
    InventoryCreate, InventoryUpdate, InventoryResponse,
    InventoryTransactionCreate, InventoryTransactionResponse, LowStockResponse
)
from app.crud import inventory as crud

router = APIRouter()


@router.get("/", response_model=List[InventoryResponse])
def list_inventory(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
):
    return crud.get_all_inventory(db, skip=skip, limit=limit)


@router.get("/low-stock", response_model=List[LowStockResponse])
def get_low_stock(db: Session = Depends(get_db)):
    items = crud.get_low_stock_items(db)
    return [
        LowStockResponse(
            product_id=product.id,
            product_name=product.name,
            sku=product.sku,
            quantity_in_stock=inventory.quantity_in_stock,
            reorder_level=inventory.reorder_level,
            reorder_quantity=inventory.reorder_quantity,
        )
        for inventory, product in items
    ]


@router.get("/product/{product_id}", response_model=InventoryResponse)
def get_inventory_by_product(product_id: int, db: Session = Depends(get_db)):
    inv = crud.get_inventory_by_product(db, product_id)
    if not inv:
        raise HTTPException(status_code=404, detail="Inventory not found for this product")
    return inv


@router.get("/{inventory_id}", response_model=InventoryResponse)
def get_inventory(inventory_id: int, db: Session = Depends(get_db)):
    inv = crud.get_inventory(db, inventory_id)
    if not inv:
        raise HTTPException(status_code=404, detail="Inventory not found")
    return inv


@router.post("/", response_model=InventoryResponse, status_code=201)
def create_inventory(inventory: InventoryCreate, db: Session = Depends(get_db)):
    existing = crud.get_inventory_by_product(db, inventory.product_id)
    if existing:
        raise HTTPException(status_code=400, detail="Inventory already exists for this product")
    return crud.create_inventory(db, inventory)


@router.put("/{inventory_id}", response_model=InventoryResponse)
def update_inventory(inventory_id: int, inventory: InventoryUpdate, db: Session = Depends(get_db)):
    updated = crud.update_inventory(db, inventory_id, inventory)
    if not updated:
        raise HTTPException(status_code=404, detail="Inventory not found")
    return updated


@router.post("/{inventory_id}/transactions", response_model=InventoryResponse)
def add_transaction(
    inventory_id: int,
    txn: InventoryTransactionCreate,
    db: Session = Depends(get_db),
):
    inv = crud.get_inventory(db, inventory_id)
    if not inv:
        raise HTTPException(status_code=404, detail="Inventory not found")
    return crud.add_stock(db, inventory_id, txn)


@router.get("/{inventory_id}/transactions", response_model=List[InventoryTransactionResponse])
def get_transactions(inventory_id: int, db: Session = Depends(get_db)):
    inv = crud.get_inventory(db, inventory_id)
    if not inv:
        raise HTTPException(status_code=404, detail="Inventory not found")
    return crud.get_transactions(db, inventory_id)
