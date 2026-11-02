import { useEffect, useRef, type RefObject } from 'react'

/** When `isOpen` goes from true to false, moves focus back to the element that opened it. */
export function useReturnFocus(isOpen: boolean, returnTo: RefObject<HTMLElement | null>) {
  const wasOpen = useRef(isOpen)

  useEffect(() => {
    if (wasOpen.current && !isOpen) returnTo.current?.focus()
    wasOpen.current = isOpen
  }, [isOpen, returnTo])
}