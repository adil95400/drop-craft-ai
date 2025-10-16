/**
 * Interface moderne du marketing inspirée des concurrents
 * Dashboard des campagnes email/SMS avec analytics
 */
import React, { useState, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Mail,
  MessageSquare,
  Users,
  TrendingUp,
  Eye,
  MousePointer,
  ShoppingCart,
  MoreVertical,
  Plus,
  Play,
  Pause,
  Edit,
  BarChart3,
  Target,
  Zap,
  Calendar
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useLegacyPlan } from '@/lib/migration-helper'

interface Campaign {
  id: string
  name: string
  type: 'email' | 'sms'
  status: 'draft' | 'active' | 'paused' | 'completed'
  sent: number
  opened: number
  clicked: number
  converted: number
  revenue: number
  created_at: string
  scheduled_at?: string
}

export default function ModernMarketing() {
  const { user } = useAuth()
  const { isPro, isUltraPro } = useLegacyPlan()
  
  // Données mockées pour la démonstration
  const [campaigns] = useState<Campaign[]>([
    {
      id: '1',
      name: 'Newsletter Hebdomadaire',
      type: 'email',
      status: 'active',
      sent: 1250,
      opened: 437,
      clicked: 89,
      converted: 12,
      revenue: 450.80,
      created_at: new Date().toISOString()
    },
    {
      id: '2',
      name: 'Promotion Flash SMS',
      type: 'sms',
      status: 'completed',
      sent: 850,
      opened: 680,
      clicked: 156,
      converted: 28,
      revenue: 890.50,
      created_at: new Date().toISOString()
    },
    {
      id: '3',
      name: 'Relance Panier Abandonné',
      type: 'email',
      status: 'active',
      sent: 320,
      opened: 145,
      clicked: 67,
      converted: 18,
      revenue: 675.20,
      created_at: new Date().toISOString()
    }
  ])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount)
  }

  const formatPercentage = (value: number, total: number) => {
    if (total === 0) return '0%'
    return `${Math.round((value / total) * 100)}%`
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      draft: { variant: 'secondary' as const, label: 'Brouillon', color: 'bg-gray-100 text-gray-800' },
      active: { variant: 'default' as const, label: 'Active', color: 'bg-green-100 text-green-800' },
      paused: { variant: 'outline' as const, label: 'En pause', color: 'bg-yellow-100 text-yellow-800' },
      completed: { variant: 'outline' as const, label: 'Terminée', color: 'bg-blue-100 text-blue-800' }
    }
    
    const config = variants[status as keyof typeof variants] || variants.draft
    
    return (
      <Badge variant={config.variant} className={config.color}>
        {config.label}
      </Badge>
    )
  }

  const getTypeIcon = (type: string) => {
    return type === 'email' ? <Mail className="h-4 w-4" /> : <MessageSquare className="h-4 w-4" />
  }

  // Stats générales
  const stats = {
    totalSent: campaigns.reduce((sum, c) => sum + c.sent, 0),
    totalOpened: campaigns.reduce((sum, c) => sum + c.opened, 0),
    totalClicked: campaigns.reduce((sum, c) => sum + c.clicked, 0),
    totalRevenue: campaigns.reduce((sum, c) => sum + c.revenue, 0),
    activeCampaigns: campaigns.filter(c => c.status === 'active').length
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header moderne */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Marketing</h1>
          <p className="text-muted-foreground">
            Gérez vos campagnes email/SMS et analysez les performances
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {isUltraPro && (
            <>
              <Button variant="outline" size="sm">
                <Target className="mr-2 h-4 w-4" />
                Segmentation IA
              </Button>
              <Button variant="outline" size="sm">
                <Zap className="mr-2 h-4 w-4" />
                Automation
              </Button>
            </>
          )}
          <Button size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Nouvelle campagne
          </Button>
        </div>
      </div>

      {/* KPIs globaux */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Envois</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSent.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              +15% ce mois
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taux d'Ouverture</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPercentage(stats.totalOpened, stats.totalSent)}</div>
            <p className="text-xs text-muted-foreground">
              +2.1% vs mois dernier
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taux de Clic</CardTitle>
            <MousePointer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPercentage(stats.totalClicked, stats.totalOpened)}</div>
            <p className="text-xs text-muted-foreground">
              +0.8% d'amélioration
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenus</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              +28% de ROI
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Campagnes Actives</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeCampaigns}</div>
            <p className="text-xs text-muted-foreground">
              En cours d'exécution
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Onglets de contenu */}
      <Tabs defaultValue="campaigns" className="space-y-4">
        <TabsList>
          <TabsTrigger value="campaigns">Campagnes</TabsTrigger>
          <TabsTrigger value="templates">Modèles</TabsTrigger>
          <TabsTrigger value="segments">Segments</TabsTrigger>
          {isUltraPro && <TabsTrigger value="automation">Automation</TabsTrigger>}
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="campaigns" className="space-y-4">
          {/* Liste des campagnes */}
          <div className="grid gap-4">
            {campaigns.map((campaign) => (
              <Card key={campaign.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="p-2 rounded-lg bg-primary/10">
                        {getTypeIcon(campaign.type)}
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">{campaign.name}</h3>
                        <div className="flex items-center space-x-2 mt-1">
                          {getStatusBadge(campaign.status)}
                          <Badge variant="outline" className="text-xs">
                            {campaign.type === 'email' ? 'Email' : 'SMS'}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-6">
                      {/* Métriques inline */}
                      <div className="text-center">
                        <div className="text-sm font-medium">{campaign.sent.toLocaleString()}</div>
                        <div className="text-xs text-muted-foreground">Envoyés</div>
                      </div>
                      
                      <div className="text-center">
                        <div className="text-sm font-medium text-blue-600">
                          {formatPercentage(campaign.opened, campaign.sent)}
                        </div>
                        <div className="text-xs text-muted-foreground">Ouverture</div>
                      </div>
                      
                      <div className="text-center">
                        <div className="text-sm font-medium text-green-600">
                          {formatPercentage(campaign.clicked, campaign.opened)}
                        </div>
                        <div className="text-xs text-muted-foreground">Clic</div>
                      </div>
                      
                      <div className="text-center">
                        <div className="text-sm font-medium text-purple-600">
                          {formatCurrency(campaign.revenue)}
                        </div>
                        <div className="text-xs text-muted-foreground">Revenus</div>
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem>
                            <BarChart3 className="mr-2 h-4 w-4" />
                            Voir analytics
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit className="mr-2 h-4 w-4" />
                            Modifier
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {campaign.status === 'active' ? (
                            <DropdownMenuItem>
                              <Pause className="mr-2 h-4 w-4" />
                              Mettre en pause
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem>
                              <Play className="mr-2 h-4 w-4" />
                              Activer
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  {/* Barre de progression des conversions */}
                  <div className="mt-4">
                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                      <span>Taux de conversion</span>
                      <span>{formatPercentage(campaign.converted, campaign.clicked)}</span>
                    </div>
                    <Progress 
                      value={(campaign.converted / campaign.clicked) * 100} 
                      className="h-2" 
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="templates">
          <Card>
            <CardHeader>
              <CardTitle>Modèles de campagne</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Créez vos modèles</h3>
                <p className="text-muted-foreground mb-4">
                  Gagnez du temps avec des modèles réutilisables
                </p>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Nouveau modèle
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="segments">
          <Card>
            <CardHeader>
              <CardTitle>Segments clients</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Segmentez votre audience</h3>
                <p className="text-muted-foreground mb-4">
                  Créez des segments pour un ciblage précis
                </p>
                <Button>
                  <Target className="mr-2 h-4 w-4" />
                  Créer un segment
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {isUltraPro && (
          <TabsContent value="automation">
            <Card>
              <CardHeader>
                <CardTitle>Automatisation marketing</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Zap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Automatisez vos campagnes</h3>
                  <p className="text-muted-foreground mb-4">
                    Créez des workflows automatiques basés sur le comportement
                  </p>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Nouveau workflow
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        <TabsContent value="analytics">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Performance par canal
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-blue-500" />
                      <span>Email</span>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">1,570 envois</div>
                      <div className="text-sm text-muted-foreground">35% ouverture</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-green-500" />
                      <span>SMS</span>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">850 envois</div>
                      <div className="text-sm text-muted-foreground">80% ouverture</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Tendances
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Taux d'ouverture moyen</span>
                    <span className="text-green-600 font-medium">+12%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Taux de clic</span>
                    <span className="text-green-600 font-medium">+5%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Désabonnements</span>
                    <span className="text-red-600 font-medium">-2%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}