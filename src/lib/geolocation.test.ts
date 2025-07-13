// Test file for geolocation functionality
import { getGeolocationWithTimeout, testGeolocation } from './geolocation'

// Test function to verify geolocation is working
export const testGeolocationFunction = async () => {
  console.log('🧪 Testing geolocation functionality...')
  
  try {
    const result = await getGeolocationWithTimeout(10000)
    
    if (result) {
      console.log('✅ Geolocation test successful!')
      console.log('📍 Location data:', {
        country: result.country,
        country_code: result.country_code,
        city: result.city,
        ip_address: result.ip_address,
        isProxy: result.isProxy
      })
      return result
    } else {
      console.log('❌ Geolocation test failed - no data returned')
      return null
    }
  } catch (error) {
    console.error('❌ Geolocation test error:', error)
    return null
  }
}

// Function to test from browser console
if (typeof window !== 'undefined') {
  (window as any).testGeolocation = testGeolocationFunction
  console.log('🌍 Geolocation test available: window.testGeolocation()')
} 