const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface RequestOptions {
  params?: Record<string, any>
  headers?: Record<string, string>
}

async function request(url: string, method: string, body?: any, options?: RequestOptions) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options?.headers,
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  let finalUrl = `${API_URL}${url}`
  if (options?.params) {
    const searchParams = new URLSearchParams()
    Object.entries(options.params).forEach(([key, val]) => {
      if (val !== undefined && val !== null) {
        searchParams.append(key, String(val))
      }
    })
    const searchStr = searchParams.toString()
    if (searchStr) {
      finalUrl += `?${searchStr}`
    }
  }

  const response = await fetch(finalUrl, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })

  if (response.status === 401) {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token')
      window.location.href = '/login'
      return { data: null } as any
    }
  }

  if (!response.ok) {
    const errText = await response.text()
    let detail = 'Request failed'
    try {
      const errJson = JSON.parse(errText)
      detail = errJson.detail || detail
    } catch {}
    const error: any = new Error(detail)
    error.response = { status: response.status, data: { detail } }
    throw error
  }

  const data = await response.json()
  return { data }
}

const apiClient = {
  get: <T = any>(url: string, options?: RequestOptions): Promise<{ data: T }> =>
    request(url, 'GET', undefined, options),
  post: <T = any>(url: string, body?: any, options?: RequestOptions): Promise<{ data: T }> =>
    request(url, 'POST', body, options),
  put: <T = any>(url: string, body?: any, options?: RequestOptions): Promise<{ data: T }> =>
    request(url, 'PUT', body, options),
  delete: <T = any>(url: string, options?: RequestOptions): Promise<{ data: T }> =>
    request(url, 'DELETE', undefined, options),
}

export default apiClient
