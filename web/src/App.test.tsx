import { screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { App } from './App'
import { renderApp } from './test/render'

function stubHealth(response: Promise<Response>) {
  vi.stubGlobal('fetch', vi.fn(() => response))
}

describe('App', () => {
  it('shows the library page and reports the API as connected', async () => {
    stubHealth(Promise.resolve(new Response(JSON.stringify({ status: 'ok' }), { status: 200 })))

    renderApp(<App />)

    expect(screen.getByRole('heading', { name: 'Library' })).toBeInTheDocument()
    expect(await screen.findByText('API connected')).toBeInTheDocument()
  })

  it('reports the API as unreachable when the health check fails', async () => {
    stubHealth(Promise.reject(new TypeError('Failed to fetch')))

    renderApp(<App />)

    expect(await screen.findByText('API unreachable')).toBeInTheDocument()
  })

  it('shows a not-found page for unknown routes', () => {
    stubHealth(Promise.resolve(new Response(JSON.stringify({ status: 'ok' }), { status: 200 })))

    renderApp(<App />, { route: '/nope' })

    expect(screen.getByRole('heading', { name: 'Page not found' })).toBeInTheDocument()
  })
})
