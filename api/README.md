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

### Credenciales de acceso

El usuario y la contraseña se configuran en el `.env` (raiz o `api/.env`):

```
AUTH_USER=mdpn
AUTH_PASSWORD=A2026i29
AUTH_SECRET_KEY=cambia-esta-clave-secreta
```

Todos los endpoints de productos y movimientos requieren un token.
El único endpoint publico es `POST /auth/login`.

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

### Dashboard

| Metodo | Ruta                    | Descripcion                                 |
|--------|-------------------------|---------------------------------------------|
| GET    | `/dashboard/stats`      | KPIs, alertas de stock minimo y datos de graficas |

`GET /dashboard/stats` acepta:
| Parametro             | Default | Descripcion                          |
|-----------------------|---------|--------------------------------------|
| `low_stock_threshold` | 12      | Stock minimo para las alertas        |
| `days`                | 14      | Dias que cubre la serie de movimientos |

Devuelve:
```json
{
  "totals": {
    "products": 10, "products_in_stock": 7, "products_out_of_stock": 3,
    "current_stock_total": 540, "movements": 25,
    "entradas_count": 18, "salidas_count": 7,
    "entradas_qty": 600, "salidas_qty": 120
  },
  "low_stock_threshold": 12,
  "low_stock": [ { "id": 1, "code": "A-02", "name": "Clavos", "current_stock": 5 } ],
  "movements_last_days": [ { "date": "2026-08-20", "entradas": 5, "salidas": 2 } ],
  "top_products": [ { "id": 1, "code": "A-01", "name": "Tornillos", "current_stock": 300 } ]
}
```

## Autenticación

### Obtener token
```http
POST /auth/login
Content-Type: application/x-www-form-urlencoded

username=mdpn&password=A2026i29
```
```json
{ "access_token": "eyJhbGciOiJIUzI1NiIs...", "token_type": "bearer" }
```

Todos los demás endpoints exigen el header:

```
Authorization: Bearer <access_token>
```

- El token vence a las 8 horas.
- Si el token falta o es inválido, responde `401`.
- Credenciales incorrectas → `401` con `{"detail": "Usuario o contraseña incorrectos"}`.

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
| GET    | `/products`                | Listar productos (paginado, con su stock)      |
| GET    | `/products/export`         | Exportar productos (Excel o PDF)               |
| GET    | `/products/{id}`           | Detalle del producto **+ su hoja de ruta**     |
| PATCH  | `/products/{id}`           | Actualizar codigo / nombre                     |
| DELETE | `/products/{id}`           | Eliminar producto (borra sus movimientos)      |
| POST   | `/products/{id}/movements` | Registrar ENTRADA o SALIDA                     |

### Movimientos

| Metodo | Ruta                | Descripcion                              |
|--------|---------------------|------------------------------------------|
| GET    | `/movements`        | Todos los movimientos (paginado)         |
| GET    | `/movements/export` | Exportar movimientos (Excel o PDF)       |
| GET    | `/movements/{id}`   | Un movimiento en particular              |

## Paginación y filtros

### `GET /products`
| Parametro     | Default | Descripcion                              |
|---------------|---------|------------------------------------------|
| `page`        | 1       | Número de página                         |
| `page_size`   | 20      | Filas por página (1 a 100)               |
| `search`      | ""      | Busca por codigo o nombre (texto parcial)|
| `stock_status`| "all"   | `all`, `with` (con stock) o `none`       |

Respuesta:
```json
{
  "items": [ ... ],
  "total": 5,
  "page": 1,
  "page_size": 20,
  "total_pages": 1
}
```

### `GET /movements`
| Parametro       | Default | Descripcion                              |
|-----------------|---------|------------------------------------------|
| `page`          | 1       | Número de página                         |
| `page_size`     | 20      | Filas por página (1 a 100)               |
| `product_id`    | null    | Filtra por producto                      |
| `movement_type` | null    | `ENTRADA` o `SALIDA`                     |
| `date_from`     | null    | Desde (YYYY-MM-DD)                       |
| `date_to`       | null    | Hasta (YYYY-MM-DD)                       |

Respuesta: igual que productos pero con `summary`:
```json
{
  "items": [ ... ],
  "total": 5,
  "page": 1,
  "page_size": 20,
  "total_pages": 1,
  "summary": { "entradas": 120, "salidas": 30 }
}
```

## Exportación

| Ruta                  | Parametros                        | Archivo           |
|-----------------------|-----------------------------------|-------------------|
| `GET /products/export`| `format=excel\|pdf` + filtros de lista | `productos-<fecha>.xlsx\|pdf` |
| `GET /movements/export`| `format=excel\|pdf` + filtros de lista | `movimientos-<fecha>.xlsx\|pdf` |

- Respeta los mismos filtros que la lista (no la paginación: exporta todo).
- Requiere el header `Authorization: Bearer <token>`.
- Los PDF y Excel incluyen el nombre de la entidad (configurable con `ENTITY_NAME` en el `.env`) y la fecha/hora de generación.

## Configuración extra

| Variable               | Default | Descripcion                                  |
|------------------------|---------|----------------------------------------------|
| `MIN_STOCK_THRESHOLD`  | 12      | Stock minimo para las alertas del dashboard |
| `ENTITY_NAME`          | Municipalidad Distrital de Pueblo Nuevo - Chincha | Nombre que aparece en reportes |

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

0. **Login** -> mostrar formulario de usuario/contraseña -> `POST /auth/login`.
   - Guardar el `access_token` (ej. en localStorage) y enviarlo en cada petición como `Authorization: Bearer <token>`.
   - Si la API responde `401`, cerrar sesión y volver al login.
1. **Lista de productos** -> `GET /products?page=1&page_size=10&search=...&stock_status=all`.
   - Renderiza `items` y usa `total`/`total_pages` para la paginacion.
2. **Exportar** -> `GET /products/export?format=excel|pdf` (o `/movements/export`).
   - Desde el navegador, haz fetch con el token, baja el archivo como `blob` y crea un enlace de descarga.
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