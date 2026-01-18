/**
 * CatalogRulesTab - Contenu de l'onglet Catalogue
 */
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Play, Pause, ListFilter, ArrowRight } from 'lucide-react';
import { RulesStatsGrid } from './RulesStatsGrid';
import { CatalogRuleCard } from './CatalogRuleCard';
import { ProductRule, RuleTemplate } from '@/lib/rules/ruleTypes';

interface CatalogRulesTabProps {
  rules: ProductRule[];
  templates: RuleTemplate[];
  stats: {
    activeRules: number;
    pausedRules: number;
    totalExecutions: number;
    aiRules: number;
  };
  isLoading: boolean;
  onNewRule: () => void;
  onEditRule: (rule: ProductRule) => void;
  onTestRule: (rule: ProductRule) => void;
  onDuplicateRule: (rule: ProductRule) => void;
  onDeleteRule: (ruleId: string) => void;
  onToggleRule: (params: { id: string; enabled: boolean }) => void;
  onSelectTemplate: (templateId: string) => void;
}

const CHANNEL_COLORS: Record<string, string> = {
  global: 'bg-slate-500',
  google: 'bg-blue-500',
  meta: 'bg-indigo-500',
  tiktok: 'bg-pink-500',
  amazon: 'bg-orange-500',
  shopify: 'bg-green-500'
};

export function CatalogRulesTab({
  rules = [],
  templates = [],
  stats,
  isLoading,
  onNewRule,
  onEditRule,
  onTestRule,
  onDuplicateRule,
  onDeleteRule,
  onToggleRule,
  onSelectTemplate,
}: CatalogRulesTabProps) {
  const [activeTab, setActiveTab] = useState('active');
  
  // Safe filtering with fallback to empty array
  const safeRules = Array.isArray(rules) ? rules : [];
  const safeTemplates = Array.isArray(templates) ? templates : [];
  
  const activeRules = safeRules.filter(r => r?.enabled);
  const pausedRules = safeRules.filter(r => !r?.enabled);

  const getChannelBadge = (channel: string) => (
    <Badge 
      variant="secondary" 
      className={`${CHANNEL_COLORS[channel] || 'bg-gray-500'} text-white text-xs`}
    >
      {channel}
    </Badge>
  );

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <RulesStatsGrid stats={stats} isLoading={isLoading} />

      {/* Rules Tabs */}
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
            Modèles ({safeTemplates.length})
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
                <Button onClick={onNewRule} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Créer une règle
                </Button>
              </CardContent>
            </Card>
          ) : (
            <AnimatePresence mode="popLayout">
              <div className="space-y-4">
                {activeRules.map(rule => (
                  <CatalogRuleCard
                    key={rule.id}
                    rule={rule}
                    onEdit={onEditRule}
                    onTest={onTestRule}
                    onDuplicate={onDuplicateRule}
                    onDelete={onDeleteRule}
                    onToggle={onToggleRule}
                  />
                ))}
              </div>
            </AnimatePresence>
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
            <AnimatePresence mode="popLayout">
              <div className="space-y-4">
                {pausedRules.map(rule => (
                  <CatalogRuleCard
                    key={rule.id}
                    rule={rule}
                    onEdit={onEditRule}
                    onTest={onTestRule}
                    onDuplicate={onDuplicateRule}
                    onDelete={onDeleteRule}
                    onToggle={onToggleRule}
                  />
                ))}
              </div>
            </AnimatePresence>
          )}
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {safeTemplates.map((template, index) => (
              <motion.div
                key={template.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ y: -4, scale: 1.01 }}
              >
                <Card className="hover:shadow-lg transition-all h-full border-border/50 group">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <h4 className="font-semibold">{template.name}</h4>
                      {getChannelBadge(template.channel)}
                    </div>
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {template.description}
                    </p>
                    <Badge variant="outline" className="mb-4">{template.category}</Badge>
                    <Button 
                      variant="outline" 
                      className="w-full gap-2 group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                      onClick={() => onSelectTemplate(template.id)}
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
    </div>
  );
}
