import React, { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { usePlan } from '@/hooks/usePlan'
import { CatalogUltraProInterface } from '@/components/catalog/CatalogUltraProInterface'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PlanGatedButton } from '@/components/plan/PlanGatedButton'
import { PlanGuard } from '@/components/plan/PlanGuard'
import { Crown, Zap, BarChart3, Package, Search, Filter } from 'lucide-react'
import { Input } from '@/components/ui/input'

export default function Catalogue() {
  const { user } = useAuth()
  const { hasPlan, plan } = usePlan(user)
  const [searchTerm, setSearchTerm] = useState('')
  
  const isUltraPro = hasPlan('ultra_pro')
  const isPro = hasPlan('pro')

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/80 to-background">
      {/* Header unifié */}
      <div className="bg-card/50 backdrop-blur-sm border-b border-border/50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                Catalogue Produits
                {isUltraPro && <Badge variant="secondary">Ultra Pro</Badge>}
              </h1>
              <p className="text-muted-foreground mt-1">
                {isUltraPro 
                  ? "Gestion avancée avec analytics et IA"
                  : "Gérez votre catalogue de produits"
                }
              </p>
            </div>
            <div className="flex items-center gap-3">
              <PlanGatedButton
                requiredPlan="ultra_pro"
                variant="outline"
                to="/catalogue-ultra-pro"
              >
                <Crown className="h-4 w-4 mr-2" />
                Ultra Pro
              </PlanGatedButton>
              
              <PlanGatedButton
                requiredPlan="pro"
                variant="outline"
                showUpgradeModal={true}
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                Analytics Pro
              </PlanGatedButton>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-6">
        <Tabs defaultValue="products" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="products">Produits</TabsTrigger>
            <TabsTrigger value="analytics" disabled={!isPro}>
              Analytics {!isPro && "🔒"}
            </TabsTrigger>
            <TabsTrigger value="ai-features" disabled={!isUltraPro}>
              IA Avancée {!isUltraPro && "🔒"}
            </TabsTrigger>
            <TabsTrigger value="ultra-pro" disabled={!isUltraPro}>
              Ultra Pro {!isUltraPro && "🔒"}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="products" className="space-y-6">
            {/* Search and filters */}
            <div className="flex gap-4 items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher des produits..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button variant="outline">
                <Filter className="h-4 w-4 mr-2" />
                Filtres
              </Button>
            </div>
            
            {/* Simple product grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <Card key={i} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="aspect-square bg-muted rounded-md flex items-center justify-center">
                      <Package className="h-8 w-8 text-muted-foreground" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardTitle className="text-sm mb-1">Produit Exemple {i + 1}</CardTitle>
                    <p className="text-xs text-muted-foreground mb-2">Description du produit</p>
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">€{(29.99 + i * 5).toFixed(2)}</span>
                      <Badge variant="secondary">En stock</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="analytics">
            <PlanGuard requiredPlan="pro">
              <div className="space-y-6">
                <h2 className="text-2xl font-bold">Analytics Catalogue</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Produits Populaires</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground">Analytics des ventes et tendances</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle>Performance</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground">Métriques de performance</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle>Revenus</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground">Suivi des revenus par produit</p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </PlanGuard>
          </TabsContent>

          <TabsContent value="ai-features">
            <PlanGuard requiredPlan="ultra_pro">
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <Zap className="h-6 w-6 text-purple-600" />
                  <h2 className="text-2xl font-bold">Fonctionnalités IA Avancées</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Optimisation IA</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground">Optimisation automatique des titres et descriptions</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle>Prédictions</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground">Prédictions de ventes et tendances</p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </PlanGuard>
          </TabsContent>

          <TabsContent value="ultra-pro">
            <PlanGuard requiredPlan="ultra_pro">
              <CatalogUltraProInterface />
            </PlanGuard>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}