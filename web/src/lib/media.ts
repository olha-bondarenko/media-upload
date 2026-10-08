import { apiFetch } from './api'
import type { Media, MediaList, MediaListParams, MediaUpdate } from './types/media'

export function listMedia(params: MediaListParams = {}): Promise<MediaList> {
  const query = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') query.set(key, String(value))
  }
  const qs = query.toString()
  return apiFetch<MediaList>(qs ? `/media?${qs}` : '/media')
}

export function getMedia(id: string): Promise<Media> {
  const encodedId = encodeURIComponent(id)
  return apiFetch<Media>(`/media/${encodedId}`)
}

export function updateMedia(id: string, changes: MediaUpdate): Promise<Media> {
  const encodedId = encodeURIComponent(id)
  return apiFetch<Media>(`/media/${encodedId}`, {
    method: 'PATCH',
    body: JSON.stringify(changes),
  })
}
