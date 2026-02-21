/**
 * Feed Rules Dashboard
 * Interface principale de gestion des règles if/then avec preview réel
 */
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Play, Copy, Trash2, Settings2, FileText, Zap,
  TrendingUp, Clock, CheckCircle2, Brain, Eye, ArrowRight,
  Loader2,
} from 'lucide-react';
import { 
  useFeedRules, useFeedRulesStats, useToggleFeedRule,
  useDeleteFeedRule, useDuplicateFeedRule, useExecuteFeedRule,
  usePreviewFeedRule,
} from '@/hooks/useFeedRules';
import { CreateRuleDialog } from './CreateRuleDialog';
import { RuleTemplatesPanel } from './RuleTemplatesPanel';
import { RuleExecutionsPanel } from './RuleExecutionsPanel';
import { FeedRulesAIPanel } from './FeedRulesAIPanel';
import { FeedRule } from '@/services/FeedRulesService';

interface PreviewResult {
  product_id: string;
  title: string;
  changes: Record<string, { before: any; after: any }>;
}

function RulePreviewPanel({ ruleId, onClose }: { ruleId: string; onClose: () => void }) {
  const preview = usePreviewFeedRule();
  const [results, setResults] = useState<{
    products_total: number;
    products_matched: number;
    products_modified: number;
    preview: PreviewResult[];
  } | null>(null);

  const handlePreview = () => {
    preview.mutate(ruleId, {
      onSuccess: (data) => setResults(data),
    });
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Prévisualisation des modifications
          </DialogTitle>
        </DialogHeader>

        {!results ? (
          <div className="py-12 text-center space-y-4">
            <Eye className="h-12 w-12 mx-auto text-muted-foreground" />
            <p className="text-muted-foreground">
              Prévisualisez les changements avant de les appliquer
            </p>
            <Button onClick={handlePreview} disabled={preview.isPending} className="gap-2">
              {preview.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
              Lancer la prévisualisation
            </Button>
          </div>
        ) : (
          <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
            <div className="grid grid-cols-3 gap-3">
              <Card>
                <CardContent className="pt-3 pb-2 text-center">
                  <p className="text-2xl font-bold">{results.products_total}</p>
                  <p className="text-xs text-muted-foreground">Produits analysés</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-3 pb-2 text-center">
                  <p className="text-2xl font-bold text-primary">{results.products_matched}</p>
                  <p className="text-xs text-muted-foreground">Correspondances</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-3 pb-2 text-center">
                  <p className="text-2xl font-bold text-green-600">{results.products_modified}</p>
                  <p className="text-xs text-muted-foreground">Seront modifiés</p>
                </CardContent>
              </Card>
            </div>

            <ScrollArea className="flex-1">
              <div className="space-y-3 pr-4">
                {results.preview.length === 0 ? (
                  <div className="py-8 text-center text-muted-foreground">
                    <CheckCircle2 className="h-8 w-8 mx-auto mb-2" />
                    Aucun produit ne sera modifié par cette règle
                  </div>
                ) : (
                  <AnimatePresence>
                    {results.preview.map((item, i) => (
                      <motion.div
                        key={item.product_id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.03 }}
                      >
                        <Card className="border-border/50">
                          <CardContent className="pt-3 pb-3">
                            <p className="font-medium text-sm mb-2 truncate">{item.title}</p>
                            {Object.entries(item.changes).map(([field, { before, after }]) => (
                              <div key={field} className="flex items-center gap-2 text-xs">
                                <Badge variant="outline" className="shrink-0 font-mono">{field}</Badge>
                                <span className="text-destructive line-through truncate max-w-[150px]">
                                  {String(before ?? '∅')}
                                </span>
                                <ArrowRight className="h-3 w-3 shrink-0 text-muted-foreground" />
                                <span className="text-green-600 font-medium truncate max-w-[150px]">
                                  {String(after ?? '∅')}
                                </span>
                              </div>
                            ))}
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                )}
              </div>
            </ScrollArea>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function FeedRulesDashboard() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedRule, setSelectedRule] = useState<FeedRule | null>(null);
  const [previewRuleId, setPreviewRuleId] = useState<string | null>(null);

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Moteur de Règles SI/ALORS</h1>
          <p className="text-muted-foreground">
            Transformez vos fiches produit en masse avec des règles conditionnelles
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle règle
        </Button>
      </div>

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
                  Créez votre première règle SI/ALORS pour transformer vos produits en masse
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
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-medium">{rule.name}</h3>
                            <Badge variant="outline">
                              SI {rule.conditions.length} condition{rule.conditions.length > 1 ? 's' : ''}
                            </Badge>
                            <Badge variant="secondary">
                              ALORS {rule.actions.length} action{rule.actions.length > 1 ? 's' : ''}
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
                                {new Date(rule.last_executed_at).toLocaleDateString('fr-FR')}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button size="sm" variant="outline" onClick={() => setPreviewRuleId(rule.id)} title="Prévisualiser">
                          <Eye className="h-4 w-4 mr-1" />
                          Preview
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleExecute(rule.id)}
                          disabled={!rule.is_active || executeRule.isPending}
                        >
                          {executeRule.isPending ? (
                            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                          ) : (
                            <Play className="h-4 w-4 mr-1" />
                          )}
                          Exécuter
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setSelectedRule(rule)}>
                          <Settings2 className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => duplicateRule.mutate(rule.id)}>
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleDelete(rule.id)}>
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

      {previewRuleId && (
        <RulePreviewPanel ruleId={previewRuleId} onClose={() => setPreviewRuleId(null)} />
      )}

      <CreateRuleDialog 
        open={isCreateOpen} 
        onOpenChange={setIsCreateOpen}
        editRule={selectedRule}
        onClose={() => setSelectedRule(null)}
      />
    </div>
  );
}
