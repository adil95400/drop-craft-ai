import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { usePremiumSuppliers } from '@/hooks/usePremiumSuppliers'
import { supabase } from '@/integrations/supabase/client'
import { 
  RefreshCw, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  Package, 
  Globe,
  Zap,
  Settings
} from 'lucide-react'

export function PremiumSupplierSync() {
  const { toast } = useToast()
  const { suppliers, connections, isLoadingSuppliers, isLoadingConnections, connectSupplier, isConnecting } = usePremiumSuppliers()
  const [syncing, setSyncing] = useState<string | null>(null)
  const [syncProgress, setSyncProgress] = useState<Record<string, number>>({})
  const [connectDialog, setConnectDialog] = useState<{ open: boolean; supplierId?: string }>({ open: false })
  const [jwtToken, setJwtToken] = useState('')

  const isConnected = (supplierId: string) => {
    return connections?.some(c => c.supplier_id === supplierId && c.status === 'active')
  }

  const getConnectionId = (supplierId: string) => {
    return connections?.find(c => c.supplier_id === supplierId)?.id
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

    try {
      // Créer la connexion
      await connectSupplier(connectDialog.supplierId)
      
      // Stocker le JWT token de manière sécurisée dans metadata
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase
          .from('premium_supplier_connections')
          .update({ 
            metadata: { 
              jwt_token: jwtToken,
              format: 'json',
              language: 'fr-FR'
            } 
          })
          .eq('user_id', user.id)
          .eq('supplier_id', connectDialog.supplierId)
      }

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
    }
  }

  const handleSync = async (supplierId: string) => {
    setSyncing(supplierId)
    setSyncProgress(prev => ({ ...prev, [supplierId]: 0 }))

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')

      // Récupérer le JWT token de la connexion depuis metadata
      const { data: connection } = await supabase
        .from('premium_supplier_connections')
        .select('metadata')
        .eq('user_id', user.id)
        .eq('supplier_id', supplierId)
        .single()

      const metadata = connection?.metadata as any
      if (!metadata?.jwt_token) {
        throw new Error('JWT token manquant. Veuillez reconnecter le fournisseur.')
      }

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

      // Appeler l'edge function de synchronisation
      const { data, error } = await supabase.functions.invoke('btswholesaler-sync', {
        body: {
          userId: user.id,
          supplierId,
          jwtToken: metadata.jwt_token,
          format: metadata.format || 'json',
          language: metadata.language || 'fr-FR'
        }
      })

      clearInterval(progressInterval)

      if (error) throw error

      setSyncProgress(prev => ({ ...prev, [supplierId]: 100 }))

      toast({
        title: 'Synchronisation terminée',
        description: `${data.imported} produits importés avec succès`
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

  if (isLoadingSuppliers || isLoadingConnections) {
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
                <p className="text-2xl font-bold">{suppliers?.length || 0}</p>
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
                <p className="text-2xl font-bold">{connections?.filter(c => c.status === 'active').length || 0}</p>
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
                  {connections?.reduce((sum, c) => sum + (c.products_synced || 0), 0) || 0}
                </p>
              </div>
              <Package className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Suppliers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {suppliers?.map((supplier) => {
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
                Obtenez votre JWT token depuis votre compte BTS Wholesaler
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
