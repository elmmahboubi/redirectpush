import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { ChevronDown, ChevronUp, Globe, ExternalLink, MapPin } from 'lucide-react'
import { supabase, type ReferrerClick, extractDomain, getCountryFlag } from '@/lib/supabase'

interface ReferrerAnalyticsProps {
  shortLinkId: string
  slug: string
}

export default function ReferrerAnalytics({ shortLinkId, slug }: ReferrerAnalyticsProps) {
  const [referrerClicks, setReferrerClicks] = useState<ReferrerClick[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [hasLoaded, setHasLoaded] = useState(false)

  const fetchReferrerClicks = async () => {
    setIsLoading(true)
    setHasError(false)
    
    try {
      const { data, error } = await supabase
        .from('referrer_clicks')
        .select('*')
        .eq('short_link_id', shortLinkId)
        .order('clicked_at', { ascending: false })

      if (error) throw error
      setReferrerClicks(data || [])
      setHasLoaded(true)
    } catch (error) {
      console.error('Error fetching referrer clicks:', error)
      setHasError(true)
      setReferrerClicks([])
    } finally {
      setIsLoading(false)
    }
  }

  // Auto-load data when component mounts (when analytics are expanded)
  useEffect(() => {
    if (!hasLoaded) {
      fetchReferrerClicks()
    }
  }, [shortLinkId, hasLoaded])

  // Group clicks by referrer domain
  const referrerStats = referrerClicks.reduce((acc, click) => {
    try {
      const domain = extractDomain(click.referrer)
      if (!acc[domain]) {
        acc[domain] = { count: 0, clicks: [] }
      }
      acc[domain].count++
      acc[domain].clicks.push(click)
    } catch (error) {
      console.error('Error processing referrer stats:', error)
    }
    return acc
  }, {} as Record<string, { count: number; clicks: ReferrerClick[] }>)

  // Group clicks by country
  const countryStats = referrerClicks.reduce((acc, click) => {
    try {
      const country = click.country || 'Unknown'
      if (!acc[country]) {
        acc[country] = { count: 0, clicks: [], countryCode: click.country_code }
      }
      acc[country].count++
      acc[country].clicks.push(click)
    } catch (error) {
      console.error('Error processing country stats:', error)
    }
    return acc
  }, {} as Record<string, { count: number; clicks: ReferrerClick[]; countryCode: string | null }>)

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch (error) {
      console.error('Error formatting date:', error)
      return 'Invalid Date'
    }
  }

  const totalClicks = referrerClicks.length
  const clicksWithCountry = referrerClicks.filter(click => click.country).length

  // If there's an error, show a simple error message
  if (hasError) {
    return (
      <Card className="mt-4 border-l-4 border-l-red-500">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg text-red-600">Analytics Error</CardTitle>
          <CardDescription>
            Unable to load analytics data. The main functionality is not affected.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="outline"
            onClick={() => {
              setHasError(false)
              setHasLoaded(false)
              fetchReferrerClicks()
            }}
          >
            Retry Analytics
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="mt-4 border-l-4 border-l-blue-500">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Globe className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-lg">Link Analytics</CardTitle>
          </div>
        </div>
        <CardDescription>
          Track where your clicks are coming from
        </CardDescription>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 text-sm">Loading analytics...</p>
            <p className="text-gray-500 text-xs">Gathering click data and location info</p>
          </div>
        ) : totalClicks === 0 ? (
          <div className="text-center py-8">
            <Globe className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 text-sm">No clicks recorded yet</p>
            <p className="text-gray-500 text-xs">Share your link to see analytics data</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{totalClicks}</div>
                <div className="text-xs text-gray-600">Total Clicks</div>
              </div>
              <div className="bg-green-50 p-3 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {Object.keys(referrerStats).length}
                </div>
                <div className="text-xs text-gray-600">Referrer Sources</div>
              </div>
              <div className="bg-purple-50 p-3 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {referrerStats['Direct']?.count || 0}
                </div>
                <div className="text-xs text-gray-600">Direct Visits</div>
              </div>
              <div className="bg-orange-50 p-3 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">
                  {Object.keys(countryStats).length}
                </div>
                <div className="text-xs text-gray-600">Countries</div>
              </div>
            </div>

            {/* Country Breakdown */}
            {Object.keys(countryStats).length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <MapPin className="h-4 w-4 mr-2" />
                  Top Countries
                </h4>
                <div className="space-y-2">
                  {Object.entries(countryStats)
                    .sort(([, a], [, b]) => b.count - a.count)
                    .slice(0, 5)
                    .map(([country, stats]) => (
                      <div key={country} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <span className="text-lg">{getCountryFlag(stats.countryCode)}</span>
                          <span className="font-medium text-gray-900">{country}</span>
                        </div>
                        <div className="flex items-center space-x-4">
                          <span className="text-sm text-gray-600">
                            {((stats.count / totalClicks) * 100).toFixed(1)}%
                          </span>
                          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm font-medium">
                            {stats.count} clicks
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Referrer Breakdown */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Top Referrer Sources</h4>
              <div className="space-y-2">
                {Object.entries(referrerStats)
                  .sort(([, a], [, b]) => b.count - a.count)
                  .map(([domain, stats]) => (
                    <div key={domain} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <ExternalLink className="h-4 w-4 text-gray-500" />
                        <span className="font-medium text-gray-900">{domain}</span>
                      </div>
                      <div className="flex items-center space-x-4">
                        <span className="text-sm text-gray-600">
                          {((stats.count / totalClicks) * 100).toFixed(1)}%
                        </span>
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm font-medium">
                          {stats.count} clicks
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Detailed Click History */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Recent Clicks</h4>
              <div className="max-h-60 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Referrer</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Device</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {referrerClicks.slice(0, 10).map((click) => (
                      <TableRow key={click.id}>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <span className="font-medium">
                              {extractDomain(click.referrer)}
                            </span>
                            {click.referrer && (
                              <a
                                href={click.referrer}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800"
                              >
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm">{getCountryFlag(click.country_code)}</span>
                            <span className="text-sm text-gray-600">
                              {click.country || 'Unknown'}
                              {click.city && `, ${click.city}`}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-gray-600">
                          {formatDate(click.clicked_at)}
                        </TableCell>
                        <TableCell>
                          <span className="text-xs text-gray-500">
                            {click.user_agent?.includes('Mobile') ? '📱 Mobile' : '💻 Desktop'}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 