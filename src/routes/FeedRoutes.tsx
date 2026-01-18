import { lazy } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'

const ChannableFeedManager = lazy(() => import('@/pages/feeds/ChannableFeedManager'))
const FeedOptimizationPage = lazy(() => import('@/pages/feeds/FeedOptimizationPage'))
const FeedRulesPage = lazy(() => import('@/pages/feeds/FeedRulesPage'))
const PPCFeedLinkPage = lazy(() => import('@/pages/feeds/PPCFeedLinkPage'))
const CategoryMappingPage = lazy(() => import('@/pages/feeds/CategoryMappingPage'))

export function FeedRoutes() {
  return (
    <Routes>
      <Route index element={<ChannableFeedManager />} />
      <Route path="optimization" element={<FeedOptimizationPage />} />
      <Route path="rules" element={<Navigate to="/rules?tab=feeds" replace />} />
      <Route path="ppc-link" element={<PPCFeedLinkPage />} />
      <Route path="categories" element={<CategoryMappingPage />} />
    </Routes>
  )
}
