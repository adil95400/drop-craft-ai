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
import URLImportConfig from '@/pages/import/URLImportConfig';
import XMLImportConfig from '@/pages/import/XMLImportConfig';
import FTPImportConfig from '@/pages/import/FTPImportConfig';
import ScheduledImportConfig from '@/pages/import/ScheduledImportConfig';
import BulkImportConfig from '@/pages/import/BulkImportConfig';
import AIImportConfig from '@/pages/import/AIImportConfig';
import { ModuleRoutes } from '@/components/routing/ModuleRoutes';

// Pages simples pour éviter les erreurs
import Products from '@/pages/Products';

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
              <Route path="/products" element={<AppLayout><Products /></AppLayout>} />
              <Route path="/suppliers" element={<AppLayout><SupplierHub /></AppLayout>} />
              <Route path="/import" element={<AppLayout><UnifiedImport /></AppLayout>} />
              <Route path="/import/url-config" element={<AppLayout><URLImportConfig /></AppLayout>} />
              <Route path="/import/xml-config" element={<AppLayout><XMLImportConfig /></AppLayout>} />
              <Route path="/import/ftp-config" element={<AppLayout><FTPImportConfig /></AppLayout>} />
              <Route path="/import/scheduled-config" element={<AppLayout><ScheduledImportConfig /></AppLayout>} />
              <Route path="/import/bulk-config" element={<AppLayout><BulkImportConfig /></AppLayout>} />
              <Route path="/import/ai-config" element={<AppLayout><AIImportConfig /></AppLayout>} />
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