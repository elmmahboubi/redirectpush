import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Globe, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { getGeolocationWithTimeout } from '@/lib/geolocation'

export default function EnvironmentCheck() {
  const [geolocationResult, setGeolocationResult] = useState<any>(null)
  const [isTestingGeolocation, setIsTestingGeolocation] = useState(false)

  const testGeolocation = async () => {
    setIsTestingGeolocation(true)
    setGeolocationResult(null)
    
    try {
      console.log('🧪 Testing geolocation...')
      const result = await getGeolocationWithTimeout(10000)
      
      if (result) {
        console.log('✅ Geolocation successful:', result)
        setGeolocationResult({
          success: true,
          data: result
        })
      } else {
        console.log('❌ Geolocation failed - no data')
        setGeolocationResult({
          success: false,
          error: 'No geolocation data returned'
        })
      }
    } catch (error) {
      console.error('❌ Geolocation error:', error)
      setGeolocationResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    } finally {
      setIsTestingGeolocation(false)
    }
  }

  return (
    <Card className="mb-4 border-l-4 border-l-blue-500">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center">
          <Globe className="h-5 w-5 mr-2" />
          Environment & Geolocation Test
        </CardTitle>
        <CardDescription>
          Test your environment and geolocation detection
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Button
            onClick={testGeolocation}
            disabled={isTestingGeolocation}
            className="w-full"
          >
            {isTestingGeolocation ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Testing Geolocation...
              </>
            ) : (
              <>
                <Globe className="h-4 w-4 mr-2" />
                Test Geolocation Detection
              </>
            )}
          </Button>

          {geolocationResult && (
            <div className="mt-4 p-4 rounded-lg border">
              {geolocationResult.success ? (
                <div className="space-y-2">
                  <div className="flex items-center text-green-600">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    <span className="font-medium">Geolocation Successful!</span>
                  </div>
                  <div className="text-sm space-y-1">
                    <div><strong>Country:</strong> {geolocationResult.data.country}</div>
                    <div><strong>Country Code:</strong> {geolocationResult.data.country_code}</div>
                    <div><strong>City:</strong> {geolocationResult.data.city || 'Unknown'}</div>
                    <div><strong>IP Address:</strong> {geolocationResult.data.ip_address || 'Unknown'}</div>
                    {geolocationResult.data.isProxy && (
                      <div className="text-orange-600"><strong>Proxy/VPN Detected</strong></div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex items-center text-red-600">
                  <XCircle className="h-4 w-4 mr-2" />
                  <span className="font-medium">Geolocation Failed: {geolocationResult.error}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
} 