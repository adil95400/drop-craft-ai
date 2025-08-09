import { useState } from 'react'
import { ArrowRight, CheckCircle, Download, Globe, Key, Zap, Star, Crown, Sparkles, Settings, Lock, Shield } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/hooks/use-toast'
import { useOAuthSupplier } from '@/hooks/useOAuthSupplier'
import { SUPPLIERS, SUPPLIER_CATEGORIES, getSuppliersByCategory, getPopularSuppliers, type Supplier } from '@/data/suppliers'

interface SupplierConfigDialogProps {
  supplier: Supplier
  isOpen: boolean
  onClose: () => void
}

const SupplierConfigDialog = ({ supplier, isOpen, onClose }: SupplierConfigDialogProps) => {
  const { toast } = useToast()
  const { initiateOAuth, isConnecting } = useOAuthSupplier()
  const [currentStep, setCurrentStep] = useState<'auth' | 'methods' | 'features'>('auth')
  const [authData, setAuthData] = useState({
    apiKey: '',
    storeUrl: '',
    isConnected: false
  })
  const [selectedMethods, setSelectedMethods] = useState<string[]>([])
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([])
  const [importSettings, setImportSettings] = useState({
    importLimit: '100',
    autoSync: false
  })

  const handleOAuthConnect = async () => {
    try {
      toast({
        title: "Démarrage OAuth",
        description: `Initialisation de la connexion avec ${supplier.displayName}...`
      })
      
      await initiateOAuth(supplier.id)
      
      // Simulate successful connection for demo
      setTimeout(() => {
        setAuthData(prev => ({ ...prev, isConnected: true }))
        toast({
          title: "Connexion OAuth simulée",
          description: `Votre compte ${supplier.displayName} a été connecté (démo)`
        })
        setCurrentStep('methods')
      }, 2000)
      
    } catch (error: any) {
      toast({
        title: "Erreur OAuth",
        description: error.message || "Impossible de se connecter",
        variant: "destructive"
      })
    }
  }

  const handleApiKeyAuth = () => {
    if (!authData.apiKey) {
      toast({
        title: "Configuration requise",
        description: "Veuillez saisir votre clé API",
        variant: "destructive"
      })
      return
    }

    setAuthData(prev => ({ ...prev, isConnected: true }))
    toast({
      title: "Authentification réussie",
      description: `Connexion établie avec ${supplier.displayName}`
    })
    setCurrentStep('methods')
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

  const handleComplete = () => {
    if (selectedMethods.length === 0) {
      toast({
        title: "Sélection requise",
        description: "Veuillez sélectionner au moins une méthode d'import",
        variant: "destructive"
      })
      return
    }

    toast({
      title: "Configuration terminée",
      description: `${supplier.displayName} configuré avec ${selectedMethods.length} méthode(s) et ${selectedFeatures.length} fonctionnalité(s)`
    })
    
    onClose()
  }

  const needsOAuth = supplier.requiresAuth && supplier.authType === 'oauth'
  const needsApiKey = supplier.requiresAuth && supplier.authType === 'api_key'
  const needsCredentials = supplier.requiresAuth && supplier.authType === 'credentials'

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
              <h3 className="text-lg font-semibold">Authentification sécurisée</h3>
            </div>

            {!supplier.requiresAuth && (
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
            )}

            {needsOAuth && (
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                  <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">Connexion OAuth</h4>
                  <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
                    Connectez votre compte {supplier.displayName} de manière sécurisée via OAuth.
                  </p>
                  {!authData.isConnected ? (
                    <Button 
                      onClick={handleOAuthConnect} 
                      className="w-full"
                      disabled={isConnecting}
                    >
                      <Globe className="h-4 w-4 mr-2" />
                      {isConnecting ? 'Connexion...' : `Se connecter à ${supplier.displayName}`}
                    </Button>
                  ) : (
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle className="h-4 w-4" />
                      <span className="text-sm font-medium">Connecté avec succès</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {needsApiKey && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Clé API</label>
                  <Input
                    type="password"
                    placeholder="Entrez votre clé API..."
                    value={authData.apiKey}
                    onChange={(e) => setAuthData(prev => ({ ...prev, apiKey: e.target.value }))}
                  />
                  <p className="text-xs text-muted-foreground">
                    Obtenez votre clé API dans les paramètres développeur de {supplier.displayName}
                  </p>
                </div>
                <Button 
                  onClick={handleApiKeyAuth} 
                  disabled={!authData.apiKey}
                  className="w-full"
                >
                  <Key className="h-4 w-4 mr-2" />
                  Authentifier
                </Button>
              </div>
            )}

            {needsCredentials && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">URL du magasin</label>
                  <Input
                    placeholder="https://monmagasin.example.com"
                    value={authData.storeUrl}
                    onChange={(e) => setAuthData(prev => ({ ...prev, storeUrl: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Clé d'accès</label>
                  <Input
                    type="password"
                    placeholder="Clé d'accès du magasin..."
                    value={authData.apiKey}
                    onChange={(e) => setAuthData(prev => ({ ...prev, apiKey: e.target.value }))}
                  />
                </div>
                <Button 
                  onClick={handleApiKeyAuth}
                  disabled={!authData.storeUrl || !authData.apiKey}
                  className="w-full"
                >
                  <Shield className="h-4 w-4 mr-2" />
                  Valider les identifiants
                </Button>
              </div>
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
              <h3 className="text-lg font-semibold">Méthodes d'import disponibles</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {supplier.supportedFormats.map((method) => (
                <div
                  key={method}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    selectedMethods.includes(method) 
                      ? 'border-primary bg-primary/10' 
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => handleMethodToggle(method)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium">{method}</h4>
                      <p className="text-sm text-muted-foreground">
                        {method === 'CSV' && 'Import de fichiers CSV'}
                        {method === 'XML' && 'Import de flux XML'}
                        {method === 'API' && 'Synchronisation API temps réel'}
                        {method === 'Excel' && 'Import de fichiers Excel'}
                        {method === 'URL' && 'Import depuis URL'}
                      </p>
                    </div>
                    <Checkbox 
                      checked={selectedMethods.includes(method)}
                      onCheckedChange={() => handleMethodToggle(method)}
                      className="ml-3"
                    />
                  </div>
                </div>
              ))}
            </div>

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

            <div className="grid grid-cols-1 gap-3">
              {supplier.features.map((feature) => (
                <div
                  key={feature}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    selectedFeatures.includes(feature) 
                      ? 'border-primary bg-primary/10' 
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => handleFeatureToggle(feature)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="text-lg">
                        {feature.includes('stock') && '📦'}
                        {feature.includes('prix') && '💰'}
                        {feature.includes('catalogue') && '📚'}
                        {feature.includes('commande') && '🛒'}
                        {feature.includes('Import') && '⬇️'}
                        {feature.includes('Suivi') && '👀'}
                        {feature.includes('Gestion') && '⚙️'}
                        {feature.includes('Analytics') && '📊'}
                        {!feature.includes('stock') && !feature.includes('prix') && 
                         !feature.includes('catalogue') && !feature.includes('commande') &&
                         !feature.includes('Import') && !feature.includes('Suivi') &&
                         !feature.includes('Gestion') && !feature.includes('Analytics') && '✨'}
                      </div>
                      <div>
                        <h4 className="font-medium">{feature}</h4>
                        <p className="text-sm text-muted-foreground">
                          Fonctionnalité disponible pour {supplier.displayName}
                        </p>
                      </div>
                    </div>
                    <Checkbox 
                      checked={selectedFeatures.includes(feature)}
                      onCheckedChange={() => handleFeatureToggle(feature)}
                      className="ml-3"
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Import Settings */}
            <div className="space-y-3 p-4 border rounded-lg bg-muted/20">
              <h4 className="font-medium">Paramètres d'import</h4>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Limite d'import</label>
                <Select value={importSettings.importLimit} onValueChange={(value) => 
                  setImportSettings(prev => ({ ...prev, importLimit: value }))
                }>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="50">50 produits</SelectItem>
                    <SelectItem value="100">100 produits</SelectItem>
                    <SelectItem value="500">500 produits</SelectItem>
                    <SelectItem value="1000">1000 produits</SelectItem>
                    <SelectItem value="unlimited">Illimité</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="autoSync"
                  checked={importSettings.autoSync}
                  onCheckedChange={(checked) => 
                    setImportSettings(prev => ({ ...prev, autoSync: checked as boolean }))
                  }
                />
                <label htmlFor="autoSync" className="text-sm font-medium">
                  Synchronisation automatique quotidienne
                </label>
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={() => setCurrentStep('methods')}>
                Retour
              </Button>
              <Button onClick={handleComplete} className="flex-1">
                <CheckCircle className="h-4 w-4 mr-2" />
                Terminer la configuration
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

export const EnhancedSupplierSelector = () => {
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [authFilter, setAuthFilter] = useState<'all' | 'oauth' | 'api_key' | 'no_auth'>('all')

  const filteredSuppliers = SUPPLIERS.filter(supplier => {
    const matchesCategory = selectedCategory === 'all' || supplier.category === selectedCategory
    const matchesSearch = supplier.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         supplier.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesAuth = authFilter === 'all' || 
                       (authFilter === 'oauth' && supplier.authType === 'oauth') ||
                       (authFilter === 'api_key' && supplier.authType === 'api_key') ||
                       (authFilter === 'no_auth' && !supplier.requiresAuth)
    return matchesCategory && matchesSearch && matchesAuth && supplier.status === 'active'
  })

  const popularSuppliers = getPopularSuppliers().filter(s => s.status === 'active')

  const getStatusBadge = (supplier: Supplier) => {
    if (supplier.isNew) return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Nouveau</Badge>
    if (supplier.isPopular) return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">Populaire</Badge>
    if (supplier.status === 'beta') return <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">Beta</Badge>
    return null
  }

  const getAuthBadge = (supplier: Supplier) => {
    if (!supplier.requiresAuth) return <Badge variant="outline" className="text-xs">Sans Auth</Badge>
    if (supplier.authType === 'oauth') return <Badge variant="default" className="text-xs bg-blue-600">OAuth</Badge>
    if (supplier.authType === 'api_key') return <Badge variant="default" className="text-xs bg-purple-600">API Key</Badge>
    if (supplier.authType === 'credentials') return <Badge variant="default" className="text-xs bg-gray-600">Credentials</Badge>
    return null
  }

  return (
    <div className="space-y-6">
      {/* Popular Suppliers */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Star className="h-5 w-5 text-yellow-500" />
          <h3 className="text-lg font-semibold">Fournisseurs Populaires</h3>
          <Badge variant="secondary">OAuth Ready</Badge>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {popularSuppliers.slice(0, 4).map((supplier) => (
            <Card key={supplier.id} className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-2xl">{supplier.icon}</div>
                  <div className="flex flex-col gap-1">
                    {getStatusBadge(supplier)}
                    {getAuthBadge(supplier)}
                  </div>
                </div>
                <h4 className="font-medium mb-1">{supplier.displayName}</h4>
                <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                  {supplier.description}
                </p>
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-1">
                    {supplier.supportedFormats.slice(0, 2).map((format, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {format}
                      </Badge>
                    ))}
                  </div>
                  <Button 
                    size="sm" 
                    className="w-full" 
                    onClick={() => setSelectedSupplier(supplier)}
                  >
                    <Settings className="h-3 w-3 mr-1" />
                    Configurer
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Tous les Fournisseurs</h3>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Rechercher un fournisseur..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full sm:w-64">
              <SelectValue placeholder="Catégorie" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les catégories</SelectItem>
              {Object.values(SUPPLIER_CATEGORIES).map(category => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={authFilter} onValueChange={(value: any) => setAuthFilter(value)}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Type d'auth" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous types</SelectItem>
              <SelectItem value="oauth">OAuth uniquement</SelectItem>
              <SelectItem value="api_key">API Key uniquement</SelectItem>
              <SelectItem value="no_auth">Sans authentification</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Suppliers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredSuppliers.map((supplier) => (
          <Card key={supplier.id} className="cursor-pointer hover:shadow-lg transition-all">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="text-2xl">{supplier.icon}</div>
                <div className="flex flex-col items-end gap-1">
                  {supplier.requiresAuth && <Key className="h-3 w-3 text-muted-foreground" />}
                  {getStatusBadge(supplier)}
                </div>
              </div>
              <CardTitle className="text-base">{supplier.displayName}</CardTitle>
              <CardDescription className="text-xs line-clamp-2">
                {supplier.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex flex-wrap gap-1">
                    {supplier.supportedFormats.slice(0, 2).map((format, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {format}
                      </Badge>
                    ))}
                    {supplier.supportedFormats.length > 2 && (
                      <Badge variant="outline" className="text-xs">
                        +{supplier.supportedFormats.length - 2}
                      </Badge>
                    )}
                  </div>
                  {getAuthBadge(supplier)}
                </div>
                
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Globe className="h-3 w-3" />
                  {supplier.regions.join(', ')}
                </div>

                <div className="text-xs text-muted-foreground">
                  <span className="font-medium">{supplier.features.length}</span> fonctionnalités disponibles
                </div>

                <Button 
                  size="sm" 
                  className="w-full" 
                  onClick={() => setSelectedSupplier(supplier)}
                >
                  <Settings className="h-3 w-3 mr-1" />
                  Configuration OAuth
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredSuppliers.length === 0 && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">
            Aucun fournisseur trouvé avec ces critères.
          </p>
        </div>
      )}

      {/* Enhanced Configuration Dialog */}
      {selectedSupplier && (
        <SupplierConfigDialog
          supplier={selectedSupplier}
          isOpen={!!selectedSupplier}
          onClose={() => setSelectedSupplier(null)}
        />
      )}
    </div>
  )
}