/**
 * PHASE 3: Dashboard multi-tenant avec gestion white-label
 * Architecture SaaS avec customisation par tenant
 */

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { 
  Building2, Users, Palette, Globe, Settings, 
  Crown, Zap, Shield, BarChart3, Upload,
  Eye, Download, Code, Smartphone
} from 'lucide-react'
import { useAuthOptimized } from '@/shared/hooks/useAuthOptimized'
import { usePlanContext } from '@/components/plan'

interface Tenant {
  id: string
  name: string
  domain: string
  subdomain: string
  status: 'active' | 'inactive' | 'trial' | 'suspended'
  plan: string
  users_count: number
  storage_used: number
  storage_limit: number
  created_at: string
  last_activity: string
  branding: {
    logo_url?: string
    primary_color: string
    secondary_color: string
    accent_color: string
    font_family: string
    custom_css?: string
  }
  features: {
    white_label: boolean
    custom_domain: boolean
    api_access: boolean
    webhooks: boolean
    sso: boolean
    advanced_analytics: boolean
  }
  metrics: {
    monthly_revenue: number
    active_users: number
    api_calls: number
    storage_growth: number
  }
}

interface TenantTemplate {
  id: string
  name: string
  description: string
  category: string
  preview_image: string
  config: {
    branding: any
    features: any
    default_settings: any
  }
}

