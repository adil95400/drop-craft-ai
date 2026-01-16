/**
 * Page de gestion des règles catalogue - Style Channable Premium
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Plus, Play, Pause, ListFilter, Sparkles, 
  Trash2, Edit, MoreVertical, Zap, Clock, CheckCircle2, XCircle,
  Settings, ArrowRight
} from 'lucide-react';
import { useProductRules } from '@/hooks/useProductRules';
import { RuleBuilder } from '@/components/rules/RuleBuilder';
import { RuleTemplatesDialog } from '@/components/rules/RuleTemplatesDialog';
import { RuleTesterDialog } from '@/components/rules/RuleTesterDialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ProductRule, RULE_TEMPLATES } from '@/lib/rules/ruleTypes';

const StatCard = ({ 
  icon: Icon, 
  label, 
  value, 
  color = 'primary'
}: { 
  icon: any; 
  label: string; 
  value: string | number; 
  color?: string;
}) => {
  const colorClasses = {
    primary: 'from-primary/20 to-primary/5 text-primary',
    green: 'from-emerald-500/20 to-emerald-500/5 text-emerald-600',
    orange: 'from-amber-500/20 to-amber-500/5 text-amber-600',
    blue: 'from-blue-500/20 to-blue-500/5 text-blue-600',
    purple: 'from-purple-500/20 to-purple-500/5 text-purple-600'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
    >
      <Card className="relative overflow-hidden border-border/50 hover:shadow-lg transition-all">
        <div className={`absolute inset-0 bg-gradient-to-br ${colorClasses[color as keyof typeof colorClasses] || colorClasses.primary} opacity-50`} />
        <CardContent className="relative p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">{label}</p>
              <p className="text-3xl font-bold mt-1">{value}</p>
            </div>
            <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${colorClasses[color as keyof typeof colorClasses] || colorClasses.primary} flex items-center justify-center`}>
              <Icon className="h-6 w-6" />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default function ProductRulesPage() {
  const [activeTab, setActiveTab] = useState('active');
  const [builderOpen, setBuilderOpen] = useState(false);
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [testerOpen, setTesterOpen] = useState(false);
  const [selectedRule, setSelectedRule] = useState<ProductRule | undefined>();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [ruleToDelete, setRuleToDelete] = useState<string | null>(null);

  const { 
    rules, 
    stats, 
    templates,
    isLoading, 
    toggleRule, 
    deleteRule,
    createFromTemplate,
    isDeleting 
  } = useProductRules();

  const activeRules = rules.filter(r => r.enabled);
  const pausedRules = rules.filter(r => !r.enabled);

  const handleEditRule = (rule: ProductRule) => {
    setSelectedRule(rule);
    setBuilderOpen(true);
  };

  const handleNewRule = () => {
    setSelectedRule(undefined);
    setBuilderOpen(true);
  };

  const handleDeleteRule = (ruleId: string) => {
    setRuleToDelete(ruleId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (ruleToDelete) {
      deleteRule(ruleToDelete);
      setDeleteDialogOpen(false);
      setRuleToDelete(null);
    }
  };

  const handleSelectTemplate = async (templateId: string) => {
    await createFromTemplate(templateId);
    setTemplatesOpen(false);
  };

  const handleTestRule = (rule: ProductRule) => {
    setSelectedRule(rule);
    setTesterOpen(true);
  };

  const getChannelBadge = (channel: string) => {
    const colors: Record<string, string> = {
      global: 'bg-gray-500',
      google: 'bg-blue-500',
      meta: 'bg-indigo-500',
      tiktok: 'bg-pink-500',
      amazon: 'bg-orange-500',
      shopify: 'bg-green-500'
    };
    return (
      <Badge variant="secondary" className={`${colors[channel] || 'bg-gray-500'} text-white text-xs`}>
        {channel}
      </Badge>
    );
  };

  const RuleCard = ({ rule }: { rule: ProductRule }) => (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.01 }}
    >
      <Card className="hover:shadow-lg transition-all border-border/50">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <CardTitle className="text-lg">{rule.name}</CardTitle>
                {getChannelBadge(rule.channel)}
                {rule.actions?.some(a => a.type === 'generate_ai') && (
                  <Badge variant="outline" className="gap-1 text-xs">
                    <Sparkles className="h-3 w-3" /> IA
                  </Badge>
                )}
              </div>
              <CardDescription>{rule.description || 'Aucune description'}</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={rule.enabled}
                onCheckedChange={(checked) => toggleRule({ id: rule.id, enabled: checked })}
              />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleEditRule(rule)}>
                    <Edit className="h-4 w-4 mr-2" /> Modifier
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleTestRule(rule)}>
                    <Zap className="h-4 w-4 mr-2" /> Tester
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => handleDeleteRule(rule.id)}
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" /> Supprimer
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {rule.executionCount || 0} exécutions
            </div>
            <div className="flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3 text-green-500" />
              {rule.successCount || 0}
            </div>
            <div className="flex items-center gap-1">
              <XCircle className="h-3 w-3 text-red-500" />
              {rule.errorCount || 0}
            </div>
            {rule.lastExecutedAt && (
              <span>
                Dernière: {new Date(rule.lastExecutedAt).toLocaleDateString('fr-FR')}
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  return (
    <ChannablePageWrapper
      title="Règles Catalogue"
      subtitle="Automatisation"
      description="Automatisez la gestion de vos produits avec des règles intelligentes type Channable"
      heroImage="integrations"
      badge={{ label: 'Auto', icon: Settings }}
      actions={
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setTemplatesOpen(true)} className="gap-2 bg-background/80 backdrop-blur-sm">
            <ListFilter className="h-4 w-4" />
            Templates
          </Button>
          <Button onClick={handleNewRule} className="gap-2">
            <Plus className="h-4 w-4" />
            Nouvelle règle
          </Button>
        </div>
      }
    >
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={Play} label="Règles actives" value={isLoading ? '...' : stats.activeRules} color="green" />
        <StatCard icon={Pause} label="Règles pausées" value={isLoading ? '...' : stats.pausedRules} color="orange" />
        <StatCard icon={Zap} label="Exécutions" value={isLoading ? '...' : stats.totalExecutions.toLocaleString()} color="blue" />
        <StatCard icon={Sparkles} label="Règles IA" value={isLoading ? '...' : stats.aiRules} color="purple" />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="w-full sm:w-auto bg-muted/50 p-1">
          <TabsTrigger value="active" className="gap-2">
            <Play className="h-4 w-4" />
            Actives ({activeRules.length})
          </TabsTrigger>
          <TabsTrigger value="paused" className="gap-2">
            <Pause className="h-4 w-4" />
            Pausées ({pausedRules.length})
          </TabsTrigger>
          <TabsTrigger value="templates" className="gap-2">
            <ListFilter className="h-4 w-4" />
            Modèles ({templates.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <Skeleton className="h-6 w-1/3 mb-2" />
                    <Skeleton className="h-4 w-2/3" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : activeRules.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center">
                <Play className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-lg font-medium mb-2">Aucune règle active</p>
                <p className="text-muted-foreground mb-4">Créez votre première règle d'automatisation</p>
                <Button onClick={handleNewRule} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Créer une règle
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {activeRules.map(rule => (
                <RuleCard key={rule.id} rule={rule} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="paused" className="space-y-4">
          {pausedRules.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center">
                <Pause className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Aucune règle pausée</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {pausedRules.map(rule => (
                <RuleCard key={rule.id} rule={rule} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {RULE_TEMPLATES.map(template => (
              <motion.div
                key={template.id}
                whileHover={{ y: -2 }}
              >
                <Card className="hover:shadow-lg transition-all h-full border-border/50">
                  <CardHeader>
                    <div className="flex items-center gap-2 flex-wrap">
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                      {getChannelBadge(template.channel)}
                    </div>
                    <CardDescription>{template.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Badge variant="outline" className="mb-3">{template.category}</Badge>
                    <Button 
                      variant="outline" 
                      className="w-full gap-2"
                      onClick={() => handleSelectTemplate(template.id)}
                    >
                      Utiliser ce modèle
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <RuleBuilder
        rule={selectedRule}
        open={builderOpen}
        onOpenChange={setBuilderOpen}
        onSave={() => setBuilderOpen(false)}
      />

      <RuleTemplatesDialog
        open={templatesOpen}
        onOpenChange={setTemplatesOpen}
        onSelectTemplate={handleSelectTemplate}
      />

      {selectedRule && (
        <RuleTesterDialog
          rule={selectedRule}
          open={testerOpen}
          onOpenChange={setTesterOpen}
        />
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer la règle ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. La règle sera définitivement supprimée.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} disabled={isDeleting}>
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ChannablePageWrapper>
  );
}
