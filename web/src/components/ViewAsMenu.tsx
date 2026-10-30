import { useState } from 'react'

import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useSession } from '@/hooks/useSession'
import type { Role } from '@/lib/types/auth'

const OPTIONS: { label: string; value: Role | null }[] = [
  { label: 'Guest', value: null },
  { label: 'Viewer', value: 'viewer' },
  { label: 'Editor', value: 'editor' },
  { label: 'Admin', value: 'admin' },
]

export function ViewAsMenu() {
  const { user, signIn, signOut } = useSession()
  const [isSwitching, setIsSwitching] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleChange(role: Role | null) {
    setError(null)
    if (role === null) {
      signOut()
      return
    }
    setIsSwitching(true)
    try {
      await signIn(role)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not sign in')
    } finally {
      setIsSwitching(false)
    }
  }

  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-muted-foreground">View as</span>
      <Select
        items={OPTIONS}
        value={user?.role ?? null}
        onValueChange={(value) => void handleChange(value)}
        disabled={isSwitching}
      >
        <SelectTrigger aria-label="View as" className="w-32">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {OPTIONS.map((option) => (
              <SelectItem key={option.label} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
      {error && (
        <span role="alert" className="text-destructive">
          {error}
        </span>
      )}
    </div>
  )
}