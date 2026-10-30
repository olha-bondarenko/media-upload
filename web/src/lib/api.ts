import { getSession, setSession } from "./session"

const API_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:8000').replace(/\/$/, '')

export class ApiError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

async function readErrorMessage(response: Response): Promise<string> {
  try {
    const body: unknown = await response.json()
    if (body && typeof body === 'object' && 'detail' in body) {
      const { detail } = body as { detail: unknown }
      if (typeof detail === 'string') return detail
      if (Array.isArray(detail) && detail.length > 0) {
        return detail
          .map((item) =>
            item && typeof item === 'object' && 'msg' in item ? String(item.msg) : String(item),
          )
          .join('; ')
      }
    }
  } catch {
    // The body wasn't JSON; fall through to the generic message.
  }
  return `Request failed with status ${response.status}`
}

/** Calls the API and returns the parsed JSON body, or throws ApiError on a non-2xx response. */
export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const session = getSession()
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(session ? { Authorization: `Bearer ${session.token}` } : {}),
      ...init?.headers,
    },
  })

  if (response.status === 401 && session) {
    setSession(null)
  }

  if (!response.ok) {
    throw new ApiError(response.status, await readErrorMessage(response))
  }

  if (response.status === 204) return undefined as T
  return (await response.json()) as T
}