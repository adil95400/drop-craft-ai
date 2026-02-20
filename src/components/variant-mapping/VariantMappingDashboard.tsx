/**
 * Variant Mapping Dashboard
 * Interface principale pour gérer les mappings de variantes
 */
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { 
  useVariantMappings, 
  useVariantMappingStats,
  useDeleteVariantMapping,
  useDeleteBulkMappings
} from '@/hooks/useVariantMapping';
import { 
  Layers, Plus, Search, Trash2, Settings, Zap, 
  Palette, Ruler, Package, ArrowRight, CheckCircle,
  AlertCircle, RefreshCw, Download, Upload, Filter
} from 'lucide-react';
import { MappingTable } from './MappingTable';
import { MappingRulesPanel } from './MappingRulesPanel';
import { MappingTemplatesPanel } from './MappingTemplatesPanel';
import { CreateMappingDialog } from './CreateMappingDialog';
import { VariantAttributeDetector } from './VariantAttributeDetector';
import { VariantMatrix } from './VariantMatrix';
import { VariantStockSync } from './VariantStockSync';
import { VisualVariantMapper } from './VisualVariantMapper';
import { Skeleton } from '@/components/ui/skeleton';
import { Scan, Grid3X3, ArrowRightLeft, MousePointerClick } from 'lucide-react';

export function VariantMappingDashboard() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedMappings, setSelectedMappings] = useState<string[]>([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const { data: mappings = [], isLoading: isLoadingMappings } = useVariantMappings();
  const { data: stats, isLoading: isLoadingStats } = useVariantMappingStats();
  const deleteBulkMutation = useDeleteBulkMappings();

  // Filter mappings
  const filteredMappings = mappings.filter(m => {
    const matchesSearch = 
      m.source_option_value.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.target_option_value.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === 'all' || m.source_option_name.toLowerCase() === selectedType;
    return matchesSearch && matchesType;
  });

  // Get unique option types
  const optionTypes = [...new Set(mappings.map(m => m.source_option_name))];

  const handleBulkDelete = () => {
    if (selectedMappings.length === 0) return;
    deleteBulkMutation.mutate(selectedMappings, {
      onSuccess: () => setSelectedMappings([])
    });
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoadingStats ? (
          Array(4).fill(0).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-16 w-full" />
              </CardContent>
            </Card>
          ))
        ) : (
          <>
            <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/20">
                    <Layers className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats?.total_mappings || 0}</p>
                    <p className="text-xs text-muted-foreground">Mappings totaux</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-500/20">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats?.active_mappings || 0}</p>
                    <p className="text-xs text-muted-foreground">Mappings actifs</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-500/10 to-purple-500/5">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-500/20">
                    <Zap className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats?.total_rules || 0}</p>
                    <p className="text-xs text-muted-foreground">Règles auto</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-500/10 to-orange-500/5">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-orange-500/20">
                    <Package className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{optionTypes.length}</p>
                    <p className="text-xs text-muted-foreground">Types de variantes</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Main Content */}
      <Tabs defaultValue="visual" className="space-y-4">
        <div className="flex flex-col lg:flex-row justify-between gap-4">
          <TabsList className="flex-wrap h-auto">
            <TabsTrigger value="visual" className="gap-2">
              <MousePointerClick className="h-4 w-4" />
              Visuel D&D
            </TabsTrigger>
            <TabsTrigger value="mappings" className="gap-2">
              <Layers className="h-4 w-4" />
              Mappings
            </TabsTrigger>
            <TabsTrigger value="detector" className="gap-2">
              <Scan className="h-4 w-4" />
              Détection
            </TabsTrigger>
            <TabsTrigger value="matrix" className="gap-2">
              <Grid3X3 className="h-4 w-4" />
              Matrice
            </TabsTrigger>
            <TabsTrigger value="sync" className="gap-2">
              <ArrowRightLeft className="h-4 w-4" />
              Sync Stocks
            </TabsTrigger>
            <TabsTrigger value="rules" className="gap-2">
              <Zap className="h-4 w-4" />
              Règles
            </TabsTrigger>
            <TabsTrigger value="templates" className="gap-2">
              <Package className="h-4 w-4" />
              Templates
            </TabsTrigger>
          </TabsList>

          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Upload className="h-4 w-4 mr-2" />
              Importer
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Exporter
            </Button>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nouveau Mapping
            </Button>
          </div>
        </div>

        <TabsContent value="visual">
          <VisualVariantMapper />
        </TabsContent>

        <TabsContent value="mappings" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher un mapping..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <div className="flex gap-2 flex-wrap">
                  <Button 
                    variant={selectedType === 'all' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedType('all')}
                  >
                    Tous
                  </Button>
                  {optionTypes.map(type => (
                    <Button
                      key={type}
                      variant={selectedType === type.toLowerCase() ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedType(type.toLowerCase())}
                      className="gap-1"
                    >
                      {type.toLowerCase() === 'color' || type.toLowerCase() === 'couleur' ? (
                        <Palette className="h-3 w-3" />
                      ) : type.toLowerCase() === 'size' || type.toLowerCase() === 'taille' ? (
                        <Ruler className="h-3 w-3" />
                      ) : null}
                      {type}
                    </Button>
                  ))}
                </div>

                {selectedMappings.length > 0 && (
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={handleBulkDelete}
                    disabled={deleteBulkMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Supprimer ({selectedMappings.length})
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Mappings Table */}
          <MappingTable 
            mappings={filteredMappings}
            isLoading={isLoadingMappings}
            selectedMappings={selectedMappings}
            onSelectionChange={setSelectedMappings}
          />
        </TabsContent>

        <TabsContent value="detector">
          <VariantAttributeDetector />
        </TabsContent>

        <TabsContent value="matrix">
          <VariantMatrix />
        </TabsContent>

        <TabsContent value="sync">
          <VariantStockSync />
        </TabsContent>

        <TabsContent value="rules">
          <MappingRulesPanel />
        </TabsContent>

        <TabsContent value="templates">
          <MappingTemplatesPanel />
        </TabsContent>
      </Tabs>

      {/* Create Dialog */}
      <CreateMappingDialog 
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
      />
    </div>
  );
}
