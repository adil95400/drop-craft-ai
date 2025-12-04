import { lazy } from 'react'
import { Routes, Route } from 'react-router-dom'

const ChannableFeedManager = lazy(() => import('@/pages/feeds/ChannableFeedManager'))
const FeedOptimizationPage = lazy(() => import('@/pages/feeds/FeedOptimizationPage'))

export function FeedRoutes() {
  return (
    <Routes>
      <Route index element={<ChannableFeedManager />} />
      <Route path="optimization" element={<FeedOptimizationPage />} />
    </Routes>
  )
}
