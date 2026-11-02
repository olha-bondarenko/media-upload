import { describe, expect, it } from 'vitest'

import { can, type Action } from './permissions'
import type { Role, User } from './types/auth'

function userWith(role: Role): User {
  return { id: `demo-${role}`, name: `Demo ${role}`, role }
}

// Mirrors the backend's permission table in api/tests/test_permissions.py.
const TABLE: [string, User | null, Record<Action, boolean>][] = [
  ['guest', null, { upload: false, edit: false, delete: false }],
  ['viewer', userWith('viewer'), { upload: false, edit: false, delete: false }],
  ['editor', userWith('editor'), { upload: true, edit: true, delete: false }],
  ['admin', userWith('admin'), { upload: true, edit: true, delete: true }],
]

describe('can', () => {
  it.each(TABLE)('applies the permission table for a %s', (_label, user, expected) => {
    expect(can(user, 'upload')).toBe(expected.upload)
    expect(can(user, 'edit')).toBe(expected.edit)
    expect(can(user, 'delete')).toBe(expected.delete)
  })
})
