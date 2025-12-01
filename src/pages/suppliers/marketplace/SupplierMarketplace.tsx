import { useState } from "react";
import { Search, Filter, Grid, List } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SupplierCard } from "./SupplierCard";
import { SupplierConnectionDialog } from "./SupplierConnectionDialog";
import { RealSupplierStats } from "./RealSupplierStats";
import { useRealSuppliers } from "@/hooks/useRealSuppliers";
import { useSupplierEcosystem } from "@/hooks/useSupplierEcosystem";
import { SUPPLIER_TEMPLATES } from "@/data/supplierTemplates";
import type { BaseSupplier } from "@/types/suppliers";

interface SupplierMarketplaceProps {
  isPremiumOnly?: boolean;
}

export function SupplierMarketplace({ isPremiumOnly = false }: SupplierMarketplaceProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedSupplier, setSelectedSupplier] = useState<BaseSupplier | null>(null);
  const [connectionDialogOpen, setConnectionDialogOpen] = useState(false);

  const { suppliers: userSuppliers } = useRealSuppliers();
  const { disconnectSupplier, isDisconnecting } = useSupplierEcosystem();

  // Merge template suppliers with user connected suppliers
  const allSuppliers = SUPPLIER_TEMPLATES.map(template => {
    const userSupplier = userSuppliers.find(s => s.name.toLowerCase() === template.id);
    return {
      ...template,
      status: userSupplier ? 'connected' : 'active'
    } as BaseSupplier;
  });

  const filteredSuppliers = allSuppliers.filter(supplier => {
    const matchesSearch = supplier.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         supplier.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || supplier.category === selectedCategory;
    const matchesPremium = !isPremiumOnly || supplier.category === "premium"; // Filtre premium
    return matchesSearch && matchesCategory && matchesPremium;
  });

  const categories = ["all", ...Array.from(new Set(SUPPLIER_TEMPLATES.map(s => s.category)))];

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
    <div className="space-y-4 sm:space-y-6 p-3 sm:p-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">
          {isPremiumOnly ? "Fournisseurs Premium" : "Marketplace"}
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1 sm:mt-2">
          {isPremiumOnly 
            ? "Fournisseurs premium avec produits de haute qualité"
            : "Connectez-vous aux meilleurs fournisseurs"
          }
        </p>
      </div>

      {/* Real-time Stats */}
      <RealSupplierStats />

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher..."
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
            className="flex-1 sm:flex-none"
          >
            <Grid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "outline"}
            size="icon"
            onClick={() => setViewMode("list")}
            className="flex-1 sm:flex-none"
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Category Tabs */}
      <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
        <TabsList className="w-full justify-start overflow-x-auto">
          {categories.map(cat => (
            <TabsTrigger key={cat} value={cat} className="capitalize text-xs sm:text-sm">
              {cat === "all" ? "Tous" : cat}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={selectedCategory} className="mt-4 sm:mt-6">
          <div className={
            viewMode === "grid" 
              ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6"
              : "space-y-3 sm:space-y-4"
          }>
            {filteredSuppliers.map(supplier => {
              const userSupplier = userSuppliers.find(s => s.name.toLowerCase() === supplier.id);
              return (
                <SupplierCard
                  key={supplier.id}
                  supplier={supplier}
                  viewMode={viewMode}
                  onConnect={() => handleConnect(supplier)}
                  onDisconnect={userSupplier ? () => handleDisconnect(userSupplier.id) : undefined}
                />
              );
            })}
          </div>

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
