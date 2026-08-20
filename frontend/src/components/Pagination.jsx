function getPageList(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const pages = new Set([1, total, current - 1, current, current + 1])
  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b)
  const result = []
  let prev = 0
  for (const p of sorted) {
    if (p - prev > 1) result.push('...')
    result.push(p)
    prev = p
  }
  return result
}

function PageButton({ active, disabled, onClick, children, label }) {
  const base =
    'min-w-9 rounded-lg px-2 py-1.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-40'
  const style = active
    ? 'bg-primary-600 text-white shadow-sm'
    : 'text-primary-700 hover:bg-primary-100 dark:text-slate-300 dark:hover:bg-slate-800'
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-label={label}
      className={`${base} ${style}`}
    >
      {children}
    </button>
  )
}

function Pagination({ page, totalPages, total, pageSize, onPageChange, onPageSizeChange }) {
  if (totalPages <= 1 && total <= pageSize) return null

  return (
    <div className="flex flex-col items-center justify-between gap-3 border-t border-primary-50 px-4 py-3 sm:flex-row dark:border-slate-800">
      <p className="text-xs text-primary-500 dark:text-slate-400">
        {total} registro{total !== 1 ? 's' : ''} · página {page} de {totalPages}
      </p>

      <div className="flex items-center gap-1">
        <PageButton
          label="Primera página"
          disabled={page === 1}
          onClick={() => onPageChange(1)}
        >
          «
        </PageButton>
        <PageButton label="Anterior" disabled={page === 1} onClick={() => onPageChange(page - 1)}>
          ‹
        </PageButton>
        {getPageList(page, totalPages).map((p, i) =>
          p === '...' ? (
            <span key={`e${i}`} className="px-1 text-sm text-primary-400 dark:text-slate-500">
              …
            </span>
          ) : (
            <PageButton
              key={p}
              active={p === page}
              onClick={() => onPageChange(p)}
              label={`Página ${p}`}
            >
              {p}
            </PageButton>
          ),
        )}
        <PageButton
          label="Siguiente"
          disabled={page === totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          ›
        </PageButton>
        <PageButton
          label="Última página"
          disabled={page === totalPages}
          onClick={() => onPageChange(totalPages)}
        >
          »
        </PageButton>
      </div>

      <label className="flex items-center gap-2 text-xs text-primary-500 dark:text-slate-400">
        Filas por página
        <select
          className="rounded-lg border border-primary-200 bg-white px-2 py-1 text-sm text-primary-900 outline-none focus:border-primary-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
        >
          {[10, 20, 50].map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </label>
    </div>
  )
}

export default Pagination