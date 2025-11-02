import React, { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import { useToast } from '@/hooks/use-toast'
import { usePremiumSuppliers } from '@/hooks/usePremiumSuppliers'
import { useRealSuppliers } from '@/hooks/useRealSuppliers'
import { supabase } from '@/integrations/supabase/client'
import { 
  Crown, 
  ShoppingBag, 
  Truck, 
  Globe, 
  Star, 
  Zap, 
  Shield, 
  TrendingUp, 
  Loader2, 
  CheckCircle2, 
  Settings, 
  Award, 
  ExternalLink, 
  RefreshCw, 
  MapPin, 
  Package,
  Clock,
  Plus,
  Search
} from 'lucide-react'
import { FeatureGate } from '@/components/common/FeatureGate'
import { useUnifiedPlan } from '@/lib/unified-plan-system'
import { RealTimeSupplierMonitor } from '@/components/suppliers/RealTimeSupplierMonitor'
import { SupplierPerformanceAnalytics } from '@/components/suppliers/SupplierPerformanceAnalytics'
import { AutomatedSupplierWorkflows } from '@/components/suppliers/AutomatedSupplierWorkflows'

export default function UnifiedSuppliersComplete() {
  const { toast } = useToast()
  const { hasFeature } = useUnifiedPlan()
  
  // Premium suppliers
  const { 
    suppliers: premiumSuppliers, 
    connections: premiumConnections,
    isLoadingSuppliers: isLoadingPremium,
    connectSupplier: connectPremiumSupplier,
    isConnecting: isConnectingPremium
  } = usePremiumSuppliers()
  
  // Standard suppliers
  const { 
    suppliers: standardSuppliers, 
    isLoading: isLoadingStandard,
    addSupplier,
    analyzeSupplier,
    isAnalyzing
  } = useRealSuppliers()

  const [activeTab, setActiveTab] = useState<'all' | 'premium' | 'standard' | 'monitor' | 'analytics' | 'workflows'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  
  // Connection dialog state
  const [connectDialog, setConnectDialog] = useState<{ open: boolean; supplierId?: string; type?: 'premium' | 'standard'; isConfig?: boolean }>({ open: false })
  const [jwtToken, setJwtToken] = useState('')
  
  // Sync state
  const [syncing, setSyncing] = useState<string | null>(null)
  const [syncProgress, setSyncProgress] = useState<Record<string, number>>({})

  const isConnected = (supplierId: string) => {
    return premiumConnections?.some(c => c.supplier_id === supplierId && c.status === 'active')
  }

  const handleDisconnect = async (supplierId: string) => {
    if (!confirm('Voulez-vous vraiment déconnecter ce fournisseur ?')) {
      return
    }

    try {
      const connection = premiumConnections?.find(c => c.supplier_id === supplierId)
      if (!connection) return

      const { error } = await supabase
        .from('premium_supplier_connections')
        .update({ status: 'suspended' })
        .eq('id', connection.id)

      if (error) throw error

      toast({
        title: 'Fournisseur déconnecté',
        description: 'La connexion a été suspendue'
      })

      // Rafraîchir les données
      window.location.reload()
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive'
      })
    }
  }

  const handleConnectPremium = (supplierId: string, isConfig = false) => {
    setConnectDialog({ open: true, supplierId, type: 'premium', isConfig })
    
    // Si c'est une reconfiguration, charger le token existant
    if (isConfig) {
      const connection = premiumConnections?.find(c => c.supplier_id === supplierId)
      const metadata = connection?.metadata as { jwt_token?: string; format?: string; language?: string } | null
      if (metadata?.jwt_token) {
        setJwtToken(metadata.jwt_token)
      }
    } else {
      setJwtToken('')
    }
  }

  const handleSaveConnection = async () => {
    if (!connectDialog.supplierId || !jwtToken) {
      toast({
        title: 'Erreur',
        description: 'Veuillez entrer le mot de passe API',
        variant: 'destructive'
      })
      return
    }

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')

      // Vérifier si une connexion existe déjà
      const { data: existingConnection } = await supabase
        .from('premium_supplier_connections')
        .select('id')
        .eq('user_id', user.id)
        .eq('supplier_id', connectDialog.supplierId)
        .single()

      if (existingConnection) {
        // Mettre à jour la connexion existante
        const { error } = await supabase
          .from('premium_supplier_connections')
          .update({
            status: 'active',
            metadata: { 
              jwt_token: jwtToken,
              api_password: jwtToken,
              format: 'json',
              language: 'fr-FR'
            }
          })
          .eq('id', existingConnection.id)

        if (error) throw error
      } else {
        // Créer une nouvelle connexion
        const { error } = await supabase
          .from('premium_supplier_connections')
          .insert({
            user_id: user.id,
            supplier_id: connectDialog.supplierId,
            status: 'active',
            metadata: { 
              jwt_token: jwtToken,
              api_password: jwtToken,
              format: 'json',
              language: 'fr-FR'
            }
          })

        if (error) throw error
      }

      setConnectDialog({ open: false })
      
      toast({
        title: 'Connexion réussie',
        description: 'Vous pouvez maintenant synchroniser les produits'
      })

      // Rafraîchir la page pour voir les changements
      window.location.reload()
    } catch (error: any) {
      console.error('Connection error:', error)
      toast({
        title: 'Erreur de connexion',
        description: error.message,
        variant: 'destructive'
      })
    }
  }

  const handleSync = async (supplierId: string) => {
    setSyncing(supplierId)
    setSyncProgress(prev => ({ ...prev, [supplierId]: 0 }))

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')

      // Simuler la progression
      const progressInterval = setInterval(() => {
        setSyncProgress(prev => {
          const current = prev[supplierId] || 0
          if (current < 90) {
            return { ...prev, [supplierId]: current + 10 }
          }
          return prev
        })
      }, 500)

      // Appeler l'edge function
      const { data, error } = await supabase.functions.invoke('premium-supplier-connect', {
        body: {
          userId: user.id,
          supplierId
        }
      })

      clearInterval(progressInterval)

      if (error) throw error

      setSyncProgress(prev => ({ ...prev, [supplierId]: 100 }))

      toast({
        title: 'Synchronisation terminée',
        description: `${data.data.products_imported} produits importés`
      })

      // Nettoyer après 2 secondes
      setTimeout(() => {
        setSyncProgress(prev => {
          const newProgress = { ...prev }
          delete newProgress[supplierId]
          return newProgress
        })
        setSyncing(null)
      }, 2000)

    } catch (error: any) {
      toast({
        title: 'Erreur de synchronisation',
        description: error.message,
        variant: 'destructive'
      })
      setSyncing(null)
      setSyncProgress(prev => {
        const newProgress = { ...prev }
        delete newProgress[supplierId]
        return newProgress
      })
    }
  }

  // Fusionner les fournisseurs premium et standard
  const allSuppliers = [
    ...(premiumSuppliers || []).map(s => ({ ...s, type: 'premium' as const })),
    ...(standardSuppliers || []).map(s => ({ 
      ...s, 
      type: 'standard' as const,
      categories: [] as string[],
      product_count: 0,
      avg_delivery_days: 0
    }))
  ]

  // Filtrer les fournisseurs
  const filteredSuppliers = allSuppliers.filter(supplier => {
    const matchesSearch = searchQuery === '' || 
      supplier.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      supplier.country?.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesCategory = categoryFilter === 'all' || 
      (supplier.type === 'premium' && supplier.categories?.some(c => c.toLowerCase().includes(categoryFilter.toLowerCase())))
    
    const matchesTab = 
      activeTab === 'all' ||
      (activeTab === 'premium' && supplier.type === 'premium') ||
      (activeTab === 'standard' && supplier.type === 'standard')
    
    return matchesSearch && matchesCategory && matchesTab
  })

  // Statistiques globales
  const stats = {
    totalSuppliers: allSuppliers.length,
    premiumSuppliers: premiumSuppliers?.length || 0,
    standardSuppliers: standardSuppliers?.length || 0,
    connectedSuppliers: premiumConnections?.filter(c => c.status === 'active').length || 0,
    totalProducts: (premiumSuppliers || []).reduce((acc, s) => acc + (s.product_count || 0), 0)
  }

  const isLoading = isLoadingPremium || isLoadingStandard

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Chargement des fournisseurs...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <Helmet>
        <title>Gestion des Fournisseurs - Hub Unifié</title>
        <meta name="description" content="Gérez tous vos fournisseurs premium et standard depuis une interface unifiée" />
      </Helmet>

      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Crown className="h-8 w-8 text-primary" />
              Hub Fournisseurs Unifié
            </h1>
            <p className="text-muted-foreground mt-2">
              {stats.totalSuppliers} fournisseurs • {stats.connectedSuppliers} connectés • {stats.totalProducts.toLocaleString()} produits
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              className="gap-2"
              onClick={() => {
                // TODO: Implémenter l'ajout de fournisseur personnalisé
                toast({
                  title: "Fonctionnalité à venir",
                  description: "L'ajout de fournisseur personnalisé sera bientôt disponible"
                })
              }}
            >
              <Plus className="h-4 w-4" />
              Ajouter Fournisseur
            </Button>
            <Badge variant="outline" className="text-lg px-4 py-2">
              <Shield className="h-4 w-4 mr-2" />
              {stats.premiumSuppliers} Premium
            </Badge>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <Globe className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{stats.totalSuppliers}</p>
                <p className="text-sm text-muted-foreground">Total Fournisseurs</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <Crown className="h-8 w-8 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold">{stats.premiumSuppliers}</p>
                <p className="text-sm text-muted-foreground">Premium</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{stats.connectedSuppliers}</p>
                <p className="text-sm text-muted-foreground">Connectés</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <Package className="h-8 w-8 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">{stats.totalProducts.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Produits</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <ShoppingBag className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{stats.standardSuppliers}</p>
                <p className="text-sm text-muted-foreground">Standard</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Tabs Navigation */}
        <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)}>
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="all">Tous</TabsTrigger>
            <TabsTrigger value="premium">Premium</TabsTrigger>
            <TabsTrigger value="standard">Standard</TabsTrigger>
            <TabsTrigger value="monitor">
              <FeatureGate feature="supplier-monitoring" fallback={null} showUpgrade={false}>
                Monitoring
              </FeatureGate>
            </TabsTrigger>
            <TabsTrigger value="analytics">
              <FeatureGate feature="supplier-analytics" fallback={null} showUpgrade={false}>
                Analytics
              </FeatureGate>
            </TabsTrigger>
            <TabsTrigger value="workflows">
              <FeatureGate feature="automation" fallback={null} showUpgrade={false}>
                Workflows
              </FeatureGate>
            </TabsTrigger>
          </TabsList>

          {/* Suppliers List Tabs */}
          <TabsContent value="all" className="space-y-4">
            <SuppliersList 
              suppliers={filteredSuppliers}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              categoryFilter={categoryFilter}
              setCategoryFilter={setCategoryFilter}
              onConnect={handleConnectPremium}
              onConfig={(supplierId: string) => handleConnectPremium(supplierId, true)}
              onDisconnect={handleDisconnect}
              onSync={handleSync}
              isConnected={isConnected}
              syncing={syncing}
              syncProgress={syncProgress}
              premiumConnections={premiumConnections}
            />
          </TabsContent>

          <TabsContent value="premium" className="space-y-4">
            <SuppliersList 
              suppliers={filteredSuppliers}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              categoryFilter={categoryFilter}
              setCategoryFilter={setCategoryFilter}
              onConnect={handleConnectPremium}
              onConfig={(supplierId: string) => handleConnectPremium(supplierId, true)}
              onDisconnect={handleDisconnect}
              onSync={handleSync}
              isConnected={isConnected}
              syncing={syncing}
              syncProgress={syncProgress}
              premiumConnections={premiumConnections}
            />
          </TabsContent>

          <TabsContent value="standard" className="space-y-4">
            <SuppliersList 
              suppliers={filteredSuppliers}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              categoryFilter={categoryFilter}
              setCategoryFilter={setCategoryFilter}
              onConnect={handleConnectPremium}
              onConfig={(supplierId: string) => handleConnectPremium(supplierId, true)}
              onDisconnect={handleDisconnect}
              onSync={handleSync}
              isConnected={isConnected}
              syncing={syncing}
              syncProgress={syncProgress}
              premiumConnections={premiumConnections}
            />
          </TabsContent>

          {/* Advanced Features Tabs */}
          <TabsContent value="monitor">
            <FeatureGate feature="supplier-monitoring">
              <RealTimeSupplierMonitor />
            </FeatureGate>
          </TabsContent>

          <TabsContent value="analytics">
            <FeatureGate feature="supplier-analytics">
              <SupplierPerformanceAnalytics />
            </FeatureGate>
          </TabsContent>

          <TabsContent value="workflows">
            <FeatureGate feature="automation">
              <AutomatedSupplierWorkflows />
            </FeatureGate>
          </TabsContent>
        </Tabs>
      </div>

      {/* Connection Dialog */}
      <Dialog open={connectDialog.open} onOpenChange={(open) => setConnectDialog({ open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                {connectDialog.isConfig ? 'Configurer BTS Wholesaler' : 'Connecter BTS Wholesaler'}
              </div>
            </DialogTitle>
            <DialogDescription>
              {connectDialog.isConfig 
                ? 'Modifiez les paramètres de votre connexion'
                : 'Configurez votre connexion sécurisée pour importer des produits'
              }
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <Tabs defaultValue="api-key" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="api-key">
                  <Zap className="h-4 w-4 mr-2" />
                  Clé API
                </TabsTrigger>
                <TabsTrigger value="oauth">
                  <Settings className="h-4 w-4 mr-2" />
                  OAuth 2.0
                </TabsTrigger>
              </TabsList>

              <TabsContent value="api-key" className="space-y-4 mt-4">
                <div className="rounded-lg bg-blue-50 dark:bg-blue-950 p-4 space-y-2">
                  <p className="text-sm font-medium flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Comment obtenir votre mot de passe API BTS Wholesaler?
                  </p>
                  <ol className="text-sm text-muted-foreground space-y-2 ml-6 list-decimal">
                    <li>Connectez-vous à <a href="https://www.btswholesaler.com" target="_blank" rel="noopener noreferrer" className="text-primary underline">www.btswholesaler.com</a></li>
                    <li>Allez dans <strong>Mon compte → API</strong></li>
                    <li>Créez un nouveau mot de passe (il remplacera l'ancien)</li>
                    <li>Copiez et collez le mot de passe ci-dessous</li>
                  </ol>
                  <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-950 rounded text-xs">
                    <p className="font-medium mb-1">⚠️ Important:</p>
                    <p>Ce n'est pas un JWT Token mais un mot de passe API que vous créez dans votre compte BTS Wholesaler. Si vous pensez que votre mot de passe a été compromis, générez-en un nouveau.</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="jwt-token">Mot de passe API BTS Wholesaler</Label>
                  <Input
                    id="jwt-token"
                    type="password"
                    placeholder="Entrez votre mot de passe API..."
                    value={jwtToken}
                    onChange={(e) => setJwtToken(e.target.value)}
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    Le mot de passe créé dans Mon compte → API
                  </p>
                </div>

                <div className="rounded-lg bg-amber-50 dark:bg-amber-950 p-3 space-y-1">
                  <p className="text-sm font-medium">Permissions requises:</p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <Badge variant="outline">Lecture produits</Badge>
                    <Badge variant="outline">Gestion commandes</Badge>
                    <Badge variant="outline">Mise à jour stock</Badge>
                    <Badge variant="outline">Webhooks</Badge>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="oauth" className="mt-4">
                <div className="text-center py-8 space-y-4">
                  <Clock className="h-12 w-12 mx-auto text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    L'authentification OAuth sera bientôt disponible
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setConnectDialog({ open: false })}>
              Annuler
            </Button>
            <Button onClick={handleSaveConnection} disabled={!jwtToken || isConnectingPremium}>
              {isConnectingPremium ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Connexion...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Connecter maintenant
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

// Composant pour la liste des fournisseurs
function SuppliersList({ 
  suppliers, 
  searchQuery, 
  setSearchQuery,
  categoryFilter,
  setCategoryFilter,
  onConnect,
  onConfig,
  onDisconnect,
  onSync,
  isConnected,
  syncing,
  syncProgress,
  premiumConnections
}: any) {
  return (
    <div className="space-y-4">
      {/* Search and filters */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un fournisseur..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <select 
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-4 py-2 rounded-md border border-input bg-background"
        >
          <option value="all">Toutes les catégories</option>
          <option value="fashion">Mode</option>
          <option value="electronics">Électronique</option>
          <option value="home">Maison</option>
          <option value="beauty">Beauté</option>
        </select>
      </div>

      {/* Suppliers grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {suppliers.map((supplier: any) => {
          const connected = isConnected(supplier.id)
          const connection = premiumConnections?.find((c: any) => c.supplier_id === supplier.id)
          const progress = syncProgress[supplier.id]
          const isSyncing = syncing === supplier.id

          return (
            <Card key={supplier.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {supplier.logo_url ? (
                      <img 
                        src={supplier.logo_url} 
                        alt={supplier.name} 
                        className="h-12 w-12 rounded object-contain"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none'
                        }}
                      />
                    ) : (
                      <Globe className="h-12 w-12 text-muted-foreground" />
                    )}
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        {supplier.name}
                        {supplier.type === 'premium' && (
                          <Crown className="h-4 w-4 text-yellow-500" />
                        )}
                      </CardTitle>
                      <CardDescription className="text-sm flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {supplier.country}
                      </CardDescription>
                    </div>
                  </div>
                  {connected && (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {supplier.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {supplier.description}
                  </p>
                )}

                {/* Stats */}
                {supplier.type === 'premium' && (
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Produits</p>
                      <p className="font-semibold">{supplier.product_count?.toLocaleString() || 0}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Livraison</p>
                      <p className="font-semibold">{supplier.avg_delivery_days}j</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Note</p>
                      <div className="flex items-center gap-1">
                        <p className="font-semibold">{supplier.rating || 4.5}</p>
                        <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                      </div>
                    </div>
                  </div>
                )}

                {/* Categories */}
                {supplier.categories && supplier.categories.length > 0 && (
                  <div className="flex gap-2 flex-wrap">
                    {supplier.categories.slice(0, 3).map((cat: string) => (
                      <Badge key={cat} variant="outline" className="text-xs">
                        {cat}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Progress bar */}
                {progress !== undefined && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Synchronisation...</span>
                      <span>{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  {connected ? (
                    <>
                      <Button 
                        size="sm" 
                        onClick={() => onSync(supplier.id)}
                        disabled={isSyncing}
                        className="flex-1"
                      >
                        {isSyncing ? (
                          <>
                            <Clock className="h-4 w-4 mr-2 animate-spin" />
                            Sync...
                          </>
                        ) : (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Synchroniser
                          </>
                        )}
                      </Button>
                      <Button 
                        size="sm" 
                        variant="destructive"
                        onClick={() => onDisconnect(supplier.id)}
                        title="Déconnecter ce fournisseur"
                      >
                        <Zap className="h-4 w-4" />
                        Déconnecter
                      </Button>
                    </>
                  ) : (
                    <Button 
                      onClick={() => onConnect(supplier.id)}
                      className="flex-1"
                    >
                      <Zap className="h-4 w-4 mr-2" />
                      Connecter
                    </Button>
                  )}
                </div>

                {/* Connection info */}
                {connection && (
                  <div className="text-xs text-muted-foreground border-t pt-2">
                    Dernière sync: {connection.last_sync_at 
                      ? new Date(connection.last_sync_at).toLocaleDateString('fr-FR')
                      : 'Jamais'
                    }
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {suppliers.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Aucun fournisseur trouvé</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
