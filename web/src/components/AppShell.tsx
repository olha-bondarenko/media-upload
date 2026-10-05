import { NavLink, Outlet } from 'react-router-dom'

import { ApiStatus } from './ApiStatus'

export function AppShell() {
  return (
    <div className="shell">
      <header className="shell__header">
        <span className="shell__brand">Media Upload</span>
        <nav aria-label="Main">
          <NavLink to="/" end>
            Library
          </NavLink>
        </nav>
        <ApiStatus />
      </header>
      <main className="shell__main">
        <Outlet />
      </main>
    </div>
  )
}
