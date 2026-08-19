# Almacen - Inventario API

API para gestionar un almacen: productos, movimientos de **ENTRADA** / **SALIDA** y **stock actual**.
Cada movimiento queda registrado como una **hoja de ruta** (historial) del producto.

## Tecnologias

- Python 3.12 + [uv](https://docs.astral.sh/uv/) (gestor de paquetes)
- FastAPI + SQLAlchemy 2 + Pydantic 2
- PostgreSQL 16 (en Docker Compose)

## Levantar todo el stack (DB + API + Frontend)

Desde la **raiz del proyecto** (donde esta `docker-compose.yml`):

```bash
# 1. Crear el .env (opcional, ya existen valores por defecto)
cp .env.example .env

# 2. Construir y levantar los 3 servicios
docker compose up -d --build
```

| Servicio  | URL                                            |
|-----------|------------------------------------------------|
| Frontend  | http://localhost:5173                          |
| API       | http://localhost:8001                          |
| Docs API  | http://localhost:8001/docs                     |
| Base datos| localhost:5433 (almacen / almacen123)          |

- `docker compose down` detiene todo (los datos se conservan en el volumen).
- `docker compose down -v` detiene y **borra** los datos.

### Servicios del compose (raiz)

- `db`: PostgreSQL 16, datos persistentes en el volumen `db_data`.
- `api`: imagen construida desde `api/Dockerfile` (uv + uvicorn).
- `frontend`: imagen construida desde `frontend/Dockerfile` (build de Vite servido por nginx).

## Desarrollar la API en local (sin Docker)

```bash
cd api
uv sync
uv run uvicorn app.main:app --reload --port 8001
```

> La API usa el puerto **5433** para PostgreSQL (por si hay un Postgres local en el 5432)
> y el **8001** para HTTP (el 8000 suele estar ocupado).

## Estructura

```
├── docker-compose.yml     # DB + API + Frontend (raiz)
├── .env                   # Credenciales y puertos (no se sube a git)
├── api/
│   ├── Dockerfile
│   ├── pyproject.toml     # Dependencias (uv)
│   ├── uv.lock
│   └── app/
│       ├── main.py        # App FastAPI, CORS, arranque
│       ├── config.py      # Lee variables de entorno (.env)
│       ├── database.py    # Conexion a PostgreSQL (SQLAlchemy)
│       ├── models.py      # Tablas: products, movements
│       ├── schemas.py     # Esquemas de entrada/salida (Pydantic)
│       └── routers/
│           ├── products.py  # Endpoints de productos
│           └── movements.py # Endpoints de movimientos
└── frontend/
    └── Dockerfile         # Vite build + nginx
```

---

## Modelo de datos

### Product (products)
| Campo           | Tipo   | Descripcion                    |
|-----------------|--------|--------------------------------|
| `id`            | int    | Identificador                  |
| `code`          | string | Codigo unico del producto      |
| `name`          | string | Nombre o descripcion           |
| `current_stock` | int    | Stock actual (se calcula solo) |
| `created_at`    | fecha  | Fecha de creacion              |

### Movement (movements) — la "hoja de ruta"
| Campo           | Tipo   | Descripcion                           |
|-----------------|--------|---------------------------------------|
| `id`            | int    | Identificador                         |
| `product_id`    | int    | Producto al que pertenece             |
| `movement_type` | string | `"ENTRADA"` o `"SALIDA"`              |
| `quantity`      | int    | Cantidad del movimiento (mayor a 0)   |
| `movement_date` | fecha  | Fecha de ingreso / salida             |
| `stock_after`   | int    | Stock que quedo tras este movimiento  |
| `note`          | string | Nota opcional (proveedor, motivo...)  |
| `created_at`    | fecha  | Momento en que se registro            |

Al registrar un movimiento la API actualiza `current_stock` del producto.
Una **SALIDA** no puede superar el stock disponible (responde error 400).

---

## Endpoints

Base: `http://localhost:8001`

### Productos

| Metodo | Ruta                       | Descripcion                                    |
|--------|----------------------------|------------------------------------------------|
| POST   | `/products`                | Crear producto                                 |
| GET    | `/products`                | Listar productos (con su stock)                |
| GET    | `/products/{id}`           | Detalle del producto **+ su hoja de ruta**     |
| PATCH  | `/products/{id}`           | Actualizar codigo / nombre                     |
| DELETE | `/products/{id}`           | Eliminar producto (borra sus movimientos)      |
| POST   | `/products/{id}/movements` | Registrar ENTRADA o SALIDA                     |

### Movimientos

| Metodo | Ruta                | Descripcion                              |
|--------|---------------------|------------------------------------------|
| GET    | `/movements`        | Todos los movimientos                    |
| GET    | `/movements?product_id=1` | Filtra por producto                |
| GET    | `/movements?movement_type=SALIDA` | Filtra por tipo              |
| GET    | `/movements/{id}`   | Un movimiento en particular              |

---

## Ejemplos de JSON

### Crear producto
```http
POST /products
{
  "code": "PROD-001",
  "name": "Caja de tornillos 3/4"
}
```

### Registrar una entrada
```http
POST /products/1/movements
{
  "movement_type": "ENTRADA",
  "quantity": 100,
  "movement_date": "2026-08-19",
  "note": "Compra a proveedor X"
}
```

### Registrar una salida
```http
POST /products/1/movements
{
  "movement_type": "SALIDA",
  "quantity": 30,
  "movement_date": "2026-08-20",
  "note": "Venta"
}
```

### Hoja de ruta de un producto
```http
GET /products/1
```
```json
{
  "id": 1,
  "code": "PROD-001",
  "name": "Caja de tornillos 3/4",
  "current_stock": 70,
  "created_at": "2026-08-19T23:14:29.516470",
  "movements": [
    {
      "id": 1,
      "product_id": 1,
      "movement_type": "ENTRADA",
      "quantity": 100,
      "movement_date": "2026-08-19",
      "stock_after": 100,
      "note": "Compra a proveedor X",
      "created_at": "2026-08-19T23:14:29.832067"
    },
    {
      "id": 2,
      "product_id": 1,
      "movement_type": "SALIDA",
      "quantity": 30,
      "movement_date": "2026-08-20",
      "stock_after": 70,
      "note": "Venta",
      "created_at": "2026-08-19T23:14:29.859116"
    }
  ]
}
```

---

## Guia rapida para el frontend

1. **Lista de productos** -> `GET /products` (tabla con codigo, nombre, stock).
2. **Nuevo producto** -> formulario -> `POST /products`.
3. **Movimiento** -> seleccionar producto, elegir ENTRADA/SALIDA, cantidad y fecha -> `POST /products/{id}/movements`.
   - Actualiza el stock automaticamente.
   - Si la salida supera el stock, la API responde `400` con un mensaje claro: mostrarlo al usuario.
4. **Historial / hoja de ruta** -> `GET /products/{id}` y renderizar `movements` como lista cronologica (fecha, tipo, cantidad, stock resultante, nota).
5. **Movimientos globales** -> `GET /movements` (filtros opcionales `product_id` y `movement_type`).

### Errores comunes
- `400` stock insuficiente en SALIDA.
- `404` producto / movimiento inexistente.
- `409` codigo de producto duplicado.

CORS esta habilitado para cualquier origen (modo desarrollo), por lo que el frontend
puede consumir la API directamente desde `http://localhost:8001`.