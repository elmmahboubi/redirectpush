// Geolocation service using free IP geolocation APIs

export interface GeolocationData {
  country: string
  country_code: string
  city: string | null
}

// Function to get geolocation data from IP address
export const getGeolocationFromIP = async (): Promise<GeolocationData | null> => {
  try {
    // Try multiple free geolocation APIs for reliability
    const apis = [
      'https://ipapi.co/json/',
      'https://ipapi.com/ip_api.php?ip=',
      'https://api.ipify.org?format=json'
    ]

    for (const api of apis) {
      try {
        const response = await fetch(api, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
        })

        if (response.ok) {
          const data = await response.json()
          
          // Handle different API response formats
          if (data.country) {
            return {
              country: data.country_name || data.country,
              country_code: data.country_code || data.countryCode,
              city: data.city || null
            }
          }
        }
      } catch (error) {
        console.warn(`Failed to fetch from ${api}:`, error)
        continue
      }
    }

    // Fallback: try to get IP first, then geolocate
    try {
      const ipResponse = await fetch('https://api.ipify.org?format=json')
      if (ipResponse.ok) {
        const { ip } = await ipResponse.json()
        const geoResponse = await fetch(`https://ipapi.co/${ip}/json/`)
        if (geoResponse.ok) {
          const geoData = await geoResponse.json()
          return {
            country: geoData.country_name || 'Unknown',
            country_code: geoData.country_code || 'XX',
            city: geoData.city || null
          }
        }
      }
    } catch (error) {
      console.warn('Failed to get IP and geolocate:', error)
    }

    return null
  } catch (error) {
    console.error('Geolocation error:', error)
    return null
  }
}

// Function to get geolocation data with timeout
export const getGeolocationWithTimeout = async (timeoutMs: number = 3000): Promise<GeolocationData | null> => {
  try {
    const timeoutPromise = new Promise<null>((resolve) => {
      setTimeout(() => resolve(null), timeoutMs)
    })

    const geolocationPromise = getGeolocationFromIP()
    
    const result = await Promise.race([geolocationPromise, timeoutPromise])
    return result
  } catch (error) {
    console.error('Geolocation timeout error:', error)
    return null
  }
} 