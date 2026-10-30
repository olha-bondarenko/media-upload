import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'

import { App } from './App'
import './index.css'
import { UploadsProvider } from './contexts/UploadsProvider'

const queryClient = new QueryClient()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <UploadsProvider>
          <App />
        </UploadsProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
)
