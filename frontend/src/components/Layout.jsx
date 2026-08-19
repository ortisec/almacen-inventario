import { NavLink, Outlet } from 'react-router-dom'

const navLink = ({ isActive }) =>
  `rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
    isActive
      ? 'bg-primary-600 text-white shadow-sm'
      : 'text-primary-800 hover:bg-primary-100'
  }`

function Layout() {
  return (
    <div className="min-h-screen bg-primary-50">
      <header className="sticky top-0 z-20 border-b border-primary-100 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <NavLink to="/" className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-600 text-white">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.8}
                stroke="currentColor"
                className="h-5 w-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21"
                />
              </svg>
            </span>
            <div className="leading-tight">
              <p className="text-base font-semibold text-primary-900">Almacén</p>
              <p className="hidden text-xs text-primary-500 sm:block">Control de inventario</p>
            </div>
          </NavLink>

          <nav className="flex items-center gap-1 sm:gap-2">
            <NavLink to="/" end className={navLink}>
              Productos
            </NavLink>
            <NavLink to="/movements" className={navLink}>
              Movimientos
            </NavLink>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        <Outlet />
      </main>

      <footer className="pb-6 text-center text-xs text-primary-400">
        Almacén - Inventario
      </footer>
    </div>
  )
}

export default Layout