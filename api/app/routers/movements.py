from datetime import date
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.database import get_db
from app.exporters import movements_excel, movements_pdf
from app.models import Movement
from app.schemas import MovementOut, MovementTotals, PaginatedMovements

router = APIRouter(prefix="/movements", tags=["movements"])

XLSX_MEDIA = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"


def _apply_movement_filters(stmt, product_id, movement_type, date_from, date_to):
    if product_id is not None:
        stmt = stmt.where(Movement.product_id == product_id)
    if movement_type is not None:
        stmt = stmt.where(Movement.movement_type == movement_type)
    if date_from is not None:
        stmt = stmt.where(Movement.movement_date >= date_from)
    if date_to is not None:
        stmt = stmt.where(Movement.movement_date <= date_to)
    return stmt


def _get_totals(db: Session, product_id, movement_type, date_from, date_to) -> MovementTotals:
    stmt = select(
        func.coalesce(
            func.sum(Movement.quantity).filter(Movement.movement_type == "ENTRADA"), 0
        ),
        func.coalesce(
            func.sum(Movement.quantity).filter(Movement.movement_type == "SALIDA"), 0
        ),
    )
    stmt = _apply_movement_filters(stmt, product_id, movement_type, date_from, date_to)
    entradas, salidas = db.execute(stmt).one()
    return MovementTotals(entradas=entradas or 0, salidas=salidas or 0)


@router.get("", response_model=PaginatedMovements)
def list_movements(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    product_id: int | None = Query(default=None, description="Filtrar por producto"),
    movement_type: Literal["ENTRADA", "SALIDA"] | None = Query(default=None),
    date_from: date | None = Query(default=None, description="Desde (YYYY-MM-DD)"),
    date_to: date | None = Query(default=None, description="Hasta (YYYY-MM-DD)"),
    db: Session = Depends(get_db),
    _: str = Depends(get_current_user),
):
    stmt = _apply_movement_filters(
        select(Movement).order_by(Movement.movement_date, Movement.id),
        product_id,
        movement_type,
        date_from,
        date_to,
    )
    total = db.scalar(select(func.count()).select_from(stmt.subquery())) or 0
    items = db.scalars(stmt.offset((page - 1) * page_size).limit(page_size)).all()
    return PaginatedMovements(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=(total + page_size - 1) // page_size,
        summary=_get_totals(db, product_id, movement_type, date_from, date_to),
    )


@router.get("/export")
def export_movements(
    format: Literal["excel", "pdf"] = Query(default="excel"),
    product_id: int | None = Query(default=None),
    movement_type: Literal["ENTRADA", "SALIDA"] | None = Query(default=None),
    date_from: date | None = Query(default=None),
    date_to: date | None = Query(default=None),
    db: Session = Depends(get_db),
    _: str = Depends(get_current_user),
):
    stmt = _apply_movement_filters(
        select(Movement).order_by(Movement.movement_date, Movement.id),
        product_id,
        movement_type,
        date_from,
        date_to,
    )
    items = db.scalars(stmt).all()
    filename = f"movimientos-{date.today().isoformat()}"

    if format == "excel":
        return StreamingResponse(
            movements_excel(items),
            media_type=XLSX_MEDIA,
            headers={"Content-Disposition": f'attachment; filename="{filename}.xlsx"'},
        )
    return StreamingResponse(
        movements_pdf(items),
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}.pdf"'},
    )


@router.get("/{movement_id}", response_model=MovementOut)
def get_movement(
    movement_id: int,
    db: Session = Depends(get_db),
    _: str = Depends(get_current_user),
):
    movement = db.get(Movement, movement_id)
    if movement is None:
        raise HTTPException(status_code=404, detail="Movimiento no encontrado")
    return movement