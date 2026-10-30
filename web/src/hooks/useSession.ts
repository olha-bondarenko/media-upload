import { useSyncExternalStore } from 'react'

import { apiFetch } from '@/lib/api'
import { getSession, setSession, subscribeToSession } from '@/lib/session'
import type { Role, Session } from '@/lib/types/auth'

export function useSession() {
  const session = useSyncExternalStore(subscribeToSession, getSession)

  async function signIn(role: Role) {
    const next = await apiFetch<Session>('/auth/demo-login', {
      method: 'POST',
      body: JSON.stringify({ role }),
    })
    setSession(next)
  }

  return {
    user: session?.user ?? null,
    signIn,
    signOut: () => setSession(null),
  }
}