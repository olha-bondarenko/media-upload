import { CircleCheck, CircleAlert } from 'lucide-react'
import { Link } from 'react-router-dom'

import { Button, buttonVariants } from '@/components/ui/button'
import type { UploadState } from '@/hooks/useFileUpload'

interface UploadStatusProps {
  state: UploadState
  onCancel: () => void
  onDismiss: () => void
}

export function UploadStatus({ state, onCancel, onDismiss }: UploadStatusProps) {
  if (state.status === 'idle') return null

  return (
    <div className="mb-6 rounded-lg border p-4" aria-live="polite">
      {state.status === 'uploading' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-4 text-sm">
            <span className="truncate font-medium">Uploading {state.fileName}</span>
            <span className="tabular-nums text-muted-foreground">
              {Math.round(state.progress * 100)}%
            </span>
          </div>
          <div
            role="progressbar"
            aria-label={`Uploading ${state.fileName}`}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(state.progress * 100)}
            className="h-2 overflow-hidden rounded-full bg-muted"
          >
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-200"
              style={{ width: `${state.progress * 100}%` }}
            />
          </div>
          <Button variant="outline" size="sm" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      )}

      {state.status === 'done' && (
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <CircleCheck className="size-4 text-emerald-600" aria-hidden="true" />
          <span>
            <span className="font-medium">{state.media.title}</span> was uploaded.
          </span>
          <Link
            to={`/media/${state.media.id}`}
            className={buttonVariants({ variant: 'outline', size: 'sm' })}
          >
            View
          </Link>
          <Button variant="ghost" size="sm" onClick={onDismiss}>
            Dismiss
          </Button>
        </div>
      )}

      {state.status === 'error' && (
        <div className="flex flex-wrap items-center gap-3 text-sm" role="alert">
          <CircleAlert className="size-4 text-destructive" aria-hidden="true" />
          <span>
            Couldn't upload {state.fileName}: {state.message}
          </span>
          <Button variant="ghost" size="sm" onClick={onDismiss}>
            Dismiss
          </Button>
        </div>
      )}
    </div>
  )
}