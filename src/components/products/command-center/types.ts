/**
 * Types pour le Command Center produits
 */

import { LucideIcon } from 'lucide-react'
import { UnifiedProduct } from '@/hooks/useUnifiedProducts'
import { ProductAuditResult } from '@/types/audit'

// Types de cartes d'action
export type ActionCardType = 'stock' | 'quality' | 'price_rule' | 'ai' | 'sync'

// Couleurs par gravité
export type ActionCardVariant = 'destructive' | 'warning' | 'info' | 'primary' | 'muted'

// Priorité de recommandation
export type RecommendationPriority = 'critical' | 'high' | 'medium' | 'low'

// Filtres intelligents
export type SmartFilterType = 
  | 'all'
  | 'at_risk' 
  | 'profitable' 
  | 'no_price_rule' 
  | 'not_synced' 
  | 'ai_recommended'
  | 'losing_margin'

// Props pour ActionCard
export interface ActionCardProps {
  type: ActionCardType
  count: number
  label: string
  sublabel: string
  variant: ActionCardVariant
  icon: LucideIcon
  onClick: () => void
  trend?: { 
    value: number
    direction: 'up' | 'down' 
  }
  isLoading?: boolean
}

// Props pour SmartFiltersBar
export interface SmartFilterOption {
  id: SmartFilterType
  label: string
  tooltip: string
  count: number
  variant?: ActionCardVariant
}

// Données du Command Center
export interface CommandCenterData {
  cards: Array<{
    type: ActionCardType
    count: number
    productIds: string[]
  }>
  smartFilters: {
    atRisk: string[]
    profitable: string[]
    noPriceRule: string[]
    notSynced: string[]
    aiRecommended: string[]
    losingMargin: string[]
  }
  recommendations: AIRecommendation[]
}

// Recommandation IA
export interface AIRecommendation {
  productId: string
  productName: string
  type: 'restock' | 'optimize_content' | 'apply_pricing' | 'sync_stores' | 'review_margin'
  priority: RecommendationPriority
  message: string
  action: string
  impact: 'high' | 'medium' | 'low'
}

// Score de risque produit
export interface ProductRiskScore {
  productId: string
  score: number // 0-100 (100 = très risqué)
  priority: RecommendationPriority
  factors: RiskFactor[]
}

export interface RiskFactor {
  type: 'stock' | 'quality' | 'margin' | 'sync' | 'price_rule'
  weight: number
  value: number
  threshold: number
  contribution: number // Contribution au score final
}

// Configuration des seuils
export interface CommandCenterConfig {
  stockCriticalThreshold: number
  qualityLowThreshold: number
  marginLowThreshold: number
  syncStaleHours: number
}

export const DEFAULT_COMMAND_CENTER_CONFIG: CommandCenterConfig = {
  stockCriticalThreshold: 10,
  qualityLowThreshold: 40,
  marginLowThreshold: 15,
  syncStaleHours: 24
}

// Labels et micro-copy
export const ACTION_CARD_LABELS: Record<ActionCardType, {
  title: string
  subtitle: string
  tooltip: string
  cta: string
}> = {
  stock: {
    title: 'Stock critique',
    subtitle: '{count} produits',
    tooltip: 'Ces produits risquent la rupture dans les 7 prochains jours',
    cta: 'Voir'
  },
  quality: {
    title: 'Qualité à améliorer',
    subtitle: '{count} produits',
    tooltip: 'Score qualité < 40/100 - Impact sur les ventes et le SEO',
    cta: 'Corriger'
  },
  price_rule: {
    title: 'Sans règle de prix',
    subtitle: '{count} produits',
    tooltip: "Ces produits n'ont aucune règle de tarification active",
    cta: 'Appliquer'
  },
  ai: {
    title: 'Recommandations IA',
    subtitle: '{count} en attente',
    tooltip: "L'IA a identifié des opportunités d'optimisation",
    cta: 'Optimiser'
  },
  sync: {
    title: 'Non synchronisés',
    subtitle: '{count} produits',
    tooltip: "Ces produits n'ont pas été mis à jour sur vos boutiques",
    cta: 'Synchroniser'
  }
}

export const SMART_FILTER_LABELS: Record<SmartFilterType, {
  label: string
  tooltip: string
}> = {
  all: {
    label: 'Tous',
    tooltip: 'Afficher tous les produits'
  },
  at_risk: {
    label: 'À risque',
    tooltip: 'Produits avec stock faible OU qualité < 40'
  },
  profitable: {
    label: 'Rentables',
    tooltip: 'Marge > 30% et stock disponible'
  },
  no_price_rule: {
    label: 'Sans règle prix',
    tooltip: 'Aucune règle de tarification appliquée'
  },
  not_synced: {
    label: 'Non synchronisés',
    tooltip: 'Dernière sync > 24h ou jamais synchronisé'
  },
  ai_recommended: {
    label: 'Recommandés IA',
    tooltip: "L'IA suggère une action d'optimisation"
  },
  losing_margin: {
    label: 'Perte de marge',
    tooltip: 'Marge en baisse vs moyenne historique'
  }
}
