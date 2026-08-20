# Sistema de Almacén e Inventario

Sistema web para el control del **almacén** de la
**Municipalidad Distrital de Pueblo Nuevo - Chincha**: registra productos,
movimientos de entrada y salida, consulta el stock en tiempo real, exporta
reportes y mantiene un historial de auditoría de cada movimiento.

---

## Funcionalidades

- **Dashboard** con indicadores: stock total, productos agotados, movimientos
  recientes, alertas de stock mínimo y gráficos.
- **Productos**: crear, editar, eliminar y listar con stock actual.
- **Movimientos (hoja de ruta)**: registrar entradas y salidas, con la nota
  del proveedor o destino.
- **Auditoría**: cada movimiento se puede **modificar** o **anular** indicando
  el motivo; queda un historial (CREACIÓN / MODIFICACIÓN / ANULACIÓN) y el
  stock se recalcula automáticamente.
- **Exportación**: reportes en **Excel** y **PDF** con el membrete de la
  entidad, lista para presentar.
- **Modo oscuro**, nombre de la entidad configurable y acceso desde otros
  equipos de la red.

---

## Tecnologías

| Capa      | Tecnología                                |
|-----------|-------------------------------------------|
| Frontend  | React + Vite + Tailwind CSS               |
| Backend   | Python + FastAPI (uv)                     |
| Base datos| PostgreSQL 16                             |
| Admin BD  | pgAdmin 4                                 |
| Despliegue| Docker Compose                            |

---

## Requisitos

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) instalado y en ejecución.
- Windows 10/11 (o cualquier sistema con Docker).

---

## Instalación (3 pasos)

Desde la raíz del proyecto (donde está `docker-compose.yml`):

```bash
# 1. Configurar credenciales (solo la primera vez)
copy .env.example .env
```

Ajusta al menos la clave secreta de los tokens:

```
AUTH_SECRET_KEY=cambia-esta-clave-secreta
```

```bash
# 2. Construir y levantar los 4 servicios
docker compose up -d --build
```

```bash
# 3. Abrir el sistema
```

Visita <http://localhost:5173> en el navegador.

---

## Acceso

| Servicio  | URL                    | Credenciales                          |
|-----------|------------------------|---------------------------------------|
| Sistema   | http://localhost:5173  | usuario `mdpn` · contraseña `A2026i29`|
| API Docs  | http://localhost:8001/docs | —                                   |
| pgAdmin   | http://localhost:5050  | `almacen@utimdpn.com` · `A2026i29`    |
| PostgreSQL| localhost:5433         | `almacen` · `almacen123`              |

Las credenciales se cambian en el archivo `.env`.

---

## Cómo usar el sistema

1. **Iniciar sesión** con el usuario y contraseña.
2. **Registrar productos**: menú *Productos* → botón *Nuevo producto*.
   El nombre se guarda en mayúsculas.
3. **Registrar movimientos**: en *Productos*, en el detalle de un producto o
   desde *Movimientos* → *Nuevo movimiento*. Elige **Entrada** o **Salida**,
   la cantidad y una nota. Las salidas no pueden superar el stock disponible.
4. **Consultar stock**: el *Dashboard* muestra el resumen y alertas; *Productos*
   muestra el stock de cada uno.
5. **Auditar movimientos**: en *Movimientos*, cada registro tiene botones para
   **ver historial**, **modificar** y **anular**. Al modificar o anular se pide
   el **motivo**; el stock se recalcula solo.
6. **Exportar reportes**: botones de **Excel** y **PDF** en las pantallas de
   Productos y Movimientos.

---

## Compartir en red (LAN)

Los demás equipos de la red acceden con la IP del servidor (obtener con
`ipconfig`):

```
http://IP_DEL_SERVIDOR:5173
```

Los puertos 5173, 8001 y 5050 deben estar abiertos en el firewall (una vez):

```powershell
netsh advfirewall firewall add rule name="Almacen Web (5173)" dir=in action=allow protocol=TCP localport=5173
netsh advfirewall firewall add rule name="Almacen API (8001)" dir=in action=allow protocol=TCP localport=8001
netsh advfirewall firewall add rule name="Almacen pgAdmin (5050)" dir=in action=allow protocol=TCP localport=5050
```

---

## Administrar la base de datos (pgAdmin)

1. Entra a <http://localhost:5050> y accede con el correo y contraseña de pgAdmin.
2. Clic derecho en *Servers* → *Register* → *Server* y configura:

   | Campo    | Valor        |
   |----------|--------------|
   | Name     | `almacen`    |
   | Host     | `db`         |
   | Port     | `5432`       |
   | Username | `almacen`    |
   | Password | `almacen123` |

> El host es `db` (el nombre del servicio dentro de la red de Docker).

---

## Comandos útiles

| Comando                        | Qué hace                                     |
|--------------------------------|----------------------------------------------|
| `docker compose up -d --build` | Construir y levantar todo                    |
| `docker compose down`          | Detener (los datos se conservan)             |
| `docker compose down -v`       | Detener y **borrar** los datos               |
| `docker compose logs -f api`   | Ver los registros de la API                  |
| `docker compose logs -f frontend` | Ver los registros del frontend            |

Para **reiniciar la base vacía** (empezar de cero en producción):

```bash
docker exec almacen_inventario_db psql -U almacen -d almacen \
  -c "TRUNCATE products, movements, movement_history RESTART IDENTITY CASCADE;"
```

---

## Estructura del proyecto

```
almacen-inventario/
├── docker-compose.yml   # Orquesta db, api, frontend y pgadmin
├── .env.example         # Plantilla de configuración
├── api/                 # Backend FastAPI
│   ├── app/
│   │   ├── routers/     # Endpoints (products, movements, dashboard, auth)
│   │   ├── models.py    # Tablas de la base de datos
│   │   ├── schemas.py   # Modelos de entrada/salida
│   │   ├── exporters.py # Generación de Excel y PDF
│   │   └── main.py      # Aplicación FastAPI
│   └── README.md        # Documentación técnica de la API
└── frontend/            # Frontend React
    ├── src/
    │   ├── pages/       # Pantallas (Dashboard, Products, Movements, Login)
    │   ├── components/  # Componentes reutilizables
    │   ├── api.js       # Cliente HTTP hacia la API
    │   └── theme.jsx    # Modo oscuro
    └── README.md
```

---

## Solución de problemas

- **Algo no inicia**: revisa los logs con `docker compose logs -f <servicio>`.
- **Puerto ocupado**: cambia los puertos en el `.env` (p. ej. `FRONTEND_PORT=5174`).
- **La página da 404 al recargar**: ya está corregido (el frontend sirve
  `index.html` para todas las rutas).
- **No puedo entrar**: confirma que las credenciales del `.env` coinciden.