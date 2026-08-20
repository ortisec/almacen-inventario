import { useState } from 'react'
import Field from './Field'

const inputClass =
  'w-full rounded-lg border border-primary-200 bg-white px-3 py-2 text-sm text-primary-900 placeholder:text-primary-300 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-600'

function ProductForm({ initial, onSubmit, onCancel }) {
  const [form, setForm] = useState({
    code: initial?.code ?? '',
    name: initial?.name ?? '',
  })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!form.code.trim() || !form.name.trim()) {
      setError('Completa el código y el nombre del producto.')
      return
    }
    setSaving(true)
    try {
      await onSubmit({ code: form.code.trim(), name: form.name.trim() })
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Field label="Código de producto">
        <input
          className={inputClass}
          value={form.code}
          onChange={(e) => setForm({ ...form, code: e.target.value })}
          placeholder="Ej. PROD-001"
          maxLength={50}
          required
        />
      </Field>
      <Field label="Nombre o descripción">
        <input
          className={`${inputClass} uppercase`}
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value.toUpperCase() })}
          placeholder="EJ. CAJA DE TORNILLOS 3/4"
          maxLength={200}
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
          {saving ? 'Guardando…' : initial ? 'Guardar cambios' : 'Crear producto'}
        </button>
      </div>
    </form>
  )
}

export default ProductForm