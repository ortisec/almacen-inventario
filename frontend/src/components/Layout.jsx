import { NavLink, Navigate, Outlet, useNavigate } from 'react-router-dom'
import { clearToken, isAuthenticated } from '../auth'
import { useTheme } from '../theme'

const navLink = ({ isActive }) =>
  `rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
    isActive
      ? 'bg-primary-600 text-white shadow-sm'
      : 'text-primary-800 hover:bg-primary-100 dark:text-slate-300 dark:hover:bg-slate-800'
  }`

function Layout() {
  const navigate = useNavigate()
  const { theme, toggle } = useTheme()

  if (!isAuthenticated()) return <Navigate to="/login" replace />

  const handleLogout = () => {
    clearToken()
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-screen bg-primary-50 dark:bg-slate-950">
      <header className="sticky top-0 z-20 border-b border-primary-100 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-900/90">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <NavLink to="/" className="flex items-center gap-2">
            <img
              src="/logo-muni.png"
              alt="Logo de la Municipalidad Distrital de Pueblo Nuevo - Chincha"
              className="h-10 w-auto shrink-0 rounded-lg object-contain sm:h-11"
            />
            <div className="leading-tight">
              <p className="text-sm font-semibold text-primary-900 sm:text-base dark:text-slate-100">
                Municipalidad Distrital de
                <br className="sm:hidden" />
                Pueblo Nuevo - Chincha
              </p>
              <p className="hidden text-xs text-primary-500 sm:block dark:text-slate-400">
                Sistema de Almacén
              </p>
            </div>
          </NavLink>

          <div className="flex items-center gap-1 sm:gap-2">
            <NavLink to="/" end className={navLink}>
              Dashboard
            </NavLink>
            <NavLink to="/products" className={navLink}>
              Productos
            </NavLink>
            <NavLink to="/movements" className={navLink}>
              Movimientos
            </NavLink>
            <button
              onClick={toggle}
              aria-label={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
              title={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
              className="ml-1 flex h-9 w-9 items-center justify-center rounded-lg text-primary-500 transition hover:bg-primary-100 hover:text-primary-700 sm:ml-2 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            >
              {theme === 'dark' ? (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="h-5 w-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="h-5 w-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" />
                </svg>
              )}
            </button>
            <button
              onClick={handleLogout}
              className="ml-1 flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm font-medium text-primary-400 transition hover:bg-primary-100 hover:text-primary-700 sm:ml-2 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-300"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.8}
                stroke="currentColor"
                className="h-4 w-4"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75"
                />
              </svg>
              <span className="hidden sm:inline">Salir</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        <Outlet />
      </main>

      <footer className="pb-6 text-center text-xs text-primary-400 dark:text-slate-500">
        Municipalidad Distrital de Pueblo Nuevo - Chincha · Sistema de Almacén
      </footer>
    </div>
  )
}

export default Layout