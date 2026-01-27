/**
 * Alerte stock faible pour la page Produits
 * Design optimisé avec animations subtiles
 */
import { motion } from 'framer-motion'
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
      className="relative overflow-hidden rounded-xl border border-orange-200/50 dark:border-orange-900/30 bg-gradient-to-r from-orange-50/80 via-amber-50/50 to-transparent dark:from-orange-950/30 dark:via-amber-950/20 dark:to-transparent"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4">
        <div className="flex items-center gap-3">
          <motion.div 
            className="h-10 w-10 rounded-xl bg-orange-500/15 flex items-center justify-center shrink-0"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <AlertCircle className="h-5 w-5 text-orange-500" />
          </motion.div>
          <div>
            <p className="font-semibold text-foreground">
              {lowStockCount.toLocaleString('fr-FR')} produit{lowStockCount > 1 ? 's' : ''} en stock faible
            </p>
            <p className="text-sm text-muted-foreground">
              Pensez à réapprovisionner pour éviter les ruptures
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onViewLowStock}
          className="bg-background/80 hover:bg-background border-orange-200 dark:border-orange-800 gap-2 shrink-0"
        >
          <Eye className="h-4 w-4" />
          Voir les produits
        </Button>
      </div>
      
      {/* Subtle animated gradient overlay */}
      <motion.div 
        className="absolute inset-0 bg-gradient-to-r from-transparent via-orange-400/5 to-transparent pointer-events-none"
        animate={{ x: ['-100%', '100%'] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
      />
    </motion.div>
  )
}
