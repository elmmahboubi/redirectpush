import { Link, useParams, useLocation } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, Home, Trash2, MessageCircle, ExternalLink } from 'lucide-react'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface NotFoundPageProps {
  slug?: string
}

export default function NotFoundPage({ slug: propSlug }: NotFoundPageProps = {}) {
  const { slug: paramSlug } = useParams<{ slug: string }>()
  const location = useLocation()
  const [isDeletedLink, setIsDeletedLink] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Use prop slug if provided, otherwise use URL param
  const slug = propSlug || paramSlug

  useEffect(() => {
    const checkIfDeleted = async () => {
      if (!slug) {
        setIsLoading(false)
        return
      }

      try {
        // Check if this slug exists but is deleted
        const { data: deletedLink, error } = await supabase
          .from('short_links')
          .select('id, slug, original_url, deleted, deleted_at')
          .eq('slug', slug)
          .eq('deleted', true)
          .single()

        if (deletedLink) {
          setIsDeletedLink(true)
        }
      } catch (error) {
        // Link doesn't exist or other error
        console.log('Link not found or error:', error)
      } finally {
        setIsLoading(false)
      }
    }

    checkIfDeleted()
  }, [slug])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking link status...</p>
        </div>
      </div>
    )
  }

  if (isDeletedLink) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full shadow-lg border-0 bg-white/90 backdrop-blur-sm">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Trash2 className="h-16 w-16 text-red-500" />
            </div>
            <CardTitle className="text-2xl text-red-700">Link Deleted</CardTitle>
            <CardDescription className="text-red-600">
              This short link has been removed by the owner.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-800 font-medium mb-2">
                The link <span className="font-bold">/{slug}</span> is no longer available.
              </p>
              <p className="text-red-600 text-sm">
                Please contact the link owner if you need access to this content.
              </p>
            </div>
            
            <div className="space-y-3">
              <p className="text-gray-600 text-sm">
                This could happen because:
              </p>
              <ul className="text-left text-gray-600 text-sm space-y-1">
                <li>• The content has been removed</li>
                <li>• The link has expired</li>
                <li>• The owner deleted the link</li>
                <li>• The destination URL is no longer valid</li>
              </ul>
            </div>

            <div className="mt-6 space-y-3">
              <Link to="/">
                <Button className="w-full">
                  <Home className="h-4 w-4 mr-2" />
                  Go to Homepage
                </Button>
              </Link>
              
              <Button variant="outline" className="w-full" asChild>
                <a href="mailto:support@yourdomain.com?subject=Broken Link: /{slug}">
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Report Broken Link
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Regular 404 for non-existent links
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full shadow-lg border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <AlertTriangle className="h-16 w-16 text-yellow-500" />
          </div>
          <CardTitle className="text-2xl">Link Not Found</CardTitle>
          <CardDescription>
            The short link you're looking for doesn't exist.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <p className="text-yellow-800 font-medium mb-2">
              Link <span className="font-bold">/{slug}</span> was not found.
            </p>
            <p className="text-yellow-600 text-sm">
              Please check the URL and try again.
            </p>
          </div>
          
          <p className="text-gray-600 mb-6">
            This could happen if:
          </p>
          <ul className="text-left text-gray-600 mb-6 space-y-1">
            <li>• The link was mistyped</li>
            <li>• The link has never existed</li>
            <li>• The link has been moved</li>
          </ul>
          <Link to="/">
            <Button className="w-full">
              <Home className="h-4 w-4 mr-2" />
              Go to Homepage
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}