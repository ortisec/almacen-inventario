import { useEffect, useState } from 'react'
import { api } from '../api'
import Spinner from './Spinner'
import Modal from './Modal'
import { formatDateTime } from '../utils'

const actionMeta = {
  CREACION: { label: 'Creación', classes: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300' },
  MODIFICACION: { label: 'Modificación', classes: 'bg-primary-50 text-primary-700 dark:bg-primary-500/15 dark:text-primary-300' },
  ANULACION: { label: 'Anulación', classes: 'bg-red-50 text-red-600 dark:bg-red-500/15 dark:text-red-400' },
}

function MovementHistoryModal({ movement, onClose }) {
  const [history, setHistory] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api
      .movementHistory(movement.id)
      .then((res) => {
        setHistory(res)
        setError('')
      })
      .catch((err) => setError(err.message))
  }, [movement.id])

  return (
    <Modal title="Historial del movimiento" onClose={onClose}>
      <p className="mb-4 text-sm text-primary-500 dark:text-slate-400">
        {movement.movement_type} · {movement.quantity} unidades · {formatDateTime(movement.created_at)}
      </p>

      {error && (
        <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-500/15 dark:text-red-400">{error}</p>
      )}

      {!history && !error ? (
        <Spinner />
      ) : (
        <ol className="relative space-y-4 border-l border-primary-100 pl-5 dark:border-slate-800">
          {history.map((h) => {
            const meta = actionMeta[h.action] ?? { label: h.action, classes: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300' }
            return (
              <li key={h.id} className="relative">
                <span className="absolute -left-[26px] top-1 h-3 w-3 rounded-full border-2 border-white bg-primary-600 dark:border-slate-900" />
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${meta.classes}`}>
                    {meta.label}
                  </span>
                  <span className="text-xs text-primary-400 dark:text-slate-500">{formatDateTime(h.created_at)}</span>
                </div>
                <p className="mt-1 text-sm font-medium text-primary-900 dark:text-slate-100 uppercase">{h.reason}</p>
                {h.details && <p className="mt-0.5 text-xs text-primary-500 dark:text-slate-400 uppercase">{h.details}</p>}
              </li>
            )
          })}
        </ol>
      )}
    </Modal>
  )
}

export default MovementHistoryModal