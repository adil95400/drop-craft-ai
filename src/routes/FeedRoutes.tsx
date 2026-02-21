import { lazy } from 'react'
import { Routes, Route } from 'react-router-dom'

const ChannableFeedManager = lazy(() => import('@/pages/feeds/ChannableFeedManager'))
const FeedOptimizationPage = lazy(() => import('@/pages/feeds/FeedOptimizationPage'))
const FeedRulesPage = lazy(() => import('@/pages/feeds/FeedRulesPage'))
const PPCFeedLinkPage = lazy(() => import('@/pages/feeds/PPCFeedLinkPage'))
const CategoryMappingPage = lazy(() => import('@/pages/feeds/CategoryMappingPage'))
const FeedDiagnostics = lazy(() => import('@/pages/FeedDiagnostics'))

export function FeedRoutes() {
  return (
    <Routes>
      <Route index element={<ChannableFeedManager />} />
      <Route path="optimization" element={<FeedOptimizationPage />} />
      <Route path="rules" element={<FeedRulesPage />} />
      <Route path="ppc-link" element={<PPCFeedLinkPage />} />
      <Route path="categories" element={<CategoryMappingPage />} />
      <Route path="diagnostics" element={<FeedDiagnostics />} />
    </Routes>
  )
}
