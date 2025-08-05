import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/import" element={<Import />} />
          <Route path="/catalogue" element={<Catalogue />} />
          <Route path="/marketplace" element={<Marketplace />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/crm" element={<CRM />} />
          <Route path="/tracking" element={<Tracking />} />
          <Route path="/reviews" element={<Reviews />} />
          <Route path="/seo" element={<SEO />} />
          <Route path="/marketing" element={<Marketing />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/automation" element={<Automation />} />
          <Route path="/plugins" element={<Plugins />} />
          <Route path="/extension" element={<Extension />} />
          <Route path="/mobile" element={<Mobile />} />
          <Route path="/integrations" element={<Integrations />} />
          <Route path="/support" element={<Support />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/stock" element={<Stock />} />
          <Route path="/winners" element={<Winners />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/admin" element={<Admin />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
