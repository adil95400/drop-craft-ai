/**
 * PHASE 4: Developer Dashboard
 * Dashboard pour les développeurs d'extensions
 */

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Code, TrendingUp, DollarSign, Users, 
  Star, Download, Package, Plus
} from 'lucide-react'

export const DeveloperDashboard: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center">
            <Code className="h-8 w-8 mr-3 text-primary" />
            Dashboard Développeur
            <Badge variant="secondary" className="ml-3">
              PRO
            </Badge>
          </h1>
          <p className="text-muted-foreground">
            Gérez vos extensions et suivez vos performances
          </p>
        </div>
        
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle extension
        </Button>
      </div>

      {/* Métriques développeur */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Extensions publiées</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground">+2 ce mois</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Téléchargements totaux</CardTitle>
            <Download className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12.4K</div>
            <p className="text-xs text-muted-foreground">+18% ce mois</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenus</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€2,847</div>
            <p className="text-xs text-muted-foreground">+22% ce mois</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Note moyenne</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4.6</div>
            <p className="text-xs text-muted-foreground">147 avis</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="extensions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="extensions">Mes Extensions</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="revenue">Revenus</TabsTrigger>
          <TabsTrigger value="reviews">Avis</TabsTrigger>
        </TabsList>

        <TabsContent value="extensions" className="space-y-4">
          <div className="grid gap-4">
            {[
              {
                name: "AI Product Optimizer",
                version: "2.1.0",
                status: "Publié",
                downloads: "2.1K",
                rating: 4.9,
                revenue: "€890"
              },
              {
                name: "Advanced Analytics Pro",
                version: "1.8.2",
                status: "Publié",
                downloads: "1.8K", 
                rating: 4.8,
                revenue: "€1,240"
              },
              {
                name: "Smart Inventory Manager",
                version: "1.2.1",
                status: "En révision",
                downloads: "0",
                rating: 0,
                revenue: "€0"
              }
            ].map((extension) => (
              <Card key={extension.name}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold">{extension.name}</h3>
                        <Badge variant={extension.status === 'Publié' ? 'default' : 'secondary'}>
                          {extension.status}
                        </Badge>
                        <span className="text-sm text-muted-foreground">v{extension.version}</span>
                      </div>
                      <div className="flex items-center gap-6 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Download className="h-4 w-4" />
                          {extension.downloads}
                        </div>
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4" />
                          {extension.rating}
                        </div>
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4" />
                          {extension.revenue}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">Modifier</Button>
                      <Button size="sm">Voir détails</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance des extensions</CardTitle>
              <CardDescription>Évolution des téléchargements sur 30 jours</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center border rounded">
                <div className="text-center text-muted-foreground">
                  <TrendingUp className="h-12 w-12 mx-auto mb-4" />
                  <p>Graphiques analytiques</p>
                  <p className="text-sm">Intégration avec charts à venir</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="revenue" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Revenus et paiements</CardTitle>
              <CardDescription>Historique des gains et prochains paiements</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <div className="font-medium">Paiement janvier 2024</div>
                    <div className="text-sm text-muted-foreground">Transféré le 15 jan</div>
                  </div>
                  <div className="text-green-600 font-bold">+€1,247</div>
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <div className="font-medium">Paiement décembre 2023</div>
                    <div className="text-sm text-muted-foreground">Transféré le 15 déc</div>
                  </div>
                  <div className="text-green-600 font-bold">+€890</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reviews" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Avis récents</CardTitle>
              <CardDescription>Retours des utilisateurs sur vos extensions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  {
                    extension: "AI Product Optimizer",
                    rating: 5,
                    review: "Excellent outil, mes ventes ont augmenté de 30% !",
                    user: "Marie D.",
                    date: "Il y a 2 jours"
                  },
                  {
                    extension: "Advanced Analytics Pro",
                    rating: 4,
                    review: "Très utile mais interface perfectible",
                    user: "Jean M.",
                    date: "Il y a 5 jours"
                  }
                ].map((review, index) => (
                  <div key={index} className="p-4 border rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <Star 
                              key={i} 
                              className={`h-4 w-4 ${i < review.rating ? 'fill-current text-yellow-500' : 'text-gray-300'}`}
                            />
                          ))}
                        </div>
                        <span className="text-sm font-medium">{review.extension}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">{review.date}</span>
                    </div>
                    <p className="text-sm">{review.review}</p>
                    <div className="text-xs text-muted-foreground">Par {review.user}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}