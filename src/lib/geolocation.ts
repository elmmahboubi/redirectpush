// Ultra-robust geolocation service with guaranteed IP detection

export interface GeolocationData {
  country: string
  country_code: string
  city: string | null
  ip_address: string | null
  isProxy?: boolean
  realIP?: string
}

// Enhanced IP detection with multiple fallbacks
const getRealIP = async (): Promise<string | null> => {
  const ipAPIs = [
    'https://api.ipify.org?format=json',
    'https://api.myip.com',
    'https://ipapi.co/json/',
    'https://api.ip.sb/ip',
    'https://icanhazip.com',
    'https://api64.ipify.org?format=json',
    'https://httpbin.org/ip',
    'https://api.ipify.org'
  ]

  for (const api of ipAPIs) {
    try {
      console.log(`Trying IP API: ${api}`)
      const response = await fetch(api, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        signal: AbortSignal.timeout(2000)
      })

      if (response.ok) {
        const contentType = response.headers.get('content-type')
        
        if (contentType && contentType.includes('application/json')) {
          const data = await response.json()
          
          // Handle different response formats
          if (data.ip) return data.ip
          if (data.origin) return data.origin
          if (data.query) return data.query
          if (typeof data === 'string') return data.trim()
        } else {
          // Handle plain text responses
          const text = await response.text()
          const ip = text.trim()
          if (ip && ip.match(/^\d+\.\d+\.\d+\.\d+$/)) {
            return ip
          }
        }
      }
    } catch (error) {
      console.warn(`Failed to get IP from ${api}:`, error)
      continue
    }
  }

  console.error('All IP detection methods failed')
  return null
}

// Enhanced geolocation from IP with multiple APIs
const getGeolocationFromIPAddress = async (ip: string): Promise<GeolocationData | null> => {
  const geoAPIs = [
    `https://ipapi.co/${ip}/json/`,
    `https://ip-api.com/json/${ip}`,
    `https://ipapi.com/ip_api.php?ip=${ip}`,
    `https://extreme-ip-lookup.com/json/${ip}`,
    `https://api.ipgeolocation.io/ipgeo?apiKey=free&ip=${ip}`,
    `https://ipinfo.io/${ip}/json`
  ]

  for (const api of geoAPIs) {
    try {
      console.log(`Trying geolocation API: ${api}`)
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
        // ipinfo.io format
        else if (data.country) {
          country = data.country
          countryCode = data.country
          city = data.city
          isProxy = data.proxy || false
        }

        if (country && countryCode) {
          console.log(`Geolocation successful from ${api}:`, { country, countryCode, city, isProxy })
          return {
            country,
            country_code: countryCode,
            city,
            ip_address: ip,
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

// Main function to get geolocation data with ultra-robust IP detection
export const getGeolocationFromIP = async (): Promise<GeolocationData | null> => {
  try {
    console.log('Starting ultra-robust geolocation detection...')
    
    // Step 1: Get real IP address with multiple fallbacks
    const realIP = await getRealIP()
    if (!realIP) {
      console.warn('Could not detect IP address, trying direct geolocation APIs')
      
      // Fallback: Try direct geolocation APIs without IP
      const directAPIs = [
        'https://ipapi.co/json/',
        'https://ip-api.com/json/',
        'https://extreme-ip-lookup.com/json/',
        'https://ipinfo.io/json'
      ]

      for (const api of directAPIs) {
        try {
          console.log(`Trying direct geolocation API: ${api}`)
          const response = await fetch(api, {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
            },
            signal: AbortSignal.timeout(3000)
          })

          if (response.ok) {
            const data = await response.json()
            
            let country = null
            let countryCode = null
            let city = null
            let isProxy = false
            let ip = null

            if (data.country_name && data.country_code) {
              country = data.country_name
              countryCode = data.country_code
              city = data.city
              ip = data.ip
              isProxy = data.proxy || data.hosting || false
            } else if (data.country && data.countryCode) {
              country = data.country
              countryCode = data.countryCode
              city = data.city
              ip = data.query || data.ip
              isProxy = data.proxy || data.hosting || false
            } else if (data.country) {
              country = data.country
              countryCode = data.country_code || data.countryCode
              city = data.city
              ip = data.ip
              isProxy = data.proxy || false
            }

            if (country && countryCode) {
              console.log('Direct geolocation successful:', { country, countryCode, city, ip, isProxy })
              return {
                country,
                country_code: countryCode,
                city,
                ip_address: ip,
                isProxy,
                realIP: ip
              }
            }
          }
        } catch (error) {
          console.warn(`Failed to get direct geolocation from ${api}:`, error)
          continue
        }
      }

      console.error('All geolocation methods failed')
      return null
    }

    console.log('Detected IP:', realIP)

    // Step 2: Get geolocation data from IP
    const geoData = await getGeolocationFromIPAddress(realIP)
    if (geoData) {
      console.log('Geolocation successful:', geoData)
      return geoData
    }

    // Step 3: Final fallback - try direct geolocation APIs
    const finalAPIs = [
      'https://ipapi.co/json/',
      'https://ip-api.com/json/',
      'https://extreme-ip-lookup.com/json/',
      'https://ipinfo.io/json'
    ]

    for (const api of finalAPIs) {
      try {
        console.log(`Trying final fallback API: ${api}`)
        const response = await fetch(api, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
          signal: AbortSignal.timeout(3000)
        })

        if (response.ok) {
          const data = await response.json()
          
          let country = null
          let countryCode = null
          let city = null
          let isProxy = false
          let ip = null

          if (data.country_name && data.country_code) {
            country = data.country_name
            countryCode = data.country_code
            city = data.city
            ip = data.ip
            isProxy = data.proxy || data.hosting || false
          } else if (data.country && data.countryCode) {
            country = data.country
            countryCode = data.countryCode
            city = data.city
            ip = data.query || data.ip
            isProxy = data.proxy || data.hosting || false
          } else if (data.country) {
            country = data.country
            countryCode = data.country_code || data.countryCode
            city = data.city
            ip = data.ip
            isProxy = data.proxy || false
          }

          if (country && countryCode) {
            console.log('Final fallback geolocation successful:', { country, countryCode, city, ip, isProxy })
            return {
              country,
              country_code: countryCode,
              city,
              ip_address: ip,
              isProxy,
              realIP: ip
            }
          }
        }
      } catch (error) {
        console.warn(`Failed to get final fallback geolocation from ${api}:`, error)
        continue
      }
    }

    console.error('All geolocation methods failed')
    return null
  } catch (error) {
    console.error('Geolocation error:', error)
    return null
  }
}

// Function to get geolocation data with timeout
export const getGeolocationWithTimeout = async (timeoutMs: number = 8000): Promise<GeolocationData | null> => {
  try {
    const timeoutPromise = new Promise<null>((resolve) => {
      setTimeout(() => {
        console.warn(`Geolocation timeout after ${timeoutMs}ms`)
        resolve(null)
      }, timeoutMs)
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
  console.log('Testing ultra-robust geolocation...')
  const result = await getGeolocationWithTimeout(15000)
  console.log('Geolocation test result:', result)
  return result
} 