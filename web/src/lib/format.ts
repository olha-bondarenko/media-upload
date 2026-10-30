const UNITS = ['B', 'KB', 'MB', 'GB', 'TB']

export function formatBytes(bytes: number): string {
  if (bytes < 1000) return `${bytes} B`
  let value = bytes
  let unit = 0
  while (value >= 1000 && unit < UNITS.length - 1) {
    value /= 1000
    unit += 1
  }
  return `${value.toFixed(value < 10 ? 1 : 0)} ${UNITS[unit]}`
}

export function formatDuration(seconds: number | null): string {
  if (seconds === null) return '—'
  const total = Math.round(seconds)
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  const pad = (n: number) => String(n).padStart(2, '0')
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`
}

export function formatDate(iso: string, locale?: string): string {
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(new Date(iso))
}

export function formatSpeed(bytesPerSecond: number): string {
  return `${formatBytes(Math.round(bytesPerSecond))}/s`
}

export function formatTimeRemaining(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return ''
  if (seconds < 5) return 'almost done'
  if (seconds < 60) return `${Math.ceil(seconds)} s left`
  const minutes = Math.round(seconds / 60)
  if (minutes < 60) return `${minutes} min left`
  return `${Math.floor(minutes / 60)} h ${minutes % 60} min left`
}