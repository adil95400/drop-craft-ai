/**
 * Command Center V3 - Labels UX orientés action
 * Micro-copy clair, non technique, pédagogique
 */

// Types de priorité V3
export type PriorityCardType = 
  | 'stock_critical'
  | 'no_price_rule'
  | 'ai_opportunities'
  | 'not_synced'
  | 'quality_low'
  | 'margin_loss'

export type PriorityLevel = 'critical' | 'high' | 'medium' | 'low'

// Configuration des cartes de priorité V3
export const PRIORITY_CARD_CONFIG: Record<PriorityCardType, {
  title: string
  impactLabel: string
  impactTemplate: string
  ctaPrimary: string
  ctaSecondary: string
  tooltip: string
  variant: 'destructive' | 'warning' | 'info' | 'primary' | 'muted'
}> = {
  stock_critical: {
    title: 'Stock critique',
    impactLabel: 'Risque de rupture',
    impactTemplate: 'Rupture estimée dans {days} jours',
    ctaPrimary: 'Synchroniser',
    ctaSecondary: 'Voir détails',
    tooltip: 'Ces produits risquent d\'être en rupture de stock dans les 7 prochains jours',
    variant: 'destructive'
  },
  no_price_rule: {
    title: 'Sans règle de prix',
    impactLabel: 'Marges non maîtrisées',
    impactTemplate: '{amount}€ de marge potentielle non optimisée',
    ctaPrimary: 'Appliquer règle',
    ctaSecondary: 'Configurer',
    tooltip: 'Ces produits n\'ont aucune règle de tarification active, vos marges ne sont pas optimisées',
    variant: 'warning'
  },
  ai_opportunities: {
    title: 'Opportunités IA',
    impactLabel: 'Potentiel de gain',
    impactTemplate: '+{amount}€ potentiel estimé',
    ctaPrimary: 'Optimiser maintenant',
    ctaSecondary: 'Analyser',
    tooltip: 'L\'IA a identifié des opportunités d\'optimisation pour améliorer vos ventes et marges',
    variant: 'primary'
  },
  not_synced: {
    title: 'Non synchronisés',
    impactLabel: 'Ventes perdues',
    impactTemplate: '{count} produits invisibles sur vos boutiques',
    ctaPrimary: 'Resynchroniser',
    ctaSecondary: 'Voir liste',
    tooltip: 'Ces produits n\'ont pas été mis à jour sur vos boutiques depuis plus de 24h',
    variant: 'info'
  },
  quality_low: {
    title: 'Qualité à améliorer',
    impactLabel: 'Conversion réduite',
    impactTemplate: 'Score moyen: {score}/100',
    ctaPrimary: 'Améliorer',
    ctaSecondary: 'Audit complet',
    tooltip: 'Ces produits ont un score de qualité faible, impactant négativement vos conversions',
    variant: 'warning'
  },
  margin_loss: {
    title: 'Perte de marge',
    impactLabel: 'Rentabilité menacée',
    impactTemplate: '{amount}€ de marge perdue ce mois',
    ctaPrimary: 'Revoir prix',
    ctaSecondary: 'Analyser',
    tooltip: 'Ces produits ont une marge inférieure à votre seuil de rentabilité',
    variant: 'destructive'
  }
}

// Header Command Center V3
export const COMMAND_CENTER_HEADER = {
  title: 'Command Center – Priorités du jour',
  subtitle: 'Les priorités sont calculées automatiquement selon votre stock, vos marges, la qualité produit et l\'impact business.',
  aiBadge: '🧠 Piloté par IA',
  aiTooltip: 'Les priorités et recommandations sont calculées automatiquement selon l\'impact business estimé.',
  allClear: {
    title: 'Tout est en ordre',
    subtitle: 'Votre catalogue est optimisé, aucune action urgente requise.'
  }
}

// KPIs de feedback (post-action)
export const KPI_FEEDBACK_CONFIG = {
  avg_margin: {
    label: 'Marge moyenne',
    unit: '%',
    tooltip: 'Marge moyenne sur l\'ensemble de vos produits actifs'
  },
  stock_value: {
    label: 'Valeur stock',
    unit: '€',
    tooltip: 'Valeur totale de votre stock au prix de vente'
  },
  potential_profit: {
    label: 'Profit potentiel',
    unit: '€',
    tooltip: 'Profit estimé si tout le stock est vendu'
  },
  profitable_products: {
    label: 'Produits rentables',
    unit: '',
    tooltip: 'Nombre de produits avec une marge supérieure à 20%'
  }
}

// Actions groupées V3
export const BULK_ACTIONS_V3 = {
  optimize_ai: {
    label: 'Optimiser via IA',
    description: 'Améliorer automatiquement le contenu et le référencement'
  },
  apply_price_rule: {
    label: 'Appliquer règle prix',
    description: 'Appliquer une règle de tarification existante'
  },
  sync_stores: {
    label: 'Synchroniser',
    description: 'Mettre à jour sur toutes les boutiques connectées'
  },
  optimize_images: {
    label: 'Optimiser images',
    description: 'Améliorer la qualité et le poids des images'
  },
  run_audit: {
    label: 'Lancer audit',
    description: 'Analyser la qualité et le potentiel d\'optimisation'
  }
}

// Messages de feedback après action
export const ACTION_FEEDBACK = {
  success: {
    sync: 'Synchronisation lancée avec succès',
    price_rule: 'Règle de prix appliquée',
    optimize: 'Optimisation IA en cours...',
    audit: 'Audit lancé'
  },
  error: {
    generic: 'Une erreur est survenue, veuillez réessayer',
    no_selection: 'Veuillez sélectionner au moins un produit'
  }
}
