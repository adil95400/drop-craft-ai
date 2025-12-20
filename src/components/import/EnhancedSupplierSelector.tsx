import { useState } from 'react'
import { ArrowRight, CheckCircle, Download, Globe, Key, Zap, Star, Crown, Sparkles, Settings, Lock, Shield } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/hooks/use-toast'
import { SecureCredentialForm } from '@/components/integrations/SecureCredentialForm'
import { supabase } from '@/integrations/supabase/client'
import { logError, logAction } from '@/utils/consoleCleanup'
import { SUPPLIERS, SUPPLIER_CATEGORIES, getSuppliersByCategory, getPopularSuppliers, type Supplier } from '@/data/suppliers'

interface SupplierConfigDialogProps {
  supplier: Supplier
  isOpen: boolean
  onClose: () => void
}

const SupplierConfigDialog = ({ supplier, isOpen, onClose }: SupplierConfigDialogProps) => {
  const { toast } = useToast()
  const [isConnecting, setIsConnecting] = useState(false)
  const [currentStep, setCurrentStep] = useState<'auth' | 'methods' | 'features'>('auth')
  const [authData, setAuthData] = useState({
    isConnected: false
  })
  const [selectedMethods, setSelectedMethods] = useState<string[]>([])
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([])

  // Enhanced import methods with more comprehensive options
  const importMethods = [
    { id: 'csv', name: 'CSV', description: 'Fichiers séparés par virgules', icon: '📊', color: 'border-blue-400 bg-blue-50 dark:bg-blue-950/20' },
    { id: 'excel', name: 'Excel', description: 'Fichiers .xlsx/.xls', icon: '📈', color: 'border-green-400 bg-green-50 dark:bg-green-950/20' },
    { id: 'xml', name: 'XML', description: 'Données structurées XML', icon: '🔗', color: 'border-purple-400 bg-purple-50 dark:bg-purple-950/20' },
    { id: 'api', name: 'API', description: 'Connexion API temps réel', icon: '⚡', color: 'border-orange-400 bg-orange-50 dark:bg-orange-950/20' },
    { id: 'ftp', name: 'FTP', description: 'Transfert fichiers FTP/SFTP', icon: '🌐', color: 'border-cyan-400 bg-cyan-50 dark:bg-cyan-950/20' },
    { id: 'url', name: 'URL', description: 'Import depuis URL web', icon: '🔗', color: 'border-pink-400 bg-pink-50 dark:bg-pink-950/20' },
    { id: 'json', name: 'JSON', description: 'Format JSON structuré', icon: '📋', color: 'border-indigo-400 bg-indigo-50 dark:bg-indigo-950/20' },
    { id: 'shopify', name: 'Shopify', description: 'Export Shopify natif', icon: '🛒', color: 'border-emerald-400 bg-emerald-50 dark:bg-emerald-950/20' }
  ]

  // Comprehensive features available for all suppliers
  const availableFeatures = [
    { id: 'sync_stock', name: 'Synchronisation stock', description: 'Mise à jour automatique des stocks', icon: '📦' },
    { id: 'import_catalog', name: 'Import catalogue', description: 'Import massif de produits', icon: '📚' },
    { id: 'order_management', name: 'Gestion commandes', description: 'Suivi et gestion des commandes', icon: '🛒' },
    { id: 'product_import', name: 'Import produits', description: 'Import sélectif de produits', icon: '⬇️' },
    { id: 'price_tracking', name: 'Suivi prix', description: 'Surveillance des prix concurrents', icon: '💰' },
    { id: 'realtime_stock', name: 'Stock temps réel', description: 'Synchronisation en temps réel', icon: '📊' },
    { id: 'marketplace_management', name: 'Gestion marketplace', description: 'Multi-marketplace management', icon: '🏪' },
    { id: 'analytics', name: 'Analytics avancées', description: 'Analyses et rapports détaillés', icon: '📈' },
    { id: 'auto_pricing', name: 'Prix automatiques', description: 'Ajustement automatique des prix', icon: '🎯' },
    { id: 'inventory_alerts', name: 'Alertes stock', description: 'Notifications de stock bas', icon: '🔔' },
    { id: 'sales_management', name: 'Gestion ventes', description: 'Suivi des ventes et CA', icon: '💳' },
    { id: 'competitor_analysis', name: 'Analyse concurrence', description: 'Surveillance de la concurrence', icon: '🔍' }
  ]

  const handleConnect = async (credentials: Record<string, string>) => {
    try {
      setIsConnecting(true)
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast({
          title: "Authentification requise",
          description: "Veuillez vous connecter pour configurer les intégrations",
          variant: "destructive"
        })
        return
      }

      // Save user-specific credentials to Supabase
      const { error } = await supabase
        .from('integrations')
        .upsert({
          user_id: user.id,
          platform: supplier.name,
          platform_name: supplier.name,
          store_url: `https://${supplier.name}.com`,
          api_key_encrypted: JSON.stringify(credentials),
          connection_status: 'connected',
          is_active: true
        })

      if (error) {
        throw error
      }

      setAuthData({ isConnected: true })
      toast({
        title: "✅ Connexion réussie",
        description: `Configuration ${supplier.displayName} sauvegardée avec succès`
      })
      setCurrentStep('methods')
    } catch (error) {
      logError(error as Error, 'Supplier connection');
      toast({
        title: "Erreur de connexion",
        description: "Impossible de sauvegarder la configuration",
        variant: "destructive"
      })
    } finally {
      setIsConnecting(false)
    }
  }

  const handleOAuthConnect = async () => {
    setIsConnecting(true)
    
    try {
      toast({
        title: "Démarrage OAuth",
        description: `Initialisation de la connexion OAuth avec ${supplier.displayName}...`
      })
      
      // Simulate OAuth process for demo
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // Save OAuth connection
      await handleConnect({ oauth_token: 'simulated_oauth_token', provider: supplier.name })
      
    } catch (error: any) {
      toast({
        title: "Erreur OAuth",
        description: error.message || "Impossible de se connecter",
        variant: "destructive"
      })
    } finally {
      setIsConnecting(false)
    }
  }

  const handleMethodToggle = (method: string) => {
    setSelectedMethods(prev => 
      prev.includes(method) 
        ? prev.filter(m => m !== method)
        : [...prev, method]
    )
  }

  const handleFeatureToggle = (feature: string) => {
    setSelectedFeatures(prev => 
      prev.includes(feature) 
        ? prev.filter(f => f !== feature)
        : [...prev, feature]
    )
  }

  const handleComplete = async () => {
    if (selectedMethods.length === 0) {
      toast({
        title: "Sélection requise",
        description: "Veuillez sélectionner au moins une méthode d'import",
        variant: "destructive"
      })
      return
    }

    try {
      // Update integration with selected methods and features
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase
          .from('integrations')
          .update({
            config: {
              import_methods: selectedMethods,
              features: selectedFeatures,
              configured_at: new Date().toISOString()
            }
          })
          .eq('user_id', user.id)
          .eq('platform', supplier.name)
      }

      toast({
        title: "✅ Configuration terminée",
        description: `${supplier.displayName} configuré avec ${selectedMethods.length} méthode(s) et ${selectedFeatures.length} fonctionnalité(s)`
      })
      
      onClose()
    } catch (error) {
      logError(error as Error, 'Save supplier configuration');
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder la configuration finale",
        variant: "destructive"
      })
    }
  }

  const getCredentialFields = () => {
    switch (supplier.authType) {
      case 'api_key':
        return [
          {
            name: 'api_key',
            label: 'Clé API',
            type: 'password' as const,
            required: true,
            placeholder: 'Votre clé API personnelle',
            description: `Obtenez votre clé API depuis votre compte ${supplier.displayName}`
          }
        ]
      case 'credentials':
        return [
          {
            name: 'username',
            label: 'Nom d\'utilisateur',
            type: 'text' as const,
            required: true,
            placeholder: 'Votre nom d\'utilisateur'
          },
          {
            name: 'password',
            label: 'Mot de passe',
            type: 'password' as const,
            required: true,
            placeholder: 'Votre mot de passe'
          },
          {
            name: 'store_url',
            label: 'URL du magasin',
            type: 'url' as const,
            required: false,
            placeholder: 'https://votre-magasin.com',
            description: 'URL de votre boutique (si applicable)'
          }
        ]
      default:
        return []
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="text-2xl">{supplier.icon}</div>
            <div>
              <DialogTitle>Configuration {supplier.displayName}</DialogTitle>
              <DialogDescription>{supplier.description}</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Progress Indicator */}
        <div className="flex items-center justify-between mb-6">
          <div className={`flex items-center gap-2 ${currentStep === 'auth' ? 'text-primary' : authData.isConnected ? 'text-green-600' : 'text-muted-foreground'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              authData.isConnected ? 'bg-green-100 text-green-600' : 
              currentStep === 'auth' ? 'bg-primary text-primary-foreground' : 'bg-muted'
            }`}>
              {authData.isConnected ? <CheckCircle className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
            </div>
            <span className="text-sm font-medium">Authentification</span>
          </div>
          
          <ArrowRight className="h-4 w-4 text-muted-foreground" />
          
          <div className={`flex items-center gap-2 ${currentStep === 'methods' ? 'text-primary' : 'text-muted-foreground'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              currentStep === 'methods' ? 'bg-primary text-primary-foreground' : 'bg-muted'
            }`}>
              <Download className="h-4 w-4" />
            </div>
            <span className="text-sm font-medium">Méthodes</span>
          </div>
          
          <ArrowRight className="h-4 w-4 text-muted-foreground" />
          
          <div className={`flex items-center gap-2 ${currentStep === 'features' ? 'text-primary' : 'text-muted-foreground'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              currentStep === 'features' ? 'bg-primary text-primary-foreground' : 'bg-muted'
            }`}>
              <Settings className="h-4 w-4" />
            </div>
            <span className="text-sm font-medium">Fonctionnalités</span>
          </div>
        </div>

        {/* Authentication Step */}
        {currentStep === 'auth' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">Authentification personnelle</h3>
            </div>

            {!supplier.requiresAuth ? (
              <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
                <div className="flex items-center gap-2 text-green-800 dark:text-green-200">
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-sm font-medium">Aucune authentification requise</span>
                </div>
                <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                  Ce fournisseur ne nécessite pas d'authentification spéciale.
                </p>
                <Button className="mt-3" onClick={() => setCurrentStep('methods')}>
                  Continuer vers les méthodes
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            ) : supplier.authType === 'oauth' ? (
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                  <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">Connexion OAuth</h4>
                  <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
                    Connectez votre compte {supplier.displayName} personnel de manière sécurisée.
                  </p>
                  {!authData.isConnected ? (
                    <Button 
                      onClick={handleOAuthConnect} 
                      className="w-full"
                      disabled={isConnecting}
                    >
                      <Globe className="h-4 w-4 mr-2" />
                      {isConnecting ? '🔄 Connexion OAuth...' : `🔐 Se connecter à ${supplier.displayName}`}
                    </Button>
                  ) : (
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle className="h-4 w-4" />
                      <span className="text-sm font-medium">Connecté avec succès</span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <SecureCredentialForm
                platform={supplier.displayName}
                fields={getCredentialFields()}
                onSubmit={handleConnect}
                isLoading={isConnecting}
              />
            )}

            {authData.isConnected && (
              <Button onClick={() => setCurrentStep('methods')} className="w-full">
                Continuer vers les méthodes d'import
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        )}

        {/* Import Methods Step */}
        {currentStep === 'methods' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Download className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">Choisissez vos méthodes d'import</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {importMethods.map((method) => {
                const isSelected = selectedMethods.includes(method.id)
                
                return (
                  <div
                    key={method.id}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                      isSelected 
                        ? `${method.color} border-primary ring-2 ring-primary/20` 
                        : 'border-border hover:border-primary/50 hover:bg-primary/5'
                    }`}
                    onClick={() => handleMethodToggle(method.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="text-2xl">{method.icon}</div>
                        <div>
                          <h4 className="font-semibold">{method.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {method.description}
                          </p>
                        </div>
                      </div>
                      <Checkbox 
                        checked={isSelected}
                        onCheckedChange={() => handleMethodToggle(method.id)}
                        className="ml-3"
                      />
                    </div>
                  </div>
                )
              })}
            </div>

            <p className="text-xs text-muted-foreground text-center">
              Sélectionnez une ou plusieurs méthodes selon vos préférences d'import
            </p>

            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={() => setCurrentStep('auth')}>
                Retour
              </Button>
              <Button 
                onClick={() => setCurrentStep('features')}
                disabled={selectedMethods.length === 0}
                className="flex-1"
              >
                Continuer vers les fonctionnalités
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* Features Step */}
        {currentStep === 'features' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">Fonctionnalités à activer</h3>
            </div>

            <div className="grid grid-cols-1 gap-3 max-h-80 overflow-y-auto">
              {availableFeatures.map((feature) => {
                const isSelected = selectedFeatures.includes(feature.id)
                
                return (
                  <div
                    key={feature.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-all ${
                      isSelected 
                        ? 'border-primary bg-primary/5 ring-2 ring-primary/20' 
                        : 'border-border hover:border-primary/50 hover:bg-primary/5'
                    }`}
                    onClick={() => handleFeatureToggle(feature.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="text-xl">{feature.icon}</div>
                        <div>
                          <h4 className="font-medium text-sm">{feature.name}</h4>
                          <p className="text-xs text-muted-foreground">
                            {feature.description}
                          </p>
                        </div>
                      </div>
                      <Checkbox 
                        checked={isSelected}
                        onCheckedChange={() => handleFeatureToggle(feature.id)}
                        className="ml-3"
                      />
                    </div>
                  </div>
                )
              })}
            </div>

            <p className="text-xs text-muted-foreground text-center">
              Activez les fonctionnalités selon vos besoins business
            </p>

            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={() => setCurrentStep('methods')}>
                Retour
              </Button>
              <Button 
                onClick={handleComplete}
                disabled={selectedFeatures.length === 0}
                className="flex-1"
              >
                Finaliser la configuration
                <CheckCircle className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

export const EnhancedSupplierSelector = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedAuthType, setSelectedAuthType] = useState<string>('all')
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null)
  const [isConfigDialogOpen, setIsConfigDialogOpen] = useState(false)

  const filteredSuppliers = SUPPLIERS.filter(supplier => {
    const matchesSearch = supplier.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         supplier.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || supplier.category === selectedCategory
    const matchesAuthType = selectedAuthType === 'all' || 
                           (selectedAuthType === 'no_auth' && !supplier.requiresAuth) ||
                           (selectedAuthType !== 'no_auth' && supplier.authType === selectedAuthType)
    
    return matchesSearch && matchesCategory && matchesAuthType
  })

  const popularSuppliers = getPopularSuppliers()
  const categories = Object.values(SUPPLIER_CATEGORIES)

  const handleConfigureSupplier = (supplier: Supplier) => {
    setSelectedSupplier(supplier)
    setIsConfigDialogOpen(true)
  }

  const getAuthTypeLabel = (authType: string | undefined, requiresAuth: boolean) => {
    if (!requiresAuth) return 'Aucune auth'
    switch (authType) {
      case 'oauth': return 'OAuth'
      case 'api_key': return 'Clé API'
      case 'credentials': return 'Identifiants'
      default: return 'Auth requise'
    }
  }

  const getAuthTypeBadgeVariant = (authType: string | undefined, requiresAuth: boolean) => {
    if (!requiresAuth) return 'secondary'
    switch (authType) {
      case 'oauth': return 'default'
      case 'api_key': return 'outline'
      case 'credentials': return 'destructive'
      default: return 'secondary'
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Sélecteur de fournisseurs avancé</h2>
        <p className="text-muted-foreground">
          Choisissez et configurez vos fournisseurs avec vos propres identifiants
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="flex-1 min-w-[300px]">
          <Input
            placeholder="Rechercher un fournisseur..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </div>
        
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Catégorie" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les catégories</SelectItem>
            {categories.map(category => (
              <SelectItem key={category} value={category}>{category}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedAuthType} onValueChange={setSelectedAuthType}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Type d'auth" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les types</SelectItem>
            <SelectItem value="no_auth">Sans auth</SelectItem>
            <SelectItem value="oauth">OAuth</SelectItem>
            <SelectItem value="api_key">Clé API</SelectItem>
            <SelectItem value="credentials">Identifiants</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Popular Suppliers */}
      {searchTerm === '' && selectedCategory === 'all' && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500" />
            Fournisseurs populaires
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {popularSuppliers.slice(0, 8).map(supplier => (
              <Card key={supplier.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{supplier.icon}</span>
                      <div>
                        <CardTitle className="text-sm">{supplier.displayName}</CardTitle>
                        <CardDescription className="text-xs">{supplier.description}</CardDescription>
                      </div>
                    </div>
                    {supplier.isPopular && <Crown className="h-4 w-4 text-yellow-500" />}
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-1">
                      {supplier.supportedFormats.slice(0, 3).map(format => (
                        <Badge key={format} variant="outline" className="text-xs">{format}</Badge>
                      ))}
                      {supplier.supportedFormats.length > 3 && (
                        <Badge variant="outline" className="text-xs">+{supplier.supportedFormats.length - 3}</Badge>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <Badge variant={getAuthTypeBadgeVariant(supplier.authType, supplier.requiresAuth)} className="text-xs">
                        {getAuthTypeLabel(supplier.authType, supplier.requiresAuth)}
                      </Badge>
                      <Button 
                        size="sm" 
                        onClick={() => handleConfigureSupplier(supplier)}
                        className="text-xs"
                      >
                        Configurer
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* All Suppliers */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">
          Tous les fournisseurs ({filteredSuppliers.length})
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredSuppliers.map(supplier => (
            <Card key={supplier.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{supplier.icon}</span>
                    <div>
                      <CardTitle className="text-sm flex items-center gap-1">
                        {supplier.displayName}
                        {supplier.isNew && <Badge className="text-xs bg-green-500">Nouveau</Badge>}
                        {supplier.status === 'beta' && <Badge variant="outline" className="text-xs">Beta</Badge>}
                      </CardTitle>
                      <CardDescription className="text-xs">{supplier.description}</CardDescription>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    {supplier.isPopular && <Crown className="h-4 w-4 text-yellow-500" />}
                    {supplier.isNew && <Sparkles className="h-4 w-4 text-green-500" />}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-1">
                    {supplier.supportedFormats.slice(0, 3).map(format => (
                      <Badge key={format} variant="outline" className="text-xs">{format}</Badge>
                    ))}
                    {supplier.supportedFormats.length > 3 && (
                      <Badge variant="outline" className="text-xs">+{supplier.supportedFormats.length - 3}</Badge>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {supplier.features.slice(0, 2).map(feature => (
                      <Badge key={feature} variant="secondary" className="text-xs">{feature}</Badge>
                    ))}
                    {supplier.features.length > 2 && (
                      <Badge variant="secondary" className="text-xs">+{supplier.features.length - 2}</Badge>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <Badge variant={getAuthTypeBadgeVariant(supplier.authType, supplier.requiresAuth)} className="text-xs">
                      {getAuthTypeLabel(supplier.authType, supplier.requiresAuth)}
                    </Badge>
                    <Button 
                      size="sm" 
                      onClick={() => handleConfigureSupplier(supplier)}
                      className="text-xs"
                    >
                      Configurer
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Configuration Dialog */}
      {selectedSupplier && (
        <SupplierConfigDialog
          supplier={selectedSupplier}
          isOpen={isConfigDialogOpen}
          onClose={() => {
            setIsConfigDialogOpen(false)
            setSelectedSupplier(null)
          }}
        />
      )}
    </div>
  )
}
