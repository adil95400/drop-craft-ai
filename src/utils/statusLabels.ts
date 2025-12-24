// Utilitaire centralisé pour les labels de statut en français

export const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: 'En attente',
  processing: 'En cours',
  shipped: 'Expédiée',
  delivered: 'Livrée',
  cancelled: 'Annulée',
  completed: 'Terminée',
  failed: 'Échouée',
  refunded: 'Remboursée',
  paid: 'Payée',
  unpaid: 'Non payée',
  on_hold: 'En suspens',
  backordered: 'En rupture',
}

export const PRODUCT_STATUS_LABELS: Record<string, string> = {
  active: 'Actif',
  inactive: 'Inactif',
  draft: 'Brouillon',
  published: 'Publié',
  archived: 'Archivé',
  out_of_stock: 'Rupture de stock',
  low_stock: 'Stock faible',
  in_stock: 'En stock',
}

export const SYNC_STATUS_LABELS: Record<string, string> = {
  pending: 'En attente',
  syncing: 'Synchronisation',
  synced: 'Synchronisé',
  error: 'Erreur',
  success: 'Succès',
  failed: 'Échoué',
  completed: 'Terminé',
  processing: 'En cours',
}

export const INTEGRATION_STATUS_LABELS: Record<string, string> = {
  connected: 'Connecté',
  disconnected: 'Déconnecté',
  pending: 'En attente',
  error: 'Erreur',
  active: 'Actif',
  inactive: 'Inactif',
}

export const ALERT_SEVERITY_LABELS: Record<string, string> = {
  info: 'Information',
  warning: 'Avertissement',
  error: 'Erreur',
  critical: 'Critique',
  success: 'Succès',
}

export const JOB_STATUS_LABELS: Record<string, string> = {
  queued: 'En file',
  running: 'En cours',
  completed: 'Terminé',
  failed: 'Échoué',
  cancelled: 'Annulé',
  pending: 'En attente',
  processing: 'Traitement',
}

// Fonction utilitaire pour récupérer le label français
export function getStatusLabel(status: string, category: 'order' | 'product' | 'sync' | 'integration' | 'alert' | 'job' = 'order'): string {
  const labelMaps: Record<string, Record<string, string>> = {
    order: ORDER_STATUS_LABELS,
    product: PRODUCT_STATUS_LABELS,
    sync: SYNC_STATUS_LABELS,
    integration: INTEGRATION_STATUS_LABELS,
    alert: ALERT_SEVERITY_LABELS,
    job: JOB_STATUS_LABELS,
  }
  
  const map = labelMaps[category] || ORDER_STATUS_LABELS
  return map[status?.toLowerCase()] || status || 'Inconnu'
}

// Couleurs de statut cohérentes
export function getStatusColorClass(status: string): string {
  const colorMap: Record<string, string> = {
    // Succès / Actif
    delivered: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    completed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    active: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    success: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    synced: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    connected: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    paid: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    published: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    in_stock: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    
    // En cours
    pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    processing: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    syncing: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    running: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    queued: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    shipped: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    
    // Avertissement
    warning: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
    low_stock: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
    on_hold: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
    
    // Erreur / Annulé
    error: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    failed: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    critical: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    disconnected: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    out_of_stock: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    
    // Neutre
    draft: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
    inactive: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
    archived: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
    refunded: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
    info: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  }
  
  return colorMap[status?.toLowerCase()] || 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
}
