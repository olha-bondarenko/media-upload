import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { Media } from '@/lib/types/media'
import { StatusBadge } from './StatusBadge'
import { formatBytes, formatDate, formatDuration } from '@/lib/format'
import { Link } from 'react-router-dom'

interface MediaTableProps {
  items: Media[]
  total: number
}

export function MediaTable({ items, total }: MediaTableProps) {
  return (
    <Table>
      <TableCaption>
        Showing {items.length} of {total} uploads
      </TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead scope="col">Title</TableHead>
          <TableHead scope="col">Status</TableHead>
          <TableHead scope="col" className="text-right">Duration</TableHead>
          <TableHead scope="col" className="text-right">Size</TableHead>
          <TableHead scope="col" className="text-right">Uploaded</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((media) => (
          <TableRow key={media.id}>
            <TableCell className="font-medium">
            <Link
                to={`/media/${media.id}`}
                className="underline-offset-4 hover:underline focus-visible:underline"
              >
                {media.title}
              </Link>
            </TableCell>
            <TableCell>
              <StatusBadge status={media.status} />
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {formatDuration(media.duration_seconds)}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {formatBytes(media.size_bytes)}
            </TableCell>
            <TableCell className="text-right">{formatDate(media.created_at)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
