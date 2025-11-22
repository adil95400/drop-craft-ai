import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { UnifiedImportInterface } from '@/components/import/UnifiedImportInterface'

export default function QuickImportPage() {
  const navigate = useNavigate()

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/import/manage')}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Import Rapide</h1>
          <p className="text-muted-foreground">
            Importez vos produits rapidement et facilement
          </p>
        </div>
      </div>

      <UnifiedImportInterface />
    </div>
  )
}
