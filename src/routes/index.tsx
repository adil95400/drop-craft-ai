/**
 * Point d'entrée principal du système de routing
 * Architecture modulaire optimisée pour la maintenance et les performances
 */
import { Routes, Route } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { Loader2 } from 'lucide-react';

// Layouts
import { AppLayout } from '@/layouts/AppLayout';
import { AdminLayout } from '@/layouts/AdminLayout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AdminRoute } from '@/components/auth/AdminRoute';

// Route modules
import { PublicRoutes } from './PublicRoutes';
import { CoreRoutes } from './CoreRoutes';
import { ProductRoutes } from './ProductRoutes';
import { AnalyticsRoutes } from './AnalyticsRoutes';
import { AutomationRoutes } from './AutomationRoutes';
import { MarketingRoutes } from './MarketingRoutes';
import { EnterpriseRoutes } from './EnterpriseRoutes';
import { IntegrationRoutes } from './IntegrationRoutes';

// Pages directes
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'));

// Loading component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="text-center space-y-4">
      <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
      <p className="text-sm text-muted-foreground">Chargement...</p>
    </div>
  </div>
);

/**
 * Router principal de l'application
 * Structure hiérarchique avec lazy loading optimisé
 */
export function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public Routes - Non authentifiés */}
        <Route path="/*" element={<PublicRoutes />} />
        
        {/* Protected App Routes - Authentification requise */}
        <Route path="/dashboard/*" element={<ProtectedRoute><AppLayout><CoreRoutes /></AppLayout></ProtectedRoute>} />
        <Route path="/products/*" element={<ProtectedRoute><AppLayout><ProductRoutes /></AppLayout></ProtectedRoute>} />
        <Route path="/analytics/*" element={<ProtectedRoute><AppLayout><AnalyticsRoutes /></AppLayout></ProtectedRoute>} />
        <Route path="/automation/*" element={<ProtectedRoute><AppLayout><AutomationRoutes /></AppLayout></ProtectedRoute>} />
        <Route path="/marketing/*" element={<ProtectedRoute><AppLayout><MarketingRoutes /></AppLayout></ProtectedRoute>} />
        <Route path="/integrations/*" element={<ProtectedRoute><AppLayout><IntegrationRoutes /></AppLayout></ProtectedRoute>} />
        
        {/* Admin Routes - Rôle admin requis */}
        <Route path="/admin/*" element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        } />
        
        {/* 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}
