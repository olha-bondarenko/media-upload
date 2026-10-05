import { useQuery } from '@tanstack/react-query'

import { getHealth } from '../lib/api'

/** Small indicator showing whether the frontend can reach the API. */
export function ApiStatus() {
  const { isPending, isError } = useQuery({
    queryKey: ['health'],
    queryFn: getHealth,
    retry: false,
  })

  const state = isPending ? 'checking' : isError ? 'offline' : 'online'
  const label = {
    checking: 'Checking API…',
    offline: 'API unreachable',
    online: 'API connected',
  }[state]

  return (
    <p className="api-status" data-state={state} role="status">
      <span className="api-status__dot" aria-hidden="true" />
      {label}
    </p>
  )
}
