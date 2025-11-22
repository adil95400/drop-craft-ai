import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminBreadcrumbs } from '@/components/admin/AdminBreadcrumbs';
import { Menu } from 'lucide-react';

// Lazy load admin pages
const AdminDashboard = React.lazy(() => import('@/pages/admin/AdminDashboard').then(m => ({ default: m.AdminDashboard })));
const AdminProducts = React.lazy(() => import('@/pages/admin/AdminProducts').then(m => ({ default: m.AdminProducts })));
const AdminOrders = React.lazy(() => import('@/pages/admin/AdminOrders').then(m => ({ default: m.AdminOrders })));
const AdminCustomers = React.lazy(() => import('@/pages/admin/AdminCustomers').then(m => ({ default: m.AdminCustomers })));
const AdminSuppliers = React.lazy(() => import('@/pages/admin/AdminSuppliers').then(m => ({ default: m.AdminSuppliers })));
const AdminImport = React.lazy(() => import('@/pages/admin/AdminImport'));
const AdminAnalytics = React.lazy(() => import('@/pages/admin/AdminAnalytics'));
const AdminCRM = React.lazy(() => import('@/pages/admin/AdminCRM'));
const AdminMarketing = React.lazy(() => import('@/pages/admin/AdminMarketing'));
const AdminBlog = React.lazy(() => import('@/pages/admin/AdminBlog'));
const AdminSEO = React.lazy(() => import('@/pages/admin/AdminSEO'));
const AdminAI = React.lazy(() => import('@/pages/admin/AdminAI'));
const AdminAutomation = React.lazy(() => import('@/pages/admin/AdminAutomation'));
const AdminSecurity = React.lazy(() => import('@/pages/admin/AdminSecurity'));
const AdminIntegrations = React.lazy(() => import('@/pages/admin/AdminIntegrations'));
const AdminSubscriptions = React.lazy(() => import('@/pages/admin/AdminSubscriptions'));
const VideoTutorialsAdmin = React.lazy(() => import('@/pages/admin/VideoTutorialsAdmin'));
const AdminLogs = React.lazy(() => import('@/pages/admin/AdminLogs'));
const SuperAdminDashboard = React.lazy(() => import('@/pages/admin/SuperAdminDashboard').then(m => ({ default: m.SuperAdminDashboard })));

export const AdminLayout: React.FC = () => {
  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen flex w-full bg-background">
        <AdminSidebar />
        <div className="flex-1 flex flex-col">
          {/* Top Bar - Trigger toujours visible */}
          <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex h-14 items-center justify-between px-6">
              <div className="flex items-center gap-4">
                <SidebarTrigger className="h-8 w-8 hover:bg-muted/50 rounded-md -ml-2">
                  <Menu className="h-4 w-4" />
                </SidebarTrigger>
                <div>
                  <h1 className="text-lg font-semibold">Administration Système</h1>
                </div>
              </div>
            </div>
          </header>

          {/* Page Content */}
          <main className="flex-1 overflow-auto p-6">
            <AdminBreadcrumbs />
            <React.Suspense fallback={
              <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center space-y-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="text-muted-foreground">Chargement...</p>
                </div>
              </div>
            }>
              <Routes>
                {/* Dashboard principal */}
                <Route index element={<AdminDashboard />} />
                
                {/* Gestion des produits et commandes */}
                <Route path="products" element={<AdminProducts />} />
                <Route path="orders" element={<AdminOrders />} />
                <Route path="import" element={<AdminImport />} />
                
                {/* Fournisseurs et clients */}
                <Route path="suppliers" element={<AdminSuppliers />} />
                <Route path="customers" element={<AdminCustomers />} />
                <Route path="crm" element={<AdminCRM />} />
                
                {/* Analytics et reporting */}
                <Route path="analytics" element={<AdminAnalytics />} />
                <Route path="monitoring" element={<AdminAnalytics />} />
                
                {/* Marketing et contenu */}
                <Route path="marketing" element={<AdminMarketing />} />
                <Route path="blog" element={<AdminBlog />} />
                <Route path="seo" element={<AdminSEO />} />
                
                {/* Outils et automatisation */}
                <Route path="ai" element={<AdminAI />} />
                <Route path="ai-studio" element={<AdminAI />} />
                <Route path="automation" element={<AdminAutomation />} />
                <Route path="automation-studio" element={<AdminAutomation />} />
                <Route path="analytics-studio" element={<AdminAnalytics />} />
                
                {/* Système et configuration */}
                <Route path="security" element={<AdminSecurity />} />
                <Route path="integrations" element={<AdminIntegrations />} />
                <Route path="subscriptions" element={<AdminSubscriptions />} />
                <Route path="extensions" element={<AdminIntegrations />} />
                <Route path="video-tutorials" element={<VideoTutorialsAdmin />} />
                <Route path="logs" element={<AdminLogs />} />
                
                {/* Super Admin */}
                <Route path="super" element={<SuperAdminDashboard />} />
                
                {/* Redirections et pages non existantes */}
                <Route path="stores" element={<AdminDashboard />} />
                <Route path="catalog" element={<AdminProducts />} />
                <Route path="users" element={<AdminCustomers />} />
                
                {/* Redirect any unknown admin routes to dashboard */}
                <Route path="*" element={<Navigate to="/admin" replace />} />
              </Routes>
            </React.Suspense>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};