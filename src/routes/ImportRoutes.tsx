import { lazy } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'

// Simplified Import module - 3 pages only
const ImportHubSimplified = lazy(() => import('@/pages/import/ImportHubSimplified'))
const AdvancedImportPage = lazy(() => import('@/pages/import/AdvancedImportPage'))
const ImportHistoryPage = lazy(() => import('@/pages/import/manage/ImportHistoryPage'))
const ImportConfigPage = lazy(() => import('@/pages/import/ImportConfigPage'))

export function ImportRoutes() {
  return (
    <Routes>
      {/* Main hub - redirects to advanced */}
      <Route index element={<ImportHubSimplified />} />
      
      {/* Core pages */}
      <Route path="advanced" element={<AdvancedImportPage />} />
      <Route path="history" element={<ImportHistoryPage />} />
      <Route path="config" element={<ImportConfigPage />} />
      
      {/* Legacy redirects */}
      <Route path="quick" element={<Navigate to="/import/advanced" replace />} />
      <Route path="url" element={<Navigate to="/import/advanced" replace />} />
      <Route path="autods" element={<Navigate to="/import/advanced" replace />} />
      <Route path="aliexpress" element={<Navigate to="/import/advanced" replace />} />
      <Route path="scheduled" element={<Navigate to="/import/advanced" replace />} />
      <Route path="marketplace" element={<Navigate to="/import/history" replace />} />
      <Route path="publishing" element={<Navigate to="/import/history" replace />} />
      
      {/* Shopify moved to channels */}
      <Route path="shopify" element={<Navigate to="/stores-channels/shopify" replace />} />
    </Routes>
  )
}
