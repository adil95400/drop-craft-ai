import { lazy } from 'react'
import { Routes, Route } from 'react-router-dom'

const ImportHub = lazy(() => import('@/pages/import/ImportHub'))
const QuickImportPage = lazy(() => import('@/pages/import/quick/QuickImportPage'))

const AutoDSImportPage = lazy(() => import('@/pages/import/AutoDSImportPage'))
const AdvancedImportPage = lazy(() => import('@/pages/import/AdvancedImportPage'))
const ImportHistoryPage = lazy(() => import('@/pages/import/manage/ImportHistoryPage'))
const ImportScheduledPage = lazy(() => import('@/pages/import/ImportScheduledPage'))
const ImportConfigPage = lazy(() => import('@/pages/import/ImportConfigPage'))
const ImportMarketplacePage = lazy(() => import('@/pages/import/manage/ImportMarketplacePage'))
const ImportPublishingPage = lazy(() => import('@/pages/import/manage/ImportPublishingPage'))
const ShopifyImportHub = lazy(() => import('@/pages/import/ShopifyImportHub'))
const AliExpressImportPage = lazy(() => import('@/pages/import/AliExpressImportPage'))

export function ImportRoutes() {
  return (
    <Routes>
      <Route index element={<ImportHub />} />
      <Route path="quick" element={<QuickImportPage />} />
      
      <Route path="autods" element={<AutoDSImportPage />} />
      <Route path="advanced" element={<AdvancedImportPage />} />
      <Route path="history" element={<ImportHistoryPage />} />
      <Route path="scheduled" element={<ImportScheduledPage />} />
      <Route path="config" element={<ImportConfigPage />} />
      <Route path="marketplace" element={<ImportMarketplacePage />} />
      <Route path="publishing" element={<ImportPublishingPage />} />
      <Route path="shopify" element={<ShopifyImportHub />} />
      <Route path="aliexpress" element={<AliExpressImportPage />} />
    </Routes>
  )
}
