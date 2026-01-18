/**
 * UrlImportPage - Page d'import par URL directe
 * Redirection vers AutoDS Import avec URL pré-remplie si fournie
 */
import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { Loader2 } from 'lucide-react'

export default function UrlImportPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const url = searchParams.get('url')
  
  useEffect(() => {
    // Redirect to AutoDS import page with URL if provided
    if (url) {
      navigate(`/import/autods?url=${encodeURIComponent(url)}`, { replace: true })
    } else {
      navigate('/import/autods', { replace: true })
    }
  }, [url, navigate])
  
  return (
    <>
      <Helmet>
        <title>Import par URL | ShopOpti</title>
      </Helmet>
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-sm text-muted-foreground">Redirection vers l'import...</p>
        </div>
      </div>
    </>
  )
}
