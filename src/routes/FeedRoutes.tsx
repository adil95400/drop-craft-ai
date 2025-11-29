import { lazy } from 'react'
import { Routes, Route } from 'react-router-dom'

const FeedManagerPage = lazy(() => import('@/pages/feeds/FeedManagerPage'))
const FeedOptimizationPage = lazy(() => import('@/pages/feeds/FeedOptimizationPage'))

export function FeedRoutes() {
  return (
    <Routes>
      <Route index element={<FeedManagerPage />} />
      <Route path="optimization" element={<FeedOptimizationPage />} />
    </Routes>
  )
}
