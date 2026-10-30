import { useQueryClient } from '@tanstack/react-query'
import { useRef, useState } from 'react'

import type { Media } from '@/lib/types/media'
import { uploadFile } from '@/lib/uploads'

const SPEED_WINDOW_MS = 5000

export type UploadItem = {
  id: string
  file: File
  status: 'uploading' | 'done' | 'error'
  uploadedBytes: number
  media?: Media
  error?: string
  bytesPerSecond?: number
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError'
}

export function useUploadQueue() {
  const queryClient = useQueryClient()
  const [items, setItems] = useState<UploadItem[]>([])
  const controllers = useRef(new Map<string, AbortController>())

  function update(id: string, patch: Partial<UploadItem>) {
    setItems((current) => current.map((item) => (item.id === id ? { ...item, ...patch } : item)))
  }

  function remove(id: string) {
    setItems((current) => current.filter((item) => item.id !== id))
  }

  async function run(item: UploadItem) {
    const controller = new AbortController()
    controllers.current.set(item.id, controller)

    const samples: { time: number; bytes: number }[] = []

    try {
      const media = await uploadFile(item.file, {
        signal: controller.signal,
        onProgress: (uploadedBytes) => {
          const now = performance.now()
          samples.push({ time: now, bytes: uploadedBytes })
          while (samples.length > 1 && now - samples[0].time > SPEED_WINDOW_MS) {
            samples.shift()
          }
          const oldest = samples[0]
          const elapsed = now - oldest.time
          const bytesPerSecond =
            elapsed >= 500 ? ((uploadedBytes - oldest.bytes) / elapsed) * 1000 : undefined
          update(item.id, { uploadedBytes, bytesPerSecond })
        },
      })
      update(item.id, { status: 'done', media, uploadedBytes: item.file.size })
      queryClient.invalidateQueries({ queryKey: ['media', 'list'] })
    } catch (error) {
      if (isAbortError(error)) {
        remove(item.id)
      } else {
        update(item.id, {
          status: 'error',
          error: error instanceof Error ? error.message : 'Upload failed',
        })
      }
    } finally {
      controllers.current.delete(item.id)
    }
  }

  function addFiles(files: File[]) {
    const newItems: UploadItem[] = files.map((file) => ({
      id: crypto.randomUUID(),
      file,
      status: 'uploading',
      uploadedBytes: 0,
    }))
    setItems((current) => [...newItems, ...current])
    newItems.forEach((item) => void run(item))
  }

  return {
    items,
    addFiles,
    cancel: (id: string) => controllers.current.get(id)?.abort(),
    dismiss: remove,
    clearFinished: () => setItems((current) => current.filter((item) => item.status === 'uploading')),
  }
}