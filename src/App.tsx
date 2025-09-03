import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as SonnerToaster } from '@/components/ui/sonner';
import { AuthProvider } from '@/contexts/AuthContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { UnifiedPlanProvider } from '@/components/plan/UnifiedPlanProvider';
import { HelmetProvider } from 'react-helmet-async';
import { AppLayout } from '@/layouts/AppLayout';

// Pages
import Index from '@/pages/Index';
import Dashboard from '@/pages/Dashboard';
import SubscriptionDashboard from '@/pages/SubscriptionDashboard';
import QuotaManagerPage from '@/pages/QuotaManagerPage';
import SupplierHub from '@/components/SupplierHub';
import UnifiedImport from '@/pages/UnifiedImport';
import { ModuleRoutes } from '@/components/routing/ModuleRoutes';

// Pages simples pour éviter les erreurs
const ProductsPage = () => <div>Products - En cours de développement</div>;

const queryClient = new QueryClient();

function App() {
  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <UnifiedPlanProvider>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/dashboard" element={<AppLayout><Dashboard /></AppLayout>} />
              <Route path="/products" element={<AppLayout><ProductsPage /></AppLayout>} />
              <Route path="/suppliers" element={<AppLayout><SupplierHub /></AppLayout>} />
              <Route path="/import" element={<AppLayout><UnifiedImport /></AppLayout>} />
              <Route path="/subscription" element={<AppLayout><SubscriptionDashboard /></AppLayout>} />
              <Route path="/quotas" element={<AppLayout><QuotaManagerPage /></AppLayout>} />
              <Route path="/*" element={<AppLayout><ModuleRoutes /></AppLayout>} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            <Toaster />
            <SonnerToaster />
          </UnifiedPlanProvider>
        </AuthProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
}

export default App;