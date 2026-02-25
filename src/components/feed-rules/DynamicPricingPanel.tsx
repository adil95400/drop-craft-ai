/**
 * Dynamic Pricing Panel
 * Quick-create pricing rules with preset templates
 */
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  DollarSign, TrendingUp, Target, Percent, ArrowRight, 
  Sparkles, ShieldCheck, Zap 
} from 'lucide-react';
import { useCreateFeedRule } from '@/hooks/useFeedRules';

const PRICING_TEMPLATES = [
  {
    id: 'margin-40',
    name: 'Marge 40% sur coût',
    icon: Percent,
    color: 'text-green-500',
    description: 'Applique une marge de 40% sur le prix d\'achat',
    conditions: [{ field: 'cost_price', operator: 'greater_than', value: 0 }],
    actions: [{ type: 'apply_margin', value: 40 }],
    match_type: 'all' as const,
  },
  {
    id: 'psychological-99',
    name: 'Arrondi psychologique .99',
    icon: Sparkles,
    color: 'text-purple-500',
    description: 'Arrondit tous les prix à X.99€',
    conditions: [{ field: 'price', operator: 'greater_than', value: 0 }],
    actions: [{ type: 'round_psychological', value: '99' }],
    match_type: 'all' as const,
  },
  {
    id: 'compare-at-price',
    name: 'Prix barré +25%',
    icon: Target,
    color: 'text-orange-500',
    description: 'Ajoute un prix barré 25% au-dessus du prix actuel',
    conditions: [{ field: 'price', operator: 'greater_than', value: 0 }],
    actions: [{ type: 'set_compare_at_price', value: 25 }],
    match_type: 'all' as const,
  },
  {
    id: 'min-price-guard',
    name: 'Prix minimum 9.99€',
    icon: ShieldCheck,
    color: 'text-blue-500',
    description: 'Empêche les prix inférieurs à 9.99€',
    conditions: [{ field: 'price', operator: 'less_than', value: 9.99 }],
    actions: [{ type: 'min_price', value: 9.99 }],
    match_type: 'all' as const,
  },
  {
    id: 'category-premium',
    name: 'Premium +15% sur électronique',
    icon: TrendingUp,
    color: 'text-amber-500',
    description: 'Augmente les prix de 15% sur la catégorie électronique',
    conditions: [{ field: 'category', operator: 'contains', value: 'électronique' }],
    actions: [{ type: 'percentage_adjust', value: 15 }],
    match_type: 'all' as const,
  },
  {
    id: 'low-stock-boost',
    name: 'Hausse prix si stock faible',
    icon: Zap,
    color: 'text-red-500',
    description: 'Augmente de 10% si stock < 5 unités',
    conditions: [
      { field: 'stock', operator: 'less_than', value: 5 },
      { field: 'stock', operator: 'greater_than', value: 0 },
    ],
    actions: [{ type: 'percentage_adjust', value: 10 }],
    match_type: 'all' as const,
  },
];

export function DynamicPricingPanel() {
  const createRule = useCreateFeedRule();
  const [customMargin, setCustomMargin] = useState('30');
  const [customRounding, setCustomRounding] = useState('99');

  const handleUseTemplate = (template: typeof PRICING_TEMPLATES[0]) => {
    createRule.mutate({
      name: template.name,
      description: template.description,
      conditions: template.conditions,
      actions: template.actions,
      match_type: template.match_type,
    });
  };

  const handleCreateCustomMargin = () => {
    createRule.mutate({
      name: `Marge ${customMargin}% + arrondi .${customRounding}`,
      description: `Applique ${customMargin}% de marge puis arrondi psychologique`,
      conditions: [{ field: 'cost_price', operator: 'greater_than', value: 0 }],
      actions: [
        { type: 'apply_margin', value: Number(customMargin) },
        { type: 'round_psychological', value: customRounding },
      ],
      match_type: 'all',
    });
  };

  return (
    <div className="space-y-6">
      {/* Quick Custom Rule */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <DollarSign className="h-5 w-5 text-primary" />
            Créateur rapide de prix
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-4 flex-wrap">
            <div className="space-y-1">
              <Label className="text-xs">Marge sur coût (%)</Label>
              <Input
                type="number"
                value={customMargin}
                onChange={(e) => setCustomMargin(e.target.value)}
                className="w-24"
              />
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground mb-2" />
            <div className="space-y-1">
              <Label className="text-xs">Arrondi</Label>
              <Select value={customRounding} onValueChange={setCustomRounding}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="99">.99€</SelectItem>
                  <SelectItem value="95">.95€</SelectItem>
                  <SelectItem value="90">.90€</SelectItem>
                  <SelectItem value="00">.00€</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleCreateCustomMargin} disabled={createRule.isPending}>
              Créer la règle
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Exemple : Coût 10€ × marge {customMargin}% = {(10 * (1 + Number(customMargin) / 100)).toFixed(2)}€ → arrondi .{customRounding}
          </p>
        </CardContent>
      </Card>

      {/* Preset Templates */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {PRICING_TEMPLATES.map((template) => {
          const Icon = template.icon;
          return (
            <Card key={template.id} className="hover:shadow-md transition-shadow cursor-pointer group">
              <CardContent className="pt-6 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`p-2 rounded-lg bg-muted ${template.color}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <h3 className="font-medium text-sm">{template.name}</h3>
                  </div>
                  <Badge variant="outline" className="text-xs">Pricing</Badge>
                </div>
                <p className="text-xs text-muted-foreground">{template.description}</p>
                <div className="flex items-center gap-1 text-xs">
                  <Badge variant="secondary" className="text-xs">
                    SI {template.conditions.length} condition{template.conditions.length > 1 ? 's' : ''}
                  </Badge>
                  <ArrowRight className="h-3 w-3 text-muted-foreground" />
                  <Badge variant="secondary" className="text-xs">
                    ALORS {template.actions.length} action{template.actions.length > 1 ? 's' : ''}
                  </Badge>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => handleUseTemplate(template)}
                  disabled={createRule.isPending}
                >
                  Utiliser ce template
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
