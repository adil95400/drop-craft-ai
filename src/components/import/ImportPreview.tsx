import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { CheckCircle2, XCircle, AlertTriangle, Image } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

interface PreviewData {
  valid: boolean
  products: Array<{
    name: string
    price: number
    currency: string
    image_url?: string
    sku?: string
    category?: string
    issues: string[]
  }>
  totalProducts: number
  validProducts: number
  invalidProducts: number
  warnings: string[]
}

interface ImportPreviewProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  data: PreviewData | null
  onConfirm: () => void
  isLoading?: boolean
}

export const ImportPreview = ({ 
  open, 
  onOpenChange, 
  data, 
  onConfirm,
  isLoading = false 
}: ImportPreviewProps) => {
  const [showDetails, setShowDetails] = useState(false)

  if (!data) return null

  const validationRate = data.totalProducts > 0 
    ? Math.round((data.validProducts / data.totalProducts) * 100)
    : 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] animate-scale-in">
        <DialogHeader>
          <DialogTitle>Aperçu de l'import</DialogTitle>
          <DialogDescription>
            Vérifiez les données avant de lancer l'import
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-4">
            <Card className="hover-scale">
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-2xl font-bold">{data.totalProducts}</p>
                  <p className="text-xs text-muted-foreground">Total produits</p>
                </div>
              </CardContent>
            </Card>
            <Card className="hover-scale">
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">{data.validProducts}</p>
                  <p className="text-xs text-muted-foreground">Valides</p>
                </div>
              </CardContent>
            </Card>
            <Card className="hover-scale">
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-destructive">{data.invalidProducts}</p>
                  <p className="text-xs text-muted-foreground">Avec erreurs</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Validation Rate */}
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg animate-fade-in">
            <span className="font-medium">Taux de validation</span>
            <Badge variant={validationRate >= 80 ? "default" : validationRate >= 50 ? "secondary" : "destructive"}>
              {validationRate}%
            </Badge>
          </div>

          {/* Warnings */}
          {data.warnings.length > 0 && (
            <div className="space-y-2 animate-fade-in">
              <div className="flex items-center gap-2 text-sm font-medium">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <span>Avertissements ({data.warnings.length})</span>
              </div>
              <ScrollArea className="h-20 rounded border p-2">
                <ul className="space-y-1 text-sm">
                  {data.warnings.map((warning, idx) => (
                    <li key={idx} className="text-muted-foreground">• {warning}</li>
                  ))}
                </ul>
              </ScrollArea>
            </div>
          )}

          {/* Products Preview */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Aperçu des produits</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDetails(!showDetails)}
              >
                {showDetails ? 'Masquer détails' : 'Voir détails'}
              </Button>
            </div>

            <ScrollArea className="h-64 rounded border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12"></TableHead>
                    <TableHead>Nom</TableHead>
                    <TableHead>Prix</TableHead>
                    {showDetails && <TableHead>SKU</TableHead>}
                    {showDetails && <TableHead>Catégorie</TableHead>}
                    <TableHead>Statut</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.products.slice(0, 20).map((product, idx) => (
                    <TableRow 
                      key={idx} 
                      className="animate-fade-in"
                      style={{ animationDelay: `${idx * 30}ms` }}
                    >
                      <TableCell>
                        {product.image_url ? (
                          <div className="relative w-10 h-10 rounded overflow-hidden bg-muted">
                            <img 
                              src={product.image_url} 
                              alt={product.name}
                              className="object-cover w-full h-full"
                            />
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded bg-muted flex items-center justify-center">
                            <Image className="h-4 w-4 text-muted-foreground" />
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="font-medium max-w-xs truncate">
                        {product.name}
                      </TableCell>
                      <TableCell>
                        {product.price.toFixed(2)} {product.currency}
                      </TableCell>
                      {showDetails && (
                        <TableCell className="text-xs text-muted-foreground">
                          {product.sku || '-'}
                        </TableCell>
                      )}
                      {showDetails && (
                        <TableCell className="text-xs">
                          {product.category || '-'}
                        </TableCell>
                      )}
                      <TableCell>
                        {product.issues.length === 0 ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                        ) : (
                          <div className="flex items-center gap-2">
                            <XCircle className="h-4 w-4 text-destructive" />
                            <span className="text-xs text-muted-foreground">
                              {product.issues.length}
                            </span>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>

            {data.products.length > 20 && (
              <p className="text-xs text-muted-foreground text-center">
                ... et {data.products.length - 20} autres produits
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Annuler
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isLoading || data.validProducts === 0}
          >
            {isLoading ? 'Import en cours...' : `Importer ${data.validProducts} produits`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
