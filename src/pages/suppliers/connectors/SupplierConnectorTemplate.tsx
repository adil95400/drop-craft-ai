/**
 * Template réutilisable pour les pages de connecteurs fournisseurs
 * Chaque connecteur a sa propre page avec configuration, import et catalogue
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Progress } from '@/components/ui/progress'
import { useToast } from '@/hooks/use-toast'
import {
  ArrowLeft, Settings, Package, Download, RefreshCw, CheckCircle,
  AlertCircle, Plug, Globe, Clock, TrendingUp, Zap, Key, ExternalLink,
  Play, Pause, BarChart3, FileText, Shield, Info
} from 'lucide-react'
import { cn } from '@/lib/utils'

export interface SupplierConnectorConfig {
  id: string
  name: string
  logo?: string
  description: string
  website: string
  category: 'dropshipping' | 'marketplace' | 'ecommerce' | 'wholesaler'
  region: string
  features: string[]
  authType: 'api_key' | 'oauth' | 'credentials'
  authFields: {
    name: string
    key: string
    type: 'text' | 'password' | 'email'
    placeholder: string
    required: boolean
    helpText?: string
  }[]
  documentation?: string
  pricing?: string
  productCount?: string
  deliveryTime?: string
  color: string
}

interface SupplierConnectorTemplateProps {
  config: SupplierConnectorConfig
}

export default function SupplierConnectorTemplate({ config }: SupplierConnectorTemplateProps) {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [autoSync, setAutoSync] = useState(true)
  const [credentials, setCredentials] = useState<Record<string, string>>({})
  const [syncProgress, setSyncProgress] = useState(0)

  const handleConnect = async () => {
    // Validate required fields
    const missingFields = config.authFields
      .filter(f => f.required && !credentials[f.key])
      .map(f => f.name)

    if (missingFields.length > 0) {
      toast({
        title: "Champs manquants",
        description: `Veuillez remplir: ${missingFields.join(', ')}`,
        variant: "destructive"
      })
      return
    }

    setIsConnecting(true)
    
    // Simulate connection
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    setIsConnected(true)
    setIsConnecting(false)
    
    toast({
      title: "Connecté avec succès",
      description: `${config.name} est maintenant connecté à votre compte`,
    })
  }

  const handleDisconnect = () => {
    setIsConnected(false)
    setCredentials({})
    toast({
      title: "Déconnecté",
      description: `${config.name} a été déconnecté`,
    })
  }

  const handleSync = async () => {
    setIsSyncing(true)
    setSyncProgress(0)
    
    // Simulate sync progress
    for (let i = 0; i <= 100; i += 10) {
      await new Promise(resolve => setTimeout(resolve, 300))
      setSyncProgress(i)
    }
    
    setIsSyncing(false)
    setSyncProgress(0)
    
    toast({
      title: "Synchronisation terminée",
      description: "Les produits ont été synchronisés avec succès",
    })
  }

  const getCategoryBadge = () => {
    const colors: Record<string, string> = {
      dropshipping: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      marketplace: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      ecommerce: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      wholesaler: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    }
    const labels: Record<string, string> = {
      dropshipping: 'Dropshipping',
      marketplace: 'Marketplace',
      ecommerce: 'E-commerce',
      wholesaler: 'Grossiste',
    }
    return (
      <Badge className={colors[config.category]}>
        {labels[config.category]}
      </Badge>
    )
  }

  return (
    <>
      <Helmet>
        <title>{config.name} - Connecteur Fournisseur | ShopOpti</title>
        <meta name="description" content={config.description} />
      </Helmet>

      <div className="container mx-auto p-4 md:p-6 space-y-6 pb-24 md:pb-6">
        {/* Header */}
        <div className="flex items-start gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate('/suppliers')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          
          <div className="flex-1">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div 
                  className={cn(
                    "p-3 rounded-xl",
                    `bg-gradient-to-br from-${config.color}-500/20 to-${config.color}-600/20`
                  )}
                  style={{ background: `linear-gradient(135deg, ${config.color}20, ${config.color}40)` }}
                >
                  <Plug className="h-8 w-8" style={{ color: config.color }} />
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <h1 className="text-2xl md:text-3xl font-bold">{config.name}</h1>
                    {getCategoryBadge()}
                    {isConnected && (
                      <Badge variant="default" className="bg-green-600">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Connecté
                      </Badge>
                    )}
                  </div>
                  <p className="text-muted-foreground mt-1">{config.description}</p>
                </div>
              </div>

              <div className="flex gap-2">
                {config.website && (
                  <Button variant="outline" asChild>
                    <a href={config.website} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Site web
                    </a>
                  </Button>
                )}
                {config.documentation && (
                  <Button variant="outline" asChild>
                    <a href={config.documentation} target="_blank" rel="noopener noreferrer">
                      <FileText className="h-4 w-4 mr-2" />
                      Documentation
                    </a>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Globe className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Région</p>
                  <p className="font-semibold">{config.region}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <Package className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Produits</p>
                  <p className="font-semibold">{config.productCount || '100K+'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <Clock className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Livraison</p>
                  <p className="font-semibold">{config.deliveryTime || '3-15 jours'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/10">
                  <TrendingUp className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Tarifs</p>
                  <p className="font-semibold">{config.pricing || 'Variable'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue={isConnected ? "catalog" : "connect"} className="space-y-6">
          <TabsList className="w-full justify-start overflow-x-auto">
            <TabsTrigger value="connect" className="gap-2">
              <Key className="h-4 w-4" />
              <span className="hidden sm:inline">Connexion</span>
            </TabsTrigger>
            <TabsTrigger value="catalog" disabled={!isConnected} className="gap-2">
              <Package className="h-4 w-4" />
              <span className="hidden sm:inline">Catalogue</span>
            </TabsTrigger>
            <TabsTrigger value="import" disabled={!isConnected} className="gap-2">
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Import</span>
            </TabsTrigger>
            <TabsTrigger value="settings" disabled={!isConnected} className="gap-2">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Paramètres</span>
            </TabsTrigger>
          </TabsList>

          {/* Connect Tab */}
          <TabsContent value="connect" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Connection Form */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Key className="h-5 w-5" />
                    {isConnected ? 'Connexion Active' : 'Configurer la connexion'}
                  </CardTitle>
                  <CardDescription>
                    {config.authType === 'api_key' && 'Entrez vos clés API pour connecter votre compte'}
                    {config.authType === 'oauth' && 'Connectez-vous via OAuth pour autoriser l\'accès'}
                    {config.authType === 'credentials' && 'Entrez vos identifiants de connexion'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {!isConnected ? (
                    <>
                      {config.authFields.map((field) => (
                        <div key={field.key} className="space-y-2">
                          <Label htmlFor={field.key}>
                            {field.name}
                            {field.required && <span className="text-destructive ml-1">*</span>}
                          </Label>
                          <Input
                            id={field.key}
                            type={field.type}
                            placeholder={field.placeholder}
                            value={credentials[field.key] || ''}
                            onChange={(e) => setCredentials(prev => ({ ...prev, [field.key]: e.target.value }))}
                          />
                          {field.helpText && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <Info className="h-3 w-3" />
                              {field.helpText}
                            </p>
                          )}
                        </div>
                      ))}
                      
                      <Button 
                        onClick={handleConnect} 
                        disabled={isConnecting}
                        className="w-full mt-4"
                      >
                        {isConnecting ? (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            Connexion en cours...
                          </>
                        ) : (
                          <>
                            <Plug className="h-4 w-4 mr-2" />
                            Connecter {config.name}
                          </>
                        )}
                      </Button>
                    </>
                  ) : (
                    <div className="space-y-4">
                      <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                        <div className="flex items-center gap-3">
                          <CheckCircle className="h-6 w-6 text-green-600" />
                          <div>
                            <p className="font-medium text-green-800 dark:text-green-200">
                              Connexion active
                            </p>
                            <p className="text-sm text-green-700 dark:text-green-300">
                              Votre compte {config.name} est connecté
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button variant="outline" onClick={handleSync} disabled={isSyncing} className="flex-1">
                          {isSyncing ? (
                            <>
                              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                              Synchronisation...
                            </>
                          ) : (
                            <>
                              <RefreshCw className="h-4 w-4 mr-2" />
                              Synchroniser
                            </>
                          )}
                        </Button>
                        <Button variant="destructive" onClick={handleDisconnect}>
                          Déconnecter
                        </Button>
                      </div>
                      
                      {isSyncing && (
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Progression</span>
                            <span>{syncProgress}%</span>
                          </div>
                          <Progress value={syncProgress} />
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Features & Info */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="h-5 w-5" />
                      Fonctionnalités
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 gap-2">
                      {config.features.map((feature, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-sm">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      Sécurité
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Connexion chiffrée SSL/TLS</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Clés API stockées de manière sécurisée</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Accès révocable à tout moment</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Catalog Tab */}
          <TabsContent value="catalog" className="space-y-6">
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Package className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Catalogue {config.name}</h3>
                <p className="text-muted-foreground text-center max-w-md mb-4">
                  Parcourez les produits disponibles et importez-les dans votre boutique en quelques clics.
                </p>
                <Button onClick={() => navigate(`/suppliers/${config.id}/catalog`)}>
                  <Package className="h-4 w-4 mr-2" />
                  Ouvrir le catalogue
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Import Tab */}
          <TabsContent value="import" className="space-y-6">
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Download className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Importer des produits</h3>
                <p className="text-muted-foreground text-center max-w-md mb-4">
                  Importez des produits depuis {config.name} vers votre catalogue.
                </p>
                <div className="flex gap-2">
                  <Button onClick={() => navigate('/import/url')}>
                    <Zap className="h-4 w-4 mr-2" />
                    Import par URL
                  </Button>
                  <Button variant="outline" onClick={() => navigate('/import/advanced')}>
                    <Settings className="h-4 w-4 mr-2" />
                    Import avancé
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Paramètres de synchronisation</CardTitle>
                <CardDescription>
                  Configurez la synchronisation automatique avec {config.name}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Synchronisation automatique</Label>
                    <p className="text-sm text-muted-foreground">
                      Mettre à jour automatiquement les stocks et prix
                    </p>
                  </div>
                  <Switch
                    checked={autoSync}
                    onCheckedChange={setAutoSync}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Notifications de rupture</Label>
                    <p className="text-sm text-muted-foreground">
                      Être alerté quand un produit est en rupture
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Mise à jour des prix</Label>
                    <p className="text-sm text-muted-foreground">
                      Appliquer automatiquement les changements de prix
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  )
}
