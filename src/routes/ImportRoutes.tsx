/**
 * Routes Import - Module simplifié (3 pages)
 * - Import Avancé (page principale)
 * - Historique
 * - Configuration
 */
import { lazy } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'

// Pages principales
const AdvancedImportPage = lazy(() => import('@/pages/import/AdvancedImportPage'))
const ImportHistoryPage = lazy(() => import('@/pages/import/manage/ImportHistoryPage'))
const ImportConfigPage = lazy(() => import('@/pages/import/ImportConfigPage'))

export function ImportRoutes() {
  return (
    <Routes>
      {/* Pages principales */}
      <Route index element={<AdvancedImportPage />} />
      <Route path="history" element={<ImportHistoryPage />} />
      <Route path="config" element={<ImportConfigPage />} />
      
      {/* Redirections pour compatibilité - anciennes URLs */}
      <Route path="quick" element={<Navigate to="/import" replace />} />
      <Route path="url" element={<Navigate to="/import" replace />} />
      <Route path="autods" element={<Navigate to="/import" replace />} />
      <Route path="advanced" element={<Navigate to="/import" replace />} />
      <Route path="aliexpress" element={<Navigate to="/import" replace />} />
      <Route path="scheduled" element={<Navigate to="/import" replace />} />
      <Route path="marketplace" element={<Navigate to="/import" replace />} />
      <Route path="publishing" element={<Navigate to="/import" replace />} />
      
      {/* Shopify redirigé vers Canaux */}
      <Route path="shopify" element={<Navigate to="/stores-channels/shopify" replace />} />
    </Routes>
  )
}
