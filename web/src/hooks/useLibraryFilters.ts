import { useSearchParams } from 'react-router-dom'

import { MEDIA_STATUSES, type MediaStatus } from '@/lib/types/media'

function isMediaStatus(value: string | null): value is MediaStatus {
  return value !== null && (MEDIA_STATUSES as readonly string[]).includes(value)
}

export function useLibraryFilters() {
  const [searchParams, setSearchParams] = useSearchParams()

  const q = searchParams.get('q') ?? ''
  const rawStatus = searchParams.get('status')
  const status = isMediaStatus(rawStatus) ? rawStatus : undefined

  function update(key: 'q' | 'status', value: string | undefined) {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        if (value) {
          next.set(key, value)
        } else {
          next.delete(key)
        }
        next.delete('page')
        return next
      },
      { replace: true },
    )
  }

  return {
    q,
    status,
    hasFilters: q !== '' || status !== undefined,
    setQuery: (value: string) => update('q', value.trim()),
    setStatus: (value: MediaStatus | undefined) => update('status', value),
    clear: () => setSearchParams({}, { replace: true }),
  }
}