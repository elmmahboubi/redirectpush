import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { getGeolocationWithTimeout } from '@/lib/geolocation'

export default function RedirectPage() {
  const { slug } = useParams<{ slug: string }>()
  const [destinationTitle, setDestinationTitle] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const handleRedirect = async () => {
      if (!slug) return

      // Set a maximum time to wait for database operations
      const MAX_WAIT_TIME = 5000 // 5 seconds
      const startTime = Date.now()

      try {
        // Look up the short link in the database
        const { data: shortLink, error } = await supabase
          .from('short_links')
          .select('id, original_url, click_count')
          .eq('slug', slug)
          .single()

        if (error || !shortLink) {
          console.log(`Slug not found: ${slug}`)
          return
        }

        // Try to fetch the destination page title
        const fetchPageTitle = async (url: string) => {
          try {
            const response = await fetch(url, {
              method: 'HEAD',
              mode: 'no-cors'
            })
            // Since we can't read the response due to CORS, we'll extract domain
            const urlObj = new URL(url)
            const domain = urlObj.hostname.replace('www.', '')
            setDestinationTitle(domain)
          } catch (error) {
            // Fallback to domain name
            try {
              const urlObj = new URL(url)
              const domain = urlObj.hostname.replace('www.', '')
              setDestinationTitle(domain)
            } catch {
              setDestinationTitle('Destination')
            }
          }
        }

        // Fetch page title in background
        fetchPageTitle(shortLink.original_url)

        // Capture referrer information
        const referrer = document.referrer || null
        const userAgent = navigator.userAgent || null

        // Get geolocation data FIRST (this is critical for proper tracking)
        console.log('Getting geolocation data before recording click...')
        const geoData = await getGeolocationWithTimeout(4000) // 4 second timeout for robust detection
        
        if (geoData) {
          console.log('Geolocation data received:', geoData)
        } else {
          console.warn('No geolocation data received, will record with null values')
        }

        // Record the click with COMPLETE data including geolocation
        const recordClick = async () => {
          try {
            const clickData = {
              short_link_id: shortLink.id,
              referrer: referrer,
              user_agent: userAgent,
              ip_address: geoData?.ip_address || null,
              country: geoData?.country || null,
              country_code: geoData?.country_code || null,
              city: geoData?.city || null
            }

            console.log('Recording click with data:', clickData)

            const { error: referrerError } = await supabase
              .from('referrer_clicks')
              .insert(clickData)

            if (referrerError) {
              console.error('Failed to record referrer click:', referrerError)
            } else {
              console.log(`Click recorded successfully for slug: ${slug}`, clickData)
            }
          } catch (error) {
            console.error('Error recording click:', error)
          }
        }

        // Increment click count (non-blocking)
        const updateClickCount = async () => {
          try {
            await supabase
              .from('short_links')
              .update({ click_count: shortLink.click_count + 1 })
              .eq('slug', slug)
            console.log(`Click count updated for slug: ${slug}`)
          } catch (error) {
            console.error('Failed to update click count:', error)
          }
        }

        // Execute both operations in parallel
        await Promise.allSettled([
          recordClick(),
          updateClickCount()
        ])

        // Redirect after recording is complete
        console.log('Redirecting to:', shortLink.original_url)
        window.location.href = shortLink.original_url

      } catch (error) {
        console.error('Redirect error:', error)
        // Even if there's an error, try to redirect if we have the URL
        try {
          const { data: shortLink } = await supabase
            .from('short_links')
            .select('original_url')
            .eq('slug', slug)
            .single()
          
          if (shortLink?.original_url) {
            window.location.href = shortLink.original_url
          }
        } catch (fallbackError) {
          console.error('Fallback redirect failed:', fallbackError)
        }
      }
    }

    // Add a timeout fallback to ensure redirect always happens
    const redirectTimeout = setTimeout(() => {
      console.warn('Redirect timeout reached - forcing redirect')
      // If we haven't redirected after 5 seconds, force it
      window.location.href = `https://${window.location.host}/${slug}`
    }, 5000)

    handleRedirect().finally(() => {
      clearTimeout(redirectTimeout)
    })
  }, [slug])

  // Show loading state while redirecting
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600 text-lg">Loading...</p>
        {destinationTitle && (
          <p className="text-gray-400 text-sm mt-2">
            Preparing to visit <span className="font-medium text-blue-600">{destinationTitle}</span>
          </p>
        )}
      </div>
    </div>
  )
}