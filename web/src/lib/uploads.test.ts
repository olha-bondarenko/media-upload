import { beforeEach, describe, expect, it, vi } from 'vitest'

import { uploadFile } from './uploads'

// Reading a real video's duration needs a browser; pretend every file is 12 seconds long.
vi.mock('./mediaDuration', () => ({ readMediaDuration: vi.fn().mockResolvedValue(12) }))

type ApiCall = { method: string; path: string; body: unknown }

/** Fakes our API: records every call and answers like the backend would. */
function stubApi(): ApiCall[] {
  const calls: ApiCall[] = []

  vi.stubGlobal(
    'fetch',
    vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const method = init?.method ?? 'GET'
      const path = new URL(String(input)).pathname
      const body: unknown = init?.body ? JSON.parse(String(init.body)) : undefined
      calls.push({ method, path, body })

      const json = (data: unknown) => Promise.resolve(new Response(JSON.stringify(data)))

      if (method === 'POST' && path === '/uploads') {
        return json({ media_id: 'm1', part_size: 4, part_count: 3 })
      }
      if (method === 'POST' && path === '/uploads/m1/parts') {
        const { part_numbers } = body as { part_numbers: number[] }
        return json({
          parts: part_numbers.map((n) => ({
            part_number: n,
            url: `https://storage.test/m1?partNumber=${n}`,
          })),
        })
      }
      if (method === 'POST' && path === '/uploads/m1/complete') {
        return json({ id: 'm1', status: 'ready' })
      }
      if (method === 'DELETE' && path === '/uploads/m1') {
        return Promise.resolve(new Response(null, { status: 204 }))
      }
      return Promise.resolve(new Response('{}', { status: 404 }))
    }),
  )

  return calls
}

/** Fakes the browser's XMLHttpRequest, which putPart uses to PUT chunks to storage. */
class FakeXhr {
  static failPart: number | null = null

  status = 0
  upload: { onprogress: ((event: { loaded: number }) => void) | null } = { onprogress: null }
  onload: (() => void) | null = null
  onerror: (() => void) | null = null
  onabort: (() => void) | null = null
  private partNumber = 0

  open(_method: string, url: string) {
    this.partNumber = Number(new URL(url).searchParams.get('partNumber'))
  }

  send(chunk: Blob) {
    // Answer a moment later, like a real network request.
    queueMicrotask(() => {
      if (FakeXhr.failPart === this.partNumber) {
        this.onerror?.()
        return
      }
      this.upload.onprogress?.({ loaded: chunk.size })
      this.status = 200
      this.onload?.()
    })
  }

  getResponseHeader(name: string) {
    return name === 'ETag' ? `"etag-${this.partNumber}"` : null
  }

  abort() {
    this.onabort?.()
  }
}

// 12 bytes with part_size 4 → 3 chunks.
const file = new File(['hello world!'], 'clip.mp4', { type: 'video/mp4' })

beforeEach(() => {
  FakeXhr.failPart = null
  vi.stubGlobal('XMLHttpRequest', FakeXhr)
})

describe('uploadFile', () => {
  it('uploads every chunk and completes with their ETags', async () => {
    const calls = stubApi()
    const onProgress = vi.fn()

    const media = await uploadFile(file, { onProgress })

    expect(media).toEqual({ id: 'm1', status: 'ready' })

    const start = calls.find((call) => call.path === '/uploads')
    expect(start?.body).toMatchObject({
      filename: 'clip.mp4',
      size_bytes: 12,
      duration_seconds: 12,
    })

    const complete = calls.find((call) => call.path === '/uploads/m1/complete')
    const { parts } = complete?.body as { parts: { part_number: number; etag: string }[] }
    expect([...parts].sort((a, b) => a.part_number - b.part_number)).toEqual([
      { part_number: 1, etag: '"etag-1"' },
      { part_number: 2, etag: '"etag-2"' },
      { part_number: 3, etag: '"etag-3"' },
    ])

    // Progress is reported in bytes; the last report is the whole file.
    expect(onProgress).toHaveBeenLastCalledWith(12)
  })

  it('cleans up on the server when a chunk fails', async () => {
    const calls = stubApi()
    FakeXhr.failPart = 2

    await expect(uploadFile(file)).rejects.toThrow('Network error while uploading')

    expect(calls).toContainEqual(expect.objectContaining({ method: 'DELETE', path: '/uploads/m1' }))
    expect(calls.some((call) => call.path === '/uploads/m1/complete')).toBe(false)
  })

  it('stops and cleans up when the upload is cancelled', async () => {
    const calls = stubApi()
    const controller = new AbortController()
    controller.abort()

    await expect(uploadFile(file, { signal: controller.signal })).rejects.toMatchObject({
      name: 'AbortError',
    })

    expect(calls).toContainEqual(expect.objectContaining({ method: 'DELETE', path: '/uploads/m1' }))
    expect(calls.some((call) => call.path === '/uploads/m1/complete')).toBe(false)
  })
})
