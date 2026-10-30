import type { Session } from './types/auth'

const STORAGE_KEY = 'media-upload.session'

function readStoredSession(): Session | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Session) : null
  } catch {
    return null
  }
}

let currentSession = readStoredSession()
const listeners = new Set<() => void>()

export function getSession(): Session | null {
  return currentSession
}

export function setSession(session: Session | null): void {
  currentSession = session
  try {
    if (session) localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
    else localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Storage can be unavailable (private mode); the session still works for this visit.
  }
  listeners.forEach((listener) => listener())
}

export function subscribeToSession(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}