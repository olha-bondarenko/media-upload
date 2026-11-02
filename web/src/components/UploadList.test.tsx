import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

import type { UploadItem } from '@/hooks/useUploadQueue'
import type { Media } from '@/lib/types/media'

import { UploadList } from './UploadList'

function item(overrides: Partial<UploadItem>): UploadItem {
  return {
    id: 'u1',
    file: new File(['0123456789'], 'clip.mp4', { type: 'video/mp4' }),
    status: 'uploading',
    uploadedBytes: 0,
    ...overrides,
  }
}

function renderList(items: UploadItem[]) {
  const onCancel = vi.fn()
  const onDismiss = vi.fn()
  render(
    <MemoryRouter>
      <UploadList items={items} onCancel={onCancel} onDismiss={onDismiss} />
    </MemoryRouter>,
  )
  return { onCancel, onDismiss }
}

describe('UploadList', () => {
  it('shows progress and cancels the right upload', async () => {
    const user = userEvent.setup()
    const { onCancel } = renderList([
      item({ id: 'u1', uploadedBytes: 5 }),
      item({ id: 'u2', file: new File(['x'], 'other.mp4', { type: 'video/mp4' }) }),
    ])

    expect(screen.getByRole('progressbar', { name: 'Uploading clip.mp4' })).toHaveAttribute(
      'aria-valuenow',
      '50',
    )
    expect(screen.getByText('5 B of 10 B')).toBeInTheDocument()

    await user.click(screen.getAllByRole('button', { name: 'Cancel' })[1])

    expect(onCancel).toHaveBeenCalledWith('u2')
  })

  it('shows speed and time remaining once known', () => {
    renderList([item({ uploadedBytes: 5, bytesPerSecond: 1 })])

    // 5 bytes left at 1 byte per second → 5 seconds.
    expect(screen.getByText('1 B/s · 5 s left')).toBeInTheDocument()
  })

  it('links to a finished upload and can dismiss it', async () => {
    const user = userEvent.setup()
    const media = { id: 'm1', title: 'clip' } as Media
    const { onDismiss } = renderList([item({ status: 'done', media })])

    expect(screen.getByRole('link', { name: 'View' })).toHaveAttribute('href', '/media/m1')
    expect(screen.queryByRole('button', { name: 'Cancel' })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Dismiss clip.mp4' }))

    expect(onDismiss).toHaveBeenCalledWith('u1')
  })

  it('shows why an upload failed', () => {
    renderList([item({ status: 'error', error: 'Only video and audio files can be uploaded' })])

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Only video and audio files can be uploaded',
    )
  })
})
