import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Users, TrendingUp, Star, AlertTriangle, Target, 
  DollarSign, ShoppingCart, Calendar, Filter, Download 
} from 'lucide-react'

interface CustomerSegmentationModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const segments = [
  {
    id: 'vip',
    name: 'Clients VIP',
    description: 'Clients à haute valeur avec plus de 5000€ de dépenses',
    count: 45,
    percentage: 3.6,
    color: 'from-yellow-400 to-orange-500',
    icon: Star,
    criteria: 'Total dépensé > 5000€ ET Commandes > 10'
  },
  {
    id: 'loyal',
    name: 'Clients Fidèles',
    description: 'Clients réguliers avec un bon historique',
    count: 342,
    percentage: 27.4,
    color: 'from-green-400 to-blue-500',
    icon: Users,
    criteria: 'Commandes > 5 ET Dernier achat < 60 jours'
  },
  {
    id: 'new',
    name: 'Nouveaux Clients',
    description: 'Clients récents avec un potentiel élevé',
    count: 186,
    percentage: 14.9,
    color: 'from-blue-400 to-purple-500',
    icon: TrendingUp,
    criteria: 'Première commande < 30 jours'
  },
  {
    id: 'at-risk',
    name: 'Clients À Risque',
    description: 'Clients inactifs nécessitant une réactivation',
    count: 89,
    percentage: 7.1,
    color: 'from-red-400 to-pink-500',
    icon: AlertTriangle,
    criteria: 'Dernier achat > 90 jours ET Total dépensé > 500€'
  },
  {
    id: 'potential',
    name: 'Potentiel Élevé',
    description: 'Clients avec un fort potentiel de croissance',
    count: 234,
    percentage: 18.8,
    color: 'from-purple-400 to-indigo-500',
    icon: Target,
    criteria: 'Panier moyen croissant ET Fréquence stable'
  },
  {
    id: 'one-time',
    name: 'Achat Unique',
    description: 'Clients avec un seul achat',
    count: 351,
    percentage: 28.2,
    color: 'from-gray-400 to-gray-600',
    icon: ShoppingCart,
    criteria: 'Une seule commande ET > 60 jours'
  }
]

const automationSuggestions = [
  {
    segment: 'vip',
    title: 'Programme de Fidélité Exclusif',
    description: 'Offrir des avantages premium et un service client prioritaire',
    action: 'Configurer'
  },
  {
    segment: 'at-risk',
    title: 'Campagne de Réactivation',
    description: 'Email avec offre personnalisée pour encourager le retour',
    action: 'Lancer'
  },
  {
    segment: 'new',
    title: 'Séquence d\'Onboarding',
    description: 'Série d\'emails pour fidéliser les nouveaux clients',
    action: 'Activer'
  },
  {
    segment: 'potential',
    title: 'Recommandations Personnalisées',
    description: 'Suggestions de produits basées sur l\'historique',
    action: 'Paramétrer'
  }
]

export function CustomerSegmentationModal({ open, onOpenChange }: CustomerSegmentationModalProps) {
  const [selectedSegment, setSelectedSegment] = useState<string | null>(null)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Segmentation des Clients</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="segments" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="segments">Segments</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="automation">Automatisation</TabsTrigger>
          </TabsList>

          <TabsContent value="segments" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {segments.map((segment) => {
                const Icon = segment.icon
                return (
                  <Card 
                    key={segment.id} 
                    className={`cursor-pointer transition-all hover:shadow-lg ${
                      selectedSegment === segment.id ? 'ring-2 ring-primary' : ''
                    }`}
                    onClick={() => setSelectedSegment(segment.id)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className={`p-2 rounded-lg bg-gradient-to-r ${segment.color} text-white`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <Badge variant="secondary">{segment.count} clients</Badge>
                      </div>
                      <CardTitle className="text-lg">{segment.name}</CardTitle>
                      <CardDescription>{segment.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">Pourcentage</span>
                          <span className="text-sm font-bold">{segment.percentage}%</span>
                        </div>
                        <Progress value={segment.percentage} className="h-2" />
                        
                        <div className="mt-3 p-2 bg-muted rounded-lg">
                          <p className="text-xs text-muted-foreground">
                            <strong>Critères:</strong> {segment.criteria}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            {selectedSegment && (
              <Card>
                <CardHeader>
                  <CardTitle>Actions Recommandées</CardTitle>
                  <CardDescription>
                    Actions suggérées pour le segment sélectionné
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {automationSuggestions
                      .filter(suggestion => suggestion.segment === selectedSegment)
                      .map((suggestion, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <p className="font-medium">{suggestion.title}</p>
                            <p className="text-sm text-muted-foreground">{suggestion.description}</p>
                          </div>
                          <Button size="sm">{suggestion.action}</Button>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-blue-500/10">
                      <DollarSign className="w-6 h-6 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Revenus VIP</p>
                      <p className="text-2xl font-bold">287K€</p>
                      <p className="text-xs text-green-600">+15% vs mois dernier</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-green-500/10">
                      <TrendingUp className="w-6 h-6 text-green-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Taux de Rétention</p>
                      <p className="text-2xl font-bold">78%</p>
                      <p className="text-xs text-green-600">+3% vs mois dernier</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-purple-500/10">
                      <Users className="w-6 h-6 text-purple-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Nouveaux Clients</p>
                      <p className="text-2xl font-bold">186</p>
                      <p className="text-xs text-red-600">-5% vs mois dernier</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Évolution des Segments</CardTitle>
                <CardDescription>
                  Performance mensuelle par segment
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center border-2 border-dashed border-muted rounded-lg">
                  <p className="text-muted-foreground">Graphique d'évolution des segments</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="automation" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Automatisations Recommandées</CardTitle>
                <CardDescription>
                  Configurez des workflows automatiques basés sur les segments
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {automationSuggestions.map((suggestion, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-lg bg-gradient-to-r ${
                          segments.find(s => s.id === suggestion.segment)?.color || 'from-gray-400 to-gray-600'
                        } text-white`}>
                          <Target className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-medium">{suggestion.title}</p>
                          <p className="text-sm text-muted-foreground">{suggestion.description}</p>
                          <Badge variant="outline" className="mt-1">
                            {segments.find(s => s.id === suggestion.segment)?.name}
                          </Badge>
                        </div>
                      </div>
                      <Button className="gap-2">
                        {suggestion.action}
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Règles de Segmentation Avancées</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="p-3 border rounded-lg">
                    <p className="font-medium">Réactivation Automatique</p>
                    <p className="text-sm text-muted-foreground">
                      Déplacer automatiquement les clients inactifs après 90 jours sans achat
                    </p>
                    <Button variant="outline" size="sm" className="mt-2">
                      Configurer
                    </Button>
                  </div>
                  
                  <div className="p-3 border rounded-lg">
                    <p className="font-medium">Promotion VIP</p>
                    <p className="text-sm text-muted-foreground">
                      Promouvoir automatiquement vers VIP après 5000€ de dépenses
                    </p>
                    <Button variant="outline" size="sm" className="mt-2">
                      Configurer
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            Exporter Segments
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fermer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}