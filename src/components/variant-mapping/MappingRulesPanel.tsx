/**
 * Mapping Rules Panel
 * Gestion des règles de mapping automatique
 */
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { 
  useVariantMappingRules,
  useCreateMappingRule,
  useUpdateMappingRule,
  useDeleteMappingRule
} from '@/hooks/useVariantMapping';
import { 
  Zap, Plus, Trash2, Edit, Code, ArrowRight,
  CheckCircle, XCircle, Settings, Loader2
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const OPTION_TYPES = [
  { value: 'size', label: 'Taille' },
  { value: 'color', label: 'Couleur' },
  { value: 'material', label: 'Matière' },
  { value: 'style', label: 'Style' },
  { value: 'custom', label: 'Personnalisé' },
];

const TRANSFORMATION_TYPES = [
  { value: 'exact', label: 'Correspondance exacte', description: 'La valeur doit être identique' },
  { value: 'contains', label: 'Contient', description: 'La valeur doit contenir le pattern' },
  { value: 'prefix', label: 'Commence par', description: 'La valeur doit commencer par le pattern' },
  { value: 'regex', label: 'Expression régulière', description: 'Utilise une regex pour matcher' },
];

export function MappingRulesPanel() {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newRule, setNewRule] = useState({
    rule_name: '',
    option_type: 'size',
    source_pattern: '',
    target_value: '',
    transformation_type: 'exact' as const,
    apply_to_all_products: true
  });

  const { data: rules = [], isLoading } = useVariantMappingRules();
  const createMutation = useCreateMappingRule();
  const updateMutation = useUpdateMappingRule();
  const deleteMutation = useDeleteMappingRule();

  const handleCreate = () => {
    if (!newRule.rule_name || !newRule.source_pattern || !newRule.target_value) return;
    
    createMutation.mutate(newRule, {
      onSuccess: () => {
        setShowCreateDialog(false);
        setNewRule({
          rule_name: '',
          option_type: 'size',
          source_pattern: '',
          target_value: '',
          transformation_type: 'exact',
          apply_to_all_products: true
        });
      }
    });
  };

  const handleToggleActive = (rule: any) => {
    updateMutation.mutate({
      id: rule.id,
      updates: { is_active: !rule.is_active }
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array(3).fill(0).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-500" />
            Règles de Mapping Automatique
          </h3>
          <p className="text-sm text-muted-foreground">
            Créez des règles pour mapper automatiquement les variantes lors de l'import
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle Règle
        </Button>
      </div>

      {/* Rules List */}
      {rules.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Zap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-medium mb-2">Aucune règle configurée</h3>
            <p className="text-muted-foreground text-sm mb-4">
              Les règles automatisent le mapping des variantes lors de l'import
            </p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Créer une règle
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {rules.map((rule) => (
            <Card key={rule.id} className={!rule.is_active ? 'opacity-60' : ''}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-medium">{rule.rule_name}</h4>
                      <Badge variant="outline">
                        {OPTION_TYPES.find(t => t.value === rule.option_type)?.label || rule.option_type}
                      </Badge>
                      <Badge variant="secondary" className="font-mono text-xs">
                        {TRANSFORMATION_TYPES.find(t => t.value === rule.transformation_type)?.label}
                      </Badge>
                      {rule.is_active ? (
                        <Badge className="bg-green-500/10 text-green-600">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Actif
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          <XCircle className="h-3 w-3 mr-1" />
                          Inactif
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                      <code className="bg-muted px-2 py-1 rounded">
                        {rule.source_pattern}
                      </code>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      <code className="bg-primary/10 text-primary px-2 py-1 rounded">
                        {rule.target_value}
                      </code>
                    </div>

                    {rule.apply_to_all_products && (
                      <p className="text-xs text-muted-foreground mt-2">
                        S'applique à tous les produits
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Switch
                      checked={rule.is_active}
                      onCheckedChange={() => handleToggleActive(rule)}
                      disabled={updateMutation.isPending}
                    />
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => deleteMutation.mutate(rule.id)}
                      disabled={deleteMutation.isPending}
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

      {/* Create Rule Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Nouvelle Règle de Mapping
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label>Nom de la règle</Label>
              <Input
                placeholder="Ex: Tailles EU vers Standard"
                value={newRule.rule_name}
                onChange={(e) => setNewRule({ ...newRule, rule_name: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Type d'option</Label>
                <Select
                  value={newRule.option_type}
                  onValueChange={(v) => setNewRule({ ...newRule, option_type: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {OPTION_TYPES.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Type de transformation</Label>
                <Select
                  value={newRule.transformation_type}
                  onValueChange={(v: any) => setNewRule({ ...newRule, transformation_type: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TRANSFORMATION_TYPES.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        <div>
                          <p>{type.label}</p>
                          <p className="text-xs text-muted-foreground">{type.description}</p>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Pattern source</Label>
                <Input
                  placeholder={newRule.transformation_type === 'regex' as string ? '^(XS|S|M|L|XL)$' : 'XL'}
                  value={newRule.source_pattern}
                  onChange={(e) => setNewRule({ ...newRule, source_pattern: e.target.value })}
                  className="font-mono"
                />
              </div>

              <div>
                <Label>Valeur cible</Label>
                <Input
                  placeholder="Extra Large"
                  value={newRule.target_value}
                  onChange={(e) => setNewRule({ ...newRule, target_value: e.target.value })}
                />
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div>
                <p className="font-medium text-sm">Appliquer à tous les produits</p>
                <p className="text-xs text-muted-foreground">
                  Cette règle s'appliquera lors de chaque import
                </p>
              </div>
              <Switch
                checked={newRule.apply_to_all_products}
                onCheckedChange={(v) => setNewRule({ ...newRule, apply_to_all_products: v })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Annuler
            </Button>
            <Button 
              onClick={handleCreate}
              disabled={createMutation.isPending || !newRule.rule_name || !newRule.source_pattern}
            >
              {createMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              Créer la règle
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
