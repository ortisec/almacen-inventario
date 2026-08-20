import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'
import Modal from '../components/Modal'
import ProductForm from '../components/ProductForm'
import ConfirmDialog from '../components/ConfirmDialog'
import Spinner from '../components/Spinner'
import Pagination from '../components/Pagination'
import { formatDate } from '../utils'

const selectClass =
  'rounded-lg border border-primary-200 bg-white px-3 py-2 text-sm text-primary-900 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100'

function StockBadge({ stock }) {
  if (stock > 0) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        {stock}
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-600 dark:bg-red-500/15 dark:text-red-400">
      <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
      Sin stock
    </span>
  )
}

function ExportButtons({ params }) {
  const [busy, setBusy] = useState('')

  const handleExport = async (format) => {
    setBusy(format)
    try {
      await api.exportProducts(params, format)
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

function Products() {
  const [data, setData] = useState({ items: [], total: 0, page: 1, page_size: 10, total_pages: 1 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [stockFilter, setStockFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [showCreate, setShowCreate] = useState(false)
  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.listProducts({
        page,
        page_size: pageSize,
        search,
        stock_status: stockFilter,
      })
      setData(res)
      setError('')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, search, stockFilter])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    const t = setTimeout(() => setPage(1), 350)
    return () => clearTimeout(t)
  }, [search, stockFilter])

  const handleCreate = async (formData) => {
    await api.createProduct(formData)
    setShowCreate(false)
    await load()
  }

  const handleEdit = async (formData) => {
    await api.updateProduct(editing.id, formData)
    setEditing(null)
    await load()
  }

  const handleDelete = async () => {
    setBusy(true)
    try {
      await api.deleteProduct(deleting.id)
      setDeleting(null)
      await load()
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary-900 dark:text-slate-100">Productos</h1>
          <p className="text-sm text-primary-500 dark:text-slate-400">Gestiona tu catálogo y su stock.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ExportButtons params={{ search, stock_status: stockFilter }} />
          <button
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-700"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="h-4 w-4"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Nuevo producto
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          className="flex-1 rounded-lg border border-primary-200 bg-white px-3 py-2 text-sm text-primary-900 placeholder:text-primary-300 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-600"
          placeholder="Buscar por código o nombre…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className={`${selectClass} sm:w-48`}
          value={stockFilter}
          onChange={(e) => setStockFilter(e.target.value)}
        >
          <option value="all">Todos los stocks</option>
          <option value="with">Con stock</option>
          <option value="none">Sin stock</option>
        </select>
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-500/15 dark:text-red-400">{error}</p>
      )}

      {loading ? (
        <Spinner />
      ) : data.items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-primary-200 bg-white p-10 text-center dark:border-slate-700 dark:bg-slate-900">
          <p className="text-primary-500 dark:text-slate-400">
            {data.total === 0
              ? 'No hay productos todavía. Crea el primero.'
              : 'No se encontraron productos con esos filtros.'}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-primary-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="bg-primary-50 text-xs uppercase tracking-wide text-primary-500 dark:bg-slate-800 dark:text-slate-400">
                <tr>
                  <th className="px-4 py-3 font-semibold">Código</th>
                  <th className="px-4 py-3 font-semibold">Nombre</th>
                  <th className="px-4 py-3 font-semibold">Stock</th>
                  <th className="px-4 py-3 font-semibold">Creado</th>
                  <th className="px-4 py-3 text-right font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-primary-50 dark:divide-slate-800">
                {data.items.map((p) => (
                  <tr key={p.id} className="transition hover:bg-primary-50/50 dark:hover:bg-slate-800/50">
                    <td className="px-4 py-3 font-medium text-primary-700 dark:text-slate-300">{p.code}</td>
                    <td className="px-4 py-3 text-primary-900 uppercase dark:text-slate-100">{p.name}</td>
                    <td className="px-4 py-3">
                      <StockBadge stock={p.current_stock} />
                    </td>
                    <td className="px-4 py-3 text-primary-500 dark:text-slate-400">{formatDate(p.created_at)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          to={`/products/${p.id}`}
                          className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-primary-600 transition hover:bg-primary-100 dark:text-primary-400 dark:hover:bg-slate-800"
                        >
                          Ver
                        </Link>
                        <button
                          onClick={() => setEditing(p)}
                          className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-primary-600 transition hover:bg-primary-100 dark:text-primary-400 dark:hover:bg-slate-800"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => setDeleting(p)}
                          className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-red-500 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
                        >
                          Eliminar
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

      {showCreate && (
        <Modal title="Nuevo producto" onClose={() => setShowCreate(false)}>
          <ProductForm onSubmit={handleCreate} onCancel={() => setShowCreate(false)} />
        </Modal>
      )}

      {editing && (
        <Modal title="Editar producto" onClose={() => setEditing(null)}>
          <ProductForm initial={editing} onSubmit={handleEdit} onCancel={() => setEditing(null)} />
        </Modal>
      )}

      {deleting && (
        <ConfirmDialog
          title="Eliminar producto"
          message={`¿Eliminar "${deleting.code}"? Se borrará junto con toda su hoja de ruta. Esta acción no se puede deshacer.`}
          onConfirm={handleDelete}
          onCancel={() => setDeleting(null)}
          busy={busy}
        />
      )}
    </div>
  )
}

export default Products