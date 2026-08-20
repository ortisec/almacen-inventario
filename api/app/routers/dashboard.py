from datetime import date, timedelta

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.config import settings
from app.database import get_db
from app.models import Movement, Product
from app.schemas import (
    DashboardStats,
    DashboardTotals,
    DayMovements,
    LowStockItem,
)

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/stats", response_model=DashboardStats)
def dashboard_stats(
    low_stock_threshold: int = Query(
        default=settings.min_stock_threshold, ge=0, description="Stock minimo para alertas"
    ),
    days: int = Query(default=14, ge=1, le=90, description="Dias del grafico de movimientos"),
    db: Session = Depends(get_db),
    _: str = Depends(get_current_user),
):
    product_totals = db.execute(
        select(
            func.count(Product.id),
            func.count().filter(Product.current_stock > 0),
            func.count().filter(Product.current_stock == 0),
            func.coalesce(func.sum(Product.current_stock), 0),
        )
    ).one()

    movement_totals = db.execute(
        select(
            func.count(Movement.id),
            func.count().filter(Movement.movement_type == "ENTRADA"),
            func.count().filter(Movement.movement_type == "SALIDA"),
            func.coalesce(
                func.sum(Movement.quantity).filter(Movement.movement_type == "ENTRADA"), 0
            ),
            func.coalesce(
                func.sum(Movement.quantity).filter(Movement.movement_type == "SALIDA"), 0
            ),
        ).where(Movement.active.is_(True))
    ).one()

    low_stock = db.scalars(
        select(Product)
        .where(Product.current_stock < low_stock_threshold)
        .order_by(Product.current_stock.asc())
        .limit(20)
    ).all()

    top_products = db.scalars(
        select(Product).order_by(Product.current_stock.desc()).limit(5)
    ).all()

    start = date.today() - timedelta(days=days - 1)
    rows = db.execute(
        select(
            Movement.movement_date,
            Movement.movement_type,
            func.sum(Movement.quantity),
        )
        .where(Movement.movement_date >= start, Movement.active.is_(True))
        .group_by(Movement.movement_date, Movement.movement_type)
    ).all()

    agg: dict[date, dict] = {}
    for mov_date, mov_type, qty in rows:
        entry = agg.setdefault(mov_date, {"entradas": 0, "salidas": 0})
        key = "entradas" if mov_type == "ENTRADA" else "salidas"
        entry[key] += qty

    movements_last_days = []
    for i in range(days):
        day = start + timedelta(days=i)
        entry = agg.get(day, {"entradas": 0, "salidas": 0})
        movements_last_days.append(DayMovements(date=day, **entry))

    return DashboardStats(
        totals=DashboardTotals(
            products=product_totals[0],
            products_in_stock=product_totals[1],
            products_out_of_stock=product_totals[2],
            current_stock_total=product_totals[3],
            movements=movement_totals[0],
            entradas_count=movement_totals[1],
            salidas_count=movement_totals[2],
            entradas_qty=movement_totals[3],
            salidas_qty=movement_totals[4],
        ),
        low_stock_threshold=low_stock_threshold,
        low_stock=[
            LowStockItem(
                id=p.id, code=p.code, name=p.name, current_stock=p.current_stock
            )
            for p in low_stock
        ],
        top_products=[
            LowStockItem(
                id=p.id, code=p.code, name=p.name, current_stock=p.current_stock
            )
            for p in top_products
        ],
        movements_last_days=movements_last_days,
    )