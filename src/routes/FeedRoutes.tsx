import { lazy } from 'react'
import { Routes, Route } from 'react-router-dom'

const ChannableFeedManager = lazy(() => import('@/pages/feeds/ChannableFeedManager'))
const FeedOptimizationPage = lazy(() => import('@/pages/feeds/FeedOptimizationPage'))
const FeedRulesPage = lazy(() => import('@/pages/feeds/FeedRulesPage'))

export function FeedRoutes() {
  return (
    <Routes>
      <Route index element={<ChannableFeedManager />} />
      <Route path="optimization" element={<FeedOptimizationPage />} />
      <Route path="rules" element={<FeedRulesPage />} />
    </Routes>
  )
}
