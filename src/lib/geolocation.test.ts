// Simple test for geolocation service
import { getGeolocationFromIP, getGeolocationWithTimeout } from './geolocation'

// Test the geolocation service
export const testGeolocation = async () => {
  console.log('Testing geolocation service...')
  
  try {
    const geoData = await getGeolocationWithTimeout(5000)
    
    if (geoData) {
      console.log('✅ Geolocation test successful:', {
        country: geoData.country,
        country_code: geoData.country_code,
        city: geoData.city
      })
      return geoData
    } else {
      console.log('❌ Geolocation test failed: No data returned')
      return null
    }
  } catch (error) {
    console.error('❌ Geolocation test error:', error)
    return null
  }
}

// Run test if this file is executed directly
if (typeof window !== 'undefined') {
  // Browser environment - can be called from console
  (window as any).testGeolocation = testGeolocation
} 