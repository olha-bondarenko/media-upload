import { useEffect, useState } from 'react'

/** Returns true once `active` has stayed true for `delayMs`. Resets when `active` turns false. */
export function useDelayedFlag(active: boolean, delayMs: number): boolean {
  const [elapsed, setElapsed] = useState(false)

  useEffect(() => {
    if (!active) return
    const id = setTimeout(() => setElapsed(true), delayMs)
    return () => {
      clearTimeout(id)
      setElapsed(false)
    }
  }, [active, delayMs])

  return active && elapsed
}