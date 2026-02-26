/**
 * Category Mapping Dashboard
 * Interface principale de gestion du mapping de catégories
 * Phase 2: Ajout de l'onglet IA
 */
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, 
  Play, 
  Trash2, 
  Settings2,
  FolderTree,
  Package,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  Brain,
} from 'lucide-react';
import { 
  useCategoryMappings, 
  useCategoryMappingStats,
  useUpdateCategoryMapping,
  useDeleteCategoryMapping,
  useApplyCategoryMapping,
} from '@/hooks/useCategoryMapping';
import { CreateMappingDialog } from './CreateMappingDialog';
import { MappingRulesEditor } from './MappingRulesEditor';
import { CategoryMappingAIPanel } from './CategoryMappingAIPanel';
import { CategoryMapping } from '@/services/CategoryMappingService';
import { formatDistanceToNow } from 'date-fns';
import { getDateFnsLocale } from '@/utils/dateFnsLocale';

const destinationLabels: Record<string, string> = {
  google: 'Google Shopping',
  facebook: 'Facebook/Meta',
  shopify: 'Shopify',
  custom: 'Personnalisé',
};

const sourceLabels: Record<string, string> = {
  supplier: 'Fournisseur',
  import: 'Import',
  manual: 'Manuel',
};

export function CategoryMappingDashboard() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedMapping, setSelectedMapping] = useState<CategoryMapping | null>(null);
  const [editingMapping, setEditingMapping] = useState<CategoryMapping | null>(null);

  const { data: mappings = [], isLoading } = useCategoryMappings();
  const { data: stats } = useCategoryMappingStats();
  const updateMapping = useUpdateCategoryMapping();
  const deleteMapping = useDeleteCategoryMapping();
  const applyMapping = useApplyCategoryMapping();

  const handleToggle = (mappingId: string, isActive: boolean) => {
    updateMapping.mutate({ mappingId, updates: { is_active: isActive } });
  };

  const handleDelete = (mappingId: string) => {
    if (confirm('Supprimer ce mapping ?')) {
      deleteMapping.mutate(mappingId);
    }
  };

  const handleApply = (mappingId: string) => {
    applyMapping.mutate(mappingId);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Category Mapping</h1>
          <p className="text-muted-foreground">
            Mappez vos catégories vers les taxonomies des plateformes
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nouveau mapping
        </Button>
      </div>

      <Tabs defaultValue="ai" className="space-y-6">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="ai" className="gap-2">
            <Brain className="h-4 w-4" />
            Intelligence IA
          </TabsTrigger>
          <TabsTrigger value="mappings" className="gap-2">
            <FolderTree className="h-4 w-4" />
            Mappings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ai" className="space-y-6">
          <CategoryMappingAIPanel />
        </TabsContent>

        <TabsContent value="mappings" className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <FolderTree className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats?.totalMappings || 0}</p>
                    <p className="text-sm text-muted-foreground">Mappings totaux</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-green-500/10 rounded-lg">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats?.activeMappings || 0}</p>
                    <p className="text-sm text-muted-foreground">Mappings actifs</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-blue-500/10 rounded-lg">
                    <Package className="h-5 w-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats?.totalProductsMapped || 0}</p>
                    <p className="text-sm text-muted-foreground">Produits mappés</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-orange-500/10 rounded-lg">
                    <Sparkles className="h-5 w-5 text-orange-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats?.pendingSuggestions || 0}</p>
                    <p className="text-sm text-muted-foreground">Suggestions IA</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

      {/* Mappings List */}
      {isLoading ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            Chargement...
          </CardContent>
        </Card>
      ) : mappings.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center">
            <FolderTree className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-medium mb-2">Aucun mapping</h3>
            <p className="text-muted-foreground mb-4">
              Créez votre premier mapping de catégories
            </p>
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Créer un mapping
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {mappings.map((mapping) => (
            <Card key={mapping.id} className={!mapping.is_active ? 'opacity-60' : ''}>
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Switch
                      checked={mapping.is_active}
                      onCheckedChange={(checked) => handleToggle(mapping.id, checked)}
                    />
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium">{mapping.name}</h3>
                        <Badge variant="outline">
                          {sourceLabels[mapping.source_type] || mapping.source_type}
                        </Badge>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        <Badge variant="secondary">
                          {destinationLabels[mapping.destination_type] || mapping.destination_type}
                        </Badge>
                      </div>
                      {mapping.description && (
                        <p className="text-sm text-muted-foreground">{mapping.description}</p>
                      )}
                      <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                        <span>{mapping.mappings.length} règle(s)</span>
                        <span>{mapping.products_mapped} produits</span>
                        {mapping.last_applied_at && (
                          <span>
                            Appliqué: {formatDistanceToNow(new Date(mapping.last_applied_at), { addSuffix: true, locale: getDateFnsLocale() })}
                          </span>
                        )}
                        {mapping.auto_map_enabled && (
                          <Badge variant="outline" className="text-xs">
                            <Sparkles className="h-3 w-3 mr-1" />
                            Auto-map
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleApply(mapping.id)}
                      disabled={!mapping.is_active || applyMapping.isPending}
                    >
                      <Play className="h-4 w-4 mr-1" />
                      Appliquer
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setEditingMapping(mapping)}
                    >
                      <Settings2 className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(mapping.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <CreateMappingDialog 
        open={isCreateOpen} 
        onOpenChange={setIsCreateOpen}
      />

      {editingMapping && (
        <MappingRulesEditor
          mapping={editingMapping}
          open={!!editingMapping}
          onOpenChange={() => setEditingMapping(null)}
        />
      )}
    </div>
  );
}
