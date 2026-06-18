from sqlalchemy.orm import Session
from typing import List, Optional
from app.models.customer import Customer
from app.schemas.customer import CustomerCreate, CustomerUpdate


def get_customer(db: Session, customer_id: int) -> Optional[Customer]:
    return db.query(Customer).filter(Customer.id == customer_id).first()


def get_customer_by_email(db: Session, email: str) -> Optional[Customer]:
    return db.query(Customer).filter(Customer.email == email).first()


def get_customers(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    is_active: Optional[bool] = None,
) -> List[Customer]:
    query = db.query(Customer)
    if is_active is not None:
        query = query.filter(Customer.is_active == is_active)
    return query.offset(skip).limit(limit).all()


def create_customer(db: Session, customer: CustomerCreate) -> Customer:
    db_customer = Customer(**customer.model_dump())
    db.add(db_customer)
    db.commit()
    db.refresh(db_customer)
    return db_customer


def update_customer(db: Session, customer_id: int, customer: CustomerUpdate) -> Optional[Customer]:
    db_customer = get_customer(db, customer_id)
    if not db_customer:
        return None
    update_data = customer.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_customer, field, value)
    db.commit()
    db.refresh(db_customer)
    return db_customer


def delete_customer(db: Session, customer_id: int) -> bool:
    db_customer = get_customer(db, customer_id)
    if not db_customer:
        return False
    db.delete(db_customer)
    db.commit()
    return True


def count_customers(db: Session) -> int:
    return db.query(Customer).count()
