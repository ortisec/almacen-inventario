import { useEffect, useMemo, useState } from 'react'
import { api } from '../api'
import Spinner from '../components/Spinner'
import { formatDate } from '../utils'

const selectClass =
  'rounded-lg border border-primary-200 bg-white px-3 py-2 text-sm text-primary-900 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-200'

function TypeBadge({ type }) {
  const isIn = type === 'ENTRADA'
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
        isIn ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'
      }`}
    >
      {isIn ? 'Entrada' : 'Salida'}
    </span>
  )
}

function Movements() {
  const [movements, setMovements] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filters, setFilters] = useState({
    product_id: '',
    movement_type: '',
    date_from: '',
    date_to: '',
  })

  useEffect(() => {
    api.listProducts().then(setProducts).catch(() => {})
  }, [])

  useEffect(() => {
    const params = {
      product_id: filters.product_id,
      movement_type: filters.movement_type,
    }
    let cancelled = false
    setLoading(true)
    api
      .listMovements(params)
      .then((data) => {
        if (!cancelled) {
          setMovements(data)
          setError('')
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err.message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [filters.product_id, filters.movement_type])

  const productName = useMemo(() => {
    const map = new Map(products.map((p) => [p.id, p]))
    return (id) => {
      const p = map.get(id)
      return p ? `${p.code} — ${p.name}` : `Producto #${id}`
    }
  }, [products])

  const visible = useMemo(() => {
    const { date_from, date_to } = filters
    if (!date_from && !date_to) return movements
    return movements.filter((m) => {
      if (date_from && m.movement_date < date_from) return false
      if (date_to && m.movement_date > date_to) return false
      return true
    })
  }, [movements, filters.date_from, filters.date_to])

  const totals = useMemo(() => {
    return visible.reduce(
      (acc, m) => {
        if (m.movement_type === 'ENTRADA') acc.entradas += m.quantity
        else acc.salidas += m.quantity
        return acc
      },
      { entradas: 0, salidas: 0 },
    )
  }, [visible])

  const clearFilters = () => {
    setFilters({ product_id: '', movement_type: '', date_from: '', date_to: '' })
  }

  const hasFilters =
    filters.product_id || filters.movement_type || filters.date_from || filters.date_to

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-primary-900">Movimientos</h1>
        <p className="text-sm text-primary-500">
          Historial de entradas y salidas de todos los productos.
        </p>
      </div>

      <div className="rounded-2xl border border-primary-100 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-primary-500">Producto</span>
            <select
              className={`${selectClass} w-full`}
              value={filters.product_id}
              onChange={(e) => setFilters({ ...filters, product_id: e.target.value })}
            >
              <option value="">Todos</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.code} — {p.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-primary-500">Tipo</span>
            <select
              className={`${selectClass} w-full`}
              value={filters.movement_type}
              onChange={(e) => setFilters({ ...filters, movement_type: e.target.value })}
            >
              <option value="">Todos</option>
              <option value="ENTRADA">Entrada</option>
              <option value="SALIDA">Salida</option>
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-primary-500">Desde</span>
            <input
              type="date"
              className={`${selectClass} w-full`}
              value={filters.date_from}
              onChange={(e) => setFilters({ ...filters, date_from: e.target.value })}
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-primary-500">Hasta</span>
            <input
              type="date"
              className={`${selectClass} w-full`}
              value={filters.date_to}
              onChange={(e) => setFilters({ ...filters, date_to: e.target.value })}
            />
          </label>
        </div>
        <div className="mt-3 flex items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2 text-xs font-medium">
            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-700">
              Entradas: +{totals.entradas}
            </span>
            <span className="rounded-full bg-red-50 px-2.5 py-1 text-red-600">
              Salidas: −{totals.salidas}
            </span>
          </div>
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="text-xs font-medium text-primary-500 underline-offset-2 transition hover:text-primary-700 hover:underline"
            >
              Limpiar filtros
            </button>
          )}
        </div>
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
      )}

      {loading ? (
        <Spinner />
      ) : visible.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-primary-200 bg-white p-10 text-center">
          <p className="text-primary-500">No hay movimientos con esos filtros.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-primary-100 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-primary-50 text-xs uppercase tracking-wide text-primary-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">Fecha</th>
                  <th className="px-4 py-3 font-semibold">Producto</th>
                  <th className="px-4 py-3 font-semibold">Tipo</th>
                  <th className="px-4 py-3 font-semibold">Cantidad</th>
                  <th className="px-4 py-3 font-semibold">Stock resultante</th>
                  <th className="px-4 py-3 font-semibold">Nota</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-primary-50">
                {visible.map((m) => (
                  <tr key={m.id} className="transition hover:bg-primary-50/50">
                    <td className="px-4 py-3 text-primary-900">{formatDate(m.movement_date)}</td>
                    <td className="px-4 py-3 text-primary-800">{productName(m.product_id)}</td>
                    <td className="px-4 py-3">
                      <TypeBadge type={m.movement_type} />
                    </td>
                    <td
                      className={`px-4 py-3 font-semibold ${
                        m.movement_type === 'ENTRADA' ? 'text-emerald-600' : 'text-red-500'
                      }`}
                    >
                      {m.movement_type === 'ENTRADA' ? '+' : '−'}
                      {m.quantity}
                    </td>
                    <td className="px-4 py-3 font-medium text-primary-800">{m.stock_after}</td>
                    <td className="px-4 py-3 text-primary-500">{m.note || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="border-t border-primary-50 px-4 py-2.5 text-xs text-primary-400">
            {visible.length} movimiento{visible.length !== 1 ? 's' : ''}
          </div>
        </div>
      )}
    </div>
  )
}

export default Movements