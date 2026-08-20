from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class ProductBase(BaseModel):
    code: str = Field(min_length=1, max_length=50, description="Codigo unico del producto")
    name: str = Field(min_length=1, max_length=200, description="Nombre o descripcion")


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    code: str | None = Field(default=None, min_length=1, max_length=50)
    name: str | None = Field(default=None, min_length=1, max_length=200)


class ProductOut(ProductBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    current_stock: int
    created_at: datetime


class MovementCreate(BaseModel):
    movement_type: Literal["ENTRADA", "SALIDA"]
    quantity: int = Field(gt=0, description="Cantidad del movimiento")
    movement_date: date = Field(default_factory=date.today)
    note: str | None = Field(default=None, max_length=500)


class MovementOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    product_id: int
    movement_type: str
    quantity: int
    movement_date: date
    stock_after: int
    note: str | None
    created_at: datetime


class ProductDetail(ProductOut):
    movements: list[MovementOut] = Field(description="Hoja de ruta: historial de movimientos")


class PaginatedProducts(BaseModel):
    items: list[ProductOut]
    total: int
    page: int
    page_size: int
    total_pages: int


class MovementTotals(BaseModel):
    entradas: int
    salidas: int


class PaginatedMovements(BaseModel):
    items: list[MovementOut]
    total: int
    page: int
    page_size: int
    total_pages: int
    summary: MovementTotals