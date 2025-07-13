import { createClient } from '@supabase/supabase-js'

// Add error handling for missing environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Check if environment variables are available
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables:', {
    VITE_SUPABASE_URL: supabaseUrl ? 'SET' : 'MISSING',
    VITE_SUPABASE_ANON_KEY: supabaseAnonKey ? 'SET' : 'MISSING'
  })
}

// Create Supabase client with error handling
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
)

export type ShortLink = {
  id: string
  slug: string
  original_url: string
  click_count: number
  created_at: string
}

export type ReferrerClick = {
  id: string
  short_link_id: string
  referrer: string | null
  user_agent: string | null
  ip_address: string | null
  country: string | null
  country_code: string | null
  city: string | null
  clicked_at: string
}

// Helper function to extract domain from referrer
export const extractDomain = (referrer: string | null): string => {
  if (!referrer) return 'Direct'
  
  try {
    const url = new URL(referrer)
    return url.hostname
  } catch {
    return 'Unknown'
  }
}

// Helper function to get country flag emoji
export const getCountryFlag = (countryCode: string | null): string => {
  if (!countryCode) return '🌍'
  
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0))
  
  return String.fromCodePoint(...codePoints)
}