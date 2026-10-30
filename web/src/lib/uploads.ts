import { apiFetch } from './api'
import type { Media } from './types/media'
import type { CompletedPart, PartUrl, UploadStartResponse } from './types/uploads'
import { readMediaDuration } from './mediaDuration'

const PARALLEL_CHUNKS = 4

async function startUpload(file: File): Promise<UploadStartResponse> {
  const durationSeconds = await readMediaDuration(file)
  return apiFetch('/uploads', {
    method: 'POST',
    body: JSON.stringify({
      filename: file.name,
      content_type: file.type,
      size_bytes: file.size,
      duration_seconds: durationSeconds,
    }),
  })
}

function getPartUrls(mediaId: string, partNumbers: number[]): Promise<{ parts: PartUrl[] }> {
  return apiFetch(`/uploads/${mediaId}/parts`, {
    method: 'POST',
    body: JSON.stringify({ part_numbers: partNumbers }),
  })
}

function completeUpload(mediaId: string, parts: CompletedPart[]): Promise<Media> {
  return apiFetch(`/uploads/${mediaId}/complete`, {
    method: 'POST',
    body: JSON.stringify({ parts }),
  })
}

function abortUpload(mediaId: string): Promise<void> {
  return apiFetch(`/uploads/${mediaId}`, { method: 'DELETE' })
}

/** PUTs one chunk straight to R2 and resolves with the ETag it returns. */
function putPart(
  url: string,
  chunk: Blob,
  onProgress: (loadedBytes: number) => void,
  signal?: AbortSignal,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('PUT', url)

    if (signal?.aborted) {
      reject(new DOMException('Upload cancelled', 'AbortError'))
      return
    }

    xhr.upload.onprogress = (event) => onProgress(event.loaded)
    xhr.onload = () => {
      if (xhr.status < 200 || xhr.status >= 300) {
        reject(new Error(`Uploading a chunk failed with status ${xhr.status}`))
        return
      }
      const etag = xhr.getResponseHeader('ETag')
      if (!etag) {
        reject(new Error('Storage did not return an ETag. Check that the bucket CORS rule exposes it.'))
        return
      }
      resolve(etag)
    }
    xhr.onerror = () => reject(new Error('Network error while uploading'))
    xhr.onabort = () => reject(new DOMException('Upload cancelled', 'AbortError'))

    signal?.addEventListener('abort', () => xhr.abort())
    xhr.send(chunk)
  })
}

interface UploadOptions {
  onProgress?: (fraction: number) => void
  signal?: AbortSignal
}

/** Runs the whole flow: start, upload chunks in parallel, complete. Cleans up on failure. */
export async function uploadFile(
  file: File,
  { onProgress, signal }: UploadOptions = {},
): Promise<Media> {
  const { media_id, part_size, part_count } = await startUpload(file)

  // One controller for all chunks: aborted by the user's Cancel, or by the first failing chunk.
  const chunksController = new AbortController()
  const abortChunks = () => chunksController.abort()
  if (signal?.aborted) abortChunks()
  signal?.addEventListener('abort', abortChunks, { once: true })

  try {
    const partNumbers = Array.from({ length: part_count }, (_, index) => index + 1)
    const { parts } = await getPartUrls(media_id, partNumbers)

    const completed: CompletedPart[] = []
    const loadedByPart = new Map<number, number>()
    const reportProgress = () => {
      let total = 0
      for (const loaded of loadedByPart.values()) total += loaded
      onProgress?.(total)
    }

    await runWithConcurrency(parts, PARALLEL_CHUNKS, async ({ part_number, url }) => {
      const start = (part_number - 1) * part_size
      const chunk = file.slice(start, start + part_size)
      const etag = await putPart(
        url,
        chunk,
        (loaded) => {
          loadedByPart.set(part_number, loaded)
          reportProgress()
        },
        chunksController.signal,
      )
      loadedByPart.set(part_number, chunk.size)
      reportProgress()
      completed.push({ part_number, etag })
    })

    return await completeUpload(media_id, completed)
  } catch (error) {
    abortChunks()
    await abortUpload(media_id).catch(() => {})
    throw error
  } finally {
    signal?.removeEventListener('abort', abortChunks)
  }
}

/** Runs `worker` on every item, with at most `limit` running at the same time. */
async function runWithConcurrency<T>(
  items: T[],
  limit: number,
  worker: (item: T) => Promise<void>,
): Promise<void> {
  let next = 0
  async function lane() {
    while (next < items.length) {
      const item = items[next]
      next += 1
      await worker(item)
    }
  }
  const lanes = Array.from({ length: Math.min(limit, items.length) }, lane)
  await Promise.all(lanes)
}