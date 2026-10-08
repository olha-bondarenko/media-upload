import { screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { App } from './App'
import { renderApp } from './test/render'

function stubFetch() {
  vi.stubGlobal(
    'fetch',
    vi.fn(() =>
      Promise.resolve(
        new Response(JSON.stringify({ items: [], total: 0, limit: 20, offset: 0 }), {
          status: 200,
        }),
      ),
    ),
  )
}

describe('App', () => {
  it('shows the library page', async () => {
    stubFetch()

    renderApp(<App />)

    expect(screen.getByRole('heading', { name: 'Library' })).toBeInTheDocument()
    expect(await screen.findByText('No media yet.')).toBeInTheDocument()
  })

  it('shows a not-found page for unknown routes', () => {
    stubFetch()

    renderApp(<App />, { route: '/nope' })

    expect(screen.getByRole('heading', { name: 'Page not found' })).toBeInTheDocument()
  })
})
