from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, engine
from app.migrations import run_migrations
from app.routers import auth, dashboard, movements, products


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    run_migrations()
    yield


app = FastAPI(
    title="Almacen - Inventario API",
    description="API para gestionar productos, movimientos de entrada/salida y stock",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(products.router)
app.include_router(movements.router)
app.include_router(dashboard.router)


@app.get("/health", tags=["health"])
def health():
    return {"status": "ok"}