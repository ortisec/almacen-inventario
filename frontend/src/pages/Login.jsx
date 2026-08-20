import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { api } from '../api'
import { isAuthenticated, setToken } from '../auth'

function Login() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ username: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (isAuthenticated()) return <Navigate to="/" replace />

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!form.username.trim() || !form.password) {
      setError('Ingresa tu usuario y contraseña.')
      return
    }
    setLoading(true)
    try {
      const data = await api.login(form.username.trim(), form.password)
      setToken(data.access_token)
      navigate('/', { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-primary-50 px-4 dark:bg-slate-950">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <img
            src="/logo-muni.png"
            alt="Logo de la Municipalidad Distrital de Pueblo Nuevo - Chincha"
            className="h-16 w-auto rounded-2xl object-contain"
          />
          <div>
            <h1 className="text-lg font-bold text-primary-900 dark:text-slate-100">
              Municipalidad Distrital de Pueblo Nuevo - Chincha
            </h1>
            <p className="text-sm text-primary-500 dark:text-slate-400">
              Sistema de Almacén · Control de inventario
            </p>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-2xl border border-primary-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
        >
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-primary-800 dark:text-slate-200">Usuario</span>
            <input
              className="w-full rounded-lg border border-primary-200 bg-white px-3 py-2 text-sm text-primary-900 placeholder:text-primary-300 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-600"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              placeholder="Ej. mdpn"
              autoComplete="username"
              required
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-primary-800 dark:text-slate-200">Contraseña</span>
            <input
              className="w-full rounded-lg border border-primary-200 bg-white px-3 py-2 text-sm text-primary-900 placeholder:text-primary-300 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-600"
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />
          </label>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-500/15 dark:text-red-400">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-700 disabled:opacity-60"
          >
            {loading ? 'Ingresando…' : 'Ingresar'}
          </button>
        </form>

        <p className="mt-4 text-center text-xs text-primary-400 dark:text-slate-500">
          Sistema de almacén e inventario
        </p>
      </div>
    </div>
  )
}

export default Login