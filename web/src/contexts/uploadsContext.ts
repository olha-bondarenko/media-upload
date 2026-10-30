import { createContext, useContext } from 'react'

import type { useUploadQueue } from '@/hooks/useUploadQueue'

export type UploadsContextValue = ReturnType<typeof useUploadQueue>

export const UploadsContext = createContext<UploadsContextValue | null>(null)

export function useUploads(): UploadsContextValue {
  const value = useContext(UploadsContext)
  if (!value) throw new Error('useUploads must be used inside <UploadsProvider>')
  return value
}