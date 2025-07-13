import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Copy, ExternalLink, Link2, BarChart3 } from 'lucide-react'
import { supabase, type ShortLink } from '@/lib/supabase'
import { toast } from 'sonner'
import ReferrerAnalytics from '@/components/ReferrerAnalytics'

export default function HomePage() {
  const [originalUrl, setOriginalUrl] = useState('')
  const [shortLinks, setShortLinks] = useState<ShortLink[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingLinks, setIsLoadingLinks] = useState(true)
  const [expandedAnalytics, setExpandedAnalytics] = useState<Set<string>>(new Set())

  // Add error logging
  console.log('HomePage component rendering...')

  // Fetch all short links on component mount
  useEffect(() => {
    console.log('HomePage useEffect - fetching links...')
    fetchShortLinks()
  }, [])

  const fetchShortLinks = async () => {
    try {
      console.log('Fetching short links from Supabase...')
      const { data, error } = await supabase
        .from('short_links')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Supabase error:', error)
        throw error
      }
      
      console.log('Fetched links:', data?.length || 0)
      setShortLinks(data || [])
    } catch (error) {
      console.error('Error fetching links:', error)
      toast.error('Failed to load links')
    } finally {
      setIsLoadingLinks(false)
    }
  }

  const createShortLink = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!originalUrl.trim()) {
      toast.error('Please enter a URL')
      return
    }

    // Basic URL validation
    try {
      new URL(originalUrl)
    } catch {
      toast.error('Please enter a valid URL')
      return
    }

    setIsLoading(true)

    try {
      // Get the next available slug number
      const { data: lastLink } = await supabase
        .from('short_links')
        .select('slug')
        .order('created_at', { ascending: false })
        .limit(1)

      // Generate next slug (p1, p2, p3, etc.)
      let nextNumber = 1
      if (lastLink?.[0]?.slug) {
        const currentNumber = parseInt(lastLink[0].slug.replace('p', ''))
        if (!isNaN(currentNumber)) {
          nextNumber = currentNumber + 1
        }
      }

      const newSlug = `p${nextNumber}`

      // Insert the new short link
      const { error } = await supabase
        .from('short_links')
        .insert({
          slug: newSlug,
          original_url: originalUrl,
          click_count: 0,
        })
        .select()
        .single()

      if (error) throw error

      toast.success('Short link created!')
      setOriginalUrl('')
      
      // Refresh the links list
      await fetchShortLinks()
    } catch (error) {
      console.error('Error creating link:', error)
      toast.error('Failed to create short link')
    } finally {
      setIsLoading(false)
    }
  }

  const copyToClipboard = async (shortUrl: string) => {
    try {
      await navigator.clipboard.writeText(shortUrl)
      toast.success('Copied to clipboard!')
    } catch (error) {
      toast.error('Failed to copy to clipboard')
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getShortUrl = (slug: string) => {
    const baseUrl = import.meta.env.VITE_BASE_URL || window.location.origin
    return `${baseUrl}/${slug}`
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <Link2 className="h-8 w-8 text-blue-600 mr-2" />
            <h1 className="text-4xl font-bold text-gray-900">HappyDeel Links</h1>
          </div>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Transform long URLs into short, shareable links instantly
          </p>
        </div>

        {/* Create Link Form */}
        <Card className="max-w-2xl mx-auto mb-12 shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-2xl text-center">Create Short Link</CardTitle>
            <CardDescription className="text-center">
              Enter your long URL below to generate a short link
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={createShortLink} className="space-y-4">
              <div className="relative">
                <Input
                  type="url"
                  placeholder="https://example.com/very/long/url"
                  value={originalUrl}
                  onChange={(e) => setOriginalUrl(e.target.value)}
                  className="pr-20 h-12 text-lg"
                  disabled={isLoading}
                />
                <Button
                  type="submit"
                  disabled={isLoading || !originalUrl.trim()}
                  className="absolute right-1 top-1 h-10 px-6"
                >
                  {isLoading ? 'Creating...' : 'Shorten'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Links Table */}
        <Card className="max-w-6xl mx-auto shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-2xl">Your Short Links</CardTitle>
            <CardDescription>
              Manage and track your shortened URLs
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingLinks ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading links...</p>
              </div>
            ) : shortLinks.length === 0 ? (
              <div className="text-center py-12">
                <Link2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 text-lg">No short links created yet</p>
                <p className="text-gray-500">Create your first short link above!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {shortLinks.map((link) => (
                  <div key={link.id} className="border rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Short Link</TableHead>
                            <TableHead>Original URL</TableHead>
                            <TableHead className="text-center">Clicks</TableHead>
                            <TableHead>Created</TableHead>
                            <TableHead className="text-center">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          <TableRow className="hover:bg-gray-50/50">
                            <TableCell className="font-mono">
                              <div className="flex items-center space-x-2">
                                <span className="text-blue-600 font-medium">
                                  {getShortUrl(link.slug)}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="max-w-md truncate" title={link.original_url}>
                                {link.original_url}
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <span className="bg-gray-100 px-2 py-1 rounded-full text-sm font-medium">
                                {link.click_count}
                              </span>
                            </TableCell>
                            <TableCell className="text-gray-600">
                              {formatDate(link.created_at)}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center justify-center space-x-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => copyToClipboard(getShortUrl(link.slug))}
                                  className="h-8 w-8 p-0"
                                >
                                  <Copy className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => window.open(link.original_url, '_blank')}
                                  className="h-8 w-8 p-0"
                                >
                                  <ExternalLink className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    const newExpanded = new Set(expandedAnalytics)
                                    if (newExpanded.has(link.id)) {
                                      newExpanded.delete(link.id)
                                    } else {
                                      newExpanded.add(link.id)
                                    }
                                    setExpandedAnalytics(newExpanded)
                                  }}
                                  className="h-8 w-8 p-0"
                                  title="View Analytics"
                                >
                                  <BarChart3 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>
                    
                    {/* Analytics Section */}
                    {expandedAnalytics.has(link.id) && (
                      <ReferrerAnalytics shortLinkId={link.id} slug={link.slug} />
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <footer className="text-center mt-12 text-gray-500">
          <p>© 2025 HappyDeel. All rights reserved.</p>
        </footer>
      </div>
    </div>
  )
}