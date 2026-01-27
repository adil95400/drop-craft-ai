/**
 * Feed Rules Dashboard
 * Interface principale de gestion des règles if/then avec IA
 */
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { 
  Plus, 
  Play, 
  Copy, 
  Trash2, 
  Settings2, 
  FileText,
  Zap,
  TrendingUp,
  Clock,
  CheckCircle2,
  Brain,
} from 'lucide-react';
import { 
  useFeedRules, 
  useFeedRulesStats,
  useToggleFeedRule,
  useDeleteFeedRule,
  useDuplicateFeedRule,
  useExecuteFeedRule,
} from '@/hooks/useFeedRules';
import { CreateRuleDialog } from './CreateRuleDialog';
import { RuleTemplatesPanel } from './RuleTemplatesPanel';
import { RuleExecutionsPanel } from './RuleExecutionsPanel';
import { FeedRulesAIPanel } from './FeedRulesAIPanel';
import { FeedRule } from '@/services/FeedRulesService';

export function FeedRulesDashboard() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedRule, setSelectedRule] = useState<FeedRule | null>(null);

  const { data: rules = [], isLoading } = useFeedRules();
  const { data: stats } = useFeedRulesStats();
  const toggleRule = useToggleFeedRule();
  const deleteRule = useDeleteFeedRule();
  const duplicateRule = useDuplicateFeedRule();
  const executeRule = useExecuteFeedRule();

  const handleToggle = (ruleId: string, isActive: boolean) => {
    toggleRule.mutate({ ruleId, isActive });
  };

  const handleDelete = (ruleId: string) => {
    if (confirm('Supprimer cette règle ?')) {
      deleteRule.mutate(ruleId);
    }
  };

  const handleExecute = (ruleId: string) => {
    executeRule.mutate({ ruleId });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Feed Rules</h1>
          <p className="text-muted-foreground">
            Règles if/then pour transformer vos flux produits
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle règle
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-primary/10 rounded-lg">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.totalRules || 0}</p>
                <p className="text-sm text-muted-foreground">Total règles</p>
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
                <p className="text-2xl font-bold">{stats?.activeRules || 0}</p>
                <p className="text-sm text-muted-foreground">Règles actives</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Zap className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.totalExecutions || 0}</p>
                <p className="text-sm text-muted-foreground">Exécutions</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-orange-500/10 rounded-lg">
                <TrendingUp className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.avgProductsModified || 0}</p>
                <p className="text-sm text-muted-foreground">Moy. produits/exéc.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="rules" className="space-y-4">
        <TabsList>
          <TabsTrigger value="rules">Mes règles</TabsTrigger>
          <TabsTrigger value="ai" className="gap-1">
            <Brain className="h-4 w-4" />
            IA
          </TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="history">Historique</TabsTrigger>
        </TabsList>

        <TabsContent value="rules" className="space-y-4">
          {isLoading ? (
            <Card>
              <CardContent className="py-10 text-center text-muted-foreground">
                Chargement...
              </CardContent>
            </Card>
          ) : rules.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-medium mb-2">Aucune règle</h3>
                <p className="text-muted-foreground mb-4">
                  Créez votre première règle pour transformer vos flux
                </p>
                <Button onClick={() => setIsCreateOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Créer une règle
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {rules.map((rule) => (
                <Card key={rule.id} className={!rule.is_active ? 'opacity-60' : ''}>
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Switch
                          checked={rule.is_active}
                          onCheckedChange={(checked) => handleToggle(rule.id, checked)}
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium">{rule.name}</h3>
                            <Badge variant="outline">
                              {rule.conditions.length} condition{rule.conditions.length > 1 ? 's' : ''}
                            </Badge>
                            <Badge variant="secondary">
                              {rule.actions.length} action{rule.actions.length > 1 ? 's' : ''}
                            </Badge>
                          </div>
                          {rule.description && (
                            <p className="text-sm text-muted-foreground">{rule.description}</p>
                          )}
                          <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Zap className="h-3 w-3" />
                              {rule.execution_count} exécutions
                            </span>
                            {rule.last_executed_at && (
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                Dernière: {new Date(rule.last_executed_at).toLocaleDateString('fr-FR')}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleExecute(rule.id)}
                          disabled={!rule.is_active || executeRule.isPending}
                        >
                          <Play className="h-4 w-4 mr-1" />
                          Exécuter
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setSelectedRule(rule)}
                        >
                          <Settings2 className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => duplicateRule.mutate(rule.id)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(rule.id)}
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

        <TabsContent value="ai">
          <FeedRulesAIPanel />
        </TabsContent>

        <TabsContent value="templates">
          <RuleTemplatesPanel onUseTemplate={() => {}} />
        </TabsContent>

        <TabsContent value="history">
          <RuleExecutionsPanel />
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <CreateRuleDialog 
        open={isCreateOpen} 
        onOpenChange={setIsCreateOpen}
        editRule={selectedRule}
        onClose={() => setSelectedRule(null)}
      />
    </div>
  );
}
