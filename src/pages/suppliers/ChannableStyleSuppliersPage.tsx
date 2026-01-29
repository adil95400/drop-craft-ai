/**
 * Suppliers Page - Optimized & Modular
 * Refactored from 3800+ lines to ~300 lines
 */

import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, ArrowRight, Package, PlugZap, Bell, BarChart2, RefreshCcw, Sparkles 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useRealSuppliers, type Supplier } from '@/hooks/useRealSuppliers';
import { useSupplierRealtime } from '@/hooks/useSupplierRealtime';
import { useToast } from '@/hooks/use-toast';
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';
import { AdvancedSupplierAnalytics } from '@/components/suppliers/AdvancedSupplierAnalytics';
import { SupplierSyncManager } from '@/components/suppliers/SupplierSyncManager';

// Modular components
import { SupplierGridCard } from '@/components/suppliers/SupplierGridCard';
import { ConnectedSupplierCard } from '@/components/suppliers/ConnectedSupplierCard';
import { SupplierConfigModal } from '@/components/suppliers/SupplierConfigModal';
import { SupplierFilters } from '@/components/suppliers/SupplierFilters';
import { 
  ALL_SUPPLIER_DEFINITIONS, 
  SupplierDefinition,
  getSupplierStats 
} from '@/data/supplierDefinitions';

export default function ChannableStyleSuppliersPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { suppliers, addSupplier, deleteSupplier, isAdding } = useRealSuppliers();
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [selectedCountry, setSelectedCountry] = useState('all');
  const [selectedShippingZone, setSelectedShippingZone] = useState('all');
  const [sortBy, setSortBy] = useState<'popular' | 'name' | 'rating' | 'products'>('popular');
  const [selectedDefinition, setSelectedDefinition] = useState<SupplierDefinition | null>(null);
  const [activeTab, setActiveTab] = useState<'catalog' | 'analytics' | 'sync'>('catalog');
  
  // Realtime hook
  const { activeJobs, unreadNotifications, markAllAsRead } = useSupplierRealtime();
  const activeSyncJobs = Array.from(activeJobs.values());

  // Find connected supplier for a definition
  const findConnectedSupplier = useCallback((definitionId: string): Supplier | undefined => {
    return suppliers.find(s => 
      s.name?.toLowerCase() === definitionId.toLowerCase() ||
      s.name?.toLowerCase().includes(definitionId.toLowerCase())
    );
  }, [suppliers]);

  // Find definition for connected supplier
  const findDefinitionForSupplier = useCallback((supplier: Supplier): SupplierDefinition | undefined => {
    return ALL_SUPPLIER_DEFINITIONS.find(def => 
      def.id.toLowerCase() === supplier.name?.toLowerCase() ||
      def.name.toLowerCase() === supplier.name?.toLowerCase()
    );
  }, []);

  // Filtering and sorting
  const filteredSuppliers = useMemo(() => {
    let result = ALL_SUPPLIER_DEFINITIONS.filter(def => {
      const matchesSearch = def.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (def.description?.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesCategory = activeCategory === 'all' || def.category === activeCategory;
      const matchesCountry = selectedCountry === 'all' || def.country === selectedCountry;
      const matchesShippingZone = selectedShippingZone === 'all' || 
                                  def.shippingZones?.includes(selectedShippingZone as any);
      return matchesSearch && matchesCategory && matchesCountry && matchesShippingZone;
    });

    // Sort
    switch (sortBy) {
      case 'popular':
        result.sort((a, b) => (a.popular && !b.popular ? -1 : !a.popular && b.popular ? 1 : (b.rating || 0) - (a.rating || 0)));
        break;
      case 'name':
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'rating':
        result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case 'products':
        result.sort((a, b) => (b.productsCount || 0) - (a.productsCount || 0));
        break;
    }
    return result;
  }, [searchTerm, activeCategory, selectedCountry, selectedShippingZone, sortBy]);

  const handleConnect = useCallback((data: any) => {
    addSupplier(data);
    setSelectedDefinition(null);
    toast({ title: 'Fournisseur connecté', description: `${data.name} a été ajouté avec succès.` });
  }, [addSupplier, toast]);

  const handleResetFilters = useCallback(() => {
    setSearchTerm('');
    setActiveCategory('all');
    setSelectedCountry('all');
    setSelectedShippingZone('all');
  }, []);

  const stats = getSupplierStats();

  return (
    <ChannablePageWrapper
      title="Fournisseurs Dropshipping"
      subtitle="Hub Fournisseurs"
      description="Connectez-vous aux meilleurs fournisseurs dropshipping du monde."
      heroImage="suppliers"
      badge={{ label: `${stats.total}+ Fournisseurs Vérifiés`, icon: Sparkles }}
      actions={
        <div className="flex items-center gap-3">
          <Button onClick={() => setActiveCategory('all')} className="gap-2">
            <Plus className="h-4 w-4" />
            Ajouter un fournisseur
          </Button>
          <Button variant="outline" onClick={() => navigate('/suppliers/my')} className="gap-2 bg-background/80 backdrop-blur">
            Gérer mes fournisseurs
          </Button>
        </div>
      }
    >
      {/* Navigation Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="mb-6">
        <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid">
          <TabsTrigger value="catalog" className="gap-2">
            <Package className="w-4 h-4" />
            <span className="hidden sm:inline">Catalogue</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-2">
            <BarChart2 className="w-4 h-4" />
            <span className="hidden sm:inline">Analytics</span>
          </TabsTrigger>
          <TabsTrigger value="sync" className="gap-2 relative">
            <RefreshCcw className="w-4 h-4" />
            <span className="hidden sm:inline">Synchronisation</span>
            {activeSyncJobs.length > 0 && (
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            )}
          </TabsTrigger>
        </TabsList>
        
        {/* Notifications */}
        {unreadNotifications > 0 && (
          <div className="mt-4 p-3 bg-primary/10 border border-primary/20 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">{unreadNotifications} nouvelle{unreadNotifications > 1 ? 's' : ''} notification{unreadNotifications > 1 ? 's' : ''}</span>
            </div>
            <Button variant="ghost" size="sm" onClick={markAllAsRead}>Tout marquer comme lu</Button>
          </div>
        )}
        
        <TabsContent value="catalog" className="mt-6 space-y-8">
          {/* Connected Suppliers */}
          {suppliers.length > 0 && (
            <div className="mb-10">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <PlugZap className="w-5 h-5 text-green-500" />
                  Vos Fournisseurs ({suppliers.length})
                </h2>
                <Button variant="outline" size="sm" onClick={() => navigate('/suppliers/my')}>
                  Gérer tout <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {suppliers.slice(0, 4).map(supplier => (
                  <ConnectedSupplierCard
                    key={supplier.id}
                    supplier={supplier}
                    definition={findDefinitionForSupplier(supplier)}
                    onConfigure={() => {
                      const def = findDefinitionForSupplier(supplier);
                      if (def) setSelectedDefinition(def);
                    }}
                    onSync={() => setActiveTab('sync')}
                    onDelete={() => deleteSupplier(supplier.id)}
                    isSyncing={false}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Filters */}
          <SupplierFilters
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            activeCategory={activeCategory}
            onCategoryChange={setActiveCategory}
            selectedCountry={selectedCountry}
            onCountryChange={setSelectedCountry}
            selectedShippingZone={selectedShippingZone}
            onShippingZoneChange={setSelectedShippingZone}
            sortBy={sortBy}
            onSortChange={setSortBy}
            onResetFilters={handleResetFilters}
          />

          {/* Results */}
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-muted-foreground">
              {filteredSuppliers.length} fournisseur{filteredSuppliers.length > 1 ? 's' : ''} trouvé{filteredSuppliers.length > 1 ? 's' : ''}
            </p>
          </div>

          {/* Suppliers Grid */}
          <AnimatePresence mode="popLayout">
            <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredSuppliers.map(definition => (
                <SupplierGridCard
                  key={definition.id}
                  definition={definition}
                  isConnected={!!findConnectedSupplier(definition.id)}
                  onClick={() => setSelectedDefinition(definition)}
                />
              ))}
            </motion.div>
          </AnimatePresence>

          {filteredSuppliers.length === 0 && (
            <div className="text-center py-16">
              <Package className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Aucun fournisseur trouvé</h3>
              <p className="text-muted-foreground mb-4">Modifiez vos critères de recherche</p>
              <Button onClick={handleResetFilters}>Réinitialiser les filtres</Button>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="analytics" className="mt-6">
          <AdvancedSupplierAnalytics />
        </TabsContent>
        
        <TabsContent value="sync" className="mt-6">
          <SupplierSyncManager supplierId="" supplierName="Tous les fournisseurs" />
        </TabsContent>
      </Tabs>

      {/* Config Modal */}
      <Dialog open={!!selectedDefinition} onOpenChange={() => setSelectedDefinition(null)}>
        {selectedDefinition && (
          <SupplierConfigModal
            definition={selectedDefinition}
            existingSupplier={findConnectedSupplier(selectedDefinition.id)}
            onClose={() => setSelectedDefinition(null)}
            onConnect={handleConnect}
            isConnecting={isAdding}
          />
        )}
      </Dialog>
    </ChannablePageWrapper>
  );
}
