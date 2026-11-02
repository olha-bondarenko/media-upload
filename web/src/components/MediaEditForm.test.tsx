import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import type { Media } from '@/lib/types/media'

import { MediaEditForm } from './MediaEditForm'

const MEDIA: Media = {
  id: 'm1',
  title: 'Product demo',
  description: 'Walkthrough of the dashboard.',
  tags: ['demo'],
  filename: 'demo.mp4',
  content_type: 'video/mp4',
  size_bytes: 1000,
  status: 'ready',
  duration_seconds: 184,
  playback_url: null,
  created_at: '2026-10-07T12:00:00Z',
  updated_at: '2026-10-07T12:00:00Z',
}

function renderForm(props: Partial<Parameters<typeof MediaEditForm>[0]> = {}) {
  const onSave = vi.fn()
  const onCancel = vi.fn()
  render(
    <MediaEditForm
      media={MEDIA}
      isSaving={false}
      error={null}
      onSave={onSave}
      onCancel={onCancel}
      {...props}
    />,
  )
  return { onSave, onCancel }
}

describe('MediaEditForm', () => {
  it('starts with the current values and Save disabled', () => {
    renderForm()

    expect(screen.getByLabelText('Title')).toHaveValue('Product demo')
    expect(screen.getByLabelText('Tags')).toHaveValue('demo')
    expect(screen.getByRole('button', { name: 'Save changes' })).toBeDisabled()
  })

  it('sends only the fields that changed', async () => {
    const user = userEvent.setup()
    const { onSave } = renderForm()

    await user.clear(screen.getByLabelText('Title'))
    await user.type(screen.getByLabelText('Title'), 'Renamed demo')
    await user.click(screen.getByRole('button', { name: 'Save changes' }))

    expect(onSave).toHaveBeenCalledWith({ title: 'Renamed demo' })
  })

  it('trims, lowercases and de-duplicates tags', async () => {
    const user = userEvent.setup()
    const { onSave } = renderForm()

    await user.clear(screen.getByLabelText('Tags'))
    await user.type(screen.getByLabelText('Tags'), 'Demo, demo,  Product ,')
    await user.click(screen.getByRole('button', { name: 'Save changes' }))

    expect(onSave).toHaveBeenCalledWith({ tags: ['demo', 'product'] })
  })

  it('shows validation errors only after submitting, and does not save', async () => {
    const user = userEvent.setup()
    const { onSave } = renderForm()

    await user.clear(screen.getByLabelText('Title'))
    expect(screen.queryByText('Title is required.')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Save changes' }))

    expect(screen.getByText('Title is required.')).toBeInTheDocument()
    expect(screen.getByLabelText('Title')).toHaveAttribute('aria-invalid', 'true')
    expect(onSave).not.toHaveBeenCalled()
  })

  it('shows the server error it is given', () => {
    renderForm({ error: 'Storage is unavailable' })

    expect(screen.getByRole('alert')).toHaveTextContent("Couldn't save: Storage is unavailable")
  })

  it('calls onCancel', async () => {
    const user = userEvent.setup()
    const { onCancel } = renderForm()

    await user.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(onCancel).toHaveBeenCalled()
  })
})
