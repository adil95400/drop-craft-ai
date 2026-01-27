/**
 * useProductBacklog - Hook pour le backlog intelligent
 * Tri et priorisation IA des produits à traiter
 */
import { useMemo } from 'react'
import { useProductsUnified, UnifiedProduct } from '@/hooks/unified'

export type BacklogPriority = 'critical' | 'high' | 'medium' | 'low'
export type BacklogCategory = 'all' | 'actions' | 'opportunities' | 'optimization'

export interface BacklogItem {
  product: UnifiedProduct
  priority: BacklogPriority
  score: number
  reasons: string[]
  estimatedImpact: number // en euros
  suggestedAction: string
}

export interface BacklogCounts {
  total: number
  actions: number
  opportunities: number
  optimization: number
  critical: number
}

export function useProductBacklog() {
  const { products, isLoading } = useProductsUnified()

  // Calcul du backlog avec scoring IA
  const backlogItems = useMemo<BacklogItem[]>(() => {
    if (!products) return []

    return products
      .map(product => {
        const reasons: string[] = []
        let score = 0
        let estimatedImpact = 0
        let suggestedAction = ''

        const stock = product.stock_quantity || 0
        const margin = product.profit_margin || 0
        const price = product.price || 0
        const hasImage = !!product.image_url
        const hasCategory = !!product.category

        // Stock critique (poids: 40)
        if (stock === 0) {
          score += 40
          reasons.push('Rupture de stock')
          suggestedAction = 'Réapprovisionner'
          estimatedImpact += price * 10 // Ventes potentielles perdues
        } else if (stock < 3) {
          score += 30
          reasons.push(`Stock critique (${stock} unités)`)
          suggestedAction = 'Réapprovisionner'
          estimatedImpact += price * 5
        } else if (stock < 10) {
          score += 15
          reasons.push(`Stock faible (${stock} unités)`)
        }

        // Marge insuffisante (poids: 25)
        if (margin < 10 && margin > 0) {
          score += 25
          reasons.push(`Marge faible (${margin.toFixed(1)}%)`)
          if (!suggestedAction) suggestedAction = 'Optimiser le prix'
          estimatedImpact += price * 0.1 * stock
        } else if (margin < 15) {
          score += 15
          reasons.push(`Marge à optimiser (${margin.toFixed(1)}%)`)
          estimatedImpact += price * 0.05 * stock
        }

        // Image manquante (poids: 20)
        if (!hasImage) {
          score += 20
          reasons.push('Image manquante')
          if (!suggestedAction) suggestedAction = 'Ajouter une image'
          estimatedImpact += price * 0.3 // -30% conversions sans image
        }

        // Catégorie manquante (poids: 15)
        if (!hasCategory) {
          score += 15
          reasons.push('Catégorie non définie')
          if (!suggestedAction) suggestedAction = 'Classifier le produit'
        }

        // Déterminer la priorité
        let priority: BacklogPriority = 'low'
        if (score >= 50) priority = 'critical'
        else if (score >= 30) priority = 'high'
        else if (score >= 15) priority = 'medium'

        // Ne garder que les produits avec des problèmes
        if (score === 0) return null

        return {
          product,
          priority,
          score,
          reasons,
          estimatedImpact: Math.round(estimatedImpact),
          suggestedAction: suggestedAction || 'Vérifier le produit'
        }
      })
      .filter((item): item is BacklogItem => item !== null)
      .sort((a, b) => b.score - a.score)
  }, [products])

  // Comptages par catégorie
  const counts = useMemo<BacklogCounts>(() => {
    const actions = backlogItems.filter(item => 
      item.reasons.some(r => r.includes('stock') || r.includes('Rupture'))
    ).length

    const opportunities = backlogItems.filter(item =>
      item.reasons.some(r => r.includes('Marge'))
    ).length

    const optimization = backlogItems.filter(item =>
      item.reasons.some(r => r.includes('Image') || r.includes('Catégorie'))
    ).length

    const critical = backlogItems.filter(item => item.priority === 'critical').length

    return {
      total: backlogItems.length,
      actions,
      opportunities,
      optimization,
      critical
    }
  }, [backlogItems])

  // Impact total estimé
  const totalEstimatedImpact = useMemo(() => 
    backlogItems.reduce((sum, item) => sum + item.estimatedImpact, 0),
    [backlogItems]
  )

  // Filtrer par catégorie
  const filterByCategory = (category: BacklogCategory): BacklogItem[] => {
    if (category === 'all') return backlogItems
    
    return backlogItems.filter(item => {
      switch (category) {
        case 'actions':
          return item.reasons.some(r => r.includes('stock') || r.includes('Rupture'))
        case 'opportunities':
          return item.reasons.some(r => r.includes('Marge'))
        case 'optimization':
          return item.reasons.some(r => r.includes('Image') || r.includes('Catégorie'))
        default:
          return true
      }
    })
  }

  return {
    backlogItems,
    counts,
    totalEstimatedImpact,
    filterByCategory,
    isLoading
  }
}
