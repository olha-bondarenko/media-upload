import { Upload } from 'lucide-react'
import { useRef } from 'react'

import { Button } from '@/components/ui/button'

interface UploadButtonProps {
  onSelect: (files: File[]) => void
  disabled?: boolean
}

export function UploadButton({ onSelect }: UploadButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept="video/*,audio/*"
        className="hidden"
        onChange={(event) => {
          const files = Array.from(event.target.files ?? [])
          if (files.length > 0) onSelect(files)
          event.target.value = ''
        }}
      />
      <Button onClick={() => inputRef.current?.click()}>
        <Upload aria-hidden="true" />
        Upload media
      </Button>
    </>
  )
}