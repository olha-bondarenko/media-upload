import { useCallback, useEffect, useRef } from 'react'

/** Returns a function that calls `fn` only after it stops being called for `delayMs`. */
export function useDebouncedCallback<A extends unknown[]>(
  fn: (...args: A) => void,
  delayMs: number,
) {
  const fnRef = useRef(fn)
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => {
    fnRef.current = fn
  })

  useEffect(() => () => clearTimeout(timerRef.current), [])

  return useCallback(
    (...args: A) => {
      clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => fnRef.current(...args), delayMs)
    },
    [delayMs],
  )
}