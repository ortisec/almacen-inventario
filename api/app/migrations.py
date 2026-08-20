from sqlalchemy import text

from app.database import SessionLocal, engine


def run_migrations():
    """Migraciones ligeras para tablas ya existentes y normalizacion de datos."""
    with engine.begin() as conn:
        conn.execute(
            text(
                "ALTER TABLE movements "
                "ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT TRUE"
            )
        )
        conn.execute(
            text(
                "ALTER TABLE movements "
                "ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITHOUT TIME ZONE"
            )
        )

    with SessionLocal() as db:
        db.execute(text("UPDATE products SET name = UPPER(name)"))
        db.execute(text("UPDATE movements SET note = UPPER(note) WHERE note IS NOT NULL"))
        db.execute(text("UPDATE movement_history SET reason = UPPER(reason)"))
        db.execute(text("UPDATE movement_history SET details = UPPER(details)"))
        db.commit()