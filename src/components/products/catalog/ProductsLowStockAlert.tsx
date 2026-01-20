/**
 * Alerte stock faible pour la page Produits
 */
import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertCircle, Eye } from 'lucide-react'

interface ProductsLowStockAlertProps {
  lowStockCount: number
  onViewLowStock: () => void
}

export function ProductsLowStockAlert({ lowStockCount, onViewLowStock }: ProductsLowStockAlertProps) {
  if (lowStockCount === 0) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className="border-orange-200 bg-gradient-to-r from-orange-50/50 to-yellow-50/50 dark:from-orange-950/20 dark:to-yellow-950/20 dark:border-orange-900/50">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
                <AlertCircle className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="font-semibold text-foreground">
                  {lowStockCount} produit{lowStockCount > 1 ? 's' : ''} en stock faible
                </p>
                <p className="text-sm text-muted-foreground">
                  Pensez à réapprovisionner pour éviter les ruptures
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={onViewLowStock}
              className="bg-background"
            >
              <Eye className="h-4 w-4 mr-2" />
              Voir les produits
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
