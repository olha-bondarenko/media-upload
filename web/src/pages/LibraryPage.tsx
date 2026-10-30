import { useQuery, keepPreviousData } from '@tanstack/react-query'

import { listMedia } from '@/lib/media'
import { PageHeader } from '@/components/PageHeader'
import { MediaTableSkeleton } from '@/components/MediaTableSkeleton'
import { MediaTable } from '@/components/MediaTable'
import { useDelayedFlag } from '@/hooks/useDelayedFlag'
import { Button } from '@/components/ui/button'
import { useLibraryFilters } from '@/hooks/useLibraryFilters'
import { LibraryFilters } from '@/components/LibraryFilters'
import { Pagination } from '@/components/Pagination'
import { UploadButton } from '@/components/UploadButton'
import { useUploads } from '@/contexts/uploadsContext'

const PAGE_SIZE = 10

export function LibraryPage() {
  const filters = useLibraryFilters()
  const uploads = useUploads()
  
  const params = {
    q: filters.q,
    status: filters.status,
    limit: PAGE_SIZE,
    offset: (filters.page - 1) * PAGE_SIZE,
  }

  const { data, isPending, isError, error, refetch, isFetching, isPlaceholderData } = useQuery({
    queryKey: ['media', 'list', params],
    queryFn: () => listMedia(params),
    placeholderData: keepPreviousData,
  })

  const isSlow = useDelayedFlag(isPending, 5000)

  return (
    <>
      <PageHeader
        title="Library"
        description="Browse, search and manage your uploaded media."
        actions={<UploadButton onSelect={uploads.addFiles} />}
      />
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
        data.total > 0 ? (
          <div className="space-y-3 text-sm text-muted-foreground">
            <p>There are no items on this page.</p>
            <Button variant="outline" size="sm" onClick={() => filters.setPage(1)}>
              Go to the first page
            </Button>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            {filters.hasFilters ? 'No media matches your filters.' : 'No media yet.'}
          </p>
        )
      ) : (
        <div className={isPlaceholderData ? 'opacity-60 transition-opacity' : undefined}>
          <MediaTable items={data.items} />
          <Pagination
            page={filters.page}
            pageSize={PAGE_SIZE}
            total={data.total}
            onPageChange={(next) => {
              filters.setPage(next)
              window.scrollTo({ top: 0 })
            }}
          />
        </div>
      )}
    </>
  )
}
