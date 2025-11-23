import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Star, Package, Globe, Clock, CheckCircle, Zap, TrendingUp } from 'lucide-react'

interface SupplierPreviewModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  supplier: any
  onConnect: () => void
}

export function SupplierPreviewModal({ open, onOpenChange, supplier, onConnect }: SupplierPreviewModalProps) {
  if (!supplier) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center overflow-hidden">
              {supplier.logo_url ? (
                <img src={supplier.logo_url} alt={supplier.name} className="w-full h-full object-cover" />
              ) : (
                <Package className="h-8 w-8 text-primary" />
              )}
            </div>
            <div className="flex-1">
              <DialogTitle className="text-2xl">{supplier.name}</DialogTitle>
              <DialogDescription className="mt-1">{supplier.description}</DialogDescription>
              <div className="flex items-center gap-2 mt-3">
                <Badge variant="outline">{supplier.sector}</Badge>
                <Badge variant="outline">{supplier.country}</Badge>
                {supplier.is_featured && (
                  <Badge className="bg-yellow-100 text-yellow-800">
                    <Star className="h-3 w-3 mr-1" fill="currentColor" />
                    Populaire
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="overview" className="mt-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
            <TabsTrigger value="features">Fonctionnalités</TabsTrigger>
            <TabsTrigger value="pricing">Tarifs</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6 mt-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 rounded-lg border bg-muted/50">
                <Package className="h-6 w-6 mx-auto mb-2 text-primary" />
                <p className="text-2xl font-bold">{supplier.product_count?.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Produits</p>
              </div>
              <div className="text-center p-4 rounded-lg border bg-muted/50">
                <Star className="h-6 w-6 mx-auto mb-2 text-yellow-500" />
                <p className="text-2xl font-bold">{supplier.rating}</p>
                <p className="text-xs text-muted-foreground">Note moyenne</p>
              </div>
              <div className="text-center p-4 rounded-lg border bg-muted/50">
                <Clock className="h-6 w-6 mx-auto mb-2 text-blue-600" />
                <p className="text-2xl font-bold">{supplier.setup_time_minutes}min</p>
                <p className="text-xs text-muted-foreground">Setup</p>
              </div>
              <div className="text-center p-4 rounded-lg border bg-muted/50">
                <Globe className="h-6 w-6 mx-auto mb-2 text-green-600" />
                <p className="text-2xl font-bold">{supplier.shipping_countries?.length || 0}</p>
                <p className="text-xs text-muted-foreground">Pays</p>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-3">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {supplier.tags?.map((tag: string) => (
                  <Badge key={tag} variant="secondary">{tag}</Badge>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-3">Pays de livraison</h3>
              <div className="flex flex-wrap gap-2">
                {supplier.shipping_countries?.map((country: string) => (
                  <Badge key={country} variant="outline">{country}</Badge>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="features" className="space-y-4 mt-6">
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 rounded-lg border">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <p className="font-medium">Connexion API automatique</p>
                  <p className="text-sm text-muted-foreground">Synchronisation en temps réel des produits</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg border">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <p className="font-medium">Mise à jour automatique des stocks</p>
                  <p className="text-sm text-muted-foreground">Stock toujours à jour automatiquement</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg border">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <p className="font-medium">Fulfillment automatisé</p>
                  <p className="text-sm text-muted-foreground">Commandes transmises automatiquement</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg border">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <p className="font-medium">Tracking des colis</p>
                  <p className="text-sm text-muted-foreground">Suivi en temps réel des expéditions</p>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="pricing" className="space-y-4 mt-6">
            <div className="grid gap-4">
              <div className="p-4 rounded-lg border">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold">Commande minimum</h4>
                  <Badge variant="outline">
                    {supplier.min_order_value ? `${supplier.min_order_value}€` : 'Aucun'}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">Montant minimum requis par commande</p>
              </div>

              {supplier.commission_rate !== undefined && (
                <div className="p-4 rounded-lg border">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold">Commission</h4>
                    <Badge variant="outline">{supplier.commission_rate}%</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">Frais de transaction sur les ventes</p>
                </div>
              )}

              <div className="p-4 rounded-lg border bg-green-50">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  <h4 className="font-semibold text-green-900">Marges recommandées</h4>
                </div>
                <p className="text-sm text-green-700">40-60% de marge selon la catégorie de produits</p>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex gap-3 pt-4 border-t">
          <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button className="flex-1" onClick={onConnect}>
            <Zap className="h-4 w-4 mr-2" />
            Connecter maintenant
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
