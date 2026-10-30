const TIMEOUT_MS = 5000

/** Reads a video or audio file's duration in seconds, or null if the browser can't tell. */
export function readMediaDuration(file: File): Promise<number | null> {
  return new Promise((resolve) => {
    const element = document.createElement(file.type.startsWith('audio/') ? 'audio' : 'video')
    const url = URL.createObjectURL(file)

    const finish = (duration: number | null) => {
      clearTimeout(timer)
      URL.revokeObjectURL(url)
      element.removeAttribute('src')
      resolve(duration)
    }
    const timer = setTimeout(() => finish(null), TIMEOUT_MS)

    element.preload = 'metadata'
    element.onloadedmetadata = () =>
      finish(Number.isFinite(element.duration) ? element.duration : null)
    element.onerror = () => finish(null)
    element.src = url
  })
}