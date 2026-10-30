import type { Role, User } from './types/auth'

export type Action = 'upload' | 'edit' | 'delete'

const ALLOWED_ROLES: Record<Action, Role[]> = {
  upload: ['editor', 'admin'],
  edit: ['editor', 'admin'],
  delete: ['admin'],
}

export function can(user: User | null, action: Action): boolean {
  return user !== null && ALLOWED_ROLES[action].includes(user.role)
}