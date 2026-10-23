import { useState, type FormEvent } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import type { Media, MediaUpdate } from '@/lib/types/media'

const MAX_TITLE = 200
const MAX_DESCRIPTION = 5000
const MAX_TAGS = 10

type FieldErrors = Partial<Record<'title' | 'description' | 'tags', string>>

function parseTags(text: string): string[] {
  const tags = text
    .split(',')
    .map((tag) => tag.trim().toLowerCase())
    .filter(Boolean)
  return [...new Set(tags)]
}

interface MediaEditFormProps {
  media: Media
  isSaving: boolean
  error: string | null
  onSave: (changes: MediaUpdate) => void
  onCancel: () => void
}

export function MediaEditForm({ media, isSaving, error, onSave, onCancel }: MediaEditFormProps) {
  const [title, setTitle] = useState(media.title)
  const [description, setDescription] = useState(media.description)
  const [tagsText, setTagsText] = useState(media.tags.join(', '))
  const [submitted, setSubmitted] = useState(false)

  const tags = parseTags(tagsText)
  const trimmedTitle = title.trim()

  const errors: FieldErrors = {}
  if (!trimmedTitle) errors.title = 'Title is required.'
  else if (trimmedTitle.length > MAX_TITLE) errors.title = `Keep the title under ${MAX_TITLE} characters.`
  if (description.length > MAX_DESCRIPTION)
    errors.description = `Keep the description under ${MAX_DESCRIPTION} characters.`
  if (tags.length > MAX_TAGS) errors.tags = `Use at most ${MAX_TAGS} tags.`

  const changes: MediaUpdate = {}
  if (trimmedTitle !== media.title) changes.title = trimmedTitle
  if (description !== media.description) changes.description = description
  if (tags.join(',') !== media.tags.join(',')) changes.tags = tags
  const isDirty = Object.keys(changes).length > 0

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitted(true)
    if (Object.keys(errors).length > 0 || !isDirty) return
    onSave(changes)
  }

  const showError = (field: keyof FieldErrors) => (submitted ? errors[field] : undefined)

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5" aria-labelledby="edit-heading">
      <h2 id="edit-heading" className="text-lg font-semibold">
        Edit details
      </h2>

      <Field id="edit-title" label="Title" error={showError('title')}>
        <Input
          id="edit-title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          aria-invalid={Boolean(showError('title'))}
          aria-describedby={showError('title') ? 'edit-title-error' : undefined}
          autoFocus
        />
      </Field>

      <Field
        id="edit-description"
        label="Description"
        error={showError('description')}
        hint={`${description.length}/${MAX_DESCRIPTION}`}
      >
        <Textarea
          id="edit-description"
          rows={5}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          aria-invalid={Boolean(showError('description'))}
          aria-describedby={showError('description') ? 'edit-description-error' : undefined}
        />
      </Field>

      <Field
        id="edit-tags"
        label="Tags"
        error={showError('tags')}
        hint="Separate tags with commas."
      >
        <Input
          id="edit-tags"
          value={tagsText}
          onChange={(event) => setTagsText(event.target.value)}
          aria-invalid={Boolean(showError('tags'))}
          aria-describedby={showError('tags') ? 'edit-tags-error' : 'edit-tags-hint'}
        />
      </Field>

      {error && (
        <p role="alert" className="text-sm text-destructive">
          Couldn't save: {error}
        </p>
      )}

      <div className="flex gap-2">
        <Button type="submit" disabled={isSaving || !isDirty}>
          {isSaving ? 'Saving…' : 'Save changes'}
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel} disabled={isSaving}>
          Cancel
        </Button>
      </div>
    </form>
  )
}

interface FieldProps {
  id: string
  label: string
  error?: string
  hint?: string
  children: React.ReactNode
}

function Field({ id, label, error, hint, children }: FieldProps) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="text-sm text-destructive">
          {error}
        </p>
      ) : (
        hint && (
          <p id={`${id}-hint`} className="text-xs text-muted-foreground">
            {hint}
          </p>
        )
      )}
    </div>
  )
}