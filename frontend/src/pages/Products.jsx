import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'
import Modal from '../components/Modal'
import ProductForm from '../components/ProductForm'
import ConfirmDialog from '../components/ConfirmDialog'
import Spinner from '../components/Spinner'
import { formatDate } from '../utils'

const selectClass =
  'rounded-lg border border-primary-200 bg-white px-3 py-2 text-sm text-primary-900 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-200'

function StockBadge({ stock }) {
  if (stock > 0) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        {stock}
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-600">
      <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
      Sin stock
    </span>
  )
}

function Products() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [stockFilter, setStockFilter] = useState('all')
  const [showCreate, setShowCreate] = useState(false)
  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [busy, setBusy] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      setProducts(await api.listProducts())
      setError('')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return products.filter((p) => {
      const matchesSearch =
        !q || p.code.toLowerCase().includes(q) || p.name.toLowerCase().includes(q)
      const matchesStock =
        stockFilter === 'all' ||
        (stockFilter === 'with' && p.current_stock > 0) ||
        (stockFilter === 'none' && p.current_stock === 0)
      return matchesSearch && matchesStock
    })
  }, [products, search, stockFilter])

  const handleCreate = async (data) => {
    await api.createProduct(data)
    setShowCreate(false)
    await load()
  }

  const handleEdit = async (data) => {
    await api.updateProduct(editing.id, data)
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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary-900">Productos</h1>
          <p className="text-sm text-primary-500">Gestiona tu catálogo y su stock.</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-700"
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

      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          className="flex-1 rounded-lg border border-primary-200 bg-white px-3 py-2 text-sm text-primary-900 placeholder:text-primary-300 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
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
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
      )}

      {loading ? (
        <Spinner />
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-primary-200 bg-white p-10 text-center">
          <p className="text-primary-500">
            {products.length === 0
              ? 'No hay productos todavía. Crea el primero.'
              : 'No se encontraron productos con esos filtros.'}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-primary-100 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="bg-primary-50 text-xs uppercase tracking-wide text-primary-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">Código</th>
                  <th className="px-4 py-3 font-semibold">Nombre</th>
                  <th className="px-4 py-3 font-semibold">Stock</th>
                  <th className="px-4 py-3 font-semibold">Creado</th>
                  <th className="px-4 py-3 text-right font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-primary-50">
                {filtered.map((p) => (
                  <tr key={p.id} className="transition hover:bg-primary-50/50">
                    <td className="px-4 py-3 font-medium text-primary-700">{p.code}</td>
                    <td className="px-4 py-3 text-primary-900">{p.name}</td>
                    <td className="px-4 py-3">
                      <StockBadge stock={p.current_stock} />
                    </td>
                    <td className="px-4 py-3 text-primary-500">{formatDate(p.created_at)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          to={`/products/${p.id}`}
                          className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-primary-600 transition hover:bg-primary-100"
                        >
                          Ver
                        </Link>
                        <button
                          onClick={() => setEditing(p)}
                          className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-primary-600 transition hover:bg-primary-100"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => setDeleting(p)}
                          className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-red-500 transition hover:bg-red-50"
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
          <div className="border-t border-primary-50 px-4 py-2.5 text-xs text-primary-400">
            {filtered.length} de {products.length} productos
          </div>
        </div>
      )}

      {showCreate && (
        <Modal title="Nuevo producto" onClose={() => setShowCreate(false)}>
          <ProductForm
            onSubmit={handleCreate}
            onCancel={() => setShowCreate(false)}
          />
        </Modal>
      )}

      {editing && (
        <Modal title="Editar producto" onClose={() => setEditing(null)}>
          <ProductForm
            initial={editing}
            onSubmit={handleEdit}
            onCancel={() => setEditing(null)}
          />
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