import { useQuery } from '@tanstack/react-query'

import { listMedia } from '@/lib/media'
import { PageHeader } from '@/components/PageHeader'
import { MediaTableSkeleton } from '@/components/MediaTableSkeleton'
import { MediaTable } from '@/components/MediaTable'
import { useDelayedFlag } from '@/hooks/useDelayedFlag'
import { Button } from '@/components/ui/button'

export function LibraryPage() {
  const { data, isPending, isError, error, refetch, isFetching } = useQuery({
    queryKey: ['media', 'list'],
    queryFn: () => listMedia(),
  })

  const isSlow = useDelayedFlag(isPending, 5000)

  return (
    <>
      <PageHeader title="Library" description="Browse, search and manage your uploaded media." />
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
        <p className="text-sm text-muted-foreground">No media yet.</p>
      ) : (
        <MediaTable items={data.items} total={data.total} />
      )}
    </>
  )
}
