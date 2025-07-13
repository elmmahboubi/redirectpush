import React from 'react'

export default function EnvironmentCheck() {
  const envVars = {
    NODE_ENV: import.meta.env.NODE_ENV,
    VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL ? 'SET' : 'MISSING',
    VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY ? 'SET' : 'MISSING',
    VITE_BASE_URL: import.meta.env.VITE_BASE_URL ? 'SET' : 'MISSING',
  }

  // Only show in development
  if (import.meta.env.NODE_ENV === 'production') {
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-2 rounded text-xs">
      <div className="font-bold">Environment Variables:</div>
      {Object.entries(envVars).map(([key, value]) => (
        <div key={key}>
          {key}: {value}
        </div>
      ))}
    </div>
  )
} 