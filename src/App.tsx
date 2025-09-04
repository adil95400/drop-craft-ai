import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as SonnerToaster } from '@/components/ui/sonner';
import { AuthProvider } from '@/contexts/AuthContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { UnifiedPlanProvider } from '@/components/plan/UnifiedPlanProvider';
import { HelmetProvider } from 'react-helmet-async';
import { AppLayout } from '@/layouts/AppLayout';
import { NotificationProvider } from '@/components/notifications/NotificationService';

// Pages
import Index from '@/pages/Index';
import Dashboard from '@/pages/Dashboard';
import Orders from '@/pages/Orders';
import Customers from '@/pages/Customers';
import Marketing from '@/pages/Marketing';
import SubscriptionDashboard from '@/pages/SubscriptionDashboard';
import QuotaManagerPage from '@/pages/QuotaManagerPage';
import Suppliers from "@/pages/Suppliers";
import UnifiedImport from '@/pages/UnifiedImport';
import URLImportConfig from '@/pages/import/URLImportConfig';
import XMLImportConfig from '@/pages/import/XMLImportConfig';
import FTPImportConfig from '@/pages/import/FTPImportConfig';
import ScheduledImportConfig from '@/pages/import/ScheduledImportConfig';
import BulkImportConfig from '@/pages/import/BulkImportConfig';
import AIImportConfig from '@/pages/import/AIImportConfig';
import ImportHistory from '@/pages/ImportHistory';
import ImportedProducts from '@/pages/ImportedProducts';
import { ModuleRoutes } from '@/components/routing/ModuleRoutes';
import Products from '@/pages/Products';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 2 * 60 * 1000, // 2 minutes
      gcTime: 10 * 60 * 1000,   // 10 minutes
    },
  },
});

function App() {
  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <UnifiedPlanProvider>
            <NotificationProvider>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/dashboard" element={<AppLayout><Dashboard /></AppLayout>} />
                <Route path="/products" element={<AppLayout><Products /></AppLayout>} />
                <Route path="/orders" element={<AppLayout><Orders /></AppLayout>} />
                <Route path="/customers" element={<AppLayout><Customers /></AppLayout>} />
                <Route path="/marketing" element={<AppLayout><Marketing /></AppLayout>} />
                <Route path="/suppliers" element={<AppLayout><Suppliers /></AppLayout>} />
                <Route path="/import" element={<AppLayout><UnifiedImport /></AppLayout>} />
                <Route path="/import/url-config" element={<AppLayout><URLImportConfig /></AppLayout>} />
                <Route path="/import/xml-config" element={<AppLayout><XMLImportConfig /></AppLayout>} />
                <Route path="/import/ftp-config" element={<AppLayout><FTPImportConfig /></AppLayout>} />
                <Route path="/import/scheduled-config" element={<AppLayout><ScheduledImportConfig /></AppLayout>} />
                <Route path="/import/bulk-config" element={<AppLayout><BulkImportConfig /></AppLayout>} />
                <Route path="/import/ai-config" element={<AppLayout><AIImportConfig /></AppLayout>} />
                <Route path="/import/history" element={<AppLayout><ImportHistory /></AppLayout>} />
                <Route path="/import/products" element={<AppLayout><ImportedProducts /></AppLayout>} />
                <Route path="/subscription" element={<AppLayout><SubscriptionDashboard /></AppLayout>} />
                <Route path="/quotas" element={<AppLayout><QuotaManagerPage /></AppLayout>} />
                <Route path="/*" element={<AppLayout><ModuleRoutes /></AppLayout>} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
              <Toaster />
              <SonnerToaster />
            </NotificationProvider>
          </UnifiedPlanProvider>
        </AuthProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
}

export default App;