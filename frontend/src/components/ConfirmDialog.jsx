import Modal from './Modal'

function ConfirmDialog({ title, message, onConfirm, onCancel, busy }) {
  return (
    <Modal title={title} onClose={onCancel}>
      <p className="text-sm text-primary-800">{message}</p>
      <div className="mt-5 flex justify-end gap-2">
        <button
          onClick={onCancel}
          className="rounded-lg border border-primary-200 px-4 py-2 text-sm font-medium text-primary-700 transition hover:bg-primary-50"
        >
          Cancelar
        </button>
        <button
          onClick={onConfirm}
          disabled={busy}
          className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-red-700 disabled:opacity-60"
        >
          {busy ? 'Eliminando…' : 'Eliminar'}
        </button>
      </div>
    </Modal>
  )
}

export default ConfirmDialog