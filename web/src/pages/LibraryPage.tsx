import { useQuery } from '@tanstack/react-query'

import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { listMedia } from '@/lib/media'
import { PageHeader } from '@/components/PageHeader'
import { StatusBadge } from '@/components/StatusBadge'
import { MediaTableSkeleton } from '@/components/MediaTableSkeleton'

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function LibraryPage() {
  const { data, isPending, isError, error } = useQuery({
    queryKey: ['media', 'list'],
    queryFn: () => listMedia(),
  })

  return (
    <>
      <PageHeader title="Library" description="Browse, search and manage your uploaded media." />
      {isPending ? (
        <MediaTableSkeleton />
      ) : isError ? (
        <p role="alert">Couldn't load media: {error.message}</p>
      ) : data.items.length === 0 ? (
        <p>No media yet.</p>
      ) : (
        <Table>
          <TableCaption>
            Showing {data.items.length} of {data.total} uploads
          </TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Size</TableHead>
              <TableHead className="text-right">Uploaded</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.items.map((media) => (
              <TableRow key={media.id}>
                <TableCell className="font-medium">{media.title}</TableCell>
                <TableCell>
                  <StatusBadge status={media.status} />
                </TableCell>
                <TableCell className="text-right">{formatSize(media.size_bytes)}</TableCell>
                <TableCell className="text-right">
                  {new Date(media.created_at).toLocaleDateString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </>
  )
}
