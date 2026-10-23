import type { ReactNode } from 'react'

import { StatusBadge } from '@/components/StatusBadge'
import { Badge } from '@/components/ui/badge'
import { formatBytes, formatDate, formatDuration } from '@/lib/format'
import type { Media } from '@/lib/types/media'

function DetailRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[8rem_1fr] gap-4 py-2">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="text-sm">{children}</dd>
    </div>
  )
}

export function MediaDetails({ media }: { media: Media }) {
  return (
    <section aria-labelledby="details-heading" className="space-y-4">
      <h2 id="details-heading" className="text-lg font-semibold">
        Details
      </h2>

      {media.description ? (
        <p className="text-sm whitespace-pre-line">{media.description}</p>
      ) : (
        <p className="text-sm text-muted-foreground">No description.</p>
      )}

      <dl className="divide-y">
        <DetailRow label="Status">
          <StatusBadge status={media.status} />
        </DetailRow>
        <DetailRow label="Duration">{formatDuration(media.duration_seconds)}</DetailRow>
        <DetailRow label="Size">{formatBytes(media.size_bytes)}</DetailRow>
        <DetailRow label="File">
          <span className="break-all">{media.filename}</span>
        </DetailRow>
        <DetailRow label="Type">{media.content_type}</DetailRow>
        <DetailRow label="Uploaded">{formatDate(media.created_at)}</DetailRow>
        <DetailRow label="Last edited">{formatDate(media.updated_at)}</DetailRow>
        <DetailRow label="Tags">
          {media.tags.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {media.tags.map((tag) => (
                <Badge key={tag} variant="outline">
                  {tag}
                </Badge>
              ))}
            </div>
          ) : (
            <span className="text-muted-foreground">None</span>
          )}
        </DetailRow>
      </dl>
    </section>
  )
}