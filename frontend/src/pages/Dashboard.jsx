import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { api } from '../api'
import Spinner from '../components/Spinner'
import { useTheme } from '../theme'

const EMERALD = '#10b981'
const RED = '#ef4444'
const PRIMARY = '#1d64f1'

function formatShortDay(value) {
  const d = new Date(`${value}T00:00:00`)
  return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })
}

const kpis = [
  {
    key: 'products',
    label: 'Productos',
    getValue: (t) => t.products,
    getSub: (t) => `${t.products_in_stock} con stock · ${t.products_out_of_stock} sin stock`,
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="h-5 w-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
      </svg>
    ),
    color: 'text-primary-600 dark:text-primary-400',
  },
  {
    key: 'stock',
    label: 'Stock total',
    getValue: (t) => t.current_stock_total,
    getSub: () => 'unidades en almacén',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="h-5 w-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
      </svg>
    ),
    color: 'text-emerald-600 dark:text-emerald-400',
  },
  {
    key: 'entradas',
    label: 'Entradas',
    getValue: (t) => `+${t.entradas_qty}`,
    getSub: (t) => `${t.entradas_count} movimientos`,
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="h-5 w-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
      </svg>
    ),
    color: 'text-emerald-600 dark:text-emerald-400',
  },
  {
    key: 'salidas',
    label: 'Salidas',
    getValue: (t) => `−${t.salidas_qty}`,
    getSub: (t) => `${t.salidas_count} movimientos`,
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="h-5 w-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
      </svg>
    ),
    color: 'text-red-500 dark:text-red-400',
  },
]

