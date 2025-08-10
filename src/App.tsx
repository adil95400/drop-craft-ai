import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { AuthProvider } from "@/contexts/AuthContext";
import { AppLayout } from "@/layouts/AppLayout";
import Suppliers from "./pages/Suppliers";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Import from "./pages/Import";
import ImportUltraPro from "./pages/ImportUltraPro";
import CatalogueReal from "./pages/CatalogueReal";
import TrackingReal from "./pages/TrackingReal";
import SEO from "./pages/SEO";
import Winners from "./pages/Winners";
import CRM from "./pages/CRM";
import Settings from "./pages/Settings";
import Blog from "./pages/Blog";
import Reviews from "./pages/Reviews";
import Marketplace from "./pages/Marketplace";
import Orders from "./pages/Orders";
import Automation from "./pages/Automation";
import Integrations from "./pages/Integrations";
import Stock from "./pages/Stock";
import Analytics from "./pages/Analytics";
import Marketing from "./pages/Marketing";
import Inventory from "./pages/Inventory";
import Plugins from "./pages/Plugins";
import Extension from "./pages/Extension";
import Mobile from "./pages/Mobile";
import Support from "./pages/Support";
import Admin from "./pages/Admin";
import FAQ from "./pages/FAQ";
import Security from "./pages/Security";
import Notifications from "./pages/Notifications";
import NotFound from "./pages/NotFound";
import CRMLeads from "./pages/CRMLeads";
import CRMActivity from "./pages/CRMActivity";
import CRMCalendar from "./pages/CRMCalendar";
import CRMEmails from "./pages/CRMEmails";
import CRMCalls from "./pages/CRMCalls";
import TrackingInTransit from "./pages/TrackingInTransit";
import TrackingToday from "./pages/TrackingToday";
import ReviewsUltraPro from "./pages/ReviewsUltraPro";
import AnalyticsUltraPro from "./pages/AnalyticsUltraPro";
import MarketingUltraPro from "./pages/MarketingUltraPro";
import DashboardUltraPro from "./pages/DashboardUltraPro";
import InventoryUltraProReal from "./pages/InventoryUltraProReal";
import OrdersUltraProReal from "./pages/OrdersUltraProReal";
import SuppliersUltraPro from "./pages/SuppliersUltraPro";
import CRMUltraProReal from "./pages/CRMUltraProReal";
import CRMProspectsUltraPro from "./pages/CRMProspectsUltraPro";
import SuiviEnTransitUltraPro from "./pages/SuiviEnTransitUltraPro";
import AvisPositifUltraPro from "./pages/AvisPositifUltraPro";
import AutomationUltraPro from "./pages/AutomationUltraPro";
import BlogUltraPro from "./pages/BlogUltraPro";
import SEOUltraPro from "./pages/SEOUltraPro";
import SecurityUltraPro from "./pages/SecurityUltraPro";
import SupportUltraPro from "./pages/SupportUltraPro";
import TrackingUltraPro from "./pages/TrackingUltraPro";
import CatalogueUltraPro from "./pages/CatalogueUltraPro";
import CatalogueUltraProAdvanced from "./pages/CatalogueUltraProAdvanced";
import PluginsUltraPro from "./pages/PluginsUltraPro";
import MobileUltraPro from "./pages/MobileUltraPro";
import ExtensionUltraPro from "./pages/ExtensionUltraPro";
import StockUltraPro from "./pages/StockUltraPro";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={
              <AuthGuard requireAuth={false}>
                <Index />
              </AuthGuard>
            } />
            <Route path="/auth" element={
              <AuthGuard requireAuth={false}>
                <Auth />
              </AuthGuard>
            } />
            
            {/* Protected routes with layout */}
            <Route path="/dashboard" element={
              <AuthGuard>
                <AppLayout>
                  <Dashboard />
                </AppLayout>
              </AuthGuard>
            } />
            <Route path="/import" element={
              <AuthGuard>
                <AppLayout>
                  <Import />
                </AppLayout>
              </AuthGuard>
            } />
            <Route path="/import-ultra-pro" element={
              <AuthGuard>
                <AppLayout>
                  <ImportUltraPro />
                </AppLayout>
              </AuthGuard>
            } />
            <Route path="/catalogue" element={
              <AuthGuard>
                <AppLayout>
                  <CatalogueReal />
                </AppLayout>
              </AuthGuard>
            } />
            <Route path="/catalogue-ultra-pro" element={
              <AuthGuard>
                <AppLayout>
                  <CatalogueUltraPro />
                </AppLayout>
              </AuthGuard>
            } />
            <Route path="/catalogue-ultra-pro-advanced" element={
              <AuthGuard>
                <AppLayout>
                  <CatalogueUltraProAdvanced />
                </AppLayout>
              </AuthGuard>
            } />
            <Route path="/marketplace" element={
              <AuthGuard>
                <AppLayout>
                  <Marketplace />
                </AppLayout>
              </AuthGuard>
            } />
            <Route path="/orders" element={
              <AuthGuard>
                <AppLayout>
                  <Orders />
                </AppLayout>
              </AuthGuard>
            } />
            <Route path="/orders-ultra-pro" element={
              <AuthGuard>
                <AppLayout>
                  <OrdersUltraProReal />
                </AppLayout>
              </AuthGuard>
            } />
            <Route path="/crm" element={
              <AuthGuard>
                <AppLayout>
                  <CRM />
                </AppLayout>
              </AuthGuard>
            } />
            <Route path="/crm-ultra-pro" element={
              <AuthGuard>
                <AppLayout>
                  <CRMUltraProReal />
                </AppLayout>
              </AuthGuard>
            } />
            <Route path="/crm/leads" element={
              <AuthGuard>
                <AppLayout>
                  <CRMLeads />
                </AppLayout>
              </AuthGuard>
            } />
            <Route path="/crm/activity" element={
              <AuthGuard>
                <AppLayout>
                  <CRMActivity />
                </AppLayout>
              </AuthGuard>
            } />
            <Route path="/crm/calendar" element={
              <AuthGuard>
                <AppLayout>
                  <CRMCalendar />
                </AppLayout>
              </AuthGuard>
            } />
            <Route path="/crm/emails" element={
              <AuthGuard>
                <AppLayout>
                  <CRMEmails />
                </AppLayout>
              </AuthGuard>
            } />
            <Route path="/crm/calls" element={
              <AuthGuard>
                <AppLayout>
                  <CRMCalls />
                </AppLayout>
              </AuthGuard>
            } />
            <Route path="/crm/prospects-ultra-pro" element={
              <AuthGuard>
                <AppLayout>
                  <CRMProspectsUltraPro />
                </AppLayout>
              </AuthGuard>
            } />
            <Route path="/tracking" element={
              <AuthGuard>
                <AppLayout>
                  <TrackingReal />
                </AppLayout>
              </AuthGuard>
            } />
            <Route path="/tracking-ultra-pro" element={
              <AuthGuard>
                <AppLayout>
                  <TrackingUltraPro />
                </AppLayout>
              </AuthGuard>
            } />
            <Route path="/tracking/in-transit" element={
              <AuthGuard>
                <AppLayout>
                  <TrackingInTransit />
                </AppLayout>
              </AuthGuard>
            } />
            <Route path="/tracking/today" element={
              <AuthGuard>
                <AppLayout>
                  <TrackingToday />
                </AppLayout>
              </AuthGuard>
            } />
            <Route path="/suivi/en-transit-ultra-pro" element={
              <AuthGuard>
                <AppLayout>
                  <SuiviEnTransitUltraPro />
                </AppLayout>
              </AuthGuard>
            } />
            <Route path="/reviews" element={
              <AuthGuard>
                <AppLayout>
                  <Reviews />
                </AppLayout>
              </AuthGuard>
            } />
            <Route path="/reviews-ultra-pro" element={
              <AuthGuard>
                <AppLayout>
                  <ReviewsUltraPro />
                </AppLayout>
              </AuthGuard>
            } />
            <Route path="/avis/positif-ultra-pro" element={
              <AuthGuard>
                <AppLayout>
                  <AvisPositifUltraPro />
                </AppLayout>
              </AuthGuard>
            } />
            <Route path="/seo" element={
              <AuthGuard>
                <AppLayout>
                  <SEO />
                </AppLayout>
              </AuthGuard>
            } />
            <Route path="/seo-ultra-pro" element={
              <AuthGuard>
                <AppLayout>
                  <SEOUltraPro />
                </AppLayout>
              </AuthGuard>
            } />
            <Route path="/marketing" element={
              <AuthGuard>
                <AppLayout>
                  <Marketing />
                </AppLayout>
              </AuthGuard>
            } />
            <Route path="/marketing-ultra-pro" element={
              <AuthGuard>
                <AppLayout>
                  <MarketingUltraPro />
                </AppLayout>
              </AuthGuard>
            } />
            <Route path="/inventory" element={
              <AuthGuard>
                <AppLayout>
                  <Inventory />
                </AppLayout>
              </AuthGuard>
            } />
            <Route path="/inventory-ultra-pro" element={
              <AuthGuard>
                <AppLayout>
                  <InventoryUltraProReal />
                </AppLayout>
              </AuthGuard>
            } />
            <Route path="/automation" element={
              <AuthGuard>
                <AppLayout>
                  <Automation />
                </AppLayout>
              </AuthGuard>
            } />
            <Route path="/automation-ultra-pro" element={
              <AuthGuard>
                <AppLayout>
                  <AutomationUltraPro />
                </AppLayout>
              </AuthGuard>
            } />
            <Route path="/plugins" element={
              <AuthGuard>
                <AppLayout>
                  <Plugins />
                </AppLayout>
              </AuthGuard>
            } />
            <Route path="/plugins-ultra-pro" element={
              <AuthGuard>
                <AppLayout>
                  <PluginsUltraPro />
                </AppLayout>
              </AuthGuard>
            } />
            <Route path="/extension" element={
              <AuthGuard>
                <AppLayout>
                  <Extension />
                </AppLayout>
              </AuthGuard>
            } />
            <Route path="/extension-ultra-pro" element={
              <AuthGuard>
                <AppLayout>
                  <ExtensionUltraPro />
                </AppLayout>
              </AuthGuard>
            } />
            <Route path="/mobile" element={
              <AuthGuard>
                <AppLayout>
                  <Mobile />
                </AppLayout>
              </AuthGuard>
            } />
            <Route path="/mobile-ultra-pro" element={
              <AuthGuard>
                <AppLayout>
                  <MobileUltraPro />
                </AppLayout>
              </AuthGuard>
            } />
            <Route path="/integrations" element={
              <AuthGuard>
                <AppLayout>
                  <Integrations />
                </AppLayout>
              </AuthGuard>
            } />
            <Route path="/support" element={
              <AuthGuard>
                <AppLayout>
                  <Support />
                </AppLayout>
              </AuthGuard>
            } />
            <Route path="/support-ultra-pro" element={
              <AuthGuard>
                <AppLayout>
                  <SupportUltraPro />
                </AppLayout>
              </AuthGuard>
            } />
            <Route path="/analytics" element={
              <AuthGuard>
                <AppLayout>
                  <Analytics />
                </AppLayout>
              </AuthGuard>
            } />
            <Route path="/analytics-ultra-pro" element={
              <AuthGuard>
                <AppLayout>
                  <AnalyticsUltraPro />
                </AppLayout>
              </AuthGuard>
            } />
            <Route path="/stock" element={
              <AuthGuard>
                <AppLayout>
                  <Stock />
                </AppLayout>
              </AuthGuard>
            } />
            <Route path="/stock-ultra-pro" element={
              <AuthGuard>
                <AppLayout>
                  <StockUltraPro />
                </AppLayout>
              </AuthGuard>
            } />
            <Route path="/winners" element={
              <AuthGuard>
                <AppLayout>
                  <Winners />
                </AppLayout>
              </AuthGuard>
            } />
            <Route path="/blog" element={
              <AuthGuard>
                <AppLayout>
                  <Blog />
                </AppLayout>
              </AuthGuard>
            } />
            <Route path="/blog-ultra-pro" element={
              <AuthGuard>
                <AppLayout>
                  <BlogUltraPro />
                </AppLayout>
              </AuthGuard>
            } />
            <Route path="/settings" element={
              <AuthGuard>
                <AppLayout>
                  <Settings />
                </AppLayout>
              </AuthGuard>
            } />
            <Route path="/admin" element={
              <AuthGuard>
                <AppLayout>
                  <Admin />
                </AppLayout>
              </AuthGuard>
            } />
            <Route path="/faq" element={
              <AuthGuard>
                <AppLayout>
                  <FAQ />
                </AppLayout>
              </AuthGuard>
            } />
            <Route path="/security" element={
              <AuthGuard>
                <AppLayout>
                  <Security />
                </AppLayout>
              </AuthGuard>
            } />
            <Route path="/security-ultra-pro" element={
              <AuthGuard>
                <AppLayout>
                  <SecurityUltraPro />
                </AppLayout>
              </AuthGuard>
            } />
            <Route path="/notifications" element={
              <AuthGuard>
                <AppLayout>
                  <Notifications />
                </AppLayout>
              </AuthGuard>
            } />
            <Route path="/suppliers" element={
              <AuthGuard>
                <AppLayout>
                  <Suppliers />
                </AppLayout>
              </AuthGuard>
            } />
            <Route path="/suppliers-ultra-pro" element={
              <AuthGuard>
                <AppLayout>
                  <SuppliersUltraPro />
                </AppLayout>
              </AuthGuard>
            } />
            <Route path="/dashboard-ultra-pro" element={
              <AuthGuard>
                <AppLayout>
                  <DashboardUltraPro />
                </AppLayout>
              </AuthGuard>
            } />
            
            {/* Catch-all route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;