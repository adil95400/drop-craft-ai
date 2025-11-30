import { useState } from 'react';
import { useSupplierPricing } from '@/hooks/useSupplierPricing';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Play, Plus, Edit, Trash2, TrendingUp, Target, DollarSign } from 'lucide-react';
import { PricingRuleDialog } from './PricingRuleDialog';
import type { PricingRule } from '@/hooks/useSupplierPricing';

interface SupplierPricingRulesProps {
  supplierId: string;
}

export function SupplierPricingRules({ supplierId }: SupplierPricingRulesProps) {
  const { pricingRules, isLoading, updateRule, deleteRule, applyPricing, isApplying } = useSupplierPricing(supplierId);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<any>(null);

  const getStrategyIcon = (pricingType: string) => {
    switch (pricingType) {
      case 'fixed_markup': return <DollarSign className="h-4 w-4" />;
      case 'target_margin': return <Target className="h-4 w-4" />;
      case 'competitive': return <TrendingUp className="h-4 w-4" />;
      default: return <DollarSign className="h-4 w-4" />;
    }
  };

  const getStrategyLabel = (pricingType: string) => {
    const labels: Record<string, string> = {
      'fixed_markup': 'Marge fixe',
      'target_margin': 'Marge cible',
      'competitive': 'Compétitif',
      'minimum_threshold': 'Seuil minimum',
      'dynamic': 'Dynamique'
    };
    return labels[pricingType] || pricingType;
  };

  const handleEdit = (rule: any) => {
    setEditingRule(rule);
    setDialogOpen(true);
  };

  const handleToggle = (rule: any) => {
    updateRule({ id: rule.id, updates: { is_active: !rule.is_active } });
  };

  const handleDelete = (ruleId: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette règle ?')) {
      deleteRule(ruleId);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Règles de tarification</CardTitle>
              <CardDescription>
                Configurez les stratégies de prix automatiques pour ce fournisseur
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => applyPricing()}
                disabled={isApplying}
                variant="default"
              >
                <Play className="h-4 w-4 mr-2" />
                {isApplying ? 'Application...' : 'Appliquer maintenant'}
              </Button>
              <Button
                onClick={() => {
                  setEditingRule(null);
                  setDialogOpen(true);
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Nouvelle règle
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {pricingRules.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aucune règle de tarification configurée</p>
              <p className="text-sm mt-2">Créez une règle pour automatiser vos prix</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pricingRules.map((rule) => (
                <Card key={rule.id} className="border-l-4" style={{
                  borderLeftColor: rule.is_active ? 'hsl(var(--success))' : 'hsl(var(--muted))'
                }}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="mt-1">
                          {getStrategyIcon(rule.pricing_type || 'fixed_markup')}
                        </div>
                        
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">
                              {getStrategyLabel(rule.pricing_type || 'fixed_markup')}
                            </span>
                            <Badge variant="secondary" className="text-xs">
                              Priorité {rule.priority}
                            </Badge>
                            {rule.is_active ? (
                              <Badge variant="default" className="text-xs">Actif</Badge>
                            ) : (
                              <Badge variant="outline" className="text-xs">Inactif</Badge>
                            )}
                          </div>

                          <div className="text-sm text-muted-foreground space-y-1">
                            {rule.fixed_markup_amount && (
                              <div>Marge: +{rule.fixed_markup_amount}€</div>
                            )}
                            {rule.target_margin_percent && (
                              <div>Marge cible: {rule.target_margin_percent}%</div>
                            )}
                            {rule.min_price && (
                              <div>Prix minimum: {rule.min_price}€</div>
                            )}
                            {rule.max_price && (
                              <div>Prix maximum: {rule.max_price}€</div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Switch
                          checked={rule.is_active}
                          onCheckedChange={() => handleToggle(rule)}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(rule)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(rule.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <PricingRuleDialog
        supplierId={supplierId}
        rule={editingRule}
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditingRule(null);
        }}
      />
    </div>
  );
}
