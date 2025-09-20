/**
 * PHASE 4: Extension Marketplace
 * Store d'extensions avec développeurs tiers et système de paiement
 */

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Store, Download, Star, Users, 
  Zap, Puzzle, TrendingUp, Shield
} from 'lucide-react'

export const ExtensionMarketplace: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center">
            <Store className="h-8 w-8 mr-3 text-primary" />
            Extension Marketplace
            <Badge variant="secondary" className="ml-3">
              PHASE 4
            </Badge>
          </h1>
          <p className="text-muted-foreground">
            Découvrez et installez des extensions pour étendre vos fonctionnalités
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <Button variant="outline">
            <Users className="h-4 w-4 mr-2" />
            Devenir développeur
          </Button>
          <Button>
            <Puzzle className="h-4 w-4 mr-2" />
            Mes extensions
          </Button>
        </div>
      </div>

      {/* Stats du marketplace */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Extensions disponibles</CardTitle>
            <Puzzle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">247</div>
            <p className="text-xs text-muted-foreground">+12 cette semaine</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Téléchargements</CardTitle>
            <Download className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">45.2K</div>
            <p className="text-xs text-muted-foreground">+8% ce mois</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Développeurs actifs</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">89</div>
            <p className="text-xs text-muted-foreground">+5 ce mois</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Note moyenne</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4.7</div>
            <p className="text-xs text-muted-foreground">Sur 5 étoiles</p>
          </CardContent>
        </Card>
      </div>

      {/* Extensions populaires */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Extensions populaires</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[
            {
              name: "AI Product Optimizer",
              description: "Optimisation automatique des fiches produits avec IA",
              category: "Automatisation",
              downloads: "2.1K",
              rating: 4.9,
              price: "29€/mois",
              verified: true
            },
            {
              name: "Advanced Analytics Pro",
              description: "Tableaux de bord avancés et analytics prédictifs",
              category: "Analytics",
              downloads: "1.8K",
              rating: 4.8,
              price: "39€/mois",
              verified: true
            },
            {
              name: "Multi-Channel Sync",
              description: "Synchronisation avancée avec 20+ marketplaces",
              category: "Intégrations",
              downloads: "3.2K",
              rating: 4.7,
              price: "49€/mois",
              verified: true
            }
          ].map((extension) => (
            <Card key={extension.name} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-primary" />
                    {extension.verified && (
                      <Shield className="h-4 w-4 text-green-500" />
                    )}
                  </div>
                  <Badge variant="outline">{extension.category}</Badge>
                </div>
                <CardTitle className="text-lg">{extension.name}</CardTitle>
                <CardDescription>{extension.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-current text-yellow-500" />
                      <span>{extension.rating}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Download className="h-4 w-4 text-muted-foreground" />
                      <span>{extension.downloads}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="text-lg font-bold text-primary">
                      {extension.price}
                    </div>
                    <Button size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Installer
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Catégories */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Parcourir par catégorie</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[
            { name: "Automatisation", count: 45, icon: Zap },
            { name: "Analytics", count: 32, icon: TrendingUp },
            { name: "Intégrations", count: 28, icon: Puzzle },
            { name: "Marketing", count: 24, icon: Users },
            { name: "Productivité", count: 38, icon: Store },
            { name: "Sécurité", count: 15, icon: Shield }
          ].map((category) => {
            const Icon = category.icon
            return (
              <Card key={category.name} className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <Icon className="h-8 w-8 text-primary" />
                    <div>
                      <div className="font-semibold">{category.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {category.count} extensions
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}