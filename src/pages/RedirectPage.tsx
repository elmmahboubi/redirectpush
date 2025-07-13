import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { getGeolocationWithTimeout } from '@/lib/geolocation'

export default function RedirectPage() {
  const { slug } = useParams<{ slug: string }>()

  useEffect(() => {
    const handleRedirect = async () => {
      if (!slug) return

      // Set a maximum time to wait for database operations
      const MAX_WAIT_TIME = 3000 // 3 seconds
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

        // Capture referrer information
        const referrer = document.referrer || null
        const userAgent = navigator.userAgent || null

        // Record the click with referrer information immediately (non-blocking)
        const recordClick = async () => {
          try {
            const { error: referrerError } = await supabase
              .from('referrer_clicks')
              .insert({
                short_link_id: shortLink.id,
                referrer: referrer,
                user_agent: userAgent,
                ip_address: null,
                country: null,
                country_code: null,
                city: null
              })

            if (referrerError) {
              console.error('Failed to record referrer click:', referrerError)
            } else {
              console.log(`Referrer click recorded for slug: ${slug}`, { referrer })
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

        // Get geolocation data and update record (non-blocking)
        const updateGeolocation = async () => {
          try {
            const geoData = await getGeolocationWithTimeout(2000)
            if (geoData) {
              // Update the most recent click record with geolocation data
              const { error: updateError } = await supabase
                .from('referrer_clicks')
                .update({
                  country: geoData.country,
                  country_code: geoData.country_code,
                  city: geoData.city
                })
                .eq('short_link_id', shortLink.id)
                .eq('referrer', referrer)
                .order('clicked_at', { ascending: false })
                .limit(1)

              if (updateError) {
                console.error('Failed to update geolocation data:', updateError)
              } else {
                console.log('Geolocation data updated:', geoData)
              }
            }
          } catch (error) {
            console.warn('Geolocation failed:', error)
          }
        }

        // Start all analytics operations in parallel (non-blocking)
        Promise.allSettled([
          recordClick(),
          updateClickCount(),
          updateGeolocation()
        ]).catch(() => {
          // Ignore any errors in analytics - don't affect redirect
          console.warn('Some analytics operations failed, but redirect will continue')
        })

        // Redirect immediately - don't wait for analytics
        window.location.href = shortLink.original_url
      } catch (error) {
        console.error('Redirect error:', error)
        // Even if there's an error, try to redirect if we have the URL
        if (shortLink?.original_url) {
          window.location.href = shortLink.original_url
        }
      }
    }

    // Add a timeout fallback to ensure redirect always happens
    const redirectTimeout = setTimeout(() => {
      console.warn('Redirect timeout reached - forcing redirect')
      // If we haven't redirected after 3 seconds, force it
      window.location.href = `https://${window.location.host}/${slug}`
    }, 3000)

    handleRedirect().finally(() => {
      clearTimeout(redirectTimeout)
    })
  }, [slug])

  // Show loading state while redirecting
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600 text-lg">Redirecting...</p>
      </div>
    </div>
  )
}