export const MultiTenantDashboard: React.FC = () => {
  const { user } = useAuthOptimized()
  const { hasFeature } = usePlanContext()
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [templates, setTemplates] = useState<TenantTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null)
  const [selectedTab, setSelectedTab] = useState('overview')
  const [showCreateTenant, setShowCreateTenant] = useState(false)

  useEffect(() => {
    if (user) {
      fetchTenantData()
    }
  }, [user])

  const fetchTenantData = async () => {
    setLoading(true)
    
    // Mock data - en production, récupérer depuis l'API
    const mockTenants: Tenant[] = [
      {
        id: 'tenant-1',
        name: 'Boutique Mode Premium',
        domain: 'boutique-mode.com',
        subdomain: 'boutique-mode',
        status: 'active',
        plan: 'Enterprise',
        users_count: 15,
        storage_used: 2.4,
        storage_limit: 10,
        created_at: '2024-01-15',
        last_activity: '2024-01-20T14:30:00Z',
        branding: {
          logo_url: '/logos/boutique-mode.png',
          primary_color: '#8B5CF6',
          secondary_color: '#06B6D4',
          accent_color: '#F59E0B',
          font_family: 'Inter'
        },
        features: {
          white_label: true,
          custom_domain: true,
          api_access: true,
          webhooks: true,
          sso: true,
          advanced_analytics: true
        },
        metrics: {
          monthly_revenue: 12450,
          active_users: 342,
          api_calls: 45678,
          storage_growth: 15.2
        }
      },
      {
        id: 'tenant-2',
        name: 'Tech Store',
        domain: 'tech-store.io',
        subdomain: 'tech-store',
        status: 'active',
        plan: 'Professional',
        users_count: 8,
        storage_used: 1.2,
        storage_limit: 5,
        created_at: '2024-01-18',
        last_activity: '2024-01-20T16:45:00Z',
        branding: {
          primary_color: '#3B82F6',
          secondary_color: '#10B981',
          accent_color: '#EF4444',
          font_family: 'Roboto'
        },
        features: {
          white_label: false,
          custom_domain: true,
          api_access: true,
          webhooks: false,
          sso: false,
          advanced_analytics: true
        },
        metrics: {
          monthly_revenue: 5890,
          active_users: 156,
          api_calls: 23456,
          storage_growth: 8.7
        }
      },
      {
        id: 'tenant-3',
        name: 'Marketplace Local',
        domain: '',
        subdomain: 'marketplace-local',
        status: 'trial',
        plan: 'Trial',
        users_count: 3,
        storage_used: 0.3,
        storage_limit: 1,
        created_at: '2024-01-19',
        last_activity: '2024-01-20T12:20:00Z',
        branding: {
          primary_color: '#059669',
          secondary_color: '#7C3AED',
          accent_color: '#DC2626',
          font_family: 'Poppins'
        },
        features: {
          white_label: false,
          custom_domain: false,
          api_access: false,
          webhooks: false,
          sso: false,
          advanced_analytics: false
        },
        metrics: {
          monthly_revenue: 0,
          active_users: 12,
          api_calls: 456,
          storage_growth: 2.1
        }
      }
    ]

    const mockTemplates: TenantTemplate[] = [
      {
        id: 'template-ecommerce',
        name: 'E-commerce Premium',
        description: 'Template optimisé pour le commerce en ligne avec toutes les fonctionnalités avancées',
        category: 'E-commerce',
        preview_image: '/templates/ecommerce.png',
        config: {
          branding: { primary_color: '#8B5CF6', secondary_color: '#06B6D4' },
          features: { white_label: true, custom_domain: true, api_access: true },
          default_settings: { theme: 'modern', layout: 'grid' }
        }
      },
      {
        id: 'template-marketplace',
        name: 'Marketplace Multi-vendeurs',
        description: 'Solution complète pour marketplace avec gestion des vendeurs',
        category: 'Marketplace',
        preview_image: '/templates/marketplace.png',
        config: {
          branding: { primary_color: '#059669', secondary_color: '#7C3AED' },
          features: { white_label: false, custom_domain: true, api_access: true },
          default_settings: { theme: 'marketplace', layout: 'list' }
        }
      }
    ]

    setTenants(mockTenants)
    setTemplates(mockTemplates)
    setLoading(false)
  }

  const handleCreateTenant = () => {
    setShowCreateTenant(true)
  }

  const handleUpdateBranding = (tenantId: string, branding: any) => {
    setTenants(prev => prev.map(tenant => 
      tenant.id === tenantId ? { ...tenant, branding: { ...tenant.branding, ...branding } } : tenant
    ))
  }

  const handleToggleFeature = (tenantId: string, feature: string, enabled: boolean) => {
    setTenants(prev => prev.map(tenant => 
      tenant.id === tenantId 
        ? { ...tenant, features: { ...tenant.features, [feature]: enabled } }
        : tenant
    ))
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500'
      case 'trial': return 'bg-blue-500'
      case 'inactive': return 'bg-gray-500'
      case 'suspended': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Actif'
      case 'trial': return 'Essai'
      case 'inactive': return 'Inactif'
      case 'suspended': return 'Suspendu'
      default: return status
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount)
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR')
  }

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-muted rounded w-1/3" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-64 bg-muted rounded" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center">
            <Building2 className="h-8 w-8 mr-3 text-primary" />
            Multi-Tenant SaaS
            <Badge variant="secondary" className="ml-3">
              ENTERPRISE
            </Badge>
          </h1>
          <p className="text-muted-foreground">
            Gestion centralisée de vos tenants et configuration white-label
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exporter données
          </Button>
          <Button onClick={handleCreateTenant}>
            <Building2 className="h-4 w-4 mr-2" />
            Nouveau tenant
          </Button>
        </div>
      </div>

      {/* Métriques globales */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tenants actifs</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {tenants.filter(t => t.status === 'active').length}
            </div>
            <p className="text-xs text-muted-foreground">
              sur {tenants.length} total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Utilisateurs totaux</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {tenants.reduce((sum, t) => sum + t.users_count, 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenus mensuels</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(tenants.reduce((sum, t) => sum + t.metrics.monthly_revenue, 0))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Appels API</CardTitle>
            <Code className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {tenants.reduce((sum, t) => sum + t.metrics.api_calls, 0).toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="tenants">Gestion tenants</TabsTrigger>
          <TabsTrigger value="branding">White-label</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-3">
            {tenants.map(tenant => (
              <Card key={tenant.id} className="hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => setSelectedTenant(tenant)}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {tenant.branding.logo_url ? (
                        <img src={tenant.branding.logo_url} alt={tenant.name} className="w-10 h-10 rounded" />
                      ) : (
                        <div 
                          className="w-10 h-10 rounded flex items-center justify-center text-white font-bold"
                          style={{ backgroundColor: tenant.branding.primary_color }}
                        >
                          {tenant.name.charAt(0)}
                        </div>
                      )}
                      <div>
                        <CardTitle className="text-base">{tenant.name}</CardTitle>
                        <CardDescription>{tenant.subdomain}.dropcraft.ai</CardDescription>
                      </div>
                    </div>
                    <Badge className={`${getStatusColor(tenant.status)} text-white`}>
                      {getStatusText(tenant.status)}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-muted-foreground">Plan</div>
                      <div className="font-semibold">{tenant.plan}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Utilisateurs</div>
                      <div className="font-semibold">{tenant.users_count}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Revenus/mois</div>
                      <div className="font-semibold text-green-600">
                        {formatCurrency(tenant.metrics.monthly_revenue)}
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Stockage</div>
                      <div className="font-semibold">
                        {tenant.storage_used}GB / {tenant.storage_limit}GB
                      </div>
                    </div>
                  </div>

                  {/* Fonctionnalités actives */}
                  <div>
                    <div className="text-sm font-medium mb-2">Fonctionnalités</div>
                    <div className="flex flex-wrap gap-1">
                      {Object.entries(tenant.features)
                        .filter(([_, enabled]) => enabled)
                        .map(([feature, _]) => (
                        <Badge key={feature} variant="secondary" className="text-xs">
                          {feature.replace('_', ' ')}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2 border-t">
                    <Button size="sm" variant="outline" className="flex-1">
                      <Eye className="h-3 w-3 mr-1" />
                      Voir
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1">
                      <Settings className="h-3 w-3 mr-1" />
                      Configurer
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="tenants" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Gestion des tenants</CardTitle>
              <CardDescription>Configuration et administration des environnements clients</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {tenants.map(tenant => (
                  <div key={tenant.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-8 h-8 rounded flex items-center justify-center text-white font-bold text-sm"
                          style={{ backgroundColor: tenant.branding.primary_color }}
                        >
                          {tenant.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-semibold">{tenant.name}</div>
                          <div className="text-sm text-muted-foreground">
                            Créé le {formatDate(tenant.created_at)}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={`${getStatusColor(tenant.status)} text-white`}>
                          {getStatusText(tenant.status)}
                        </Badge>
                        <Button size="sm" variant="outline">
                          Gérer
                        </Button>
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-4 text-sm">
                      <div>
                        <div className="text-muted-foreground mb-1">Domaine</div>
                        <div className="font-medium">
                          {tenant.domain || `${tenant.subdomain}.dropcraft.ai`}
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground mb-1">Plan</div>
                        <div className="font-medium">{tenant.plan}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground mb-1">Utilisateurs</div>
                        <div className="font-medium">{tenant.users_count} actifs</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground mb-1">Dernière activité</div>
                        <div className="font-medium">
                          {new Date(tenant.last_activity).toLocaleDateString('fr-FR')}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="branding" className="space-y-4">
          {selectedTenant ? (
            <Card>
              <CardHeader>
                <CardTitle>Configuration white-label - {selectedTenant.name}</CardTitle>
                <CardDescription>Personnalisation de l'apparence et du branding</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Upload logo */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Logo de marque</label>
                  <div className="flex items-center gap-4">
                    {selectedTenant.branding.logo_url ? (
                      <img 
                        src={selectedTenant.branding.logo_url} 
                        alt="Logo" 
                        className="w-16 h-16 rounded border object-cover" 
                      />
                    ) : (
                      <div 
                        className="w-16 h-16 rounded border flex items-center justify-center text-white font-bold"
                        style={{ backgroundColor: selectedTenant.branding.primary_color }}
                      >
                        {selectedTenant.name.charAt(0)}
                      </div>
                    )}
                    <Button variant="outline">
                      <Upload className="h-4 w-4 mr-2" />
                      Changer le logo
                    </Button>
                  </div>
                </div>

                {/* Couleurs */}
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Couleur primaire</label>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-10 h-10 rounded border cursor-pointer"
                        style={{ backgroundColor: selectedTenant.branding.primary_color }}
                      />
                      <Input 
                        value={selectedTenant.branding.primary_color}
                        onChange={(e) => handleUpdateBranding(selectedTenant.id, { primary_color: e.target.value })}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Couleur secondaire</label>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-10 h-10 rounded border cursor-pointer"
                        style={{ backgroundColor: selectedTenant.branding.secondary_color }}
                      />
                      <Input 
                        value={selectedTenant.branding.secondary_color}
                        onChange={(e) => handleUpdateBranding(selectedTenant.id, { secondary_color: e.target.value })}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Couleur d'accent</label>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-10 h-10 rounded border cursor-pointer"
                        style={{ backgroundColor: selectedTenant.branding.accent_color }}
                      />
                      <Input 
                        value={selectedTenant.branding.accent_color}
                        onChange={(e) => handleUpdateBranding(selectedTenant.id, { accent_color: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                {/* Police */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Police de caractères</label>
                  <Select 
                    value={selectedTenant.branding.font_family}
                    onValueChange={(value) => handleUpdateBranding(selectedTenant.id, { font_family: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Inter">Inter</SelectItem>
                      <SelectItem value="Roboto">Roboto</SelectItem>
                      <SelectItem value="Poppins">Poppins</SelectItem>
                      <SelectItem value="Open Sans">Open Sans</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* CSS personnalisé */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">CSS personnalisé</label>
                  <Textarea 
                    placeholder="/* CSS personnalisé pour votre tenant */"
                    value={selectedTenant.branding.custom_css || ''}
                    onChange={(e) => handleUpdateBranding(selectedTenant.id, { custom_css: e.target.value })}
                    rows={8}
                  />
                </div>

                {/* Fonctionnalités */}
                <div className="space-y-4">
                  <h4 className="font-medium">Fonctionnalités white-label</h4>
                  <div className="space-y-3">
                    {Object.entries(selectedTenant.features).map(([feature, enabled]) => (
                      <div key={feature} className="flex items-center justify-between">
                        <div>
                          <div className="font-medium capitalize">
                            {feature.replace('_', ' ')}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {feature === 'white_label' && 'Masquer la marque Drop Craft AI'}
                            {feature === 'custom_domain' && 'Utiliser un domaine personnalisé'}
                            {feature === 'api_access' && 'Accès API complet'}
                            {feature === 'webhooks' && 'Configuration des webhooks'}
                            {feature === 'sso' && 'Single Sign-On (SSO)'}
                            {feature === 'advanced_analytics' && 'Analytics avancés'}
                          </div>
                        </div>
                        <Switch 
                          checked={enabled}
                          onCheckedChange={(checked) => handleToggleFeature(selectedTenant.id, feature, checked)}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 pt-4 border-t">
                  <Button>Sauvegarder les modifications</Button>
                  <Button variant="outline">Prévisualiser</Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="p-6 text-center">
              <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold">Sélectionnez un tenant</h3>
              <p className="text-muted-foreground">
                Choisissez un tenant dans l'onglet "Vue d'ensemble" pour configurer son branding
              </p>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {templates.map(template => (
              <Card key={template.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="aspect-video bg-gradient-to-br from-primary/20 to-secondary/20 rounded-lg mb-3 flex items-center justify-center">
                    <Smartphone className="h-8 w-8 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{template.name}</CardTitle>
                  <CardDescription>{template.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mb-4">
                    <Badge variant="secondary">{template.category}</Badge>
                    <Button size="sm">
                      <Eye className="h-4 w-4 mr-2" />
                      Prévisualiser
                    </Button>
                  </div>
                  <Button className="w-full">
                    Utiliser ce template
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Revenus par tenant</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {tenants.filter(t => t.metrics.monthly_revenue > 0).map(tenant => (
                    <div key={tenant.id}>
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium">{tenant.name}</span>
                        <span className="font-bold">{formatCurrency(tenant.metrics.monthly_revenue)}</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div 
                          className="h-2 rounded-full"
                          style={{ 
                            width: `${(tenant.metrics.monthly_revenue / Math.max(...tenants.map(t => t.metrics.monthly_revenue))) * 100}%`,
                            backgroundColor: tenant.branding.primary_color
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Utilisation API</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {tenants.filter(t => t.metrics.api_calls > 0).map(tenant => (
                    <div key={tenant.id}>
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium">{tenant.name}</span>
                        <span className="font-bold">{tenant.metrics.api_calls.toLocaleString()}</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div 
                          className="h-2 rounded-full"
                          style={{ 
                            width: `${(tenant.metrics.api_calls / Math.max(...tenants.map(t => t.metrics.api_calls))) * 100}%`,
                            backgroundColor: tenant.branding.secondary_color
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}