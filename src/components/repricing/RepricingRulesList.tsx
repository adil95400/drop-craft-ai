import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  Play, 
  Pause, 
  Trash2, 
  Eye, 
  Edit, 
  ChevronRight,
  TrendingUp,
  TrendingDown,
  DollarSign
} from 'lucide-react';
import { 
  useRepricingRules, 
  useUpdateRepricingRule, 
  useDeleteRepricingRule,
  useApplyRepricingRule,
  usePreviewRepricingRule,
  type PricingRule 
} from '@/hooks/useRepricingEngine';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { format } from 'date-fns';
import { getDateFnsLocale } from '@/utils/dateFnsLocale';

interface RepricingRulesListProps {
  onEditRule?: (rule: PricingRule) => void;
  onPreviewRule?: (preview: any) => void;
}

export function RepricingRulesList({ onEditRule, onPreviewRule }: RepricingRulesListProps) {
  const { data: rules, isLoading } = useRepricingRules();
  const updateRule = useUpdateRepricingRule();
  const deleteRule = useDeleteRepricingRule();
  const applyRule = useApplyRepricingRule();
  const previewRule = usePreviewRepricingRule();

  const handleToggleActive = (rule: PricingRule) => {
    updateRule.mutate({ 
      id: rule.id, 
      updates: { is_active: !rule.is_active } 
    });
  };

  const handleDelete = (id: string) => {
    if (confirm('Supprimer cette règle ?')) {
      deleteRule.mutate(id);
    }
  };

  const handleApply = (ruleId: string) => {
    applyRule.mutate({ ruleId, applyToAll: true });
  };

  const handlePreview = async (ruleId: string) => {
    const result = await previewRule.mutateAsync({ ruleId, applyToAll: true });
    onPreviewRule?.(result);
  };

  const getRuleTypeLabel = (type?: string) => {
    const types: Record<string, string> = {
      fixed_margin: 'Marge Fixe',
      target_margin: 'Marge Cible',
      competitive: 'Compétitif',
      dynamic: 'Dynamique',
    };
    return types[type || ''] || type || 'Standard';
  };

  const getRuleTypeColor = (type?: string) => {
    const colors: Record<string, string> = {
      fixed_margin: 'bg-blue-100 text-blue-700',
      target_margin: 'bg-green-100 text-green-700',
      competitive: 'bg-orange-100 text-orange-700',
      dynamic: 'bg-purple-100 text-purple-700',
    };
    return colors[type || ''] || 'bg-gray-100 text-gray-700';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!rules || rules.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <DollarSign className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Aucune règle de repricing</h3>
          <p className="text-muted-foreground">
            Créez votre première règle pour automatiser vos prix.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {rules.map((rule) => (
        <Card key={rule.id} className={`transition-all ${!rule.is_active ? 'opacity-60' : ''}`}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 flex-1">
                <Switch
                  checked={rule.is_active}
                  onCheckedChange={() => handleToggleActive(rule)}
                />
                
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">{rule.name}</span>
                    <Badge className={getRuleTypeColor(rule.rule_type)} variant="secondary">
                      {getRuleTypeLabel(rule.rule_type)}
                    </Badge>
                    <Badge variant="outline">
                      Priorité: {rule.priority || 0}
                    </Badge>
                  </div>
                  
                  {rule.description && (
                    <p className="text-sm text-muted-foreground mb-2">
                      {rule.description}
                    </p>
                  )}
                  
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    {rule.target_margin && (
                      <span className="flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" />
                        Marge: {rule.target_margin}%
                      </span>
                    )}
                    {rule.min_price && (
                      <span>Min: {rule.min_price}€</span>
                    )}
                    {rule.max_price && (
                      <span>Max: {rule.max_price}€</span>
                    )}
                    <span className="flex items-center gap-1">
                      <ChevronRight className="h-3 w-3" />
                      {rule.products_affected || 0} produits
                    </span>
                    {rule.last_executed_at && (
                      <span>
                        Exécuté: {format(new Date(rule.last_executed_at), 'dd/MM HH:mm', { locale: getDateFnsLocale() })}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => handlePreview(rule.id)}
                  disabled={previewRule.isPending}
                >
                  <Eye className="h-4 w-4" />
                </Button>
                
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => onEditRule?.(rule)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => handleApply(rule.id)}
                  disabled={!rule.is_active || applyRule.isPending}
                >
                  <Play className="h-4 w-4" />
                </Button>
                
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => handleDelete(rule.id)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
