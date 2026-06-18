#!/usr/bin/env python3
"""
Seed script — populates the database with sample data for testing.

Run inside Docker:
    docker compose exec backend python seed.py

Run locally (with venv active and DATABASE_URL set in .env):
    cd backend && python seed.py
"""

import sys
import os

# Ensure the app package is importable when run directly
sys.path.insert(0, os.path.dirname(__file__))

from app.database import SessionLocal, engine, Base
from app.models.product import Product
from app.models.customer import Customer
from app.models.order import Order, OrderItem, OrderStatus
from app.models.inventory import Inventory, InventoryTransaction

# ── Create tables if they don't exist ────────────────────────────────────────
Base.metadata.create_all(bind=engine)

db = SessionLocal()

# ─────────────────────────────────────────────────────────────────────────────
# HELPERS
# ─────────────────────────────────────────────────────────────────────────────

def clear_existing(verbose=True):
    """Remove all existing seed data to allow re-running cleanly."""
    tables = [InventoryTransaction, Inventory, OrderItem, Order, Customer, Product]
    for model in tables:
        count = db.query(model).delete()
        if verbose and count:
            print(f"  🗑  Cleared {count} existing {model.__tablename__} rows")
    db.commit()


def seed_products():
    products = [
        Product(
            name="Wireless Bluetooth Headphones",
            sku="WBH-001",
            description="Over-ear noise-cancelling Bluetooth headphones with 30h battery life.",
            category="Electronics",
            price=89.99,
            cost_price=42.50,
            quantity_in_stock=120,
            is_active=True,
        ),
        Product(
            name="Ergonomic Office Chair",
            sku="EOC-002",
            description="Adjustable lumbar support, breathable mesh back, 5-year warranty.",
            category="Furniture",
            price=299.00,
            cost_price=160.00,
            quantity_in_stock=25,
            is_active=True,
        ),
        Product(
            name="USB-C Laptop Stand",
            sku="ULS-003",
            description="Aluminium foldable laptop stand, compatible with 11–17 inch laptops.",
            category="Accessories",
            price=49.95,
            cost_price=18.00,
            quantity_in_stock=80,
            is_active=True,
        ),
        Product(
            name="Mechanical Keyboard",
            sku="MKB-004",
            description="TKL layout, Cherry MX Blue switches, RGB backlighting.",
            category="Electronics",
            price=129.00,
            cost_price=65.00,
            quantity_in_stock=15,
            is_active=True,
        ),
        Product(
            name="4K Webcam",
            sku="WCM-005",
            description="4K 30fps webcam with autofocus, built-in dual microphone.",
            category="Electronics",
            price=74.99,
            cost_price=35.00,
            quantity_in_stock=60,
            is_active=True,
        ),
    ]
    db.add_all(products)
    db.flush()  # assigns IDs without committing
    print(f"  ✅ Seeded {len(products)} products")
    return products


def seed_inventory(products):
    stock_levels = [120, 25, 80, 15, 60]   # qty in stock
    reorder_lvls = [20,  10, 15, 20, 10]   # reorder level
    locations    = ["Shelf A-1", "Shelf B-3", "Shelf A-4", "Shelf C-2", "Shelf A-2"]

    records = []
    for product, qty, reorder, loc in zip(products, stock_levels, reorder_lvls, locations):
        inv = Inventory(
            product_id=product.id,
            quantity_in_stock=qty,
            reorder_level=reorder,
            reorder_quantity=50,
            location=loc,
        )
        db.add(inv)
        db.flush()

        # Seed the initial "stock in" transaction
        txn = InventoryTransaction(
            inventory_id=inv.id,
            transaction_type="in",
            quantity=qty,
            reason="Initial stock — seed data",
            reference_id="SEED-001",
        )
        db.add(txn)
        records.append(inv)

    print(f"  ✅ Seeded {len(records)} inventory records with opening transactions")
    return records


def seed_customers():
    customers = [
        Customer(
            name="Alice Johnson",
            email="alice.johnson@example.com",
            phone="+1-555-010-0001",
            address="12 Oak Street, Apt 4B",
            city="New York",
            country="United States",
            is_active=True,
        ),
        Customer(
            name="Bob Martínez",
            email="bob.martinez@example.com",
            phone="+1-555-020-0002",
            address="88 Maple Avenue",
            city="Chicago",
            country="United States",
            is_active=True,
        ),
        Customer(
            name="Clara Schmidt",
            email="clara.schmidt@example.com",
            phone="+49-30-1234567",
            address="Berliner Str. 44",
            city="Berlin",
            country="Germany",
            is_active=True,
        ),
        Customer(
            name="David Okafor",
            email="david.okafor@example.com",
            phone="+44-20-7946-0958",
            address="27 King's Road",
            city="London",
            country="United Kingdom",
            is_active=True,
        ),
        Customer(
            name="Eva Nakamura",
            email="eva.nakamura@example.com",
            phone="+81-3-1234-5678",
            address="2-14 Shibuya, Shibuya-ku",
            city="Tokyo",
            country="Japan",
            is_active=True,
        ),
    ]
    db.add_all(customers)
    db.flush()
    print(f"  ✅ Seeded {len(customers)} customers")
    return customers


