import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, Home } from 'lucide-react'

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full shadow-lg border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <AlertTriangle className="h-16 w-16 text-yellow-500" />
          </div>
          <CardTitle className="text-2xl">Link Not Found</CardTitle>
          <CardDescription>
            The short link you're looking for doesn't exist or has been removed.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-gray-600 mb-6">
            This could happen if:
          </p>
          <ul className="text-left text-gray-600 mb-6 space-y-1">
            <li>• The link was mistyped</li>
            <li>• The link has expired</li>
            <li>• The link has been deleted</li>
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