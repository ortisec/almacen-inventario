import { useState } from 'react'
import Field from './Field'

const inputClass =
  'w-full rounded-lg border border-primary-200 bg-white px-3 py-2 text-sm text-primary-900 placeholder:text-primary-300 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-600'

function MovementEditForm({ movement, onSubmit, onCancel }) {
  const [form, setForm] = useState({
    movement_type: movement.movement_type,
    quantity: movement.quantity,
    movement_date: movement.movement_date,
    note: movement.note ?? '',
    reason: '',
  })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    const quantity = Number(form.quantity)
    if (!Number.isInteger(quantity) || quantity <= 0) {
      setError('La cantidad debe ser un número entero mayor a 0.')
      return
    }
    if (!form.reason.trim()) {
      setError('Indica el motivo de la modificación.')
      return
    }
    setSaving(true)
    try {
      await onSubmit({
        movement_type: form.movement_type,
        quantity,
        movement_date: form.movement_date,
        note: form.note.trim() || null,
        reason: form.reason.trim(),
      })
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Tipo de movimiento">
          <select
            className={inputClass}
            value={form.movement_type}
            onChange={(e) => setForm({ ...form, movement_type: e.target.value })}
          >
            <option value="ENTRADA">Entrada (+)</option>
            <option value="SALIDA">Salida (−)</option>
          </select>
        </Field>
        <Field label="Cantidad">
          <input
            className={inputClass}
            type="number"
            min="1"
            step="1"
            value={form.quantity}
            onChange={(e) => setForm({ ...form, quantity: e.target.value })}
            placeholder="Ej. 25"
            required
          />
        </Field>
        <Field label="Fecha del movimiento">
          <input
            className={inputClass}
            type="date"
            value={form.movement_date}
            onChange={(e) => setForm({ ...form, movement_date: e.target.value })}
            required
          />
        </Field>
        <Field label="Nota (opcional)">
          <input
            className={`${inputClass} uppercase`}
            value={form.note}
            onChange={(e) => setForm({ ...form, note: e.target.value.toUpperCase() })}
            placeholder="EJ. COMPRA A PROVEEDOR"
            maxLength={500}
          />
        </Field>
      </div>

      <Field label="Motivo de la modificación *">
        <input
          className={`${inputClass} uppercase`}
          value={form.reason}
          onChange={(e) => setForm({ ...form, reason: e.target.value.toUpperCase() })}
          placeholder="EJ. ERROR EN LA CANTIDAD REGISTRADA"
          maxLength={500}
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
          disabled={saving}
          className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-primary-700 disabled:opacity-60"
        >
          {saving ? 'Guardando…' : 'Guardar cambios'}
        </button>
      </div>
    </form>
  )
}

export default MovementEditForm