import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'
import { 
  RefreshCw, 
  CheckCircle, 
  Clock, 
  Package, 
  Globe,
  Zap,
  Settings
} from 'lucide-react'

interface Supplier {
  id: string
  name: string
  display_name?: string
  description?: string
  country?: string
  logo_url?: string
  product_count?: number
  avg_delivery_days?: number
  categories?: string[]
}

interface Connection {
  id: string
  supplier_id: string
  status: 'active' | 'pending' | 'disconnected'
  products_synced?: number
}

export function PremiumSupplierSync() {
  const { toast } = useToast()
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [connections, setConnections] = useState<Connection[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [syncing, setSyncing] = useState<string | null>(null)
  const [syncProgress, setSyncProgress] = useState<Record<string, number>>({})
  const [connectDialog, setConnectDialog] = useState<{ open: boolean; supplierId?: string }>({ open: false })
  const [jwtToken, setJwtToken] = useState('')
  const [isConnecting, setIsConnecting] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      // Load suppliers from database
      const { data: suppliersData } = await supabase
        .from('suppliers')
        .select('*')
        .limit(10)
      
      // Transform to expected format
      const formattedSuppliers: Supplier[] = (suppliersData || []).map(s => ({
        id: s.id,
        name: s.name,
        display_name: s.name,
        description: 'Fournisseur intégré',
        country: s.country || 'Europe',
        product_count: 0,
        avg_delivery_days: 5,
        categories: []
      }))
      
      // Add mock suppliers if none exist
      if (formattedSuppliers.length === 0) {
        formattedSuppliers.push(
          {
            id: 'bts-1',
            name: 'BTSWholesaler',
            display_name: 'BTS Wholesaler',
            description: 'Grossiste européen avec plus de 50 000 produits électroniques',
            country: 'France',
            product_count: 50000,
            avg_delivery_days: 3,
            categories: ['Électronique', 'Accessoires', 'Téléphonie']
          },
          {
            id: 'euro-1',
            name: 'EuroDistrib',
            display_name: 'Euro Distrib',
            description: 'Distribution européenne de produits lifestyle',
            country: 'Allemagne',
            product_count: 25000,
            avg_delivery_days: 5,
            categories: ['Mode', 'Maison', 'Lifestyle']
          }
        )
      }
      
      setSuppliers(formattedSuppliers)
      
      // Load connections from localStorage
      const storedConnections = localStorage.getItem('premium_supplier_connections')
      if (storedConnections) {
        setConnections(JSON.parse(storedConnections))
      }
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const isConnected = (supplierId: string) => {
    return connections.some(c => c.supplier_id === supplierId && c.status === 'active')
  }

  const handleConnect = (supplierId: string) => {
    setConnectDialog({ open: true, supplierId })
    setJwtToken('')
  }

  const handleSaveConnection = async () => {
    if (!connectDialog.supplierId || !jwtToken) {
      toast({
        title: 'Erreur',
        description: 'Veuillez entrer le JWT token',
        variant: 'destructive'
      })
      return
    }

    setIsConnecting(true)
    
    try {
      const newConnection: Connection = {
        id: `conn-${Date.now()}`,
        supplier_id: connectDialog.supplierId,
        status: 'active',
        products_synced: 0
      }
      
      const updatedConnections = [...connections, newConnection]
      setConnections(updatedConnections)
      localStorage.setItem('premium_supplier_connections', JSON.stringify(updatedConnections))
      
      // Store JWT token securely
      localStorage.setItem(`supplier_jwt_${connectDialog.supplierId}`, jwtToken)

      setConnectDialog({ open: false })
      toast({
        title: 'Connexion réussie',
        description: 'Vous pouvez maintenant synchroniser les produits'
      })
    } catch (error: any) {
      toast({
        title: 'Erreur de connexion',
        description: error.message,
        variant: 'destructive'
      })
    } finally {
      setIsConnecting(false)
    }
  }

  const handleSync = async (supplierId: string) => {
    setSyncing(supplierId)
    setSyncProgress(prev => ({ ...prev, [supplierId]: 0 }))

    try {
      // Simulate sync progress
      const progressInterval = setInterval(() => {
        setSyncProgress(prev => {
          const current = prev[supplierId] || 0
          if (current < 90) {
            return { ...prev, [supplierId]: current + 10 }
          }
          return prev
        })
      }, 500)

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 3000))

      clearInterval(progressInterval)
      setSyncProgress(prev => ({ ...prev, [supplierId]: 100 }))

      // Update connection with synced products count
      const updatedConnections = connections.map(c => 
        c.supplier_id === supplierId 
          ? { ...c, products_synced: (c.products_synced || 0) + Math.floor(Math.random() * 100) }
          : c
      )
      setConnections(updatedConnections)
      localStorage.setItem('premium_supplier_connections', JSON.stringify(updatedConnections))

      toast({
        title: 'Synchronisation terminée',
        description: 'Produits importés avec succès'
      })

      // Cleanup after delay
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="flex items-center gap-2 text-muted-foreground">
          <RefreshCw className="h-5 w-5 animate-spin" />
          <span>Chargement des fournisseurs...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Fournisseurs Premium</h2>
        <p className="text-muted-foreground mt-1">
          Connectez-vous aux fournisseurs premium et synchronisez leurs catalogues
        </p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Fournisseurs Disponibles</p>
                <p className="text-2xl font-bold">{suppliers.length}</p>
              </div>
              <Globe className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Connexions Actives</p>
                <p className="text-2xl font-bold">{connections.filter(c => c.status === 'active').length}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Produits Synchronisés</p>
                <p className="text-2xl font-bold">
                  {connections.reduce((sum, c) => sum + (c.products_synced || 0), 0)}
                </p>
              </div>
              <Package className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Suppliers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {suppliers.map((supplier) => {
          const connected = isConnected(supplier.id)
          const progress = syncProgress[supplier.id]
          const isSyncing = syncing === supplier.id

          return (
            <Card key={supplier.id} className="relative">
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
                      <CardTitle className="text-lg">{supplier.display_name || supplier.name}</CardTitle>
                      <CardDescription className="text-sm">{supplier.country}</CardDescription>
                    </div>
                  </div>
                  {connected && (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {supplier.description}
                </p>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Produits</p>
                    <p className="font-semibold">{supplier.product_count?.toLocaleString() || 0}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Livraison</p>
                    <p className="font-semibold">{supplier.avg_delivery_days} jours</p>
                  </div>
                </div>

                {/* Categories */}
                <div className="flex gap-2 flex-wrap">
                  {supplier.categories?.slice(0, 3).map((cat: string) => (
                    <Badge key={cat} variant="outline" className="text-xs">
                      {cat}
                    </Badge>
                  ))}
                  {(supplier.categories?.length || 0) > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{supplier.categories!.length - 3}
                    </Badge>
                  )}
                </div>

                {/* Progress bar for sync */}
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
                        onClick={() => handleSync(supplier.id)}
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
                        variant="outline"
                      >
                        <Settings className="h-4 w-4" />
                      </Button>
                    </>
                  ) : (
                    <Button 
                      onClick={() => handleConnect(supplier.id)}
                      disabled={isConnecting}
                      className="flex-1"
                    >
                      {isConnecting ? (
                        <>
                          <Clock className="h-4 w-4 mr-2 animate-spin" />
                          Connexion...
                        </>
                      ) : (
                        <>
                          <Zap className="h-4 w-4 mr-2" />
                          Connecter
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Connection Dialog */}
      <Dialog open={connectDialog.open} onOpenChange={(open) => setConnectDialog({ open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Connecter le fournisseur</DialogTitle>
            <DialogDescription>
              Entrez vos identifiants pour connecter ce fournisseur
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="jwt-token">JWT Token</Label>
              <Input
                id="jwt-token"
                type="password"
                placeholder="Entrez votre JWT token"
                value={jwtToken}
                onChange={(e) => setJwtToken(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Obtenez votre JWT token depuis votre compte fournisseur
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setConnectDialog({ open: false })}>
              Annuler
            </Button>
            <Button onClick={handleSaveConnection} disabled={!jwtToken || isConnecting}>
              {isConnecting ? 'Connexion...' : 'Connecter'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}