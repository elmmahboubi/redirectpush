// Robust geolocation service with VPN/proxy detection

export interface GeolocationData {
  country: string
  country_code: string
  city: string | null
  isProxy?: boolean
  realIP?: string
}

// Function to get real IP address (even behind VPNs/proxies)
const getRealIP = async (): Promise<string | null> => {
  const ipAPIs = [
    'https://api.ipify.org?format=json',
    'https://api.myip.com',
    'https://ipapi.co/json/',
    'https://api.ip.sb/ip',
    'https://icanhazip.com'
  ]

  for (const api of ipAPIs) {
    try {
      const response = await fetch(api, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        // Add timeout
        signal: AbortSignal.timeout(3000)
      })

      if (response.ok) {
        const data = await response.json()
        
        // Handle different response formats
        if (data.ip) return data.ip
        if (typeof data === 'string') return data.trim()
        if (data.query) return data.query
      }
    } catch (error) {
      console.warn(`Failed to get IP from ${api}:`, error)
      continue
    }
  }

  return null
}

// Function to get detailed geolocation data from IP
const getGeolocationFromIPAddress = async (ip: string): Promise<GeolocationData | null> => {
  const geoAPIs = [
    `https://ipapi.co/${ip}/json/`,
    `https://ipapi.com/ip_api.php?ip=${ip}`,
    `https://ip-api.com/json/${ip}`,
    `https://api.ipgeolocation.io/ipgeo?apiKey=free&ip=${ip}`,
    `https://extreme-ip-lookup.com/json/${ip}`
  ]

  for (const api of geoAPIs) {
    try {
      const response = await fetch(api, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        signal: AbortSignal.timeout(3000)
      })

      if (response.ok) {
        const data = await response.json()
        
        // Handle different API response formats
        let country = null
        let countryCode = null
        let city = null
        let isProxy = false

        // ipapi.co format
        if (data.country_name && data.country_code) {
          country = data.country_name
          countryCode = data.country_code
          city = data.city
          isProxy = data.proxy || data.hosting || false
        }
        // ip-api.com format
        else if (data.country && data.countryCode) {
          country = data.country
          countryCode = data.countryCode
          city = data.city
          isProxy = data.proxy || data.hosting || false
        }
        // ipapi.com format
        else if (data.country) {
          country = data.country
          countryCode = data.country_code || data.countryCode
          city = data.city
          isProxy = data.proxy || false
        }
        // ipgeolocation.io format
        else if (data.country_name) {
          country = data.country_name
          countryCode = data.country_code2
          city = data.city
          isProxy = data.security?.proxy || false
        }
        // extreme-ip-lookup format
        else if (data.country) {
          country = data.country
          countryCode = data.countryCode
          city = data.city
          isProxy = data.proxy || false
        }

        if (country && countryCode) {
          return {
            country,
            country_code: countryCode,
            city,
            isProxy,
            realIP: ip
          }
        }
      }
    } catch (error) {
      console.warn(`Failed to get geolocation from ${api}:`, error)
      continue
    }
  }

  return null
}

// Main function to get geolocation data with robust IP detection
export const getGeolocationFromIP = async (): Promise<GeolocationData | null> => {
  try {
    console.log('Starting robust geolocation detection...')
    
    // Step 1: Get real IP address
    const realIP = await getRealIP()
    if (!realIP) {
      console.warn('Could not detect IP address')
      return null
    }

    console.log('Detected IP:', realIP)

    // Step 2: Get geolocation data from IP
    const geoData = await getGeolocationFromIPAddress(realIP)
    if (geoData) {
      console.log('Geolocation successful:', geoData)
      return geoData
    }

    // Step 3: Fallback - try direct geolocation APIs
    const directAPIs = [
      'https://ipapi.co/json/',
      'https://ip-api.com/json/',
      'https://api.ipgeolocation.io/ipgeo?apiKey=free',
      'https://extreme-ip-lookup.com/json/'
    ]

    for (const api of directAPIs) {
      try {
        const response = await fetch(api, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
          signal: AbortSignal.timeout(3000)
        })

        if (response.ok) {
          const data = await response.json()
          
          // Handle different response formats
          let country = null
          let countryCode = null
          let city = null
          let isProxy = false

          if (data.country_name && data.country_code) {
            country = data.country_name
            countryCode = data.country_code
            city = data.city
            isProxy = data.proxy || data.hosting || false
          } else if (data.country && data.countryCode) {
            country = data.country
            countryCode = data.countryCode
            city = data.city
            isProxy = data.proxy || data.hosting || false
          } else if (data.country) {
            country = data.country
            countryCode = data.country_code || data.countryCode
            city = data.city
            isProxy = data.proxy || false
          }

          if (country && countryCode) {
            console.log('Fallback geolocation successful:', { country, countryCode, city, isProxy })
            return {
              country,
              country_code: countryCode,
              city,
              isProxy,
              realIP: data.ip || realIP
            }
          }
        }
      } catch (error) {
        console.warn(`Failed to get direct geolocation from ${api}:`, error)
        continue
      }
    }

    console.warn('All geolocation methods failed')
    return null
  } catch (error) {
    console.error('Geolocation error:', error)
    return null
  }
}

// Function to get geolocation data with timeout
export const getGeolocationWithTimeout = async (timeoutMs: number = 5000): Promise<GeolocationData | null> => {
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

// Test function for debugging
export const testGeolocation = async () => {
  console.log('Testing robust geolocation...')
  const result = await getGeolocationWithTimeout(10000)
  console.log('Geolocation test result:', result)
  return result
} 