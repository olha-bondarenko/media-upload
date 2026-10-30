import { CircleAlert, CircleCheck, X } from 'lucide-react'
import { Link } from 'react-router-dom'

import { ProgressBar } from '@/components/ProgressBar'
import { Button, buttonVariants } from '@/components/ui/button'
import type { UploadItem } from '@/hooks/useUploadQueue'
import { formatBytes } from '@/lib/format'

interface UploadListProps {
  items: UploadItem[]
  onCancel: (id: string) => void
  onDismiss: (id: string) => void
  onClearFinished: () => void
}

export function UploadList({ items, onCancel, onDismiss, onClearFinished }: UploadListProps) {
  if (items.length === 0) return null
  const hasFinished = items.some((item) => item.status !== 'uploading')

  return (
    <section aria-labelledby="uploads-heading" className="mb-6 rounded-lg border">
      <div className="flex items-center justify-between border-b px-4 py-2">
        <h2 id="uploads-heading" className="text-sm font-medium">
          Uploads
        </h2>
        {hasFinished && (
          <Button variant="ghost" size="sm" onClick={onClearFinished}>
            Clear finished
          </Button>
        )}
      </div>
      <ul className="divide-y" aria-live="polite">
        {items.map((item) => (
          <li key={item.id} className="space-y-2 px-4 py-3 text-sm">
            <div className="flex items-center gap-3">
              {item.status === 'done' && (
                <CircleCheck className="size-4 shrink-0 text-emerald-600" aria-hidden="true" />
              )}
              {item.status === 'error' && (
                <CircleAlert className="size-4 shrink-0 text-destructive" aria-hidden="true" />
              )}
              <span className="min-w-0 flex-1 truncate font-medium">{item.file.name}</span>
              <span className="shrink-0 tabular-nums text-muted-foreground">
                {item.status === 'uploading'
                  ? `${formatBytes(item.uploadedBytes)} of ${formatBytes(item.file.size)}`
                  : formatBytes(item.file.size)}
              </span>

              {item.status === 'uploading' && (
                <Button variant="outline" size="sm" onClick={() => onCancel(item.id)}>
                  Cancel
                </Button>
              )}
              {item.status === 'done' && item.media && (
                <Link
                  to={`/media/${item.media.id}`}
                  className={buttonVariants({ variant: 'outline', size: 'sm' })}
                >
                  View
                </Link>
              )}
              {item.status !== 'uploading' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDismiss(item.id)}
                  aria-label={`Dismiss ${item.file.name}`}
                >
                  <X aria-hidden="true" />
                </Button>
              )}
            </div>

            {item.status === 'uploading' && (
              <ProgressBar
                value={item.uploadedBytes / item.file.size}
                label={`Uploading ${item.file.name}`}
              />
            )}
            {item.status === 'error' && (
              <p role="alert" className="text-destructive">
                {item.error}
              </p>
            )}
          </li>
        ))}
      </ul>
    </section>
  )
}