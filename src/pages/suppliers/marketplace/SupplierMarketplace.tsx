// MARKETPLACE FOURNISSEURS AMÉLIORÉE
// Design inspiré AutoDS/Spocket avec logos officiels et onboarding

import { useState, memo, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, Filter, Grid, List, Package, Star, Zap, 
  Globe, TrendingUp, CheckCircle2, ArrowRight, Sparkles
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SupplierConnectionDialog } from "./SupplierConnectionDialog";
import { RealSupplierStats } from "./RealSupplierStats";
import { SupplierMarketplaceCard } from "@/components/suppliers/SupplierMarketplaceCard";
import { useRealSuppliers } from "@/hooks/useRealSuppliers";
import { useSupplierEcosystem } from "@/hooks/useSupplierEcosystem";
import { MARKETPLACE_TEMPLATES, getMarketplacesByType } from "@/data/marketplaceTemplates";
import { AddCJCredentialsButton } from "../AddCJCredentialsButton";
import { cn } from "@/lib/utils";
import type { BaseSupplier } from "@/types/suppliers";

interface SupplierMarketplaceProps {
  isPremiumOnly?: boolean;
}

// Onboarding Banner Component
const OnboardingBanner = memo(({ onDismiss }: { onDismiss: () => void }) => (
  <motion.div
    initial={{ opacity: 0, y: -20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
  >
    <Card className="bg-gradient-to-r from-primary/10 via-purple-500/10 to-pink-500/10 border-primary/20">
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-primary/20">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Bienvenue sur le Marketplace</h3>
              <p className="text-muted-foreground text-sm mt-1">
                Connectez vos fournisseurs préférés en 1 clic et importez des produits gagnants instantanément
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                <Badge variant="secondary" className="text-xs">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  50+ fournisseurs
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  <Zap className="h-3 w-3 mr-1" />
                  Import 1-clic
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  <Globe className="h-3 w-3 mr-1" />
                  EU & Mondial
                </Badge>
              </div>
            </div>
          </div>
          <Button onClick={onDismiss} variant="outline" size="sm">
            Compris
          </Button>
        </div>
      </CardContent>
    </Card>
  </motion.div>
));

OnboardingBanner.displayName = 'OnboardingBanner';

export function SupplierMarketplace({ isPremiumOnly = false }: SupplierMarketplaceProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedSupplier, setSelectedSupplier] = useState<BaseSupplier | null>(null);
  const [connectionDialogOpen, setConnectionDialogOpen] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(true);

  const { suppliers: userSuppliers } = useRealSuppliers();
  const { disconnectSupplier, isDisconnecting } = useSupplierEcosystem();

  // Merge template suppliers with user connected suppliers
  const allSuppliers = useMemo(() => {
    return MARKETPLACE_TEMPLATES.map(template => {
      const userSupplier = userSuppliers.find(s => 
        s.name.toLowerCase() === template.id.toLowerCase()
      );
      return {
        ...template,
        status: userSupplier ? 'connected' : 'active'
      } as BaseSupplier;
    });
  }, [userSuppliers]);

  // Filtrage amélioré
  const filteredSuppliers = useMemo(() => {
    return allSuppliers.filter(supplier => {
      const matchesSearch = supplier.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           supplier.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = selectedType === "all" || 
                         (supplier as any).type === selectedType ||
                         supplier.category === selectedType;
      return matchesSearch && matchesType;
    });
  }, [allSuppliers, searchQuery, selectedType]);

  // Stats
  const stats = useMemo(() => ({
    total: allSuppliers.length,
    connected: allSuppliers.filter(s => s.status === 'connected').length,
    suppliers: getMarketplacesByType('supplier').length,
    marketplaces: getMarketplacesByType('marketplace').length,
  }), [allSuppliers]);

  const handleConnect = (supplier: BaseSupplier) => {
    setSelectedSupplier(supplier);
    setConnectionDialogOpen(true);
  };

  const handleDisconnect = (supplierId: string) => {
    if (confirm('Êtes-vous sûr de vouloir déconnecter ce fournisseur ?')) {
      disconnectSupplier(supplierId);
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-primary to-purple-600">
              <Package className="h-6 w-6 text-white" />
            </div>
            {isPremiumOnly ? "Fournisseurs Premium" : "Marketplace"}
          </h1>
          <p className="text-muted-foreground mt-1">
            Connectez-vous aux meilleurs fournisseurs et marketplaces
          </p>
        </div>
        
        <div className="flex gap-2">
          <AddCJCredentialsButton />
          <Button variant="outline">
            <TrendingUp className="h-4 w-4 mr-2" />
            Tendances
          </Button>
        </div>
      </div>

      {/* Onboarding */}
      <AnimatePresence>
        {showOnboarding && (
          <OnboardingBanner onDismiss={() => setShowOnboarding(false)} />
        )}
      </AnimatePresence>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-primary">{stats.total}</p>
            <p className="text-sm text-muted-foreground">Total</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-green-600">{stats.connected}</p>
            <p className="text-sm text-muted-foreground">Connectés</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-blue-600">{stats.suppliers}</p>
            <p className="text-sm text-muted-foreground">Fournisseurs</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-purple-600">{stats.marketplaces}</p>
            <p className="text-sm text-muted-foreground">Marketplaces</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un fournisseur ou marketplace..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={viewMode === "grid" ? "default" : "outline"}
            size="icon"
            onClick={() => setViewMode("grid")}
          >
            <Grid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "outline"}
            size="icon"
            onClick={() => setViewMode("list")}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Type Tabs */}
      <Tabs value={selectedType} onValueChange={setSelectedType}>
        <TabsList className="w-full justify-start overflow-x-auto flex-nowrap">
          <TabsTrigger value="all">Tous</TabsTrigger>
          <TabsTrigger value="supplier">Fournisseurs</TabsTrigger>
          <TabsTrigger value="marketplace">Marketplaces</TabsTrigger>
          <TabsTrigger value="platform">Plateformes</TabsTrigger>
          <TabsTrigger value="dropshipping">Dropshipping</TabsTrigger>
          <TabsTrigger value="print-on-demand">POD</TabsTrigger>
        </TabsList>

        <TabsContent value={selectedType} className="mt-6">
          <motion.div 
            className={cn(
              "grid gap-4",
              viewMode === "grid" 
                ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                : "grid-cols-1"
            )}
            layout
          >
            <AnimatePresence mode="popLayout">
              {filteredSuppliers.map(supplier => {
                const userSupplier = userSuppliers.find(s => 
                  s.name.toLowerCase() === supplier.id.toLowerCase()
                );
                return (
                  <SupplierMarketplaceCard
                    key={supplier.id}
                    supplier={supplier}
                    viewMode={viewMode}
                    onConnect={() => handleConnect(supplier)}
                    onDisconnect={userSupplier ? () => handleDisconnect(userSupplier.id) : undefined}
                  />
                );
              })}
            </AnimatePresence>
          </motion.div>

          {filteredSuppliers.length === 0 && (
            <div className="text-center py-12">
              <Filter className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                Aucun fournisseur trouvé avec ces critères
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Connection Dialog */}
      <SupplierConnectionDialog
        supplier={selectedSupplier}
        open={connectionDialogOpen}
        onOpenChange={setConnectionDialogOpen}
      />
    </div>
  );
}
