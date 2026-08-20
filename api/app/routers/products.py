from datetime import date
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import StreamingResponse
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.database import get_db
from app.exporters import products_excel, products_pdf
from app.models import Movement, Product
from app.schemas import (
    MovementCreate,
    MovementOut,
    PaginatedProducts,
    ProductCreate,
    ProductDetail,
    ProductOut,
    ProductUpdate,
)

router = APIRouter(prefix="/products", tags=["products"])

XLSX_MEDIA = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"


def get_product_or_404(db: Session, product_id: int) -> Product:
    product = db.get(Product, product_id)
    if product is None:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    return product


def _apply_product_filters(stmt, search: str, stock_status: str):
    if search:
        like = f"%{search.strip()}%"
        stmt = stmt.where(or_(Product.code.ilike(like), Product.name.ilike(like)))
    if stock_status == "with":
        stmt = stmt.where(Product.current_stock > 0)
    elif stock_status == "none":
        stmt = stmt.where(Product.current_stock == 0)
    return stmt


@router.post("", response_model=ProductOut, status_code=status.HTTP_201_CREATED)
def create_product(
    payload: ProductCreate,
    db: Session = Depends(get_db),
    _: str = Depends(get_current_user),
):
    existing = db.scalar(select(Product).where(Product.code == payload.code))
    if existing:
        raise HTTPException(status_code=409, detail="Ya existe un producto con ese codigo")
    product = Product(code=payload.code, name=payload.name)
    db.add(product)
    db.commit()
    db.refresh(product)
    return product


@router.get("", response_model=PaginatedProducts)
def list_products(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    search: str = Query(default="", max_length=100, description="Buscar por codigo o nombre"),
    stock_status: Literal["all", "with", "none"] = Query(default="all"),
    db: Session = Depends(get_db),
    _: str = Depends(get_current_user),
):
    stmt = _apply_product_filters(
        select(Product).order_by(Product.code), search, stock_status
    )
    total = db.scalar(select(func.count()).select_from(stmt.subquery())) or 0
    items = db.scalars(stmt.offset((page - 1) * page_size).limit(page_size)).all()
    return PaginatedProducts(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=(total + page_size - 1) // page_size,
    )


@router.get("/export")
def export_products(
    format: Literal["excel", "pdf"] = Query(default="excel"),
    search: str = Query(default="", max_length=100),
    stock_status: Literal["all", "with", "none"] = Query(default="all"),
    db: Session = Depends(get_db),
    _: str = Depends(get_current_user),
):
    stmt = _apply_product_filters(
        select(Product).order_by(Product.code), search, stock_status
    )
    items = db.scalars(stmt).all()
    filename = f"productos-{date.today().isoformat()}"

    if format == "excel":
        return StreamingResponse(
            products_excel(items),
            media_type=XLSX_MEDIA,
            headers={"Content-Disposition": f'attachment; filename="{filename}.xlsx"'},
        )
    return StreamingResponse(
        products_pdf(items),
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}.pdf"'},
    )


@router.get("/{product_id}", response_model=ProductDetail)
def get_product(
    product_id: int,
    db: Session = Depends(get_db),
    _: str = Depends(get_current_user),
):
    product = get_product_or_404(db, product_id)
    return product


@router.patch("/{product_id}", response_model=ProductOut)
def update_product(
    product_id: int,
    payload: ProductUpdate,
    db: Session = Depends(get_db),
    _: str = Depends(get_current_user),
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
def delete_product(
    product_id: int,
    db: Session = Depends(get_db),
    _: str = Depends(get_current_user),
):
    product = get_product_or_404(db, product_id)
    db.delete(product)
    db.commit()


@router.post(
    "/{product_id}/movements",
    response_model=MovementOut,
    status_code=status.HTTP_201_CREATED,
)
def register_movement(
    product_id: int,
    payload: MovementCreate,
    db: Session = Depends(get_db),
    _: str = Depends(get_current_user),
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