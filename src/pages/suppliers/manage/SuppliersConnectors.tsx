import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Zap, Store, Globe, Package, Star } from 'lucide-react'

const connectors = [
  {
    id: 'aliexpress',
    name: 'AliExpress',
    description: 'Connectez-vous à AliExpress et importez des milliers de produits',
    category: 'Marketplace',
    complexity: 'Facile',
    setupTime: '10 min',
    features: ['API', 'Auto-sync', 'Real-time'],
    logo: '🇨🇳'
  },
  {
    id: 'amazon',
    name: 'Amazon',
    description: 'Intégration avec Amazon pour dropshipping',
    category: 'Marketplace',
    complexity: 'Moyen',
    setupTime: '20 min',
    features: ['API', 'Catalogue', 'Stock'],
    logo: '📦'
  },
  {
    id: 'faire',
    name: 'Faire',
    description: 'Marketplace B2B avec marques indépendantes',
    category: 'B2B',
    complexity: 'Facile',
    setupTime: '15 min',
    features: ['Wholesale', 'Premium', 'Artisan'],
    logo: '✨'
  }
]

export function SuppliersConnectors() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Connecteurs Fournisseurs</h1>
        <p className="text-muted-foreground mt-2">
          Connectez-vous aux principales plateformes en quelques clics
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {connectors.map((connector) => (
          <Card key={connector.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="text-4xl">{connector.logo}</div>
                  <div>
                    <CardTitle className="text-lg">{connector.name}</CardTitle>
                    <Badge variant="outline" className="mt-1">
                      {connector.category}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {connector.description}
              </p>
              
              <div className="flex flex-wrap gap-2">
                {connector.features.map(feature => (
                  <Badge key={feature} variant="secondary" className="text-xs">
                    {feature}
                  </Badge>
                ))}
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Difficulté:</span>
                  <div className="font-medium">{connector.complexity}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Setup:</span>
                  <div className="font-medium">{connector.setupTime}</div>
                </div>
              </div>
              
              <Button className="w-full" variant="outline">
                <Zap className="h-4 w-4 mr-2" />
                Connecter
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
