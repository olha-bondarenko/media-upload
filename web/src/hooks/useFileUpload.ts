import { useQueryClient } from '@tanstack/react-query'
import { useRef, useState } from 'react'

import type { Media } from '@/lib/types/media'
import { uploadFile } from '@/lib/uploads'

export type UploadState =
  | { status: 'idle' }
  | { status: 'uploading'; fileName: string; progress: number }
  | { status: 'done'; media: Media }
  | { status: 'error'; fileName: string; message: string }

export function useFileUpload() {
  const queryClient = useQueryClient()
  const [state, setState] = useState<UploadState>({ status: 'idle' })
  const controllerRef = useRef<AbortController | null>(null)

  async function upload(file: File) {
    const controller = new AbortController()
    controllerRef.current = controller
    setState({ status: 'uploading', fileName: file.name, progress: 0 })

    try {
      const media = await uploadFile(file, {
        signal: controller.signal,
        onProgress: (progress) => setState({ status: 'uploading', fileName: file.name, progress }),
      })
      setState({ status: 'done', media })
      queryClient.invalidateQueries({ queryKey: ['media', 'list'] })
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        setState({ status: 'idle' })
      } else {
        const message = error instanceof Error ? error.message : 'Upload failed'
        setState({ status: 'error', fileName: file.name, message })
      }
    } finally {
      controllerRef.current = null
    }
  }

  return {
    state,
    upload,
    cancel: () => controllerRef.current?.abort(),
    dismiss: () => setState({ status: 'idle' }),
  }
}