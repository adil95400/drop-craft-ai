import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Database, Loader2, Zap } from 'lucide-react'
import { useRealisticData } from '@/hooks/useRealisticData'

export const DataGeneratorCard = () => {
  const { generateRealisticData, loading } = useRealisticData()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Données de démonstration
        </CardTitle>
        <CardDescription>
          Générez des données réalistes pour tester votre application
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            Cette fonction créera des fournisseurs, clients, commandes et données d'automatisation 
            réalistes pour vous permettre de tester toutes les fonctionnalités.
          </div>
          <Button 
            onClick={generateRealisticData} 
            disabled={loading}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Génération en cours...
              </>
            ) : (
              <>
                <Zap className="h-4 w-4 mr-2" />
                Générer des données réalistes
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}