import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, Grid3x3, List } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ModuleCard } from '@/components/modules/ModuleCard';
import { Breadcrumbs } from '@/components/navigation/Breadcrumbs';
import { MODULE_REGISTRY } from '@/config/modules';
import { getAllCategories } from '@/config/module-categories';
import { useUnifiedPlan } from '@/lib/unified-plan-system';
import { useModules } from '@/hooks/useModules';
import type { PlanType } from '@/hooks/usePlan';

export default function ModulesOverview() {
  const navigate = useNavigate();
  const { currentPlan, hasPlan } = useUnifiedPlan();
  const { canAccess, isModuleEnabled } = useModules();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPlan, setSelectedPlan] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const categories = getAllCategories();
  const modules = Object.values(MODULE_REGISTRY).sort((a, b) => a.order - b.order);

  // Filter modules
  const filteredModules = useMemo(() => {
    return modules.filter(module => {
      // Search filter
      const matchesSearch = searchQuery === '' || 
        module.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        module.description.toLowerCase().includes(searchQuery.toLowerCase());

      // Category filter
      const matchesCategory = selectedCategory === 'all' || module.category === selectedCategory;

      // Plan filter
      const matchesPlan = selectedPlan === 'all' || module.minPlan === selectedPlan;

      return matchesSearch && matchesCategory && matchesPlan;
    });
  }, [modules, searchQuery, selectedCategory, selectedPlan]);

  // Group modules by category
  const modulesByCategory = useMemo(() => {
    const grouped: Record<string, typeof modules> = {};
    
    filteredModules.forEach(module => {
      if (!grouped[module.category]) {
        grouped[module.category] = [];
      }
      grouped[module.category].push(module);
    });

    return grouped;
  }, [filteredModules]);

  // Statistics
  const stats = useMemo(() => {
    const accessible = modules.filter(m => canAccess(m.id)).length;
    const enabled = modules.filter(m => isModuleEnabled(m.id)).length;
    
    return {
      total: modules.length,
      accessible,
      enabled,
      locked: modules.length - accessible
    };
  }, [modules, canAccess, isModuleEnabled]);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-6 space-y-6">
        {/* Breadcrumbs */}
        <Breadcrumbs 
          items={[
            { label: 'Accueil', href: '/' },
            { label: 'Modules', isActive: true }
          ]}
        />

        {/* Header */}
        <div className="flex flex-col gap-4">
          <div>
            <h1 className="text-3xl font-bold">Tous les Modules</h1>
            <p className="text-muted-foreground mt-1">
              Gérez et explorez tous les modules disponibles dans votre plan
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="border rounded-lg p-4 bg-card">
              <div className="text-2xl font-bold">{stats.total}</div>
              <div className="text-sm text-muted-foreground">Total modules</div>
            </div>
            <div className="border rounded-lg p-4 bg-card">
              <div className="text-2xl font-bold text-primary">{stats.accessible}</div>
              <div className="text-sm text-muted-foreground">Accessibles</div>
            </div>
            <div className="border rounded-lg p-4 bg-card">
              <div className="text-2xl font-bold text-green-500">{stats.enabled}</div>
              <div className="text-sm text-muted-foreground">Activés</div>
            </div>
            <div className="border rounded-lg p-4 bg-card">
              <div className="text-2xl font-bold text-muted-foreground">{stats.locked}</div>
              <div className="text-sm text-muted-foreground">Verrouillés</div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher un module..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full md:w-[200px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Catégorie" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes catégories</SelectItem>
              {categories.map(cat => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedPlan} onValueChange={setSelectedPlan}>
            <SelectTrigger className="w-full md:w-[200px]">
              <SelectValue placeholder="Plan" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les plans</SelectItem>
              <SelectItem value="standard">Standard</SelectItem>
              <SelectItem value="pro">Pro</SelectItem>
              <SelectItem value="ultra_pro">Ultra Pro</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex gap-2">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="icon"
              onClick={() => setViewMode('grid')}
            >
              <Grid3x3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="icon"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Current Plan Badge */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Plan actuel:</span>
          <Badge variant={currentPlan === 'ultra_pro' ? 'default' : 'secondary'}>
            {currentPlan === 'standard' ? 'Standard' : currentPlan === 'pro' ? 'Pro' : 'Ultra Pro'}
          </Badge>
        </div>

        {/* Modules Display */}
        <Tabs defaultValue="all" className="w-full">
          <TabsList>
            <TabsTrigger value="all">
              Tous ({filteredModules.length})
            </TabsTrigger>
            <TabsTrigger value="accessible">
              Accessibles ({stats.accessible})
            </TabsTrigger>
            <TabsTrigger value="locked">
              Verrouillés ({stats.locked})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-6">
            {selectedCategory === 'all' ? (
              // Show grouped by category
              <div className="space-y-8">
                {categories.map(category => {
                  const categoryModules = modulesByCategory[category.id];
                  if (!categoryModules || categoryModules.length === 0) return null;

                  return (
                    <div key={category.id}>
                      <div className="mb-4">
                        <h2 className="text-2xl font-semibold">{category.name}</h2>
                        <p className="text-sm text-muted-foreground">{category.description}</p>
                      </div>
                      <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
                        {categoryModules.map(module => (
                          <ModuleCard
                            key={module.id}
                            module={module}
                            currentPlan={currentPlan}
                            isAccessible={canAccess(module.id)}
                            isEnabled={isModuleEnabled(module.id)}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              // Show filtered modules
              <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
                {filteredModules.map(module => (
                  <ModuleCard
                    key={module.id}
                    module={module}
                    currentPlan={currentPlan}
                    isAccessible={canAccess(module.id)}
                    isEnabled={isModuleEnabled(module.id)}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="accessible" className="mt-6">
            <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
              {filteredModules
                .filter(module => canAccess(module.id))
                .map(module => (
                  <ModuleCard
                    key={module.id}
                    module={module}
                    currentPlan={currentPlan}
                    isAccessible={true}
                    isEnabled={isModuleEnabled(module.id)}
                  />
                ))}
            </div>
          </TabsContent>

          <TabsContent value="locked" className="mt-6">
            <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
              {filteredModules
                .filter(module => !canAccess(module.id))
                .map(module => (
                  <ModuleCard
                    key={module.id}
                    module={module}
                    currentPlan={currentPlan}
                    isAccessible={false}
                    isEnabled={false}
                  />
                ))}
            </div>
          </TabsContent>
        </Tabs>

        {filteredModules.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Aucun module trouvé</p>
          </div>
        )}
      </div>
    </div>
  );
}
