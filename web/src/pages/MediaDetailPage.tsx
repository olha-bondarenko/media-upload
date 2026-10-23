import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Pencil } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'

import { MediaDetails } from '@/components/MediaDetails'
import { MediaPlayer } from '@/components/MediaPlayer'
import { PageHeader } from '@/components/PageHeader'
import { Button, buttonVariants } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ApiError } from '@/lib/api'
import { getMedia, updateMedia } from '@/lib/media'
import { useState } from 'react'
import type { MediaUpdate } from '@/lib/types/media'
import { MediaEditForm } from '@/components/MediaEditForm'

function isNotFound(error: unknown): boolean {
  return error instanceof ApiError && (error.status === 404 || error.status === 422)
}

function BackLink() {
  return (
    <Link to="/" className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
      <ArrowLeft aria-hidden="true" />
      Library
    </Link>
  )
}

export function MediaDetailPage() {
  const { id = '' } = useParams()
  const queryClient = useQueryClient()
  const [isEditing, setIsEditing] = useState(false)
  const [savedMessage, setSavedMessage] = useState('')

  const mutation = useMutation({
    mutationFn: (changes: MediaUpdate) => updateMedia(id, changes),
    onSuccess: (updated) => {
      queryClient.setQueryData(['media', 'detail', id], updated)
      queryClient.invalidateQueries({ queryKey: ['media', 'list'] })
      setIsEditing(false)
      setSavedMessage('Changes saved.')
    },
  })

  const {
    data: media,
    isPending,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['media', 'detail', id],
    queryFn: () => getMedia(id),
    retry: (failureCount, error) => !isNotFound(error) && failureCount < 3,
  })

  if (isPending) {
    return (
      <div className="space-y-6" aria-busy="true">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-8 lg:grid-cols-[2fr_1fr]">
          <Skeleton className="aspect-video w-full" />
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-4 w-full" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <>
        <BackLink />
        {isNotFound(error) ? (
          <div className="mt-6 space-y-2">
            <h1 className="text-2xl font-semibold">Media not found</h1>
            <p className="text-sm text-muted-foreground">
              It may have been deleted, or the link is wrong.
            </p>
          </div>
        ) : (
          <div
            role="alert"
            className="mt-6 flex flex-col items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4"
          >
            <p className="text-sm">Couldn't load this media. {error.message}</p>
            <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
              {isFetching ? 'Retrying…' : 'Try again'}
            </Button>
          </div>
        )}
      </>
    )
  }

  return (
    <>
      <BackLink />
      <div className="mt-4">
        <PageHeader
          title={media.title}
          actions={
            !isEditing && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  mutation.reset()
                  setSavedMessage('')
                  setIsEditing(true)
                }}
              >
                <Pencil aria-hidden="true" />
                Edit
              </Button>
            )
          }
        />
      </div>
      <p role="status" className="mb-4 text-sm text-emerald-700 dark:text-emerald-400">
        {savedMessage}
      </p>
      <div className="grid gap-8 lg:grid-cols-[2fr_1fr]">
        <MediaPlayer media={media} />
        {isEditing ? (
          <MediaEditForm
            media={media}
            isSaving={mutation.isPending}
            error={mutation.error?.message ?? null}
            onSave={(changes) => mutation.mutate(changes)}
            onCancel={() => setIsEditing(false)}
          />
        ) : (
          <MediaDetails media={media} />
        )}
      </div>
    </>
  )
}
