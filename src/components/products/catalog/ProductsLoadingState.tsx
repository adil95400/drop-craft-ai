/**
 * État de chargement pour la page produits
 */

import { memo } from 'react'
import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'

export const ProductsLoadingState = memo(function ProductsLoadingState() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center space-y-4"
      >
        <div className="relative">
          <Loader2 className="h-16 w-16 animate-spin mx-auto text-primary" />
          <div className="absolute inset-0 animate-ping opacity-20">
            <Loader2 className="h-16 w-16 mx-auto text-primary" />
          </div>
        </div>
        <div className="space-y-2">
          <p className="text-lg font-medium">Chargement du catalogue...</p>
          <p className="text-sm text-muted-foreground">Préparation de vos produits</p>
        </div>
      </motion.div>
    </div>
  )
})
