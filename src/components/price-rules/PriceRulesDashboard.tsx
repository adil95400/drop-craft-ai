/**
 * Price Rules Dashboard - Enhanced with AI
 */
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, Play, Eye, Trash2, DollarSign, Link2, Brain 
} from 'lucide-react';
import { 
  usePriceRules, useUpdatePriceRule, 
  useDeletePriceRule, useApplyPriceRule, useSimulatePriceRule 
} from '@/hooks/usePriceRules';
import { CreatePriceRuleDialog } from './CreatePriceRuleDialog';
import { PriceRuleLogsPanel } from './PriceRuleLogsPanel';
import { PriceSyncPanel } from './PriceSyncPanel';
import { AIRecommendationsPanel } from './AIRecommendationsPanel';
import { EnhancedStatsGrid } from './EnhancedStatsGrid';
import { formatDistanceToNow } from 'date-fns';
import { useDateFnsLocale } from '@/hooks/useDateFnsLocale';

const ruleTypeLabels: Record<string, string> = {
  markup: 'Markup', margin: 'Marge', fixed: 'Fixe',
  rounding: 'Arrondi', competitive: 'Compétitif', tiered: 'Palier',
};

export function PriceRulesDashboard() {
  const locale = useDateFnsLocale();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const { data: rules = [], isLoading } = usePriceRules();
  const updateRule = useUpdatePriceRule();
  const deleteRule = useDeletePriceRule();
  const applyRule = useApplyPriceRule();
  const simulateRule = useSimulatePriceRule();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Price Rules</h1>
          <p className="text-muted-foreground">Tarification dynamique et automatique</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle règle
        </Button>
      </div>

      {/* Enhanced Stats with AI scoring */}
      <EnhancedStatsGrid />

      <Tabs defaultValue="rules" className="space-y-4">
        <TabsList>
          <TabsTrigger value="rules">Mes règles</TabsTrigger>
          <TabsTrigger value="ai" className="gap-1">
            <Brain className="h-4 w-4" />
            IA
          </TabsTrigger>
          <TabsTrigger value="sync" className="gap-1">
            <Link2 className="h-4 w-4" />
            Sync Boutiques
          </TabsTrigger>
          <TabsTrigger value="logs">Historique</TabsTrigger>
        </TabsList>

        <TabsContent value="rules" className="space-y-3">
          {isLoading ? (
            <Card><CardContent className="py-10 text-center text-muted-foreground">Chargement...</CardContent></Card>
          ) : rules.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center">
                <DollarSign className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-medium mb-2">Aucune règle</h3>
                <p className="text-muted-foreground mb-4">Créez votre première règle de tarification</p>
                <Button onClick={() => setIsCreateOpen(true)}><Plus className="h-4 w-4 mr-2" />Créer</Button>
              </CardContent>
            </Card>
          ) : (
            rules.map((rule) => (
              <Card key={rule.id} className={!rule.is_active ? 'opacity-60' : ''}>
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Switch
                        checked={rule.is_active}
                        onCheckedChange={(checked) => updateRule.mutate({ ruleId: rule.id, updates: { is_active: checked } })}
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{rule.name}</h3>
                          <Badge variant="outline">{ruleTypeLabels[rule.rule_type]}</Badge>
                          <Badge variant="secondary">Priorité: {rule.priority}</Badge>
                        </div>
                        {rule.description && <p className="text-sm text-muted-foreground">{rule.description}</p>}
                        <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                          <span>{rule.products_affected} produits</span>
                          {rule.last_applied_at && (
                            <span>Appliqué: {formatDistanceToNow(new Date(rule.last_applied_at), { addSuffix: true, locale })}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline" onClick={() => simulateRule.mutate(rule.id)} disabled={simulateRule.isPending}>
                        <Eye className="h-4 w-4 mr-1" />Simuler
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => applyRule.mutate(rule.id)} disabled={!rule.is_active || applyRule.isPending}>
                        <Play className="h-4 w-4 mr-1" />Appliquer
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => confirm('Supprimer?') && deleteRule.mutate(rule.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="ai" className="space-y-4">
          <AIRecommendationsPanel />
        </TabsContent>

        <TabsContent value="sync">
          <PriceSyncPanel />
        </TabsContent>

        <TabsContent value="logs">
          <PriceRuleLogsPanel />
        </TabsContent>
      </Tabs>

      <CreatePriceRuleDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} />
    </div>
  );
}
