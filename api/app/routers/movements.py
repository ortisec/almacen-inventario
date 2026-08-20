from datetime import date
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.database import get_db
from app.exporters import movements_excel, movements_pdf
from app.models import Movement, MovementHistory, Product
from app.schemas import (
    MovementHistoryIn,
    MovementHistoryOut,
    MovementOut,
    MovementTotals,
    MovementUpdate,
    PaginatedMovements,
)

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
    ).where(Movement.active.is_(True))
    stmt = _apply_movement_filters(stmt, product_id, movement_type, date_from, date_to)
    entradas, salidas = db.execute(stmt).one()
    return MovementTotals(entradas=entradas or 0, salidas=salidas or 0)


def get_movement_or_404(db: Session, movement_id: int) -> Movement:
    movement = db.get(Movement, movement_id)
    if movement is None:
        raise HTTPException(status_code=404, detail="Movimiento no encontrado")
    return movement


def _recalc_product_stock(db: Session, product_id: int):
    """Recomputed el stock del producto desde los movimientos activos (auditoria)."""
    db.flush()
    movements = db.scalars(
        select(Movement)
        .where(Movement.product_id == product_id, Movement.active.is_(True))
        .order_by(Movement.movement_date, Movement.created_at, Movement.id)
    ).all()

    running = 0
    for m in movements:
        running += m.quantity if m.movement_type == "ENTRADA" else -m.quantity
        if running < 0:
            raise HTTPException(
                status_code=400,
                detail=(
                    "No se puede guardar: el stock quedaria negativo en el movimiento "
                    f"del {m.movement_date.isoformat()} ({m.movement_type} {m.quantity})."
                ),
            )
        m.stock_after = running

    product = db.get(Product, product_id)
    product.current_stock = running
    db.flush()


def _add_history(db: Session, movement: Movement, action: str, reason: str, details: str):
    db.add(
        MovementHistory(
            movement_id=movement.id,
            action=action,
            reason=reason.strip().upper() or action,
            details=details,
        )
    )


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
    return get_movement_or_404(db, movement_id)


@router.get("/{movement_id}/history", response_model=list[MovementHistoryOut])
def get_movement_history(
    movement_id: int,
    db: Session = Depends(get_db),
    _: str = Depends(get_current_user),
):
    movement = get_movement_or_404(db, movement_id)
    return movement.history


@router.patch("/{movement_id}", response_model=MovementOut)
def update_movement(
    movement_id: int,
    payload: MovementUpdate,
    db: Session = Depends(get_db),
    _: str = Depends(get_current_user),
):
    movement = get_movement_or_404(db, movement_id)
    if not movement.active:
        raise HTTPException(status_code=400, detail="No se puede modificar un movimiento anulado")

    changes = []
    if payload.movement_type != movement.movement_type:
        changes.append(f"Tipo: {movement.movement_type} -> {payload.movement_type}")
    if payload.quantity != movement.quantity:
        changes.append(f"Cantidad: {movement.quantity} -> {payload.quantity}")
    if payload.movement_date != movement.movement_date:
        changes.append(f"Fecha: {movement.movement_date} -> {payload.movement_date}")
    new_note = (payload.note or "").strip().upper() or None
    if new_note != movement.note:
        changes.append(f"Nota: {movement.note or '-'} -> {new_note or '-'}")

    movement.movement_type = payload.movement_type
    movement.quantity = payload.quantity
    movement.movement_date = payload.movement_date
    movement.note = new_note
    _add_history(
        db,
        movement,
        "MODIFICACION",
        payload.reason,
        "; ".join(changes) or "Sin cambios",
    )

    try:
        _recalc_product_stock(db, movement.product_id)
        db.commit()
    except HTTPException:
        db.rollback()
        raise
    db.refresh(movement)
    return movement


@router.post("/{movement_id}/undo", response_model=MovementOut)
def undo_movement(
    movement_id: int,
    payload: MovementHistoryIn,
    db: Session = Depends(get_db),
    _: str = Depends(get_current_user),
):
    movement = get_movement_or_404(db, movement_id)
    if not movement.active:
        raise HTTPException(status_code=400, detail="Este movimiento ya fue anulado")

    movement.active = False
    _add_history(
        db,
        movement,
        "ANULACION",
        payload.reason,
        (
            f"Tipo: {movement.movement_type}, Cantidad: {movement.quantity}, "
            f"Fecha: {movement.movement_date}, Nota: {movement.note or '-'}"
        ),
    )

    try:
        _recalc_product_stock(db, movement.product_id)
        db.commit()
    except HTTPException:
        db.rollback()
        raise
    db.refresh(movement)
    return movement