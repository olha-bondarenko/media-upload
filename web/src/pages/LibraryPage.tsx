import { useQuery, keepPreviousData } from '@tanstack/react-query'

import { listMedia } from '@/lib/media'
import { PageHeader } from '@/components/PageHeader'
import { MediaTableSkeleton } from '@/components/MediaTableSkeleton'
import { MediaTable } from '@/components/MediaTable'
import { useDelayedFlag } from '@/hooks/useDelayedFlag'
import { Button } from '@/components/ui/button'
import { useLibraryFilters } from '@/hooks/useLibraryFilters'
import { LibraryFilters } from '@/components/LibraryFilters'

export function LibraryPage() {
  const filters = useLibraryFilters()
  const params = { q: filters.q, status: filters.status }

  const { data, isPending, isError, error, refetch, isFetching, isPlaceholderData } = useQuery({
    queryKey: ['media', 'list', params],
    queryFn: () => listMedia(params),
    placeholderData: keepPreviousData,
  })

  const isSlow = useDelayedFlag(isPending, 5000)

  return (
    <>
      <PageHeader title="Library" description="Browse, search and manage your uploaded media." />
      <LibraryFilters
        q={filters.q}
        status={filters.status}
        hasFilters={filters.hasFilters}
        onQueryChange={filters.setQuery}
        onStatusChange={filters.setStatus}
        onClear={filters.clear}
      />

      {isPending ? (
        <div className="space-y-4">
          <MediaTableSkeleton />
          {isSlow && (
            <p role="status" className="text-sm text-muted-foreground">
              Waking up the server... Please, wait.
            </p>
          )}
        </div>
      ) : isError ? (
        <div
          role="alert"
          className="flex flex-col items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4"
        >
          <p className="text-sm">Couldn't load media. {error.message}</p>
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
            {isFetching ? 'Retrying…' : 'Try again'}
          </Button>
        </div>
      ) : data.items.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {filters.hasFilters ? 'No media matches your filters.' : 'No media yet.'}
        </p>
      ) : (
        <div className={isPlaceholderData ? 'opacity-60 transition-opacity' : undefined}>
          <MediaTable items={data.items} total={data.total} />
        </div>
      )}
    </>
  )
}
