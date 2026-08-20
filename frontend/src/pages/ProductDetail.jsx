import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../api'
import Modal from '../components/Modal'
import MovementForm from '../components/MovementForm'
import Spinner from '../components/Spinner'
import { formatDate } from '../utils'

function TypeBadge({ type, active = true }) {
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

function ProductDetail() {
  const { id } = useParams()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showMovement, setShowMovement] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      setProduct(await api.getProduct(id))
      setError('')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  if (loading) return <Spinner />

  if (error || !product) {
    return (
      <div className="rounded-2xl border border-dashed border-primary-200 bg-white p-10 text-center dark:border-slate-700 dark:bg-slate-900">
        <p className="text-primary-500 dark:text-slate-400">{error || 'Producto no encontrado.'}</p>
        <Link
          to="/products"
          className="mt-3 inline-block rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white"
        >
          Volver a productos
        </Link>
      </div>
    )
  }

  const handleMovement = async (data) => {
    await api.createMovement(product.id, data)
    setShowMovement(false)
    await load()
  }

  return (
    <div className="space-y-5">
      <Link
        to="/products"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-600 transition hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          className="h-4 w-4"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
        </svg>
        Volver
      </Link>

      <div className="flex flex-col gap-4 rounded-2xl border border-primary-100 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between dark:border-slate-800 dark:bg-slate-900">
        <div>
          <p className="text-sm font-medium text-primary-500 dark:text-slate-400">{product.code}</p>
          <h1 className="text-2xl font-bold text-primary-900 uppercase dark:text-slate-100">{product.name}</h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="text-right">
            <p className="text-xs text-primary-400 dark:text-slate-500">Stock actual</p>
            <p
              className={`text-2xl font-bold ${
                product.current_stock > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'
              }`}
            >
              {product.current_stock}
            </p>
          </div>
          <button
            onClick={() => setShowMovement(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-700"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="h-4 w-4"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5h15M12 12.75V21m0-8.25V6.75" />
            </svg>
            Registrar movimiento
          </button>
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold text-primary-900 dark:text-slate-100">
          Hoja de ruta del producto
        </h2>
        {product.movements.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-primary-200 bg-white p-10 text-center dark:border-slate-700 dark:bg-slate-900">
            <p className="text-primary-500 dark:text-slate-400">
              Aún no hay movimientos registrados para este producto.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-primary-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] text-left text-sm">
                <thead className="bg-primary-50 text-xs uppercase tracking-wide text-primary-500 dark:bg-slate-800 dark:text-slate-400">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Fecha</th>
                    <th className="px-4 py-3 font-semibold">Tipo</th>
                    <th className="px-4 py-3 font-semibold">Cantidad</th>
                    <th className="px-4 py-3 font-semibold">Stock resultante</th>
                    <th className="px-4 py-3 font-semibold">Nota</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-primary-50 dark:divide-slate-800">
                  {product.movements.map((m) => (
                    <tr
                      key={m.id}
                      className={`transition hover:bg-primary-50/50 dark:hover:bg-slate-800/50 ${m.active ? '' : 'opacity-60'}`}
                    >
                      <td className="px-4 py-3 text-primary-900 dark:text-slate-100">{formatDate(m.movement_date)}</td>
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
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {showMovement && (
        <Modal title="Registrar movimiento" onClose={() => setShowMovement(false)}>
          <MovementForm
            product={product}
            onSubmit={handleMovement}
            onCancel={() => setShowMovement(false)}
          />
        </Modal>
      )}
    </div>
  )
}

export default ProductDetail