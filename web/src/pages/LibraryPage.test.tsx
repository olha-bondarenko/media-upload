import { screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { App } from '@/App'
import { setSession } from '@/lib/session'
import { renderApp } from '@/test/render'

const EMPTY_PAGE = { items: [], total: 0, limit: 10, offset: 0 }

beforeEach(() => {
  // A fresh Response per call: a body can only be read once.
  vi.stubGlobal(
    'fetch',
    vi.fn(() => Promise.resolve(new Response(JSON.stringify(EMPTY_PAGE), { status: 200 }))),
  )
})

afterEach(() => {
  setSession(null)
})

describe('LibraryPage', () => {
  it('sends the filters from the URL to the API', async () => {
    renderApp(<App />, { route: '/?status=failed' })

    expect(await screen.findByText('No media matches your filters.')).toBeInTheDocument()
    const [url] = vi.mocked(fetch).mock.calls[0]
    expect(String(url)).toContain('status=failed')
  })

  it('shows an empty state and an upload hint to guests', async () => {
    renderApp(<App />)

    expect(await screen.findByText('No media yet.')).toBeInTheDocument()
    expect(screen.getByText('Switch to Editor or Admin to upload.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Upload media' })).not.toBeInTheDocument()
  })

  it('shows the upload button to editors', async () => {
    setSession({ token: 't', user: { id: 'demo-editor', name: 'Demo Editor', role: 'editor' } })

    renderApp(<App />)

    expect(await screen.findByRole('button', { name: 'Upload media' })).toBeInTheDocument()
    expect(screen.queryByText('Switch to Editor or Admin to upload.')).not.toBeInTheDocument()
  })
})
