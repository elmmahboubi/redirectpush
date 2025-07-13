import { Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import RedirectPage from './pages/RedirectPage'
import NotFoundPage from './pages/NotFoundPage'
import { Toaster } from 'sonner'

function App() {
  // Add error logging
  console.log('App component rendering...')
  console.log('Environment check:', {
    NODE_ENV: import.meta.env.NODE_ENV,
    VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL ? 'SET' : 'MISSING',
    VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY ? 'SET' : 'MISSING'
  })

  return (
    <>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/:slug" element={<RedirectPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      <Toaster position="top-right" />
    </>
  )
}

export default App