import { useEffect, useMemo, useState } from 'react'
import { api } from '../api'
import Spinner from '../components/Spinner'
import Pagination from '../components/Pagination'
import Modal from '../components/Modal'
import Field from '../components/Field'
import MovementEditForm from '../components/MovementEditForm'
import MovementHistoryModal from '../components/MovementHistoryModal'
import { formatDate } from '../utils'

const selectClass =
  'rounded-lg border border-primary-200 bg-white px-3 py-2 text-sm text-primary-900 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100'

function TypeBadge({ type, active }) {
  const isIn = type === 'ENTRADA'
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
          isIn ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300' : 'bg-red-50 text-red-600 dark:bg-red-500/15 dark:text-red-400'
        }`}
      >
        {isIn ? 'Entrada' : 'Salida'}
      </span>
      {!active && (
        <span className="inline-flex items-center rounded-full bg-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-700 dark:text-slate-300">
          Anulado
        </span>
      )}
    </span>
  )
}

const iconBtn =
  'rounded-lg p-2 text-primary-600 transition hover:bg-primary-100 dark:text-primary-400 dark:hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40'

function UndoForm({ movement, onConfirm, onCancel, busy }) {
  const [reason, setReason] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')
    if (!reason.trim()) {
      setError('Indica el motivo de la anulación.')
      return
    }
    onConfirm(reason.trim())
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-sm text-primary-800 dark:text-slate-300">
        Vas a <strong>anular</strong> este movimiento: {movement.movement_type} de{' '}
        {movement.quantity} unidades. El stock se recalculará y quedará registro del motivo.
      </p>
      <Field label="Motivo de la anulación *">
        <input
          className="w-full rounded-lg border border-primary-200 bg-white px-3 py-2 text-sm text-primary-900 placeholder:text-primary-300 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-200 uppercase dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-600"
          value={reason}
          onChange={(e) => setReason(e.target.value.toUpperCase())}
          placeholder="EJ. MOVIMIENTO REGISTRADO POR ERROR"
          maxLength={500}
          autoFocus
          required
        />
      </Field>
      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-500/15 dark:text-red-400">{error}</p>
      )}
      <div className="flex justify-end gap-2 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-primary-200 px-4 py-2 text-sm font-medium text-primary-700 transition hover:bg-primary-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={busy}
          className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-red-700 disabled:opacity-60"
        >
          {busy ? 'Anulando…' : 'Anular movimiento'}
        </button>
      </div>
    </form>
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
  const [historyFor, setHistoryFor] = useState(null)
  const [editing, setEditing] = useState(null)
  const [undoing, setUndoing] = useState(null)
  const [busy, setBusy] = useState(false)

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

  const handleUpdate = async (formData) => {
    await api.updateMovement(editing.id, formData)
    setEditing(null)
    await load()
  }

  const handleUndo = async (reason) => {
    setBusy(true)
    try {
      await api.undoMovement(undoing.id, reason)
      setUndoing(null)
      await load()
    } finally {
      setBusy(false)
    }
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
                  <th className="px-4 py-3 text-right font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-primary-50 dark:divide-slate-800">
                {data.items.map((m) => (
                  <tr
                    key={m.id}
                    className={`transition hover:bg-primary-50/50 dark:hover:bg-slate-800/50 ${m.active ? '' : 'opacity-60'}`}
                  >
                    <td className="px-4 py-3 text-primary-900 dark:text-slate-100">{formatDate(m.movement_date)}</td>
                    <td className="px-4 py-3 text-primary-800 uppercase dark:text-slate-200">{productName(m.product_id)}</td>
                    <td className="px-4 py-3">
                      <TypeBadge type={m.movement_type} active={m.active} />
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
                    <td className="px-4 py-3 text-primary-500 uppercase dark:text-slate-400">{m.note || '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setHistoryFor(m)}
                          className={iconBtn}
                          title="Ver historial"
                          aria-label="Ver historial"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="h-4 w-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => setEditing(m)}
                          disabled={!m.active}
                          className={iconBtn}
                          title="Modificar"
                          aria-label="Modificar"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="h-4 w-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                          </svg>
                        </button>
                        <button
                          onClick={() => setUndoing(m)}
                          disabled={!m.active}
                          className={`${iconBtn} !text-red-500 dark:!text-red-400`}
                          title="Deshacer (anular)"
                          aria-label="Deshacer movimiento"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="h-4 w-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3" />
                          </svg>
                        </button>
                      </div>
                    </td>
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

      {historyFor && (
        <MovementHistoryModal movement={historyFor} onClose={() => setHistoryFor(null)} />
      )}

      {editing && (
        <Modal title="Modificar movimiento" onClose={() => setEditing(null)}>
          <MovementEditForm
            movement={editing}
            onSubmit={handleUpdate}
            onCancel={() => setEditing(null)}
          />
        </Modal>
      )}

      {undoing && (
        <Modal title="Deshacer movimiento" onClose={() => setUndoing(null)}>
          <UndoForm
            movement={undoing}
            onConfirm={handleUndo}
            onCancel={() => setUndoing(null)}
            busy={busy}
          />
        </Modal>
      )}
    </div>
  )
}

export default Movements