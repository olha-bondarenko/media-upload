import { useState } from 'react'

import { STATUS_STYLES } from '@/components/StatusBadge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useDebouncedCallback } from '@/hooks/useDebouncedCallback'
import { MEDIA_STATUSES, type MediaStatus } from '@/lib/types/media'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface LibraryFiltersProps {
  q: string
  status: MediaStatus | undefined
  hasFilters: boolean
  onQueryChange: (value: string) => void
  onStatusChange: (value: MediaStatus | undefined) => void
  onClear: () => void
}

const STATUS_LIST: { label: string; value: MediaStatus | null }[] = [
  { label: 'All statuses', value: null },
  ...MEDIA_STATUSES.map((value) => ({ label: STATUS_STYLES[value].label, value })),
]

export function LibraryFilters({
  q,
  status,
  hasFilters,
  onQueryChange,
  onStatusChange,
  onClear,
}: LibraryFiltersProps) {
  const [input, setInput] = useState(q)
  const debouncedQueryChange = useDebouncedCallback(onQueryChange, 300)

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      <label htmlFor="media-search" className="sr-only">
        Search by title
      </label>
      <Input
        id="media-search"
        type="search"
        placeholder="Search by title…"
        value={input}
        onChange={(event) => {
          setInput(event.target.value)
          debouncedQueryChange(event.target.value)
        }}
        className="w-full sm:w-72"
      />

      <label htmlFor="media-status" className="sr-only">
        Filter by status
      </label>

      <Select
        items={STATUS_LIST}
        value={status ?? null}
        onValueChange={(value) => onStatusChange(value ?? undefined)}
      >
        <SelectTrigger id="media-status" className="w-full max-w-48">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {STATUS_LIST.map((item) => (
              <SelectItem key={item.label} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>

      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setInput('')
            debouncedQueryChange('')
            onClear()
          }}
        >
          Clear filters
        </Button>
      )}
    </div>
  )
}
