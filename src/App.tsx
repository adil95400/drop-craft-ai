import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Import from "./pages/Import";
import Catalogue from "./pages/Catalogue";
import Tracking from "./pages/Tracking";
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
import InventoryUltraPro from "./pages/InventoryUltraPro";
import OrdersUltraPro from "./pages/OrdersUltraPro";
import SuppliersUltraPro from "./pages/SuppliersUltraPro";
import CRMUltraPro from "./pages/CRMUltraPro";
import CRMProspectsUltraPro from "./pages/CRMProspectsUltraPro";
import SuiviEnTransitUltraPro from "./pages/SuiviEnTransitUltraPro";
import AvisPositifUltraPro from "./pages/AvisPositifUltraPro";
import AutomationUltraPro from "./pages/AutomationUltraPro";
import BlogUltraPro from "./pages/BlogUltraPro";
import SEOUltraPro from "./pages/SEOUltraPro";
import SecurityUltraPro from "./pages/SecurityUltraPro";
import SupportUltraPro from "./pages/SupportUltraPro";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
        <Routes>
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
          <Route path="/dashboard" element={
            <AuthGuard>
              <Dashboard />
            </AuthGuard>
          } />
          <Route path="/import" element={
            <AuthGuard>
              <Import />
            </AuthGuard>
          } />
          <Route path="/catalogue" element={
            <AuthGuard>
              <Catalogue />
            </AuthGuard>
          } />
          <Route path="/marketplace" element={
            <AuthGuard>
              <Marketplace />
            </AuthGuard>
          } />
          <Route path="/orders" element={
            <AuthGuard>
              <Orders />
            </AuthGuard>
          } />
          <Route path="/crm" element={
            <AuthGuard>
              <CRM />
            </AuthGuard>
          } />
          <Route path="/tracking" element={
            <AuthGuard>
              <Tracking />
            </AuthGuard>
          } />
          <Route path="/reviews" element={
            <AuthGuard>
              <Reviews />
            </AuthGuard>
          } />
          <Route path="/seo" element={
            <AuthGuard>
              <SEO />
            </AuthGuard>
          } />
          <Route path="/marketing" element={
            <AuthGuard>
              <Marketing />
            </AuthGuard>
          } />
          <Route path="/inventory" element={
            <AuthGuard>
              <Inventory />
            </AuthGuard>
          } />
          <Route path="/automation" element={
            <AuthGuard>
              <Automation />
            </AuthGuard>
          } />
          <Route path="/plugins" element={
            <AuthGuard>
              <Plugins />
            </AuthGuard>
          } />
          <Route path="/extension" element={
            <AuthGuard>
              <Extension />
            </AuthGuard>
          } />
          <Route path="/mobile" element={
            <AuthGuard>
              <Mobile />
            </AuthGuard>
          } />
          <Route path="/integrations" element={
            <AuthGuard>
              <Integrations />
            </AuthGuard>
          } />
          <Route path="/support" element={
            <AuthGuard>
              <Support />
            </AuthGuard>
          } />
          <Route path="/analytics" element={
            <AuthGuard>
              <Analytics />
            </AuthGuard>
          } />
          <Route path="/stock" element={
            <AuthGuard>
              <Stock />
            </AuthGuard>
          } />
          <Route path="/winners" element={
            <AuthGuard>
              <Winners />
            </AuthGuard>
          } />
          <Route path="/blog" element={
            <AuthGuard>
              <Blog />
            </AuthGuard>
          } />
          <Route path="/settings" element={
            <AuthGuard>
              <Settings />
            </AuthGuard>
          } />
          <Route path="/admin" element={
            <AuthGuard>
              <Admin />
            </AuthGuard>
          } />
          <Route path="/faq" element={
            <AuthGuard>
              <FAQ />
            </AuthGuard>
          } />
          <Route path="/security" element={
            <AuthGuard>
              <Security />
            </AuthGuard>
          } />
          <Route path="/notifications" element={
            <AuthGuard>
              <Notifications />
            </AuthGuard>
          } />
          {/* CRM Routes */}
          <Route path="/crm/leads" element={
            <AuthGuard>
              <CRMLeads />
            </AuthGuard>
          } />
          <Route path="/crm/activity" element={
            <AuthGuard>
              <CRMActivity />
            </AuthGuard>
          } />
          <Route path="/crm/calendar" element={
            <AuthGuard>
              <CRMCalendar />
            </AuthGuard>
          } />
          <Route path="/crm/emails" element={
            <AuthGuard>
              <CRMEmails />
            </AuthGuard>
          } />
          <Route path="/crm/calls" element={
            <AuthGuard>
              <CRMCalls />
            </AuthGuard>
          } />
          {/* Tracking Routes */}
          <Route path="/tracking/in-transit" element={
            <AuthGuard>
              <TrackingInTransit />
            </AuthGuard>
          } />
          <Route path="/tracking/today" element={
            <AuthGuard>
              <TrackingToday />
            </AuthGuard>
          } />
          {/* Ultra Pro Routes */}
          <Route path="/reviews-ultra-pro" element={
            <AuthGuard>
              <ReviewsUltraPro />
            </AuthGuard>
          } />
          <Route path="/analytics-ultra-pro" element={
            <AuthGuard>
              <AnalyticsUltraPro />
            </AuthGuard>
          } />
          <Route path="/marketing-ultra-pro" element={
            <AuthGuard>
              <MarketingUltraPro />
            </AuthGuard>
          } />
          <Route path="/dashboard-ultra-pro" element={
            <AuthGuard>
              <DashboardUltraPro />
            </AuthGuard>
          } />
          <Route path="/inventory-ultra-pro" element={
            <AuthGuard>
              <InventoryUltraPro />
            </AuthGuard>
          } />
          <Route path="/orders-ultra-pro" element={
            <AuthGuard>
              <OrdersUltraPro />
            </AuthGuard>
          } />
          <Route path="/suppliers-ultra-pro" element={
            <AuthGuard>
              <SuppliersUltraPro />
            </AuthGuard>
          } />
          <Route path="/crm-ultra-pro" element={
            <AuthGuard>
              <CRMUltraPro />
            </AuthGuard>
          } />
          <Route path="/crm/prospects-ultra-pro" element={
            <AuthGuard>
              <CRMProspectsUltraPro />
            </AuthGuard>
          } />
          <Route path="/suivi/en-transit-ultra-pro" element={
            <AuthGuard>
              <SuiviEnTransitUltraPro />
            </AuthGuard>
          } />
          <Route path="/avis/positif-ultra-pro" element={
            <AuthGuard>
              <AvisPositifUltraPro />
            </AuthGuard>
          } />
          <Route path="/automation/ultra-pro" element={
            <AuthGuard>
              <AutomationUltraPro />
            </AuthGuard>
          } />
          <Route path="/blog/ultra-pro" element={
            <AuthGuard>
              <BlogUltraPro />
            </AuthGuard>
          } />
          <Route path="/seo/ultra-pro" element={
            <AuthGuard>
              <SEOUltraPro />
            </AuthGuard>
          } />
          <Route path="/security/ultra-pro" element={
            <AuthGuard>
              <SecurityUltraPro />
            </AuthGuard>
          } />
          <Route path="/support/ultra-pro" element={
            <AuthGuard>
              <SupportUltraPro />
            </AuthGuard>
          } />
          <Route path="/dashboard/ultra-pro" element={
            <AuthGuard>
              <DashboardUltraPro />
            </AuthGuard>
          } />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
