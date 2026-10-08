export type MediaStatus = 'uploading' | 'processing' | 'ready' | 'failed'

export type Media = {
  id: string
  title: string
  description: string
  tags: string[]
  filename: string
  content_type: string
  size_bytes: number
  status: MediaStatus
  duration_seconds: number | null
  playback_url: string | null
  created_at: string
  updated_at: string
}

export type MediaList = {
  items: Media[]
  total: number
  limit: number
  offset: number
}

export type MediaListParams = {
  q?: string
  status?: MediaStatus
  limit?: number
  offset?: number
}

export type MediaUpdate = {
  title?: string
  description?: string
  tags?: string[]
}
