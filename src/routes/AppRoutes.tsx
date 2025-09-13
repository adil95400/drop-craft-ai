import { Routes, Route, Navigate } from 'react-router-dom'
import { Layout } from '@/components/Layout'
import ConnectStorePage from '@/pages/stores/ConnectStorePage'
import { IntegrationsPage } from '@/pages/stores/IntegrationsPage'
import { ManageIntegrationPage } from '@/pages/stores/ManageIntegrationPage'
import { StoreDashboard } from '@/pages/stores/StoreDashboard'

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Navigate to="/stores" replace />} />
        <Route path="stores" element={<StoreDashboard />} />
        <Route path="stores/connect" element={<ConnectStorePage />} />
        <Route path="stores/integrations" element={<IntegrationsPage />} />
        <Route path="stores/integrations/:id" element={<ManageIntegrationPage />} />
      </Route>
    </Routes>
  )
}