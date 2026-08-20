from datetime import date, datetime

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    Date,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Product(Base):
    __tablename__ = "products"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    code: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(200))
    current_stock: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    movements: Mapped[list["Movement"]] = relationship(
        back_populates="product",
        cascade="all, delete-orphan",
        order_by="Movement.movement_date, Movement.id",
    )


class Movement(Base):
    __tablename__ = "movements"
    __table_args__ = (
        CheckConstraint("quantity > 0", name="ck_movement_quantity_positive"),
        CheckConstraint("stock_after >= 0", name="ck_movement_stock_positive"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    product_id: Mapped[int] = mapped_column(
        ForeignKey("products.id", ondelete="CASCADE"), index=True
    )
    movement_type: Mapped[str] = mapped_column(String(10))  # "ENTRADA" | "SALIDA"
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    movement_date: Mapped[date] = mapped_column(Date, default=date.today, index=True)
    stock_after: Mapped[int] = mapped_column(Integer, nullable=False)
    note: Mapped[str | None] = mapped_column(Text, nullable=True)
    active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime | None] = mapped_column(
        DateTime, onupdate=datetime.utcnow, nullable=True
    )

    product: Mapped[Product] = relationship(back_populates="movements")
    history: Mapped[list["MovementHistory"]] = relationship(
        back_populates="movement",
        cascade="all, delete-orphan",
        order_by="MovementHistory.created_at, MovementHistory.id",
    )


class MovementHistory(Base):
    __tablename__ = "movement_history"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    movement_id: Mapped[int] = mapped_column(
        ForeignKey("movements.id", ondelete="CASCADE"), index=True
    )
    action: Mapped[str] = mapped_column(String(20))  # CREACION | MODIFICACION | ANULACION
    reason: Mapped[str] = mapped_column(String(500))
    details: Mapped[str] = mapped_column(Text, default="")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    movement: Mapped[Movement] = relationship(back_populates="history")