function KpiCard({ kpi, totals }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-primary-100 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <span className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-50 dark:bg-slate-800 ${kpi.color}`}>
        {kpi.icon}
      </span>
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-primary-400 dark:text-slate-500">{kpi.label}</p>
        <p className="text-2xl font-bold text-primary-900 dark:text-slate-100">{kpi.getValue(totals)}</p>
        <p className="truncate text-xs text-primary-500 dark:text-slate-400">{kpi.getSub(totals)}</p>
      </div>
    </div>
  )
}

function ChartCard({ title, subtitle, children, className = '' }) {
  return (
    <div className={`rounded-2xl border border-primary-100 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 ${className}`}>
      <h3 className="text-sm font-semibold text-primary-900 dark:text-slate-100">{title}</h3>
      {subtitle && <p className="text-xs text-primary-400 dark:text-slate-500">{subtitle}</p>}
      <div className="mt-4">{children}</div>
    </div>
  )
}

function Dashboard() {
  const { theme } = useTheme()
  const dark = theme === 'dark'
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const axisTick = { fontSize: 11, fill: dark ? '#94a3b8' : '#64748b' }
  const gridStroke = dark ? '#334155' : '#e2e8f0'
  const cursorFill = dark ? '#1e293b' : '#f1f5f9'
  const tooltipStyle = {
    backgroundColor: dark ? '#0f172a' : '#ffffff',
    border: `1px solid ${dark ? '#334155' : '#e2e8f0'}`,
    color: dark ? '#e2e8f0' : undefined,
    borderRadius: 12,
    fontSize: 12,
  }
  const legendStyle = { fontSize: 12, color: dark ? '#e2e8f0' : undefined }

  const load = useCallback(() => {
    setLoading(true)
    api
      .dashboardStats()
      .then((res) => {
        setStats(res)
        setError('')
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    load()
  }, [load])

  if (loading) return <Spinner />
  if (error) {
    return (
      <div className="flex flex-col items-center gap-3 py-16">
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-500/15 dark:text-red-400">{error}</p>
        <button
          onClick={load}
          className="rounded-lg border border-primary-200 bg-white px-4 py-2 text-sm font-medium text-primary-700 transition hover:bg-primary-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          Reintentar
        </button>
      </div>
    )
  }
  if (!stats) return null

  const { totals, low_stock_threshold: threshold, low_stock, movements_last_days, top_products } = stats

  const daysChart = movements_last_days.map((d) => ({
    name: formatShortDay(d.date),
    entradas: d.entradas,
    salidas: d.salidas,
  }))

  const pieData = [
    { name: 'Entradas', value: totals.entradas_qty, color: EMERALD },
    { name: 'Salidas', value: totals.salidas_qty, color: RED },
  ].filter((d) => d.value > 0)

  const stockChart = top_products.map((p) => ({
    name: p.code,
    fullName: p.name,
    stock: p.current_stock,
  }))

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary-900 dark:text-slate-100">Dashboard</h1>
          <p className="text-sm text-primary-500 dark:text-slate-400">
            Resumen general del almacén con los datos registrados.
          </p>
        </div>
        <button
          onClick={load}
          className="inline-flex items-center gap-1.5 rounded-lg border border-primary-200 bg-white px-3 py-2 text-sm font-medium text-primary-700 transition hover:bg-primary-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="h-4 w-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
          </svg>
          Actualizar
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => (
          <KpiCard key={k.key} kpi={k} totals={totals} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <ChartCard
          title="Movimientos por día"
          subtitle={`Entradas y salidas de los últimos ${movements_last_days.length} días`}
          className="lg:col-span-2"
        >
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={daysChart} barSize={10}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridStroke} />
                <XAxis dataKey="name" tick={axisTick} tickLine={false} axisLine={{ stroke: gridStroke }} interval="preserveStartEnd" />
                <YAxis allowDecimals={false} tick={axisTick} tickLine={false} axisLine={false} width={28} />
                <Tooltip cursor={{ fill: cursorFill }} contentStyle={tooltipStyle} />
                <Legend wrapperStyle={legendStyle} />
                <Bar dataKey="entradas" name="Entradas" fill={EMERALD} radius={[4, 4, 0, 0]} />
                <Bar dataKey="salidas" name="Salidas" fill={RED} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Entradas vs Salidas" subtitle="Unidades totales movidas">
          <div className="h-64">
            {pieData.length === 0 ? (
              <p className="flex h-full items-center justify-center text-sm text-primary-400 dark:text-slate-500">
                Aún no hay movimientos.
              </p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={4} strokeWidth={0}>
                    {pieData.map((d) => (
                      <Cell key={d.name} fill={d.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={legendStyle} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <ChartCard title="Top productos por stock" subtitle="Los 5 con más unidades" className="lg:col-span-2">
          <div className="h-64">
            {stockChart.length === 0 ? (
              <p className="flex h-full items-center justify-center text-sm text-primary-400 dark:text-slate-500">
                Aún no hay productos registrados.
              </p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stockChart} layout="vertical" margin={{ left: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={gridStroke} />
                  <XAxis type="number" allowDecimals={false} tick={axisTick} tickLine={false} axisLine={false} />
                  <YAxis type="category" dataKey="name" tick={axisTick} tickLine={false} axisLine={false} width={54} />
                  <Tooltip
                    cursor={{ fill: cursorFill }}
                    formatter={(value) => [value, 'Stock']}
                    labelFormatter={(label) => {
                      const p = stockChart.find((s) => s.name === label)
                      return p ? `${p.name} — ${p.fullName}` : label
                    }}
                    contentStyle={tooltipStyle}
                  />
                  <Bar dataKey="stock" fill={PRIMARY} radius={[0, 4, 4, 0]} barSize={18} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </ChartCard>

        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm dark:border-amber-800 dark:bg-amber-500/10">
          <div className="flex items-center justify-between gap-2">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-amber-800 dark:text-amber-300">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="h-5 w-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
              </svg>
              Stock mínimo
            </h3>
            <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-500/20 dark:text-amber-300">
              &lt; {threshold}
            </span>
          </div>
          <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
            Productos que necesitan reposición.
          </p>
          <div className="mt-4 space-y-2">
            {low_stock.length === 0 ? (
              <div className="rounded-xl bg-emerald-50 p-4 text-center dark:bg-emerald-500/15">
                <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">Todo en orden</p>
                <p className="text-xs text-emerald-600 dark:text-emerald-400">Ningún producto por debajo del stock mínimo.</p>
              </div>
            ) : (
              low_stock.map((p) => (
                <Link
                  key={p.id}
                  to={`/products/${p.id}`}
                  className="flex items-center justify-between gap-3 rounded-xl border border-amber-200 bg-white px-3 py-2.5 transition hover:border-amber-300 hover:shadow-sm dark:border-amber-800 dark:bg-slate-900 dark:hover:border-amber-700"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-primary-900 dark:text-slate-100">
                      <span className="mr-1 font-mono text-xs text-primary-400 dark:text-slate-500">{p.code}</span>
                      {p.name}
                    </p>
                    <p className="text-xs text-amber-600 dark:text-amber-400">Quedan {p.current_stock} unidades</p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${
                      p.current_stock === 0
                        ? 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400'
                        : 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300'
                    }`}
                  >
                    {p.current_stock}
                  </span>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard