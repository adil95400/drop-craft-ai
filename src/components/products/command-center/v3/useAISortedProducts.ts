/**
 * Hook pour trier les produits par priorité IA
 * Utilisé pour le tri par défaut de la liste produits en V3
 */

import { useMemo } from 'react'
import { UnifiedProduct } from '@/hooks/useUnifiedProducts'
import { AIPriorityEngineResult } from './useAIPriorityEngine'

export type AISortMode = 'ai_priority' | 'risk_first' | 'opportunity_first' | 'name' | 'price' | 'stock' | 'margin' | 'updated'

interface UseAISortedProductsProps {
  products: UnifiedProduct[]
  engineResult: AIPriorityEngineResult
  sortMode?: AISortMode
  ascending?: boolean
}

interface UseAISortedProductsResult {
  sortedProducts: UnifiedProduct[]
  sortMode: AISortMode
  setSortMode: (mode: AISortMode) => void
}

/**
 * Trie les produits selon le mode IA sélectionné
 */
export function useAISortedProducts({
  products,
  engineResult,
  sortMode = 'ai_priority',
  ascending = false
}: UseAISortedProductsProps): UnifiedProduct[] {
  return useMemo(() => {
    const { sortedProductIds, productBadges } = engineResult
    
    // Créer une map pour lookup rapide des produits
    const productMap = new Map(products.map(p => [p.id, p]))
    
    switch (sortMode) {
      case 'ai_priority': {
        // Utiliser l'ordre calculé par le Priority Engine
        const sorted = sortedProductIds
          .map(id => productMap.get(id))
          .filter(Boolean) as UnifiedProduct[]
        
        // Ajouter les produits qui ne sont pas dans la liste triée
        const inSorted = new Set(sortedProductIds)
        const remaining = products.filter(p => !inSorted.has(p.id))
        
        return ascending ? [...sorted, ...remaining].reverse() : [...sorted, ...remaining]
      }
      
      case 'risk_first': {
        // Trier par score de risque (produits à risque en premier)
        return [...products].sort((a, b) => {
          const badgeA = productBadges.get(a.id)
          const badgeB = productBadges.get(b.id)
          const scoreA = badgeA?.score ?? 0
          const scoreB = badgeB?.score ?? 0
          return ascending ? scoreA - scoreB : scoreB - scoreA
        })
      }
      
      case 'opportunity_first': {
        // Trier par type d'opportunité
        return [...products].sort((a, b) => {
          const badgeA = productBadges.get(a.id)
          const badgeB = productBadges.get(b.id)
          const typeOrder = { opportunity: 0, optimized: 1, neutral: 2, risk: 3 }
          const orderA = typeOrder[badgeA?.type ?? 'neutral']
          const orderB = typeOrder[badgeB?.type ?? 'neutral']
          return ascending ? orderB - orderA : orderA - orderB
        })
      }
      
      case 'name': {
        return [...products].sort((a, b) => {
          const nameA = a.name?.toLowerCase() ?? ''
          const nameB = b.name?.toLowerCase() ?? ''
          return ascending ? nameB.localeCompare(nameA) : nameA.localeCompare(nameB)
        })
      }
      
      case 'price': {
        return [...products].sort((a, b) => {
          const priceA = a.price ?? 0
          const priceB = b.price ?? 0
          return ascending ? priceA - priceB : priceB - priceA
        })
      }
      
      case 'stock': {
        return [...products].sort((a, b) => {
          const stockA = a.stock_quantity ?? 0
          const stockB = b.stock_quantity ?? 0
          return ascending ? stockA - stockB : stockB - stockA
        })
      }
      
      case 'margin': {
        return [...products].sort((a, b) => {
          const marginA = calculateMargin(a.price, a.cost_price)
          const marginB = calculateMargin(b.price, b.cost_price)
          return ascending ? marginA - marginB : marginB - marginA
        })
      }
      
      case 'updated': {
        return [...products].sort((a, b) => {
          const dateA = a.updated_at ? new Date(a.updated_at).getTime() : 0
          const dateB = b.updated_at ? new Date(b.updated_at).getTime() : 0
          return ascending ? dateA - dateB : dateB - dateA
        })
      }
      
      default:
        return products
    }
  }, [products, engineResult, sortMode, ascending])
}

function calculateMargin(price?: number, costPrice?: number): number {
  if (!price || !costPrice || price === 0) return 0
  return ((price - costPrice) / price) * 100
}

/**
 * Labels pour les modes de tri
 */
export const AI_SORT_MODE_LABELS: Record<AISortMode, { label: string; description: string }> = {
  ai_priority: {
    label: 'Priorité IA',
    description: 'Trié par urgence et impact business'
  },
  risk_first: {
    label: 'Risques d\'abord',
    description: 'Produits à risque en premier'
  },
  opportunity_first: {
    label: 'Opportunités d\'abord',
    description: 'Meilleures opportunités en premier'
  },
  name: {
    label: 'Nom',
    description: 'Ordre alphabétique'
  },
  price: {
    label: 'Prix',
    description: 'Du plus cher au moins cher'
  },
  stock: {
    label: 'Stock',
    description: 'Par quantité en stock'
  },
  margin: {
    label: 'Marge',
    description: 'Par pourcentage de marge'
  },
  updated: {
    label: 'Mis à jour',
    description: 'Plus récemment modifiés'
  }
}
