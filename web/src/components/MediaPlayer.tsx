import { StatusBadge } from '@/components/StatusBadge'
import type { Media, MediaStatus } from '@/lib/types/media'

const UNAVAILABLE_TEXT: Record<MediaStatus, string> = {
  uploading: 'This file is still uploading. It can be played once processing finishes.',
  processing: 'This file is being processed and will be playable shortly.',
  failed: "This upload failed and can't be played.",
  ready: 'No playable source is available for this file.',
}

export function MediaPlayer({ media }: { media: Media }) {
  if (!media.playback_url) {
    return (
      <div className="grid aspect-video place-items-center rounded-lg border border-dashed bg-muted/40 p-6 text-center">
        <div className="space-y-3">
          <StatusBadge status={media.status} />
          <p className="max-w-sm text-sm text-muted-foreground">{UNAVAILABLE_TEXT[media.status]}</p>
        </div>
      </div>
    )
  }

  if (media.content_type.startsWith('audio/')) {
    return (
      <div className="rounded-lg border p-6">
        <audio controls preload="metadata" src={media.playback_url} className="w-full" />
      </div>
    )
  }

  return (
    <video
      key={media.playback_url}
      controls
      preload="metadata"
      src={media.playback_url}
      className="aspect-video w-full rounded-lg bg-black"
    />
  )
}