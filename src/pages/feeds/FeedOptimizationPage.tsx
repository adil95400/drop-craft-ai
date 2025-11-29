import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, AlertTriangle, CheckCircle, Zap } from 'lucide-react'

export default function FeedOptimizationPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Optimisation des Feeds</h1>
        <p className="text-muted-foreground">
          Améliorez la qualité de vos feeds avec l'IA
        </p>
      </div>

      {/* Score global */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Score Moyen</p>
                <p className="text-2xl font-bold">68/100</p>
              </div>
              <TrendingUp className="w-8 h-8 text-primary/20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Produits Exclus</p>
                <p className="text-2xl font-bold text-red-600">142</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-600/20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Optimisés</p>
                <p className="text-2xl font-bold text-green-600">1,245</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600/20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">À Optimiser</p>
                <p className="text-2xl font-bold text-yellow-600">328</p>
              </div>
              <Zap className="w-8 h-8 text-yellow-600/20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recommandations IA */}
      <Card>
        <CardHeader>
          <CardTitle>Recommandations IA</CardTitle>
          <CardDescription>Suggestions pour améliorer vos feeds</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              {
                title: 'Titres trop courts',
                count: 45,
                impact: 'high',
                description: '45 produits ont des titres < 30 caractères'
              },
              {
                title: 'Descriptions manquantes',
                count: 23,
                impact: 'high',
                description: '23 produits sans description'
              },
              {
                title: 'Catégories incomplètes',
                count: 67,
                impact: 'medium',
                description: '67 produits sans catégorie Google'
              }
            ].map((rec, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/5"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{rec.title}</p>
                    <Badge variant={rec.impact === 'high' ? 'destructive' : 'secondary'}>
                      {rec.impact === 'high' ? 'Impact élevé' : 'Impact moyen'}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{rec.description}</p>
                </div>
                <Button>
                  <Zap className="w-4 h-4 mr-2" />
                  Corriger avec IA
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
