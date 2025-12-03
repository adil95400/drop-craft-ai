/**
 * Page de gestion des règles catalogue
 * Permet de créer des règles automatiques type Channable
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Plus, Play, Pause, Settings, ListFilter, Sparkles, 
  Trash2, Edit, MoreVertical, Zap, Clock, CheckCircle2, XCircle
} from 'lucide-react';
import { Helmet } from 'react-helmet-async';
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
      <Badge variant="secondary" className={`${colors[channel] || 'bg-gray-500'} text-white`}>
        {channel}
      </Badge>
    );
  };

  const RuleCard = ({ rule }: { rule: ProductRule }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <CardTitle className="text-lg">{rule.name}</CardTitle>
              {getChannelBadge(rule.channel)}
              {rule.actions?.some(a => a.type === 'generate_ai') && (
                <Badge variant="outline" className="gap-1">
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
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
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
  );

  return (
    <>
      <Helmet>
        <title>Règles Catalogue - Automatisation Produits</title>
        <meta name="description" content="Créez des règles automatiques pour gérer votre catalogue produits" />
      </Helmet>

      <div className="container mx-auto p-4 md:p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-4xl font-bold">Règles Catalogue</h1>
            <p className="text-muted-foreground mt-1">
              Automatisez la gestion de vos produits avec des règles intelligentes
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setTemplatesOpen(true)}>
              <ListFilter className="h-4 w-4 mr-2" />
              Templates
            </Button>
            <Button onClick={handleNewRule}>
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle règle
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Règles actives</p>
                  {isLoading ? (
                    <Skeleton className="h-9 w-12" />
                  ) : (
                    <p className="text-3xl font-bold">{stats.activeRules}</p>
                  )}
                </div>
                <Play className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Règles pausées</p>
                  {isLoading ? (
                    <Skeleton className="h-9 w-12" />
                  ) : (
                    <p className="text-3xl font-bold">{stats.pausedRules}</p>
                  )}
                </div>
                <Pause className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Exécutions</p>
                  {isLoading ? (
                    <Skeleton className="h-9 w-12" />
                  ) : (
                    <p className="text-3xl font-bold">{stats.totalExecutions.toLocaleString()}</p>
                  )}
                </div>
                <Zap className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Règles IA</p>
                  {isLoading ? (
                    <Skeleton className="h-9 w-12" />
                  ) : (
                    <p className="text-3xl font-bold">{stats.aiRules}</p>
                  )}
                </div>
                <Sparkles className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="w-full sm:w-auto overflow-x-auto">
            <TabsTrigger value="active">Actives ({activeRules.length})</TabsTrigger>
            <TabsTrigger value="paused">Pausées ({pausedRules.length})</TabsTrigger>
            <TabsTrigger value="templates">Modèles ({templates.length})</TabsTrigger>
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
              <Card>
                <CardContent className="py-12 text-center">
                  <Play className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-4">Aucune règle active</p>
                  <Button onClick={handleNewRule}>
                    <Plus className="h-4 w-4 mr-2" />
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
              <Card>
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
                <Card key={template.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                      {getChannelBadge(template.channel)}
                    </div>
                    <CardDescription>{template.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Badge variant="outline" className="mb-3">{template.category}</Badge>
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => handleSelectTemplate(template.id)}
                    >
                      Utiliser ce modèle
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>

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
    </>
  );
}
