from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Movement, Product
from app.schemas import (
    MovementCreate,
    MovementOut,
    ProductCreate,
    ProductDetail,
    ProductOut,
    ProductUpdate,
)

router = APIRouter(prefix="/products", tags=["products"])


def get_product_or_404(db: Session, product_id: int) -> Product:
    product = db.get(Product, product_id)
    if product is None:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    return product


@router.post("", response_model=ProductOut, status_code=status.HTTP_201_CREATED)
def create_product(payload: ProductCreate, db: Session = Depends(get_db)):
    existing = db.scalar(select(Product).where(Product.code == payload.code))
    if existing:
        raise HTTPException(status_code=409, detail="Ya existe un producto con ese codigo")
    product = Product(code=payload.code, name=payload.name)
    db.add(product)
    db.commit()
    db.refresh(product)
    return product


@router.get("", response_model=list[ProductOut])
def list_products(db: Session = Depends(get_db)):
    return db.scalars(select(Product).order_by(Product.code)).all()


@router.get("/{product_id}", response_model=ProductDetail)
def get_product(product_id: int, db: Session = Depends(get_db)):
    product = get_product_or_404(db, product_id)
    return product


@router.patch("/{product_id}", response_model=ProductOut)
def update_product(
    product_id: int, payload: ProductUpdate, db: Session = Depends(get_db)
):
    product = get_product_or_404(db, product_id)
    data = payload.model_dump(exclude_unset=True)
    if "code" in data:
        existing = db.scalar(
            select(Product).where(Product.code == data["code"], Product.id != product_id)
        )
        if existing:
            raise HTTPException(status_code=409, detail="Ya existe un producto con ese codigo")
    for field, value in data.items():
        setattr(product, field, value)
    db.commit()
    db.refresh(product)
    return product


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(product_id: int, db: Session = Depends(get_db)):
    product = get_product_or_404(db, product_id)
    db.delete(product)
    db.commit()


@router.post(
    "/{product_id}/movements",
    response_model=MovementOut,
    status_code=status.HTTP_201_CREATED,
)
def register_movement(
    product_id: int, payload: MovementCreate, db: Session = Depends(get_db)
):
    product = get_product_or_404(db, product_id)

    if payload.movement_type == "SALIDA" and payload.quantity > product.current_stock:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Stock insuficiente: hay {product.current_stock} y se intenta "
                f"retirar {payload.quantity}"
            ),
        )

    stock_after = product.current_stock + (
        payload.quantity if payload.movement_type == "ENTRADA" else -payload.quantity
    )
    product.current_stock = stock_after

    movement = Movement(
        product_id=product.id,
        movement_type=payload.movement_type,
        quantity=payload.quantity,
        movement_date=payload.movement_date,
        stock_after=stock_after,
        note=payload.note,
    )
    db.add(movement)
    db.commit()
    db.refresh(movement)
    return movement