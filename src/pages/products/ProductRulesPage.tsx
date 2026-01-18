/**
 * Page de gestion des règles unifiée - Style Channable Premium
 * Fusionne: Règles Catalogue, Règles Prix, Règles Feeds
 */

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, ListFilter, Settings, DollarSign, Rss, Package, History
} from 'lucide-react';
import { useProductRules } from '@/hooks/useProductRules';
import { RuleBuilder } from '@/components/rules/RuleBuilder';
import { RuleTemplatesDialog } from '@/components/rules/RuleTemplatesDialog';
import { RuleTesterDialog } from '@/components/rules/RuleTesterDialog';
import { CatalogRulesTab } from '@/components/rules/CatalogRulesTab';
import { RulesExecutionHistory } from '@/components/rules/RulesExecutionHistory';
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
import { ProductRule } from '@/lib/rules/ruleTypes';
import { FeedRulesDashboard } from '@/components/feed-rules';
import { PriceRulesDashboard } from '@/components/price-rules';
import { useToast } from '@/hooks/use-toast';

type RuleType = 'catalog' | 'pricing' | 'feeds' | 'executions';

const TAB_CONFIG = [
  { value: 'catalog', label: 'Catalogue', icon: Package },
  { value: 'pricing', label: 'Prix', icon: DollarSign },
  { value: 'feeds', label: 'Feeds', icon: Rss },
  { value: 'executions', label: 'Exécutions', icon: History },
] as const;

export default function ProductRulesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = (searchParams.get('tab') as RuleType) || 'catalog';
  const { toast } = useToast();
  
  const [ruleType, setRuleType] = useState<RuleType>(initialTab);
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
    createRule,
    createFromTemplate,
    isDeleting 
  } = useProductRules();

  // Sync URL with tab
  useEffect(() => {
    const tabFromUrl = searchParams.get('tab') as RuleType;
    if (tabFromUrl && TAB_CONFIG.some(t => t.value === tabFromUrl)) {
      setRuleType(tabFromUrl);
    }
  }, [searchParams]);

  const handleRuleTypeChange = useCallback((type: RuleType) => {
    setRuleType(type);
    setSearchParams({ tab: type });
  }, [setSearchParams]);

  const handleEditRule = useCallback((rule: ProductRule) => {
    setSelectedRule(rule);
    setBuilderOpen(true);
  }, []);

  const handleNewRule = useCallback(() => {
    setSelectedRule(undefined);
    setBuilderOpen(true);
  }, []);

  const handleDeleteRule = useCallback((ruleId: string) => {
    setRuleToDelete(ruleId);
    setDeleteDialogOpen(true);
  }, []);

  const confirmDelete = useCallback(() => {
    if (ruleToDelete) {
      deleteRule(ruleToDelete);
      setDeleteDialogOpen(false);
      setRuleToDelete(null);
    }
  }, [ruleToDelete, deleteRule]);

  const handleSelectTemplate = useCallback(async (templateId: string) => {
    await createFromTemplate(templateId);
    setTemplatesOpen(false);
  }, [createFromTemplate]);

  const handleTestRule = useCallback((rule: ProductRule) => {
    setSelectedRule(rule);
    setTesterOpen(true);
  }, []);

  const handleDuplicateRule = useCallback((rule: ProductRule) => {
    createRule({
      ...rule,
      id: undefined,
      name: `${rule.name} (copie)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      executionCount: 0,
      successCount: 0,
      errorCount: 0,
    } as any);
    toast({ title: 'Règle dupliquée', description: 'La copie a été créée avec succès' });
  }, [createRule, toast]);

  return (
    <ChannablePageWrapper
      title="Moteur de Règles"
      subtitle="Automatisation"
      description="Automatisez la gestion de vos produits avec des règles intelligentes type Channable"
      heroImage="integrations"
      badge={{ label: 'Auto', icon: Settings }}
      actions={
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => setTemplatesOpen(true)} 
            className="gap-2 bg-background/80 backdrop-blur-sm"
          >
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
      {/* Rule Type Tabs */}
      <Tabs 
        value={ruleType} 
        onValueChange={(v) => handleRuleTypeChange(v as RuleType)} 
        className="space-y-6"
      >
        <TabsList className="w-full justify-start bg-muted/50 p-1 h-auto flex-wrap">
          {TAB_CONFIG.map(({ value, label, icon: Icon }) => (
            <TabsTrigger key={value} value={value} className="gap-2 py-2">
              <Icon className="h-4 w-4" />
              {label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="catalog" className="space-y-6">
          <CatalogRulesTab
            rules={rules}
            templates={templates}
            stats={stats}
            isLoading={isLoading}
            onNewRule={handleNewRule}
            onEditRule={handleEditRule}
            onTestRule={handleTestRule}
            onDuplicateRule={handleDuplicateRule}
            onDeleteRule={handleDeleteRule}
            onToggleRule={toggleRule}
            onSelectTemplate={handleSelectTemplate}
          />
        </TabsContent>

        <TabsContent value="pricing" className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <PriceRulesDashboard />
          </motion.div>
        </TabsContent>

        <TabsContent value="feeds" className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <FeedRulesDashboard />
          </motion.div>
        </TabsContent>

        <TabsContent value="executions" className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <RulesExecutionHistory />
          </motion.div>
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
