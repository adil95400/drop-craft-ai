import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Import from "./pages/Import";
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
          <Route path="/marketplace" element={<Marketplace />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/automation" element={<Automation />} />
          <Route path="/integrations" element={<Integrations />} />
          <Route path="/crm" element={<CRM />} />
          <Route path="/reviews" element={<Reviews />} />
          <Route path="/seo" element={<SEO />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/stock" element={<Stock />} />
          <Route path="/tracking" element={<Tracking />} />
          <Route path="/winners" element={<Winners />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/settings" element={<Settings />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
