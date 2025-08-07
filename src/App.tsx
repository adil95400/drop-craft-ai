import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthGuard } from "@/components/auth/AuthGuard";
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
import Notifications from "./pages/Notifications";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
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
          <Route path="/notifications" element={
            <AuthGuard>
              <Notifications />
            </AuthGuard>
          } />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
