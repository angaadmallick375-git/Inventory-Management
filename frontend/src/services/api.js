import axios from 'axios'

/**
 * Centralised Axios instance.
 *
 * baseURL strategy:
 *   - In Docker / dev server: baseURL = '' (empty) so all /api/* requests
 *     go through Vite's proxy (vite.config.js → /api → backend service).
 *   - In production (built bundle served by nginx): set VITE_API_URL to your
 *     public API domain (e.g. https://api.yourdomain.com).
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
})

// ── Global response interceptor ─────────────────────────────────────────────
// Normalise error detail to always be a string so toast.error() never shows
// "[object Object]".
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const detail = error.response?.data?.detail
    if (detail && typeof detail !== 'string') {
      // Pydantic validation errors arrive as an array of objects
      error.response.data.detail = detail
        .map((e) => `${e.loc?.slice(-1)[0] ?? 'field'}: ${e.msg}`)
        .join(' • ')
    }
    return Promise.reject(error)
  },
)

// ── Products ─────────────────────────────────────────────────────────────────
export const productsApi = {
  list:   (params) => api.get('/api/products/',       { params }),
  get:    (id)     => api.get(`/api/products/${id}`),
  create: (data)   => api.post('/api/products/',      data),
  update: (id, data) => api.put(`/api/products/${id}`, data),
  delete: (id)     => api.delete(`/api/products/${id}`),
  count:  ()       => api.get('/api/products/count'),
}

// ── Customers ─────────────────────────────────────────────────────────────────
export const customersApi = {
  list:   (params) => api.get('/api/customers/',       { params }),
  get:    (id)     => api.get(`/api/customers/${id}`),
  create: (data)   => api.post('/api/customers/',      data),
  update: (id, data) => api.put(`/api/customers/${id}`, data),
  delete: (id)     => api.delete(`/api/customers/${id}`),
  count:  ()       => api.get('/api/customers/count'),
}

// ── Orders ────────────────────────────────────────────────────────────────────
export const ordersApi = {
  list:   (params) => api.get('/api/orders/',       { params }),
  get:    (id)     => api.get(`/api/orders/${id}`),
  create: (data)   => api.post('/api/orders/',      data),
  update: (id, data) => api.put(`/api/orders/${id}`, data),
  delete: (id)     => api.delete(`/api/orders/${id}`),
  count:  ()       => api.get('/api/orders/count'),
}

// ── Inventory ─────────────────────────────────────────────────────────────────
export const inventoryApi = {
  list:           (params) => api.get('/api/inventory/',                  { params }),
  get:            (id)     => api.get(`/api/inventory/${id}`),
  getByProduct:   (pid)    => api.get(`/api/inventory/product/${pid}`),
  create:         (data)   => api.post('/api/inventory/',                 data),
  update:         (id, d)  => api.put(`/api/inventory/${id}`,             d),
  lowStock:       ()       => api.get('/api/inventory/low-stock'),
  addTransaction: (id, d)  => api.post(`/api/inventory/${id}/transactions`, d),
  getTransactions:(id)     => api.get(`/api/inventory/${id}/transactions`),
}

export default api
