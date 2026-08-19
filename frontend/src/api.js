const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8001'

async function request(path, options = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })

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

export const api = {
  listProducts: () => request('/products'),
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
    const qs = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== '' && v !== null && v !== undefined),
    ).toString()
    return request(`/movements${qs ? `?${qs}` : ''}`)
  },
}