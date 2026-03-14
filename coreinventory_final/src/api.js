// src/api.js — All backend API calls in one place
// Switch VITE_API_URL in .env to point to your backend

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

// ── Token storage ─────────────────────────────────────────────────────────────
export const getToken  = ()      => localStorage.getItem('ci_token')
export const setToken  = (t)     => localStorage.setItem('ci_token', t)
export const clearToken = ()     => localStorage.removeItem('ci_token')

// ── Core fetch wrapper ────────────────────────────────────────────────────────
const req = async (method, path, body) => {
  const token = getToken()
  const opts  = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  }
  const res  = await fetch(`${BASE}${path}`, opts)
  const data = await res.json()
  if (!res.ok) throw new Error(data.message || 'Request failed')
  return data
}

const get    = (path)        => req('GET',    path)
const post   = (path, body)  => req('POST',   path, body)
const put    = (path, body)  => req('PUT',    path, body)
const del    = (path)        => req('DELETE', path)

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const authAPI = {
  login:   (email, password)          => post('/auth/login',   { email, password }),
  signup:  (name, email, password)    => post('/auth/signup',  { name, email, password }),
  me:      ()                         => get('/auth/me'),
  sendOtp: (email)                    => post('/auth/otp/send',   { email }),
  verifyOtp: (email, code)            => post('/auth/otp/verify', { email, code }),
  resetPass: (resetToken, newPassword) => post('/auth/otp/reset', { resetToken, newPassword }),
  updateProfile: (data)               => put('/auth/profile', data),
  changePassword: (currentPassword, newPassword) => put('/auth/password', { currentPassword, newPassword }),
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
export const dashboardAPI = {
  get: () => get('/dashboard'),
}

// ─── Products ─────────────────────────────────────────────────────────────────
export const productsAPI = {
  list:    (params = {}) => get(`/products?${new URLSearchParams(params)}`),
  get:     (id)          => get(`/products/${id}`),
  create:  (data)        => post('/products', data),
  update:  (id, data)    => put(`/products/${id}`, data),
  delete:  (id)          => del(`/products/${id}`),
  movements: (id)        => get(`/products/${id}/movements`),
}

// ─── Warehouses ───────────────────────────────────────────────────────────────
export const warehousesAPI = {
  list:   ()         => get('/warehouses'),
  get:    (id)       => get(`/warehouses/${id}`),
  create: (data)     => post('/warehouses', data),
  update: (id, data) => put(`/warehouses/${id}`, data),
  delete: (id)       => del(`/warehouses/${id}`),
}

// ─── Receipts ─────────────────────────────────────────────────────────────────
export const receiptsAPI = {
  list:     (params = {}) => get(`/receipts?${new URLSearchParams(params)}`),
  get:      (id)          => get(`/receipts/${id}`),
  create:   (data)        => post('/receipts', data),
  update:   (id, data)    => put(`/receipts/${id}`, data),
  delete:   (id)          => del(`/receipts/${id}`),
  validate: (id)          => post(`/receipts/${id}/validate`),
  cancel:   (id)          => post(`/receipts/${id}/cancel`),
}

// ─── Deliveries ───────────────────────────────────────────────────────────────
export const deliveriesAPI = {
  list:     (params = {}) => get(`/deliveries?${new URLSearchParams(params)}`),
  get:      (id)          => get(`/deliveries/${id}`),
  create:   (data)        => post('/deliveries', data),
  update:   (id, data)    => put(`/deliveries/${id}`, data),
  delete:   (id)          => del(`/deliveries/${id}`),
  validate: (id)          => post(`/deliveries/${id}/validate`),
  cancel:   (id)          => post(`/deliveries/${id}/cancel`),
}

// ─── Transfers ────────────────────────────────────────────────────────────────
export const transfersAPI = {
  list:     (params = {}) => get(`/transfers?${new URLSearchParams(params)}`),
  get:      (id)          => get(`/transfers/${id}`),
  create:   (data)        => post('/transfers', data),
  update:   (id, data)    => put(`/transfers/${id}`, data),
  delete:   (id)          => del(`/transfers/${id}`),
  validate: (id)          => post(`/transfers/${id}/validate`),
  cancel:   (id)          => post(`/transfers/${id}/cancel`),
}

// ─── Adjustments ─────────────────────────────────────────────────────────────
export const adjustmentsAPI = {
  list:   (params = {}) => get(`/adjustments?${new URLSearchParams(params)}`),
  get:    (id)          => get(`/adjustments/${id}`),
  create: (data)        => post('/adjustments', data),
}

// ─── Stock Movements ─────────────────────────────────────────────────────────
export const movementsAPI = {
  list:    (params = {}) => get(`/movements?${new URLSearchParams(params)}`),
  summary: (days = 30)   => get(`/movements/summary?days=${days}`),
}

// ─── Users ───────────────────────────────────────────────────────────────────
export const usersAPI = {
  list:   ()              => get('/users'),
  stats:  ()              => get('/users/stats'),
  get:    (id)            => get(`/users/${id}`),
  create: (data)          => post('/users', data),
  update: (id, data)      => put(`/users/${id}`, data),
  delete: (id)            => del(`/users/${id}`),
}
