from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.schemas.product import ProductCreate, ProductUpdate, ProductResponse
from app.crud import product as crud
from app.crud import inventory as inv_crud
from app.schemas.inventory import InventoryCreate

router = APIRouter()


@router.get("/", response_model=List[ProductResponse])
def list_products(
    skip:      int            = Query(0, ge=0),
    limit:     int            = Query(100, ge=1, le=500),
    category:  Optional[str]  = None,
    is_active: Optional[bool] = None,
    db:        Session        = Depends(get_db),
):
    return crud.get_products(db, skip=skip, limit=limit,
                             category=category, is_active=is_active)


@router.get("/count")
def get_product_count(db: Session = Depends(get_db)):
    return {"count": crud.count_products(db)}


@router.get("/{product_id}", response_model=ProductResponse)
def get_product(product_id: int, db: Session = Depends(get_db)):
    product = crud.get_product(db, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


@router.post("/", response_model=ProductResponse, status_code=201)
def create_product(product: ProductCreate, db: Session = Depends(get_db)):
    # Enforce unique SKU
    if crud.get_product_by_sku(db, product.sku):
        raise HTTPException(status_code=400,
                            detail=f"SKU '{product.sku}' already exists")
    db_product = crud.create_product(db, product)

    # Auto-create an inventory record so the Inventory page / low-stock
    # endpoint stays in sync with the product's quantity_in_stock.
    if not inv_crud.get_inventory_by_product(db, db_product.id):
        inv_crud.create_inventory(
            db,
            InventoryCreate(
                product_id=db_product.id,
                quantity_in_stock=db_product.quantity_in_stock,
                reorder_level=10,
                reorder_quantity=50,
            ),
        )
    return db_product


@router.put("/{product_id}", response_model=ProductResponse)
def update_product(
    product_id: int,
    product:    ProductUpdate,
    db:         Session = Depends(get_db),
):
    updated = crud.update_product(db, product_id, product)
    if not updated:
        raise HTTPException(status_code=404, detail="Product not found")

    # Sync inventory record if quantity_in_stock was updated
    if product.quantity_in_stock is not None:
        inv = inv_crud.get_inventory_by_product(db, product_id)
        if inv:
            inv.quantity_in_stock = product.quantity_in_stock
            db.commit()
    return updated


@router.delete("/{product_id}", status_code=204)
def delete_product(product_id: int, db: Session = Depends(get_db)):
    deleted = crud.delete_product(db, product_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Product not found")
