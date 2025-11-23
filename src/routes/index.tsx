/**
 * Point d'entrée principal du système de routing
 * Architecture modulaire optimisée pour la maintenance et les performances
 */
import { Routes, Route, Navigate } from 'react-router-dom';
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
import { ExtensionRoutes } from './ExtensionRoutes';

// Pages directes
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'));
const AvisPositifUltraPro = lazy(() => import('@/pages/AvisPositifUltraPro'));
const AdvancedImportPage = lazy(() => import('@/pages/import/AdvancedImportPage'));
const SyncManagerPage = lazy(() => import('@/pages/sync/SyncManagerPage'));
const OrdersCenterPage = lazy(() => import('@/pages/orders/OrdersCenterPage'));
const ProductsQA = lazy(() => import('@/pages/qa/ProductsQA'));
const OrdersQA = lazy(() => import('@/pages/qa/OrdersQA'));
const QADashboard = lazy(() => import('@/pages/qa/QADashboard'));
const ShopifyStore = lazy(() => import('@/pages/ShopifyStore'));
const ShopifyProductDetail = lazy(() => import('@/pages/ShopifyProductDetail'));
const CreateProduct = lazy(() => import('@/pages/products/CreateProduct'));
const CreateOrder = lazy(() => import('@/pages/orders/CreateOrder'));
const CreateCustomer = lazy(() => import('@/pages/customers/CreateCustomer'));
const CreateNotification = lazy(() => import('@/pages/notifications/CreateNotification'));

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
        
        {/* Redirections pour profil et paramètres */}
        <Route path="/profile" element={<Navigate to="/dashboard/profile" replace />} />
        <Route path="/settings" element={<Navigate to="/dashboard/settings" replace />} />
        
        {/* Protected App Routes - Authentification requise */}
        <Route path="/dashboard/*" element={<ProtectedRoute><AppLayout><CoreRoutes /></AppLayout></ProtectedRoute>} />
        <Route path="/products/*" element={<ProtectedRoute><AppLayout><ProductRoutes /></AppLayout></ProtectedRoute>} />
        <Route path="/analytics/*" element={<ProtectedRoute><AppLayout><AnalyticsRoutes /></AppLayout></ProtectedRoute>} />
        <Route path="/automation/*" element={<ProtectedRoute><AppLayout><AutomationRoutes /></AppLayout></ProtectedRoute>} />
        <Route path="/marketing/*" element={<ProtectedRoute><AppLayout><MarketingRoutes /></AppLayout></ProtectedRoute>} />
        <Route path="/integrations/*" element={<ProtectedRoute><AppLayout><IntegrationRoutes /></AppLayout></ProtectedRoute>} />
        <Route path="/enterprise/*" element={<ProtectedRoute><AppLayout><EnterpriseRoutes /></AppLayout></ProtectedRoute>} />
        <Route path="/extensions/*" element={<ProtectedRoute><AppLayout><ExtensionRoutes /></AppLayout></ProtectedRoute>} />
        <Route path="/reviews" element={<ProtectedRoute><AppLayout><AvisPositifUltraPro /></AppLayout></ProtectedRoute>} />
        
        {/* Pages manquantes ajoutées - Phase 1 */}
        <Route path="/import/advanced" element={<ProtectedRoute><AppLayout><AdvancedImportPage /></AppLayout></ProtectedRoute>} />
        <Route path="/sync-manager" element={<ProtectedRoute><AppLayout><SyncManagerPage /></AppLayout></ProtectedRoute>} />
        <Route path="/orders-center" element={<ProtectedRoute><AppLayout><OrdersCenterPage /></AppLayout></ProtectedRoute>} />
        
        {/* QA Routes - Phase 4 */}
        <Route path="/qa" element={<ProtectedRoute><AppLayout><QADashboard /></AppLayout></ProtectedRoute>} />
        <Route path="/qa/products" element={<ProtectedRoute><AppLayout><ProductsQA /></AppLayout></ProtectedRoute>} />
        <Route path="/qa/orders" element={<ProtectedRoute><AppLayout><OrdersQA /></AppLayout></ProtectedRoute>} />
        
        {/* Shopify Store Routes */}
        <Route path="/store" element={<ShopifyStore />} />
        <Route path="/store/product/:handle" element={<ShopifyProductDetail />} />
        
        {/* Creation Pages */}
        <Route path="/products/create" element={<ProtectedRoute><CreateProduct /></ProtectedRoute>} />
        <Route path="/orders/create" element={<ProtectedRoute><CreateOrder /></ProtectedRoute>} />
        <Route path="/customers/create" element={<ProtectedRoute><CreateCustomer /></ProtectedRoute>} />
        <Route path="/notifications/create" element={<ProtectedRoute><CreateNotification /></ProtectedRoute>} />
        
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
