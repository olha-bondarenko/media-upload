import { ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'

import { UploadList } from '@/components/UploadList'
import { Button } from '@/components/ui/button'
import { useUploads } from '@/contexts/uploadsContext'

export function UploadPanel() {
  const uploads = useUploads()
  const [isCollapsed, setIsCollapsed] = useState(false)

  if (uploads.items.length === 0) return null

  const activeCount = uploads.items.filter((item) => item.status === 'uploading').length
  const hasFinished = uploads.items.length > activeCount
  const title =
    activeCount > 0
      ? `Uploading ${activeCount} ${activeCount === 1 ? 'file' : 'files'}`
      : 'Uploads finished'

  return (
    <aside
      aria-label="Uploads"
      className="fixed right-4 bottom-4 z-50 w-[min(26rem,calc(100vw-2rem))] rounded-lg border bg-background shadow-lg"
    >
      <div className="flex items-center gap-2 border-b px-4 py-2">
        <h2 className="flex-1 text-sm font-medium" aria-live="polite">
          {title}
        </h2>
        {hasFinished && (
          <Button variant="ghost" size="sm" onClick={uploads.clearFinished}>
            Clear finished
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsCollapsed((value) => !value)}
          aria-expanded={!isCollapsed}
          aria-controls="upload-panel-list"
          aria-label={isCollapsed ? 'Show uploads' : 'Hide uploads'}
        >
          {isCollapsed ? <ChevronUp aria-hidden="true" /> : <ChevronDown aria-hidden="true" />}
        </Button>
      </div>
      <div id="upload-panel-list" hidden={isCollapsed}>
        <UploadList items={uploads.items} onCancel={uploads.cancel} onDismiss={uploads.dismiss} />
      </div>
    </aside>
  )
}