def seed_orders(customers, products, inventory_map):
    """
    inventory_map: dict[product.id → Inventory]
    Places 3 orders and deducts stock automatically.
    """
    import uuid

    def make_order_number():
        return f"ORD-{uuid.uuid4().hex[:8].upper()}"

    orders_data = [
        # Order 1: Alice buys headphones (2×) + webcam (1×)
        {
            "customer": customers[0],
            "shipping_address": "12 Oak Street, Apt 4B, New York, USA",
            "notes": "Please leave at door if no answer.",
            "status": OrderStatus.delivered,
            "items": [
                {"product": products[0], "qty": 2},   # headphones
                {"product": products[4], "qty": 1},   # webcam
            ],
        },
        # Order 2: Bob buys chair (1×) + keyboard (1×)
        {
            "customer": customers[1],
            "shipping_address": "88 Maple Avenue, Chicago, USA",
            "notes": None,
            "status": OrderStatus.shipped,
            "items": [
                {"product": products[1], "qty": 1},   # chair
                {"product": products[3], "qty": 1},   # keyboard
            ],
        },
        # Order 3: Clara buys laptop stand (3×)
        {
            "customer": customers[2],
            "shipping_address": "Berliner Str. 44, Berlin, Germany",
            "notes": "Gift — please include no receipt.",
            "status": OrderStatus.processing,
            "items": [
                {"product": products[2], "qty": 3},   # laptop stand
            ],
        },
    ]

    created = []
    for od in orders_data:
        total = 0.0
        order = Order(
            order_number=make_order_number(),
            customer_id=od["customer"].id,
            status=od["status"],
            notes=od["notes"],
            shipping_address=od["shipping_address"],
        )
        db.add(order)
        db.flush()

        for item_data in od["items"]:
            product = item_data["product"]
            qty     = item_data["qty"]
            price   = product.price
            subtotal = qty * price
            total   += subtotal

            db.add(OrderItem(
                order_id=order.id,
                product_id=product.id,
                quantity=qty,
                unit_price=price,
                subtotal=subtotal,
            ))

            # Deduct from product.quantity_in_stock (primary source of truth)
            product.quantity_in_stock -= qty

            # Mirror deduction in inventory record + log transaction
            inv = inventory_map.get(product.id)
            if inv:
                inv.quantity_in_stock = product.quantity_in_stock
                db.add(InventoryTransaction(
                    inventory_id=inv.id,
                    transaction_type="out",
                    quantity=qty,
                    reason="Order placed (seed data)",
                    reference_id=order.order_number,
                ))

        order.total_amount = total
        created.append(order)
        print(f"     • {order.order_number} — {od['customer'].name} — "
              f"${total:.2f} — {od['status'].value}")

    print(f"  ✅ Seeded {len(created)} orders")
    return created


# ─────────────────────────────────────────────────────────────────────────────
# MAIN
# ─────────────────────────────────────────────────────────────────────────────

def main():
    print("\n🌱 Starting seed...\n")

    try:
        print("1️⃣  Clearing existing data...")
        clear_existing()

        print("\n2️⃣  Seeding products...")
        products = seed_products()

        print("\n3️⃣  Seeding inventory...")
        inventory_records = seed_inventory(products)
        inventory_map = {inv.product_id: inv for inv in inventory_records}

        print("\n4️⃣  Seeding customers...")
        customers = seed_customers()

        print("\n5️⃣  Seeding orders...")
        seed_orders(customers, products, inventory_map)

        db.commit()
        print("\n✨ Seed completed successfully!\n")

        print("─" * 50)
        print("  Products : 5")
        print("  Customers: 5")
        print("  Orders   : 3  (delivered / shipped / processing)")
        print("  Inventory: 5 records with opening stock transactions")
        print("─" * 50)
        print("\n  Frontend → http://localhost:5173")
        print("  API Docs → http://localhost:8000/docs\n")

    except Exception as e:
        db.rollback()
        print(f"\n❌ Seed failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
    finally:
        db.close()


if __name__ == "__main__":
    main()
