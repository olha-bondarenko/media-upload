import { Upload } from 'lucide-react'
import { useRef } from 'react'

import { Button } from '@/components/ui/button'

interface UploadButtonProps {
  onSelect: (file: File) => void
  disabled?: boolean
}

export function UploadButton({ onSelect, disabled }: UploadButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="video/*,audio/*"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0]
          if (file) onSelect(file)
          event.target.value = ''
        }}
      />
      <Button onClick={() => inputRef.current?.click()} disabled={disabled}>
        <Upload aria-hidden="true" />
        Upload media
      </Button>
    </>
  )
}