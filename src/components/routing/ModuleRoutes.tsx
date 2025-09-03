import { Routes, Route } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { ModuleGuard } from '@/components/common/ModuleGuard';
import { Skeleton } from '@/components/ui/skeleton';

// Lazy loading des modules pour optimiser le bundle
const Analytics = lazy(() => import('@/pages/Analytics'));
const AutomationPage = lazy(() => import('@/pages/AutomationPage'));
const CRMPage = lazy(() => import('@/pages/CRMPage'));
const SEOManagerPage = lazy(() => import('@/pages/SEOManagerPage'));
const AIPage = lazy(() => import('@/pages/AIPage'));
const SecurityDashboard = lazy(() => import('@/pages/SecurityDashboard'));
const IntegrationsPage = lazy(() => import('@/pages/IntegrationsPage'));

// Composant de chargement
const ModuleLoadingSkeleton = () => (
  <div className="space-y-4 p-6">
    <Skeleton className="h-8 w-[250px]" />
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-32" />
      ))}
    </div>
  </div>
);

export function ModuleRoutes() {
  return (
    <Suspense fallback={<ModuleLoadingSkeleton />}>
      <Routes>
        {/* Modules Pro */}
        <Route 
          path="/analytics" 
          element={
            <ModuleGuard moduleId="analytics">
              <Analytics />
            </ModuleGuard>
          } 
        />
        <Route 
          path="/automation" 
          element={
            <ModuleGuard moduleId="automation">
              <AutomationPage />
            </ModuleGuard>
          } 
        />
        <Route 
          path="/crm" 
          element={
            <ModuleGuard moduleId="crm">
              <CRMPage />
            </ModuleGuard>
          } 
        />
        <Route 
          path="/seo" 
          element={
            <ModuleGuard moduleId="seo">
              <SEOManagerPage />
            </ModuleGuard>
          } 
        />

        {/* Modules Ultra Pro */}
        <Route 
          path="/ai" 
          element={
            <ModuleGuard moduleId="ai">
              <AIPage />
            </ModuleGuard>
          } 
        />
        <Route 
          path="/security" 
          element={
            <ModuleGuard moduleId="security">
              <SecurityDashboard />
            </ModuleGuard>
          } 
        />
        <Route 
          path="/integrations" 
          element={
            <ModuleGuard moduleId="integrations">
              <IntegrationsPage />
            </ModuleGuard>
          } 
        />
      </Routes>
    </Suspense>
  );
}