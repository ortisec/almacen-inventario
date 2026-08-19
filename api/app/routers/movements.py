from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Movement
from app.schemas import MovementOut

router = APIRouter(prefix="/movements", tags=["movements"])


@router.get("", response_model=list[MovementOut])
def list_movements(
    product_id: int | None = Query(default=None, description="Filtrar por producto"),
    movement_type: Literal["ENTRADA", "SALIDA"] | None = Query(default=None),
    db: Session = Depends(get_db),
):
    stmt = select(Movement).order_by(Movement.movement_date, Movement.id)
    if product_id is not None:
        stmt = stmt.where(Movement.product_id == product_id)
    if movement_type is not None:
        stmt = stmt.where(Movement.movement_type == movement_type)
    return db.scalars(stmt).all()


@router.get("/{movement_id}", response_model=MovementOut)
def get_movement(movement_id: int, db: Session = Depends(get_db)):
    movement = db.get(Movement, movement_id)
    if movement is None:
        raise HTTPException(status_code=404, detail="Movimiento no encontrado")
    return movement