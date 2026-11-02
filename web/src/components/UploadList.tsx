import { CircleAlert, CircleCheck, X } from 'lucide-react'
import { Link } from 'react-router-dom'

import { ProgressBar } from '@/components/ProgressBar'
import { Button, buttonVariants } from '@/components/ui/button'
import type { UploadItem } from '@/hooks/useUploadQueue'
import { formatBytes, formatSpeed, formatTimeRemaining } from '@/lib/format'

interface UploadListProps {
  items: UploadItem[]
  onCancel: (id: string) => void
  onDismiss: (id: string) => void
}

export function UploadList({ items, onCancel, onDismiss }: UploadListProps) {
  return (
      <ul className="max-h-80 divide-y overflow-y-auto">
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
              {item.status === 'uploading' && (
                <>
                  <span className="shrink-0 tabular-nums text-muted-foreground">
                    {formatBytes(item.uploadedBytes)} of {formatBytes(item.file.size)}
                  </span>
                  <Button variant="outline" size="sm" onClick={() => onCancel(item.id)}>
                    Cancel
                  </Button>
                </>
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
              <>
                <ProgressBar
                  value={item.uploadedBytes / item.file.size}
                  label={`Uploading ${item.file.name}`}
                />
                <p className="text-xs tabular-nums text-muted-foreground">
                  {item.bytesPerSecond
                    ? `${formatSpeed(item.bytesPerSecond)} · ${formatTimeRemaining(
                        (item.file.size - item.uploadedBytes) / item.bytesPerSecond,
                      )}`
                    : 'Starting…'}
                </p>
              </>
            )}
            {item.status === 'error' && (
              <p role="alert" className="text-destructive">
                {item.error}
              </p>
            )}
          </li>
        ))}
      </ul>
  )
}