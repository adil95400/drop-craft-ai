import { Button } from '@/components/ui/button'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import ImportHistory from '@/pages/ImportHistory'

export default function ImportHistoryPage() {
  const navigate = useNavigate()

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 px-6 pt-6">
        <Button variant="ghost" size="icon" onClick={() => navigate('/import/manage')}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Historique Détaillé</h1>
          <p className="text-muted-foreground">
            Suivez tous vos imports en détail
          </p>
        </div>
      </div>
      
      <ImportHistory />
    </div>
  )
}
