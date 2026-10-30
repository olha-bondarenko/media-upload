import type { ReactNode } from 'react'

import { UploadsContext } from '@/contexts/uploadsContext'
import { useUploadQueue } from '@/hooks/useUploadQueue'

export function UploadsProvider({ children }: { children: ReactNode }) {
  const uploads = useUploadQueue()
  return <UploadsContext.Provider value={uploads}>{children}</UploadsContext.Provider>
}