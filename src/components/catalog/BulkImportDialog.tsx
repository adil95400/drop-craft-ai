import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Progress } from "@/components/ui/progress"
import { 
  Download, 
  Package, 
  CheckCircle, 
  AlertTriangle,
  ShoppingCart,
  DollarSign,
  Star,
  Crown,
  TrendingUp
} from "lucide-react"
import { CatalogProduct } from "@/hooks/useCatalogProducts"
import { useToast } from "@/hooks/use-toast"

interface BulkImportDialogProps {
  selectedProducts: CatalogProduct[]
  onClearSelection: () => void
  children: React.ReactNode
}

export const BulkImportDialog = ({ 
  selectedProducts, 
  onClearSelection,
  children 
}: BulkImportDialogProps) => {
  const [isImporting, setIsImporting] = useState(false)
  const [importProgress, setImportProgress] = useState(0)
  const [importedCount, setImportedCount] = useState(0)
  const { toast } = useToast()

  const totalValue = selectedProducts.reduce((sum, p) => sum + p.price, 0)
  const averageMargin = selectedProducts.length > 0 
    ? selectedProducts.reduce((sum, p) => sum + p.profit_margin, 0) / selectedProducts.length 
    : 0

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(price)
  }

  const handleBulkImport = async () => {
    setIsImporting(true)
    setImportProgress(0)
    setImportedCount(0)

    // Simulate import process
    for (let i = 0; i < selectedProducts.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 500))
      setImportProgress(((i + 1) / selectedProducts.length) * 100)
      setImportedCount(i + 1)
    }

    toast({
      title: "Import réussi",
      description: `${selectedProducts.length} produits importés avec succès.`
    })

    setIsImporting(false)
    onClearSelection()
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="w-5 h-5" />
            Import en masse ({selectedProducts.length} produits)
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <Package className="w-8 h-8 text-primary mx-auto mb-2" />
                <div className="text-2xl font-bold">{selectedProducts.length}</div>
                <p className="text-sm text-muted-foreground">Produits</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-center">
                <DollarSign className="w-8 h-8 text-green-500 mx-auto mb-2" />
                <div className="text-2xl font-bold">{formatPrice(totalValue)}</div>
                <p className="text-sm text-muted-foreground">Valeur totale</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-center">
                <Star className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                <div className="text-2xl font-bold">{averageMargin.toFixed(1)}%</div>
                <p className="text-sm text-muted-foreground">Marge moyenne</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-center">
                <Crown className="w-8 h-8 text-purple-500 mx-auto mb-2" />
                <div className="text-2xl font-bold">
                  {selectedProducts.filter(p => p.is_winner).length}
                </div>
                <p className="text-sm text-muted-foreground">Winners</p>
              </CardContent>
            </Card>
          </div>

          {/* Import Progress */}
          {isImporting && (
            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Import en cours...</span>
                    <span className="text-sm text-muted-foreground">
                      {importedCount}/{selectedProducts.length}
                    </span>
                  </div>
                  <Progress value={importProgress} />
                  <p className="text-sm text-muted-foreground">
                    {importedCount > 0 && `${importedCount} produits importés`}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Product List */}
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {selectedProducts.map((product) => (
              <Card key={product.id} className="border-border/50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
                      {product.image_url ? (
                        <img 
                          src={product.image_url} 
                          alt={product.name}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <Package className="w-8 h-8 text-muted-foreground" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <h4 className="font-medium text-sm line-clamp-1">{product.name}</h4>
                          <p className="text-xs text-muted-foreground">{product.supplier_name}</p>
                          
                          <div className="flex items-center gap-2 mt-1">
                            {product.is_winner && (
                              <Badge className="bg-yellow-500 text-black text-xs">
                                <Crown className="w-3 h-3 mr-1" />
                                Winner
                              </Badge>
                            )}
                            {product.is_trending && (
                              <Badge className="bg-green-500 text-white text-xs">
                                <TrendingUp className="w-3 h-3 mr-1" />
                                Trending
                              </Badge>
                            )}
                          </div>
                        </div>

                        <div className="text-right">
                          <p className="font-bold text-primary">{formatPrice(product.price)}</p>
                          {product.profit_margin > 0 && (
                            <Badge 
                              variant="outline" 
                              className={`text-xs ${
                                product.profit_margin >= 50 ? 'text-green-600' : 
                                product.profit_margin >= 30 ? 'text-orange-600' : 'text-red-600'
                              }`}
                            >
                              {product.profit_margin.toFixed(0)}% marge
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Star className="w-3 h-3" />
                          {product.rating.toFixed(1)}
                        </span>
                        <span className="flex items-center gap-1">
                          <ShoppingCart className="w-3 h-3" />
                          {product.sales_count} ventes
                        </span>
                        <span className="flex items-center gap-1">
                          <Package className="w-3 h-3" />
                          {product.stock_quantity} stock
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Actions */}
          <div className="flex justify-between items-center pt-4 border-t">
            <Button variant="outline" onClick={onClearSelection} disabled={isImporting}>
              Annuler
            </Button>
            <Button 
              onClick={handleBulkImport}
              disabled={isImporting || selectedProducts.length === 0}
              className="bg-gradient-primary hover:opacity-90"
            >
              <Download className="w-4 h-4 mr-2" />
              {isImporting ? 'Import en cours...' : `Importer ${selectedProducts.length} produits`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}