export enum MediaStatus {
  Uploading = "uploading",
  Processing = "processing",
  Ready = "ready",
  Failed = "failed",
}

export type Media = {
  id: string,
  title: string,
  description: string,
  tags: string[],
  filename: string,
  content_type: string,
  size_bytes: number,
  status: MediaStatus,
  duration_seconds: number,
  playback_url: string,
  created_at: string,
  updated_at: string,
}

export type MediaList = {
  items: Media[],
  total: number,
  limit: number,
  offset: number,
}

export type MediaListParams = {
  q?: string,
  status?: MediaStatus,
  limit?: number,
  offset?: number,
}

export type MediaUpdate = {
  title?: string,
  description?: string,
  tags?: string[],
}
