export type Role = 'viewer' | 'editor' | 'admin'

export type User = {
  id: string
  name: string
  role: Role
}

export type Session = {
  token: string
  user: User
}