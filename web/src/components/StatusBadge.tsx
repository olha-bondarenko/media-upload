import type { ComponentProps } from 'react'

import { Badge } from '@/components/ui/badge'
import type { MediaStatus } from '@/lib/types/media'

type BadgeVariant = ComponentProps<typeof Badge>['variant']

const STATUS_STYLES = {
  uploading: { label: 'Uploading', variant: 'secondary' },
  processing: { label: 'Processing', variant: 'warning' },
  ready: { label: 'Ready', variant: 'success' },
  failed: { label: 'Failed', variant: 'destructive' },
} satisfies Record<MediaStatus, { label: string; variant: BadgeVariant }>

export function StatusBadge({ status }: { status: MediaStatus }) {
  const { label, variant } = STATUS_STYLES[status]
  return <Badge variant={variant}>{label}</Badge>
}