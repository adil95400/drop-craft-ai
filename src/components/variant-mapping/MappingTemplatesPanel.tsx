/**
 * Mapping Templates Panel
 * Templates prédéfinis pour le mapping rapide
 */
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  useVariantMappingTemplates,
  useApplyTemplate,
  useCreateTemplate
} from '@/hooks/useVariantMapping';
import { 
  Package, Plus, Download, Palette, Ruler, Globe,
  Star, CheckCircle, Loader2, ArrowRight, Sparkles
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export function MappingTemplatesPanel() {
  const [showApplyDialog, setShowApplyDialog] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    description: '',
    option_type: 'size',
    mappings: [{ source: '', target: '' }]
  });

  const { data: templates = [], isLoading } = useVariantMappingTemplates();
  const applyMutation = useApplyTemplate();
  const createMutation = useCreateTemplate();

  const globalTemplates = templates.filter(t => t.is_global);
  const userTemplates = templates.filter(t => !t.is_global);

  const handleApply = () => {
    if (!selectedTemplate) return;
    applyMutation.mutate({ templateId: selectedTemplate.id }, {
      onSuccess: () => {
        setShowApplyDialog(false);
        setSelectedTemplate(null);
      }
    });
  };

  const handleCreateTemplate = () => {
    const validMappings = newTemplate.mappings.filter(m => m.source && m.target);
    if (!newTemplate.name || validMappings.length === 0) return;

    createMutation.mutate({
      ...newTemplate,
      mappings: validMappings
    }, {
      onSuccess: () => {
        setShowCreateDialog(false);
        setNewTemplate({
          name: '',
          description: '',
          option_type: 'size',
          mappings: [{ source: '', target: '' }]
        });
      }
    });
  };

  const addMappingRow = () => {
    setNewTemplate({
      ...newTemplate,
      mappings: [...newTemplate.mappings, { source: '', target: '' }]
    });
  };

  const updateMappingRow = (index: number, field: 'source' | 'target', value: string) => {
    const updated = [...newTemplate.mappings];
    updated[index][field] = value;
    setNewTemplate({ ...newTemplate, mappings: updated });
  };

  const getTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'color':
      case 'couleur':
        return <Palette className="h-4 w-4 text-pink-500" />;
      case 'size':
      case 'taille':
        return <Ruler className="h-4 w-4 text-blue-500" />;
      default:
        return <Package className="h-4 w-4 text-gray-500" />;
    }
  };

  if (isLoading) {
    return (
      <div className="grid md:grid-cols-2 gap-4">
        {Array(4).fill(0).map((_, i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            Templates de Mapping
          </h3>
          <p className="text-sm text-muted-foreground">
            Appliquez des templates prédéfinis pour un mapping rapide
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Créer un Template
        </Button>
      </div>

      {/* Global Templates */}
      <div>
        <h4 className="font-medium mb-3 flex items-center gap-2">
          <Globe className="h-4 w-4" />
          Templates Globaux
          <Badge variant="secondary">{globalTemplates.length}</Badge>
        </h4>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {globalTemplates.map((template) => (
            <Card 
              key={template.id} 
              className="cursor-pointer hover:border-primary transition-colors"
              onClick={() => {
                setSelectedTemplate(template);
                setShowApplyDialog(true);
              }}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {getTypeIcon(template.option_type)}
                    <h5 className="font-medium">{template.name}</h5>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    <Star className="h-3 w-3 mr-1" />
                    {template.usage_count}
                  </Badge>
                </div>
                {template.description && (
                  <p className="text-sm text-muted-foreground mb-3">
                    {template.description}
                  </p>
                )}
                <div className="flex flex-wrap gap-1">
                  {(template.mappings as any[]).slice(0, 4).map((m, i) => (
                    <Badge key={i} variant="secondary" className="text-xs font-mono">
                      {m.source}→{m.target}
                    </Badge>
                  ))}
                  {(template.mappings as any[]).length > 4 && (
                    <Badge variant="secondary" className="text-xs">
                      +{(template.mappings as any[]).length - 4}
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* User Templates */}
      {userTemplates.length > 0 && (
        <div>
          <h4 className="font-medium mb-3 flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Mes Templates
            <Badge variant="secondary">{userTemplates.length}</Badge>
          </h4>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {userTemplates.map((template) => (
              <Card 
                key={template.id} 
                className="cursor-pointer hover:border-primary transition-colors"
                onClick={() => {
                  setSelectedTemplate(template);
                  setShowApplyDialog(true);
                }}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {getTypeIcon(template.option_type)}
                      <h5 className="font-medium">{template.name}</h5>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {(template.mappings as any[]).slice(0, 4).map((m, i) => (
                      <Badge key={i} variant="secondary" className="text-xs font-mono">
                        {m.source}→{m.target}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Apply Template Dialog */}
      <Dialog open={showApplyDialog} onOpenChange={setShowApplyDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Appliquer le Template</DialogTitle>
          </DialogHeader>

          {selectedTemplate && (
            <div className="py-4">
              <div className="flex items-center gap-2 mb-4">
                {getTypeIcon(selectedTemplate.option_type)}
                <h4 className="font-medium">{selectedTemplate.name}</h4>
              </div>

              <p className="text-sm text-muted-foreground mb-4">
                Ce template contient {(selectedTemplate.mappings as any[]).length} mappings qui seront créés:
              </p>

              <ScrollArea className="h-48 border rounded-lg p-3">
                <div className="space-y-2">
                  {(selectedTemplate.mappings as any[]).map((m, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <code className="bg-muted px-2 py-1 rounded">{m.source}</code>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      <code className="bg-primary/10 text-primary px-2 py-1 rounded">{m.target}</code>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApplyDialog(false)}>
              Annuler
            </Button>
            <Button onClick={handleApply} disabled={applyMutation.isPending}>
              {applyMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              Appliquer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Template Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Créer un Template</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label>Nom du template</Label>
              <Input
                placeholder="Ex: Tailles Enfant"
                value={newTemplate.name}
                onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
              />
            </div>

            <div>
              <Label>Description (optionnel)</Label>
              <Input
                placeholder="Description du template"
                value={newTemplate.description}
                onChange={(e) => setNewTemplate({ ...newTemplate, description: e.target.value })}
              />
            </div>

            <div>
              <Label>Type d'option</Label>
              <Select
                value={newTemplate.option_type}
                onValueChange={(v) => setNewTemplate({ ...newTemplate, option_type: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="size">Taille</SelectItem>
                  <SelectItem value="color">Couleur</SelectItem>
                  <SelectItem value="material">Matière</SelectItem>
                  <SelectItem value="style">Style</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Mappings</Label>
              <div className="space-y-2 mt-2">
                {newTemplate.mappings.map((m, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Input
                      placeholder="Source"
                      value={m.source}
                      onChange={(e) => updateMappingRow(i, 'source', e.target.value)}
                      className="font-mono"
                    />
                    <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                    <Input
                      placeholder="Cible"
                      value={m.target}
                      onChange={(e) => updateMappingRow(i, 'target', e.target.value)}
                    />
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={addMappingRow}>
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter une ligne
                </Button>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Annuler
            </Button>
            <Button 
              onClick={handleCreateTemplate}
              disabled={createMutation.isPending || !newTemplate.name}
            >
              {createMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              Créer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
