export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: string[],
  ) {
    super(message)
    this.name = "ApiError"
  }
}

async function getToken(): Promise<string | null> {
  if (typeof window === "undefined") return null
  const stored = localStorage.getItem("auth-storage")
  if (!stored) return null
  try {
    const parsed = JSON.parse(stored)
    return parsed.state?.accessToken ?? null
  } catch {
    return null
  }
}

async function request<T>(
  url: string,
  options: RequestInit = {},
): Promise<T> {
  const token = await getToken()

  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`
  }

  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json"
  }

  const response = await fetch(url, {
    ...options,
    headers,
  })

  if (!response.ok) {
    let errorData: { error?: string; details?: string[] } = {}
    try {
      errorData = await response.json()
    } catch {
      // ignore parse error
    }
    throw new ApiError(
      response.status,
      errorData.error ?? `Request failed with status ${response.status}`,
      errorData.details,
    )
  }

  if (response.status === 204) {
    return undefined as T
  }

  return response.json()
}

export const apiClient = {
  get: <T>(url: string, params?: Record<string, string | null | undefined>) => {
    const searchParams = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value != null) searchParams.set(key, value)
      })
    }
    const queryString = searchParams.toString()
    const fullUrl = queryString ? `${url}?${queryString}` : url
    return request<T>(fullUrl, { method: "GET" })
  },

  post: <T>(url: string, body?: unknown) =>
    request<T>(url, {
      method: "POST",
      body: body instanceof FormData ? body : JSON.stringify(body),
    }),

  patch: <T>(url: string, body: unknown) =>
    request<T>(url, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),

  delete: <T>(url: string) =>
    request<T>(url, { method: "DELETE" }),

  upload: <T>(url: string, formData: FormData) =>
    request<T>(url, {
      method: "POST",
      body: formData,
    }),
}
