import { Route, Routes } from 'react-router-dom'

import { AppShell } from './components/AppShell'
import { LibraryPage } from './pages/LibraryPage'
import { NotFoundPage } from './pages/NotFoundPage'
import { MediaDetailPage } from './pages/MediaDetailPage'

export function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<LibraryPage />} />
        <Route path="media/:id" element={<MediaDetailPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
