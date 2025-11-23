import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useSupplierAdmin } from '@/hooks/useSupplierAdmin'
import { 
  Package, 
  Star, 
  MapPin, 
  CheckCircle, 
  Loader2,
  Award,
  TrendingUp,
  Zap
} from 'lucide-react'

interface ImportSuppliersDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const availableSuppliers = [
  {
    id: 'spocket',
    name: 'Spocket',
    description: 'Fournisseurs US/EU dropshipping avec expédition rapide',
    tier: 'platinum',
    country: 'USA',
    products: '50K+ produits',
    delivery: '3 jours',
    featured: true
  },
  {
    id: 'printful',
    name: 'Printful',
    description: 'Print-on-demand leader avec 300+ produits personnalisables',
    tier: 'diamond',
    country: 'USA',
    products: '350+ produits',
    delivery: '4 jours',
    featured: true
  },
  {
    id: 'cj',
    name: 'CJ Dropshipping',
    description: 'Plateforme tout-en-un avec entrepôts EU/US',
    tier: 'platinum',
    country: 'Chine',
    products: '500K+ produits',
    delivery: '7 jours',
    featured: true
  },
  {
    id: 'modalyst',
    name: 'Modalyst',
    description: 'Marques premium et designers indépendants',
    tier: 'diamond',
    country: 'USA',
    products: '15K+ produits',
    delivery: '5 jours',
    featured: true
  },
  {
    id: 'printify',
    name: 'Printify',
    description: 'Print-on-demand avec 250+ produits',
    tier: 'platinum',
    country: 'USA',
    products: '850+ produits',
    delivery: '5 jours',
    featured: true
  },
  {
    id: 'bigbuy',
    name: 'BigBuy',
    description: 'Grossiste européen B2B avec stock permanent',
    tier: 'platinum',
    country: 'Espagne',
    products: '120K+ produits',
    delivery: '2 jours',
    featured: true
  },
  {
    id: 'zendrop',
    name: 'Zendrop',
    description: 'Dropshipping automatisé EU/US',
    tier: 'platinum',
    country: 'USA',
    products: '100K+ produits',
    delivery: '4 jours',
    featured: true
  },
  {
    id: 'trendsi',
    name: 'Trendsi',
    description: 'Mode féminine rapide avec fulfillment 1-3 jours',
    tier: 'platinum',
    country: 'USA',
    products: '25K+ produits',
    delivery: '2 jours',
    featured: true
  },
  {
    id: 'faire',
    name: 'Faire Wholesale',
    description: 'Marketplace B2B de marques artisanales',
    tier: 'diamond',
    country: 'USA',
    products: '500K+ produits',
    delivery: '5 jours',
    featured: true
  },
  {
    id: 'btswholesaler',
    name: 'BTSWholesaler',
    description: 'Grossiste européen avec feed API complet',
    tier: 'platinum',
    country: 'Espagne',
    products: '100K+ produits',
    delivery: '3 jours',
    featured: true
  },
  {
    id: 'syncee',
    name: 'Syncee',
    description: 'Marketplace de fournisseurs dropshipping',
    tier: 'gold',
    country: 'USA',
    products: '500K+ produits',
    delivery: '5 jours',
    featured: false
  },
  {
    id: 'doba',
    name: 'Doba',
    description: 'Plateforme avec 2M+ produits américains',
    tier: 'gold',
    country: 'USA',
    products: '2M+ produits',
    delivery: '5 jours',
    featured: false
  },
  {
    id: 'salehoo',
    name: 'SaleHoo',
    description: '8000+ fournisseurs vérifiés',
    tier: 'gold',
    country: 'Nouvelle-Zélande',
    products: '250K+ produits',
    delivery: '10 jours',
    featured: false
  },
  {
    id: 'inventory-source',
    name: 'Inventory Source',
    description: 'Agrégateur multi-fournisseurs avec automation',
    tier: 'platinum',
    country: 'USA',
    products: '750K+ produits',
    delivery: '4 jours',
    featured: false
  },
  {
    id: 'wholesale2b',
    name: 'Wholesale2B',
    description: '1M+ produits dropshipping',
    tier: 'gold',
    country: 'USA',
    products: '1M+ produits',
    delivery: '7 jours',
    featured: false
  },
  {
    id: 'oberlo',
    name: 'Oberlo by Shopify',
    description: 'Produits AliExpress vérifiés',
    tier: 'gold',
    country: 'International',
    products: '100K+ produits',
    delivery: '12 jours',
    featured: false
  }
]

