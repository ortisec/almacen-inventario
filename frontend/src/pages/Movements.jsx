import { useEffect, useMemo, useState } from 'react'
import { api } from '../api'
import Spinner from '../components/Spinner'
import Pagination from '../components/Pagination'
import { formatDate } from '../utils'

const selectClass =
  'rounded-lg border border-primary-200 bg-white px-3 py-2 text-sm text-primary-900 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100'

function TypeBadge({ type }) {
  const isIn = type === 'ENTRADA'
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
        isIn ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300' : 'bg-red-50 text-red-600 dark:bg-red-500/15 dark:text-red-400'
      }`}
    >
      {isIn ? 'Entrada' : 'Salida'}
    </span>
  )
}

function ExportButtons({ params }) {
  const [busy, setBusy] = useState('')

  const handleExport = async (format) => {
    setBusy(format)
    try {
      await api.exportMovements(params, format)
    } catch (err) {
      alert(`No se pudo exportar: ${err.message}`)
    } finally {
      setBusy('')
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => handleExport('excel')}
        disabled={Boolean(busy)}
        className="inline-flex items-center gap-1.5 rounded-lg border border-primary-200 bg-white px-3 py-2 text-sm font-medium text-primary-700 transition hover:bg-primary-50 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.8}
          stroke="currentColor"
          className="h-4 w-4 text-emerald-600"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3"
          />
        </svg>
        {busy === 'excel' ? '…' : 'Excel'}
      </button>
      <button
        onClick={() => handleExport('pdf')}
        disabled={Boolean(busy)}
        className="inline-flex items-center gap-1.5 rounded-lg border border-primary-200 bg-white px-3 py-2 text-sm font-medium text-primary-700 transition hover:bg-primary-50 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.8}
          stroke="currentColor"
          className="h-4 w-4 text-red-600"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"
          />
        </svg>
        {busy === 'pdf' ? '…' : 'PDF'}
      </button>
    </div>
  )
}

function Movements() {
  const [data, setData] = useState({ items: [], total: 0, page: 1, page_size: 10, total_pages: 1, summary: { entradas: 0, salidas: 0 } })
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filters, setFilters] = useState({
    product_id: '',
    movement_type: '',
    date_from: '',
    date_to: '',
  })
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  useEffect(() => {
    api.listProducts({ page_size: 100 }).then((res) => setProducts(res.items)).catch(() => {})
  }, [])

  const params = useMemo(
    () => ({
      product_id: filters.product_id,
      movement_type: filters.movement_type,
      date_from: filters.date_from,
      date_to: filters.date_to,
      page,
      page_size: pageSize,
    }),
    [filters, page, pageSize],
  )

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    api
      .listMovements(params)
      .then((res) => {
        if (!cancelled) {
          setData(res)
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
  }, [params])

  useEffect(() => {
    const t = setTimeout(() => setPage(1), 350)
    return () => clearTimeout(t)
  }, [filters.product_id, filters.movement_type, filters.date_from, filters.date_to])

  const productName = useMemo(() => {
    const map = new Map(products.map((p) => [p.id, p]))
    return (id) => {
      const p = map.get(id)
      return p ? `${p.code} — ${p.name}` : `Producto #${id}`
    }
  }, [products])

  const clearFilters = () => {
    setFilters({ product_id: '', movement_type: '', date_from: '', date_to: '' })
  }

  const hasFilters =
    filters.product_id || filters.movement_type || filters.date_from || filters.date_to

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary-900 dark:text-slate-100">Movimientos</h1>
          <p className="text-sm text-primary-500 dark:text-slate-400">
            Historial de entradas y salidas de todos los productos.
          </p>
        </div>
        <ExportButtons
          params={{
            product_id: filters.product_id,
            movement_type: filters.movement_type,
            date_from: filters.date_from,
            date_to: filters.date_to,
          }}
        />
      </div>

      <div className="rounded-2xl border border-primary-100 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-primary-500 dark:text-slate-400">Producto</span>
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
            <span className="mb-1 block text-xs font-medium text-primary-500 dark:text-slate-400">Tipo</span>
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
            <span className="mb-1 block text-xs font-medium text-primary-500 dark:text-slate-400">Desde</span>
            <input
              type="date"
              className={`${selectClass} w-full`}
              value={filters.date_from}
              onChange={(e) => setFilters({ ...filters, date_from: e.target.value })}
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-primary-500 dark:text-slate-400">Hasta</span>
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
            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
              Entradas: +{data.summary.entradas}
            </span>
            <span className="rounded-full bg-red-50 px-2.5 py-1 text-red-600 dark:bg-red-500/15 dark:text-red-400">
              Salidas: −{data.summary.salidas}
            </span>
          </div>
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="text-xs font-medium text-primary-500 underline-offset-2 transition hover:text-primary-700 hover:underline dark:text-slate-400 dark:hover:text-slate-200"
            >
              Limpiar filtros
            </button>
          )}
        </div>
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-500/15 dark:text-red-400">{error}</p>
      )}

      {loading ? (
        <Spinner />
      ) : data.items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-primary-200 bg-white p-10 text-center dark:border-slate-700 dark:bg-slate-900">
          <p className="text-primary-500 dark:text-slate-400">No hay movimientos con esos filtros.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-primary-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-primary-50 text-xs uppercase tracking-wide text-primary-500 dark:bg-slate-800 dark:text-slate-400">
                <tr>
                  <th className="px-4 py-3 font-semibold">Fecha</th>
                  <th className="px-4 py-3 font-semibold">Producto</th>
                  <th className="px-4 py-3 font-semibold">Tipo</th>
                  <th className="px-4 py-3 font-semibold">Cantidad</th>
                  <th className="px-4 py-3 font-semibold">Stock resultante</th>
                  <th className="px-4 py-3 font-semibold">Nota</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-primary-50 dark:divide-slate-800">
                {data.items.map((m) => (
                  <tr key={m.id} className="transition hover:bg-primary-50/50 dark:hover:bg-slate-800/50">
                    <td className="px-4 py-3 text-primary-900 dark:text-slate-100">{formatDate(m.movement_date)}</td>
                    <td className="px-4 py-3 text-primary-800 dark:text-slate-200">{productName(m.product_id)}</td>
                    <td className="px-4 py-3">
                      <TypeBadge type={m.movement_type} />
                    </td>
                    <td
                      className={`px-4 py-3 font-semibold ${
                        m.movement_type === 'ENTRADA' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'
                      }`}
                    >
                      {m.movement_type === 'ENTRADA' ? '+' : '−'}
                      {m.quantity}
                    </td>
                    <td className="px-4 py-3 font-medium text-primary-800 dark:text-slate-200">{m.stock_after}</td>
                    <td className="px-4 py-3 text-primary-500 dark:text-slate-400">{m.note || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination
            page={data.page}
            totalPages={data.total_pages}
            total={data.total}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={(n) => {
              setPageSize(n)
              setPage(1)
            }}
          />
        </div>
      )}
    </div>
  )
}

export default Movements