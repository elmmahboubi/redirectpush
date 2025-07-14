import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Copy, ExternalLink, Link2, BarChart3, Plus, Search, Filter, MoreHorizontal, TrendingUp, Eye, Clock, Globe, Trash2, Calendar, TrendingDown, Activity, Lock, User, Shield } from 'lucide-react'
import { supabase, type ShortLink } from '@/lib/supabase'
import { toast } from 'sonner'
import ReferrerAnalytics from '@/components/ReferrerAnalytics'
import EnvironmentCheck from '@/components/EnvironmentCheck'

interface ClickStats {
  today: number
  yesterday: number
  last7Days: number
  last30Days: number
  total: number
}

interface LoginCredentials {
  username: string
  password: string
}

export default function HomePage() {
  const [originalUrl, setOriginalUrl] = useState('')
  const [shortLinks, setShortLinks] = useState<ShortLink[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingLinks, setIsLoadingLinks] = useState(true)
  const [expandedAnalytics, setExpandedAnalytics] = useState<Set<string>>(new Set())
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<'created_at' | 'click_count'>('created_at')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [deletingLinkId, setDeletingLinkId] = useState<string | null>(null)
  const [clickStats, setClickStats] = useState<ClickStats>({
    today: 0,
    yesterday: 0,
    last7Days: 0,
    last30Days: 0,
    total: 0
  })
  const [isLoadingStats, setIsLoadingStats] = useState(true)
  
  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoadingAuth, setIsLoadingAuth] = useState(true)
  const [loginCredentials, setLoginCredentials] = useState<LoginCredentials>({
    username: '',
    password: ''
  })

  // Tab state for links management
  const [activeTab, setActiveTab] = useState<'active' | 'deleted'>('active')
  const [deletedLinks, setDeletedLinks] = useState<ShortLink[]>([])
  const [isLoadingDeletedLinks, setIsLoadingDeletedLinks] = useState(false)

  // Superuser credentials
  const SUPERUSER_CREDENTIALS = {
    username: 'elmahboubi',
    password: 'Localserver!!2'
  }

  // Check authentication on mount
  useEffect(() => {
    const authStatus = localStorage.getItem('golinks_authenticated')
    if (authStatus === 'true') {
      setIsAuthenticated(true)
    }
    setIsLoadingAuth(false)
  }, [])

  // Fetch all short links on component mount
  useEffect(() => {
    if (isAuthenticated) {
      console.log('HomePage useEffect - fetching links...')
      fetchShortLinks()
      fetchClickStats()
    }
  }, [isAuthenticated])

  // Fetch deleted links when tab changes
  useEffect(() => {
    if (isAuthenticated && activeTab === 'deleted') {
      console.log('🔄 Tab changed to deleted, fetching deleted links...')
      fetchDeletedLinks()
    }
  }, [isAuthenticated, activeTab])

  // Update document title
  useEffect(() => {
    document.title = 'GoLinks - Advanced URL Shortener with Analytics'
  }, [])

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoadingAuth(true)
    
    // Simulate loading
    setTimeout(() => {
      if (loginCredentials.username === SUPERUSER_CREDENTIALS.username && 
          loginCredentials.password === SUPERUSER_CREDENTIALS.password) {
        setIsAuthenticated(true)
        localStorage.setItem('golinks_authenticated', 'true')
        toast.success('Welcome back, Superuser!')
      } else {
        toast.error('Invalid credentials. Access denied.')
        setLoginCredentials({ username: '', password: '' })
      }
      setIsLoadingAuth(false)
    }, 1000)
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
    localStorage.removeItem('golinks_authenticated')
    toast.success('Logged out successfully')
  }

  const restoreDeletedLink = async (linkId: string, slug: string) => {
    if (!confirm(`Are you sure you want to restore the link "${slug}"?`)) {
      return
    }

    try {
      const { error } = await supabase
        .from('short_links')
        .update({ 
          deleted: false, 
          deleted_at: null 
        })
        .eq('id', linkId)

      if (error) throw error

      toast.success('Link restored successfully!')
      
      // Refresh both active and deleted links
      await Promise.all([fetchShortLinks(), fetchDeletedLinks()])
    } catch (error) {
      console.error('Error restoring link:', error)
      toast.error('Failed to restore link')
    }
  }

  const fetchClickStats = async () => {
    setIsLoadingStats(true)
    try {
      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000)
      const last7Days = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
      const last30Days = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)

      // Fetch click statistics for different time periods
      const { data: referrerClicks, error } = await supabase
        .from('referrer_clicks')
        .select('clicked_at')
        .gte('clicked_at', last30Days.toISOString())

      if (error) {
        console.error('Error fetching click stats:', error)
        return
      }

      const clicks = referrerClicks || []
      const todayClicks = clicks.filter(click => 
        new Date(click.clicked_at) >= today
      ).length
      
      const yesterdayClicks = clicks.filter(click => {
        const clickDate = new Date(click.clicked_at)
        return clickDate >= yesterday && clickDate < today
      }).length
      
      const last7DaysClicks = clicks.filter(click => 
        new Date(click.clicked_at) >= last7Days
      ).length
      
      const last30DaysClicks = clicks.length

      // Get total clicks from short_links table (only active links)
      const { data: totalData } = await supabase
        .from('short_links')
        .select('click_count')

      // Filter active links on the client side
      const activeLinksData = totalData?.filter(link => link.deleted !== true) || []
      const totalClicks = activeLinksData.reduce((sum, link) => sum + link.click_count, 0) || 0

      setClickStats({
        today: todayClicks,
        yesterday: yesterdayClicks,
        last7Days: last7DaysClicks,
        last30Days: last30DaysClicks,
        total: totalClicks
      })
    } catch (error) {
      console.error('Error calculating click stats:', error)
    } finally {
      setIsLoadingStats(false)
    }
  }

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
      
      // Filter active links on the client side
      const activeLinksData = data?.filter(link => link.deleted !== true) || []
      
      console.log('Fetched links:', activeLinksData.length)
      setShortLinks(activeLinksData)
    } catch (error) {
      console.error('Error fetching links:', error)
      toast.error('Failed to load links')
    } finally {
      setIsLoadingLinks(false)
    }
  }

  const fetchDeletedLinks = async () => {
    setIsLoadingDeletedLinks(true)
    try {
      console.log('🔍 Fetching deleted links from Supabase...')
      
      // First try to fetch all links and filter on the client side
      // This works around potential RLS policy issues
      const { data, error } = await supabase
        .from('short_links')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('❌ Supabase error:', error)
        throw error
      }
      
      // Filter deleted links on the client side
      const deletedLinksData = data?.filter(link => link.deleted === true) || []
      
      console.log('✅ Fetched deleted links:', deletedLinksData.length)
      if (deletedLinksData.length > 0) {
        console.log('📋 Deleted links:', deletedLinksData.map(link => ({ id: link.id, slug: link.slug, deleted_at: link.deleted_at })))
      }
      setDeletedLinks(deletedLinksData)
    } catch (error) {
      console.error('❌ Error fetching deleted links:', error)
      toast.error('Failed to load deleted links')
    } finally {
      setIsLoadingDeletedLinks(false)
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
      // Get the next available slug number (only from active links)
      const { data: allLinks } = await supabase
        .from('short_links')
        .select('slug')
        .order('created_at', { ascending: false })

      // Filter active links on the client side
      const activeLinks = allLinks?.filter(link => link.deleted !== true) || []
      const lastLink = activeLinks.length > 0 ? [activeLinks[0]] : []

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
      
      // Refresh both links and stats
      await Promise.all([fetchShortLinks(), fetchClickStats()])
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

  const deleteShortLink = async (linkId: string, slug: string) => {
    // Confirm deletion
    if (!confirm(`Are you sure you want to delete the link "${slug}"? This action cannot be undone.`)) {
      return
    }

    setDeletingLinkId(linkId)
    
    try {
      console.log(`Attempting to delete link: ${slug} (ID: ${linkId})`)
      
      // First, verify the link exists
      const { data: existingLink, error: fetchError } = await supabase
        .from('short_links')
        .select('id, slug, original_url')
        .eq('id', linkId)
        .single()

      if (fetchError) {
        console.error('Error fetching link before deletion:', fetchError)
        throw new Error('Link not found')
      }

      if (!existingLink) {
        throw new Error('Link not found')
      }

      console.log('Link found, proceeding with deletion:', existingLink)

      // Mark the short link as deleted instead of actually deleting it
      const { error: deleteError, count } = await supabase
        .from('short_links')
        .update({ 
          deleted: true, 
          deleted_at: new Date().toISOString() 
        })
        .eq('id', linkId)

      if (deleteError) {
        console.error('Supabase delete error:', deleteError)
        throw deleteError
      }

      console.log(`Soft delete operation completed. Rows affected: ${count}`)

      // Verify soft deletion
      const { data: verifyData, error: verifyError } = await supabase
        .from('short_links')
        .select('id, deleted')
        .eq('id', linkId)
        .single()

      if (!verifyData?.deleted) {
        console.warn('Link was not marked as deleted:', verifyData)
        throw new Error('Link was not deleted successfully')
      }

      console.log('✅ Link soft deletion verified successfully')

      toast.success('Link moved to deleted links!')
      
      // Remove from active links state immediately for better UX
      setShortLinks(prevLinks => prevLinks.filter(link => link.id !== linkId))
      
      // Refresh both links and stats to ensure consistency
      await Promise.all([fetchShortLinks(), fetchClickStats()])
      
      // Also refresh deleted links if we're on that tab
      if (activeTab === 'deleted') {
        console.log('🔄 Refreshing deleted links tab...')
        await fetchDeletedLinks()
      }
    } catch (error) {
      console.error('Error deleting link:', error)
      toast.error(`Failed to delete link: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setDeletingLinkId(null)
    }
  }

  // Test function to verify deletion is working
  const testDeletion = async (linkId: string, slug: string) => {
    console.log('🧪 Testing deletion for:', slug)
    
    try {
      // Test if link exists
      const { data, error } = await supabase
        .from('short_links')
        .select('*')
        .eq('id', linkId)
        .single()
      
      if (error) {
        console.log('❌ Link not found in database:', error)
        return false
      }
      
      console.log('✅ Link found in database:', data)
      return true
    } catch (error) {
      console.error('❌ Error testing deletion:', error)
      return false
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

  // Filter and sort links
  const filteredAndSortedLinks = shortLinks
    .filter(link => 
      link.original_url.toLowerCase().includes(searchTerm.toLowerCase()) ||
      link.slug.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === 'click_count') {
        return sortOrder === 'desc' ? b.click_count - a.click_count : a.click_count - b.click_count
      } else {
        return sortOrder === 'desc' 
          ? new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          : new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      }
    })

  // Calculate statistics
  const totalClicks = shortLinks.reduce((sum, link) => sum + link.click_count, 0)
  const totalLinks = shortLinks.length
  const averageClicks = totalLinks > 0 ? Math.round(totalClicks / totalLinks) : 0
  const topPerformer = shortLinks.reduce((max, link) => 
    link.click_count > max.click_count ? link : max, 
    { click_count: 0, slug: '', original_url: '', id: '', created_at: '' }
  )

  // Show loading screen while checking authentication
  if (isLoadingAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Initializing GoLinks...</p>
        </div>
      </div>
    )
  }

  // Show login screen if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="w-full max-w-md">
          <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
            <CardHeader className="text-center pb-6">
              <div className="flex items-center justify-center mb-4">
                <img 
                  src="/golinks-logo.svg" 
                  alt="GoLinks" 
                  className="h-16 w-auto"
                />
              </div>
              <CardTitle className="text-2xl font-bold text-gray-900">GoLinks Admin</CardTitle>
              <CardDescription className="text-gray-600">
                Superuser authentication required
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Username</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      type="text"
                      placeholder="Enter username"
                      value={loginCredentials.username}
                      onChange={(e) => setLoginCredentials(prev => ({ ...prev, username: e.target.value }))}
                      className="pl-10 h-12 border-2 focus:border-blue-500 transition-colors"
                      disabled={isLoadingAuth}
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      type="password"
                      placeholder="Enter password"
                      value={loginCredentials.password}
                      onChange={(e) => setLoginCredentials(prev => ({ ...prev, password: e.target.value }))}
                      className="pl-10 h-12 border-2 focus:border-blue-500 transition-colors"
                      disabled={isLoadingAuth}
                      required
                    />
                  </div>
                </div>
                
                <Button
                  type="submit"
                  disabled={isLoadingAuth || !loginCredentials.username || !loginCredentials.password}
                  className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition-all duration-200"
                >
                  {isLoadingAuth ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Authenticating...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <Shield className="h-4 w-4" />
                      <span>Login</span>
                    </div>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Enhanced Header */}
        <div className="text-center mb-8 sm:mb-12">
          <div className="flex items-center justify-center mb-4 sm:mb-6">
            <div className="relative">
              <img 
                src="/golinks-logo.svg" 
                alt="GoLinks" 
                className="h-16 sm:h-20 w-auto"
                onError={(e) => {
                  // Fallback to icon if logo fails to load
                  const target = e.target as HTMLImageElement
                  target.style.display = 'none'
                  const fallback = document.createElement('div')
                  fallback.className = 'h-16 sm:h-20 w-16 sm:w-20 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center'
                  fallback.innerHTML = '<svg class="h-8 sm:h-10 w-8 sm:w-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path></svg>'
                  target.parentNode?.insertBefore(fallback, target)
                }}
              />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            </div>
          </div>
          <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed mb-4 px-4">
            Transform long URLs into short, shareable links with advanced analytics and global reach tracking
          </p>
          
          {/* User Info and Logout */}
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-4">
            <div className="flex items-center space-x-2 bg-white/80 backdrop-blur-sm px-3 sm:px-4 py-2 rounded-full shadow-sm">
              <Shield className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-gray-700">Superuser: {SUPERUSER_CREDENTIALS.username}</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="flex items-center space-x-2 hover:bg-red-50 hover:border-red-300 hover:text-red-600 transition-colors"
            >
              <Lock className="h-4 w-4" />
              <span>Logout</span>
            </Button>
          </div>
        </div>

        {/* Environment Check for Testing */}
        <EnvironmentCheck />

        {/* Advanced Analytics Dashboard */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 mb-6">
            <div className="flex items-center space-x-3">
              <div className="h-8 sm:h-10 w-8 sm:w-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Activity className="h-4 sm:h-5 w-4 sm:w-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Analytics Dashboard</h2>
                <p className="text-sm sm:text-base text-gray-600">Track your link performance over time</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                fetchClickStats()
                fetchShortLinks()
              }}
              disabled={isLoadingStats}
              className="flex items-center space-x-2 text-xs sm:text-sm"
            >
              {isLoadingStats ? (
                <div className="animate-spin rounded-full h-3 sm:h-4 w-3 sm:w-4 border-b-2 border-blue-600"></div>
              ) : (
                <div className="h-3 sm:h-4 w-3 sm:w-4">🔄</div>
              )}
              <span className="hidden sm:inline">Refresh</span>
              <span className="sm:hidden">Refresh</span>
            </Button>
          </div>

          {/* Time-based Analytics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4 mb-6">
            {/* Today's Clicks */}
            <Card className="bg-gradient-to-br from-green-50 to-green-100 border-0 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-green-700 uppercase tracking-wide">Today</p>
                    <p className="text-lg sm:text-2xl font-bold text-green-800">
                      {isLoadingStats ? '...' : clickStats.today.toLocaleString()}
                    </p>
                    <p className="text-xs text-green-600">clicks</p>
                  </div>
                  <div className="h-8 w-8 sm:h-10 sm:w-10 bg-green-200 rounded-lg flex items-center justify-center">
                    <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-green-700" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Yesterday's Clicks */}
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-0 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-blue-700 uppercase tracking-wide">Yesterday</p>
                    <p className="text-lg sm:text-2xl font-bold text-blue-800">
                      {isLoadingStats ? '...' : clickStats.yesterday.toLocaleString()}
                    </p>
                    <p className="text-xs text-blue-600">clicks</p>
                  </div>
                  <div className="h-8 w-8 sm:h-10 sm:w-10 bg-blue-200 rounded-lg flex items-center justify-center">
                    <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-blue-700" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Last 7 Days */}
            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-0 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-purple-700 uppercase tracking-wide">Last 7 Days</p>
                    <p className="text-lg sm:text-2xl font-bold text-purple-800">
                      {isLoadingStats ? '...' : clickStats.last7Days.toLocaleString()}
                    </p>
                    <p className="text-xs text-purple-600">clicks</p>
                  </div>
                  <div className="h-8 w-8 sm:h-10 sm:w-10 bg-purple-200 rounded-lg flex items-center justify-center">
                    <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-purple-700" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Last 30 Days */}
            <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-0 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-orange-700 uppercase tracking-wide">Last 30 Days</p>
                    <p className="text-lg sm:text-2xl font-bold text-orange-800">
                      {isLoadingStats ? '...' : clickStats.last30Days.toLocaleString()}
                    </p>
                    <p className="text-xs text-orange-600">clicks</p>
                  </div>
                  <div className="h-8 w-8 sm:h-10 sm:w-10 bg-orange-200 rounded-lg flex items-center justify-center">
                    <Activity className="h-4 w-4 sm:h-5 sm:w-5 text-orange-700" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Total Clicks */}
            <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 border-0 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-indigo-700 uppercase tracking-wide">Total Clicks</p>
                    <p className="text-lg sm:text-2xl font-bold text-indigo-800">
                      {isLoadingStats ? '...' : clickStats.total.toLocaleString()}
                    </p>
                    <p className="text-xs text-indigo-600">all time</p>
                  </div>
                  <div className="h-8 w-8 sm:h-10 sm:w-10 bg-indigo-200 rounded-lg flex items-center justify-center">
                    <Eye className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-700" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Performance Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-gray-600">Total Links</p>
                    <p className="text-lg sm:text-2xl font-bold text-blue-600">{totalLinks}</p>
                  </div>
                  <div className="h-8 w-8 sm:h-10 sm:w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Link2 className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-gray-600">Top Performer</p>
                    <p className="text-base sm:text-lg font-bold text-orange-600">{topPerformer.click_count} clicks</p>
                  </div>
                  <div className="h-8 w-8 sm:h-10 sm:w-10 bg-orange-100 rounded-lg flex items-center justify-center">
                    <Globe className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Enhanced Create Link Form */}
        <Card className="max-w-4xl mx-auto mb-6 sm:mb-8 shadow-xl border-0 bg-white/90 backdrop-blur-sm">
          <CardHeader className="pb-4 sm:pb-6">
            <div className="flex items-center space-x-3">
              <div className="h-8 sm:h-10 w-8 sm:w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Plus className="h-4 sm:h-5 w-4 sm:w-5 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-xl sm:text-2xl">Create New Short Link</CardTitle>
                <CardDescription className="text-sm sm:text-base">
                  Enter your long URL below to generate a short, trackable link
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={createShortLink} className="space-y-4">
              <div className="relative">
                <Input
                  type="url"
                  placeholder="https://example.com/very/long/url/that/needs/shortening"
                  value={originalUrl}
                  onChange={(e) => setOriginalUrl(e.target.value)}
                  className="pr-20 sm:pr-24 h-12 sm:h-14 text-base sm:text-lg border-2 focus:border-blue-500 transition-colors"
                  disabled={isLoading}
                />
                <Button
                  type="submit"
                  disabled={isLoading || !originalUrl.trim()}
                  className="absolute right-2 top-2 h-8 sm:h-10 px-3 sm:px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 text-sm sm:text-base"
                >
                  {isLoading ? (
                    <div className="flex items-center space-x-1 sm:space-x-2">
                      <div className="animate-spin rounded-full h-3 sm:h-4 w-3 sm:w-4 border-b-2 border-white"></div>
                      <span className="hidden sm:inline">Creating...</span>
                      <span className="sm:hidden">...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-1 sm:space-x-2">
                      <Plus className="h-3 sm:h-4 w-3 sm:w-4" />
                      <span className="hidden sm:inline">Shorten</span>
                      <span className="sm:hidden">Go</span>
                    </div>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Enhanced Links Management */}
        <Card className="max-w-7xl mx-auto shadow-xl border-0 bg-white/90 backdrop-blur-sm">
          <CardHeader className="pb-4 sm:pb-6">
            <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
              <div className="flex items-center space-x-3">
                <div className="h-8 sm:h-10 w-8 sm:w-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <BarChart3 className="h-4 sm:h-5 w-4 sm:w-5 text-indigo-600" />
                </div>
                <div>
                  <CardTitle className="text-xl sm:text-2xl">Your Short Links</CardTitle>
                  <CardDescription className="text-sm sm:text-base">
                    Manage and analyze your shortened URLs with advanced tracking
                  </CardDescription>
                </div>
              </div>
              
              {/* Search and Filter Controls */}
              <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search links..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-full sm:w-64 border-2 focus:border-blue-500 transition-colors"
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSortBy(sortBy === 'created_at' ? 'click_count' : 'created_at')
                      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')
                    }}
                    className="flex items-center space-x-2 text-xs sm:text-sm"
                  >
                    <Filter className="h-3 sm:h-4 w-3 sm:w-4" />
                    <span className="hidden sm:inline">{sortBy === 'created_at' ? 'Date' : 'Clicks'}</span>
                    <span className="sm:hidden">{sortBy === 'created_at' ? 'Date' : 'Clicks'}</span>
                    <span className="text-xs">{sortOrder === 'desc' ? '↓' : '↑'}</span>
                  </Button>
                  
                  {/* Manual refresh button for debugging */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={activeTab === 'active' ? fetchShortLinks : fetchDeletedLinks}
                    className="flex items-center space-x-2"
                    title="Refresh links"
                  >
                    <div className="h-4 w-4">🔄</div>
                  </Button>
                </div>
              </div>
            </div>
          </CardHeader>

          {/* Tabs */}
          <div className="px-4 sm:px-6 pb-4">
            <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
              <Button
                variant={activeTab === 'active' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab('active')}
                className={`flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm ${
                  activeTab === 'active' 
                    ? 'bg-white shadow-sm' 
                    : 'hover:bg-gray-50'
                }`}
              >
                <Link2 className="h-3 sm:h-4 w-3 sm:w-4" />
                <span className="hidden sm:inline">Active Links</span>
                <span className="sm:hidden">Active</span>
                <span className="bg-blue-100 text-blue-700 px-1.5 sm:px-2 py-0.5 rounded-full text-xs font-medium">
                  {shortLinks.length}
                </span>
              </Button>
              
              <Button
                variant={activeTab === 'deleted' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab('deleted')}
                className={`flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm ${
                  activeTab === 'deleted' 
                    ? 'bg-white shadow-sm' 
                    : 'hover:bg-gray-50'
                }`}
              >
                <Trash2 className="h-3 sm:h-4 w-3 sm:w-4" />
                <span className="hidden sm:inline">Deleted Links</span>
                <span className="sm:hidden">Deleted</span>
                <span className="bg-red-100 text-red-700 px-1.5 sm:px-2 py-0.5 rounded-full text-xs font-medium">
                  {deletedLinks.length}
                </span>
              </Button>
            </div>
          </div>
          
          <CardContent>
            {activeTab === 'active' ? (
              // Active Links Tab
              <>
                {isLoadingLinks ? (
                  <div className="text-center py-8 sm:py-12">
                    <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2 border-blue-600 mx-auto mb-3 sm:mb-4"></div>
                    <p className="text-gray-600 text-base sm:text-lg">Loading your links...</p>
                    <p className="text-gray-500 text-sm">This will just take a moment</p>
                  </div>
                ) : filteredAndSortedLinks.length === 0 ? (
              <div className="text-center py-12 sm:py-16">
                <div className="h-16 w-16 sm:h-24 sm:w-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                  <Link2 className="h-8 w-8 sm:h-12 sm:w-12 text-gray-400" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
                  {searchTerm ? 'No links found' : 'No short links yet'}
                </h3>
                <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6 max-w-md mx-auto px-4">
                  {searchTerm 
                    ? 'Try adjusting your search terms or create a new link above.'
                    : 'Create your first short link above to start tracking and analyzing your URLs.'
                  }
                </p>
                {!searchTerm && (
                  <Button 
                    onClick={() => document.getElementById('url-input')?.focus()}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-sm sm:text-base"
                  >
                    <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                    Create Your First Link
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredAndSortedLinks.map((link) => (
                  <div key={link.id} className="group">
                    <Card className="border-0 shadow-sm hover:shadow-md transition-all duration-300 bg-gradient-to-r from-white to-gray-50/50">
                      <CardContent className="p-4 sm:p-6">
                        <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
                          {/* Link Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start space-x-3 sm:space-x-4">
                              <div className="flex-shrink-0">
                                <div className="h-10 w-10 sm:h-12 sm:w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                  <Link2 className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                                </div>
                              </div>
                              
                              <div className="flex-1 min-w-0">
                                <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-3 mb-2">
                                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate">
                                    {getShortUrl(link.slug)}
                                  </h3>
                                  <span className="inline-flex items-center px-2 py-0.5 sm:px-2.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 w-fit">
                                    {link.slug}
                                  </span>
                                </div>
                                
                                <p className="text-sm text-gray-600 truncate max-w-md mb-3 sm:mb-0">
                                  {link.original_url}
                                </p>
                                
                                <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-4">
                                  {/* Enhanced Click Count Display */}
                                  <div className="flex items-center space-x-2">
                                    <div className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-semibold ${
                                      link.click_count === 0 
                                        ? 'bg-gray-100 text-gray-500' 
                                        : link.click_count < 10 
                                        ? 'bg-green-100 text-green-700' 
                                        : link.click_count < 50 
                                        ? 'bg-blue-100 text-blue-700' 
                                        : link.click_count < 100 
                                        ? 'bg-purple-100 text-purple-700' 
                                        : 'bg-orange-100 text-orange-700'
                                    }`}>
                                      <Eye className="h-3 w-3 inline mr-1" />
                                      {link.click_count} {link.click_count === 1 ? 'click' : 'clicks'}
                                    </div>
                                    {link.click_count > 0 && (
                                      <div className="text-xs text-gray-400">
                                        {link.click_count < 10 ? '🆕' : 
                                         link.click_count < 50 ? '🔥' : 
                                         link.click_count < 100 ? '⚡' : '🚀'}
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex items-center space-x-1 text-xs sm:text-sm text-gray-500">
                                    <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                                    <span>{formatDate(link.created_at)}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center justify-center space-x-2 sm:ml-6">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => copyToClipboard(getShortUrl(link.slug))}
                              className="h-8 w-8 sm:h-9 sm:w-9 p-0 hover:bg-blue-50 hover:border-blue-300 transition-colors"
                              title="Copy link"
                            >
                              <Copy className="h-3 w-3 sm:h-4 sm:w-4" />
                            </Button>
                            
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(link.original_url, '_blank')}
                              className="h-8 w-8 sm:h-9 sm:w-9 p-0 hover:bg-green-50 hover:border-green-300 transition-colors"
                              title="Visit original URL"
                            >
                              <ExternalLink className="h-3 w-3 sm:h-4 sm:w-4" />
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
                              className={`h-8 w-8 sm:h-9 sm:w-9 p-0 transition-colors ${
                                expandedAnalytics.has(link.id)
                                  ? 'bg-purple-50 border-purple-300 text-purple-600'
                                  : 'hover:bg-purple-50 hover:border-purple-300'
                              }`}
                              title={expandedAnalytics.has(link.id) ? "Hide analytics" : "Show analytics"}
                            >
                              <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4" />
                            </Button>
                            
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => deleteShortLink(link.id, link.slug)}
                              disabled={deletingLinkId === link.id}
                              className="h-8 w-8 sm:h-9 sm:w-9 p-0 hover:bg-red-50 hover:border-red-300 hover:text-red-600 transition-colors"
                              title="Delete link"
                            >
                              {deletingLinkId === link.id ? (
                                <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-b-2 border-red-600"></div>
                              ) : (
                                <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                              )}
                            </Button>
                            
                            {/* Debug button - only in development */}
                            {import.meta.env.DEV && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => testDeletion(link.id, link.slug)}
                                className="h-8 w-8 sm:h-9 sm:w-9 p-0 hover:bg-yellow-50 hover:border-yellow-300 hover:text-yellow-600 transition-colors"
                                title="Test deletion (dev only)"
                              >
                                🧪
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    {/* Analytics Section */}
                    {expandedAnalytics.has(link.id) && (
                      <div className="mt-4 ml-6">
                        <ReferrerAnalytics shortLinkId={link.id} slug={link.slug} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )
            ) : (
              // Deleted Links Tab
              <>
                {isLoadingDeletedLinks ? (
                  <div className="text-center py-8 sm:py-12">
                    <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2 border-red-600 mx-auto mb-3 sm:mb-4"></div>
                    <p className="text-gray-600 text-base sm:text-lg">Loading deleted links...</p>
                    <p className="text-gray-500 text-sm">This will just take a moment</p>
                  </div>
                ) : deletedLinks.length === 0 ? (
                  <div className="text-center py-12 sm:py-16">
                    <div className="h-16 w-16 sm:h-24 sm:w-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                      <Trash2 className="h-8 w-8 sm:h-12 sm:w-12 text-gray-400" />
                    </div>
                    <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
                      No deleted links
                    </h3>
                    <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6 max-w-md mx-auto px-4">
                      Deleted links will appear here. You can restore them if needed.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {deletedLinks.map((link) => (
                      <div key={link.id} className="group">
                        <Card className="border-0 shadow-sm hover:shadow-md transition-all duration-300 bg-gradient-to-r from-gray-50 to-red-50/50">
                          <CardContent className="p-4 sm:p-6">
                            <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
                              {/* Link Info */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start space-x-3 sm:space-x-4">
                                  <div className="flex-shrink-0">
                                    <div className="h-10 w-10 sm:h-12 sm:w-12 bg-red-100 rounded-lg flex items-center justify-center">
                                      <Trash2 className="h-5 w-5 sm:h-6 sm:w-6 text-red-600" />
                                    </div>
                                  </div>
                                  
                                  <div className="flex-1 min-w-0">
                                    <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-3 mb-2">
                                      <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate">
                                        {getShortUrl(link.slug)}
                                      </h3>
                                      <span className="inline-flex items-center px-2 py-0.5 sm:px-2.5 rounded-full text-xs font-medium bg-red-100 text-red-800 w-fit">
                                        {link.slug}
                                      </span>
                                      <span className="inline-flex items-center px-2 py-0.5 sm:px-2.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 w-fit">
                                        Deleted
                                      </span>
                                    </div>
                                    
                                    <p className="text-sm text-gray-600 truncate max-w-md mb-3 sm:mb-0">
                                      {link.original_url}
                                    </p>
                                    
                                    <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-4">
                                      <div className="flex items-center space-x-1 text-xs sm:text-sm text-gray-500">
                                        <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                                        <span>{link.click_count} clicks</span>
                                      </div>
                                      <div className="flex items-center space-x-1 text-xs sm:text-sm text-gray-500">
                                        <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                                        <span>Deleted {formatDate(link.deleted_at || link.created_at)}</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Actions */}
                              <div className="flex items-center justify-center space-x-2 sm:ml-6">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => restoreDeletedLink(link.id, link.slug)}
                                  className="h-8 w-8 sm:h-9 sm:w-9 p-0 hover:bg-green-50 hover:border-green-300 hover:text-green-600 transition-colors"
                                  title="Restore link"
                                >
                                  <div className="h-3 w-3 sm:h-4 sm:w-4">🔄</div>
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Enhanced Footer */}
        <footer className="text-center mt-12 sm:mt-16 text-gray-500">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium">GoLinks</span>
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
          </div>
          <p className="text-xs sm:text-sm">Advanced URL shortening with global analytics</p>
        </footer>
      </div>
    </div>
  )
}