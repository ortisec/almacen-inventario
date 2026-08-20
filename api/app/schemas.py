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


class MovementUpdate(BaseModel):
    movement_type: Literal["ENTRADA", "SALIDA"]
    quantity: int = Field(gt=0, description="Cantidad del movimiento")
    movement_date: date
    note: str | None = Field(default=None, max_length=500)
    reason: str = Field(min_length=1, max_length=500, description="Motivo de la modificacion")


class MovementHistoryIn(BaseModel):
    reason: str = Field(min_length=1, max_length=500, description="Motivo de la anulacion")


class MovementHistoryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    action: str
    reason: str
    details: str
    created_at: datetime


class MovementOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    product_id: int
    movement_type: str
    quantity: int
    movement_date: date
    stock_after: int
    note: str | None
    active: bool = True
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


class LowStockItem(BaseModel):
    id: int
    code: str
    name: str
    current_stock: int


class DashboardTotals(BaseModel):
    products: int
    products_in_stock: int
    products_out_of_stock: int
    current_stock_total: int
    movements: int
    entradas_count: int
    salidas_count: int
    entradas_qty: int
    salidas_qty: int


class DayMovements(BaseModel):
    date: date
    entradas: int
    salidas: int


class DashboardStats(BaseModel):
    totals: DashboardTotals
    low_stock_threshold: int
    low_stock: list[LowStockItem]
    movements_last_days: list[DayMovements]
    top_products: list[LowStockItem]