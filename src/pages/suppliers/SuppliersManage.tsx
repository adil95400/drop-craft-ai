import { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { useRealSuppliers } from '@/hooks/useRealSuppliers'
import { useNavigate } from 'react-router-dom'
import { AdvancedSupplierManager } from '@/components/suppliers/AdvancedSupplierManager'
import { SupplierStatsChart } from '@/components/suppliers/SupplierStatsChart'
import {
  Settings, BarChart3, Zap, Link as LinkIcon,
  TrendingUp, Package, CheckCircle, Globe, Clock, AlertTriangle, Target
} from 'lucide-react'

export default function SuppliersManage() {
  const navigate = useNavigate()
  const { suppliers, stats, isLoading } = useRealSuppliers()

  return (
    <>
      <Helmet>
        <title>Gestion Avancée - Fournisseurs</title>
        <meta name="description" content="Monitoring, analytics et automation de vos fournisseurs" />
      </Helmet>

      <div className="container mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold flex items-center gap-3">
              <Settings className="h-10 w-10 text-primary" />
              Gestion Avancée
            </h1>
            <p className="text-muted-foreground mt-2">
              Monitoring, analytics et automation de vos fournisseurs
            </p>
          </div>
          <Button onClick={() => navigate('/products/suppliers')}>
            Retour au Hub
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <Package className="h-8 w-8 text-primary opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Actifs</p>
                  <p className="text-2xl font-bold text-green-600">{stats.active}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Note</p>
                  <p className="text-2xl font-bold">{stats.averageRating.toFixed(1)}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-orange-600 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Pays</p>
                  <p className="text-2xl font-bold">{Object.keys(stats.topCountries).length}</p>
                </div>
                <Globe className="h-8 w-8 text-blue-600 opacity-20" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="monitoring" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="monitoring">
              <BarChart3 className="h-4 w-4 mr-2" />
              Monitoring
            </TabsTrigger>
            <TabsTrigger value="analytics">
              <TrendingUp className="h-4 w-4 mr-2" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="automation">
              <Zap className="h-4 w-4 mr-2" />
              Automation
            </TabsTrigger>
            <TabsTrigger value="connectors">
              <LinkIcon className="h-4 w-4 mr-2" />
              Connecteurs
            </TabsTrigger>
          </TabsList>

          <TabsContent value="monitoring" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Monitoring en Temps Réel</CardTitle>
              </CardHeader>
              <CardContent>
                <AdvancedSupplierManager />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <SupplierStatsChart suppliers={suppliers} />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Répartition par pays</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(stats.topCountries || {})
                      .sort(([, a], [, b]) => (b as number) - (a as number))
                      .map(([country, count]) => (
                        <div key={country} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Globe className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{country}</span>
                          </div>
                          <Badge variant="secondary">{count as number}</Badge>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Performance Globale</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Taux d'activation</span>
                      <span className="font-bold">
                        {stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : 0}%
                      </span>
                    </div>
                    <Progress value={stats.total > 0 ? (stats.active / stats.total) * 100 : 0} />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Note moyenne</span>
                      <span className="font-bold">{stats.averageRating.toFixed(1)}/5</span>
                    </div>
                    <Progress value={(stats.averageRating / 5) * 100} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Couverture internationale</span>
                    <span className="font-bold">{Object.keys(stats.topCountries || {}).length} pays</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Indicateurs de Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-lg border">
                    <div className="flex items-center gap-2 mb-2">
                      <Target className="h-5 w-5 text-green-600" />
                      <span className="font-medium">Objectif de croissance</span>
                    </div>
                    <p className="text-2xl font-bold text-green-600">+15%</p>
                    <p className="text-xs text-muted-foreground mt-1">Ce trimestre</p>
                  </div>
                  <div className="p-4 rounded-lg border">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="h-5 w-5 text-blue-600" />
                      <span className="font-medium">Temps moyen sync</span>
                    </div>
                    <p className="text-2xl font-bold text-blue-600">4.2min</p>
                    <p className="text-xs text-muted-foreground mt-1">Dernières 24h</p>
                  </div>
                  <div className="p-4 rounded-lg border">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="h-5 w-5 text-orange-600" />
                      <span className="font-medium">Taux d'erreur</span>
                    </div>
                    <p className="text-2xl font-bold text-orange-600">2.1%</p>
                    <p className="text-xs text-muted-foreground mt-1">Cette semaine</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="automation" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Règles d'Automation</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-muted-foreground">
                  <Zap className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium mb-2">Automation Avancée</p>
                  <p className="text-sm mb-4">
                    Configurez des règles pour automatiser la gestion de vos fournisseurs
                  </p>
                  <Button>
                    <Zap className="h-4 w-4 mr-2" />
                    Créer une règle
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="connectors" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Gestion des Connecteurs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-muted-foreground">
                  <LinkIcon className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium mb-2">Connecteurs API</p>
                  <p className="text-sm mb-4">
                    Gérez vos connexions API avec vos fournisseurs
                  </p>
                  <Button onClick={() => navigate('/products/suppliers/browse')}>
                    <LinkIcon className="h-4 w-4 mr-2" />
                    Explorer les connecteurs
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  )
}
