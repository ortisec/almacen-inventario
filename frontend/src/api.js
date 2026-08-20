import { clearToken, getToken } from './auth'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8001'

async function request(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  }
  const token = getToken()
  if (token && !options.public) {
    headers.Authorization = `Bearer ${token}`
  }

  const res = await fetch(`${API_URL}${path}`, { ...options, headers })

  if (res.status === 401 && !options.public) {
    clearToken()
    if (window.location.pathname !== '/login') {
      window.location.assign('/login')
    }
  }

  if (!res.ok) {
    let detail = `Error ${res.status}`
    try {
      const body = await res.json()
      if (typeof body.detail === 'string') detail = body.detail
      else if (Array.isArray(body.detail)) {
        detail = body.detail.map((e) => e.msg).join(', ')
      }
    } catch {
      /* sin cuerpo JSON */
    }
    throw new Error(detail)
  }

  if (res.status === 204) return null
  return res.json()
}

function buildQuery(params = {}) {
  return new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== '' && v !== null && v !== undefined),
  ).toString()
}

async function download(path, params = {}, filename) {
  const token = getToken()
  const qs = buildQuery(params)
  const res = await fetch(`${API_URL}${path}${qs ? `?${qs}` : ''}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
  if (!res.ok) {
    let detail = `Error ${res.status}`
    try {
      const body = await res.json()
      if (typeof body.detail === 'string') detail = body.detail
    } catch {
      /* sin cuerpo JSON */
    }
    throw new Error(detail)
  }
  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export const api = {
  login: (username, password) =>
    request(
      '/auth/login',
      {
        method: 'POST',
        public: true,
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ username, password }),
      },
    ),
  listProducts: (params = {}) => {
    const qs = buildQuery(params)
    return request(`/products${qs ? `?${qs}` : ''}`)
  },
  exportProducts: (params = {}, format) =>
    download(
      '/products/export',
      { ...params, format },
      `productos-${new Date().toISOString().slice(0, 10)}.${format === 'pdf' ? 'pdf' : 'xlsx'}`,
    ),
  getProduct: (id) => request(`/products/${id}`),
  createProduct: (data) =>
    request('/products', { method: 'POST', body: JSON.stringify(data) }),
  updateProduct: (id, data) =>
    request(`/products/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteProduct: (id) => request(`/products/${id}`, { method: 'DELETE' }),
  createMovement: (id, data) =>
    request(`/products/${id}/movements`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  listMovements: (params = {}) => {
    const qs = buildQuery(params)
    return request(`/movements${qs ? `?${qs}` : ''}`)
  },
  exportMovements: (params = {}, format) =>
    download(
      '/movements/export',
      { ...params, format },
      `movimientos-${new Date().toISOString().slice(0, 10)}.${format === 'pdf' ? 'pdf' : 'xlsx'}`,
    ),
}