export function ImportSuppliersDialog({ open, onOpenChange }: ImportSuppliersDialogProps) {
  const [selectedSuppliers, setSelectedSuppliers] = useState<string[]>([])
  const [importProgress, setImportProgress] = useState(0)
  const { importFromAPI, isImporting } = useSupplierAdmin()

  const handleToggleSupplier = (id: string) => {
    setSelectedSuppliers(prev => 
      prev.includes(id) 
        ? prev.filter(s => s !== id)
        : [...prev, id]
    )
  }

  const handleSelectAll = () => {
    if (selectedSuppliers.length === availableSuppliers.length) {
      setSelectedSuppliers([])
    } else {
      setSelectedSuppliers(availableSuppliers.map(s => s.id))
    }
  }

  const handleImport = async () => {
    if (selectedSuppliers.length === 0) return

    setImportProgress(0)
    
    // Simuler la progression
    const progressInterval = setInterval(() => {
      setImportProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval)
          return 90
        }
        return prev + 10
      })
    }, 200)

    try {
      await importFromAPI({
        provider: 'all',
        apiKey: undefined
      })
      
      setImportProgress(100)
      
      setTimeout(() => {
        onOpenChange(false)
        setSelectedSuppliers([])
        setImportProgress(0)
      }, 1000)
    } catch (error) {
      clearInterval(progressInterval)
      setImportProgress(0)
    }
  }

  const getTierBadge = (tier: string) => {
    switch (tier) {
      case 'diamond':
        return <Badge className="bg-purple-500">💎 Diamond</Badge>
      case 'platinum':
        return <Badge className="bg-blue-500">⭐ Platinum</Badge>
      case 'gold':
        return <Badge className="bg-yellow-500">🥇 Gold</Badge>
      default:
        return <Badge variant="secondary">{tier}</Badge>
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Importer des fournisseurs dropshipping
          </DialogTitle>
          <DialogDescription>
            Sélectionnez les fournisseurs que vous souhaitez ajouter à votre catalogue
          </DialogDescription>
        </DialogHeader>

        {isImporting ? (
          <div className="space-y-4 py-8">
            <div className="flex flex-col items-center justify-center gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <div className="text-center space-y-2">
                <p className="font-medium">Import en cours...</p>
                <p className="text-sm text-muted-foreground">
                  {selectedSuppliers.length} fournisseur(s) sélectionné(s)
                </p>
              </div>
            </div>
            <Progress value={importProgress} className="w-full" />
            <p className="text-center text-sm text-muted-foreground">
              {importProgress}% complété
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAll}
                >
                  {selectedSuppliers.length === availableSuppliers.length ? 'Tout désélectionner' : 'Tout sélectionner'}
                </Button>
                <Badge variant="secondary">
                  {selectedSuppliers.length} / {availableSuppliers.length} sélectionnés
                </Badge>
              </div>
            </div>

            <ScrollArea className="h-[400px] pr-4">
              <div className="grid gap-3">
                {availableSuppliers.map((supplier) => {
                  const isSelected = selectedSuppliers.includes(supplier.id)
                  
                  return (
                    <div
                      key={supplier.id}
                      className={`border rounded-lg p-4 cursor-pointer transition-all ${
                        isSelected 
                          ? 'border-primary bg-primary/5 shadow-sm' 
                          : 'border-border hover:border-primary/50'
                      }`}
                      onClick={() => handleToggleSupplier(supplier.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold">{supplier.name}</h4>
                            {supplier.featured && (
                              <Badge variant="secondary" className="text-xs">
                                <TrendingUp className="h-3 w-3 mr-1" />
                                Populaire
                              </Badge>
                            )}
                            {getTierBadge(supplier.tier)}
                          </div>
                          
                          <p className="text-sm text-muted-foreground">
                            {supplier.description}
                          </p>
                          
                          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {supplier.country}
                            </div>
                            <div className="flex items-center gap-1">
                              <Package className="h-3 w-3" />
                              {supplier.products}
                            </div>
                            <div className="flex items-center gap-1">
                              <Zap className="h-3 w-3" />
                              Livraison {supplier.delivery}
                            </div>
                          </div>
                        </div>
                        
                        <div className="ml-4">
                          {isSelected ? (
                            <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center">
                              <CheckCircle className="h-4 w-4 text-primary-foreground" />
                            </div>
                          ) : (
                            <div className="h-6 w-6 rounded-full border-2 border-muted" />
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </ScrollArea>

            <div className="flex justify-between items-center pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                {selectedSuppliers.length > 0 
                  ? `${selectedSuppliers.length} fournisseur(s) prêt(s) à être importé(s)` 
                  : 'Aucun fournisseur sélectionné'}
              </p>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Annuler
                </Button>
                <Button 
                  onClick={handleImport}
                  disabled={selectedSuppliers.length === 0 || isImporting}
                >
                  <Package className="h-4 w-4 mr-2" />
                  Importer ({selectedSuppliers.length})
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
