/**
 * Vue Règles pour la page Produits
 */
import { motion } from 'framer-motion'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Package, DollarSign, Rss, History } from 'lucide-react'
import { CatalogRulesTab } from '@/components/rules/CatalogRulesTab'
import { RulesExecutionHistory } from '@/components/rules/RulesExecutionHistory'
import { FeedRulesDashboard } from '@/components/feed-rules'
import { PriceRulesDashboard } from '@/components/price-rules'
import { ProductRule } from '@/lib/rules/ruleTypes'

interface ProductsRulesViewProps {
  rules: ProductRule[]
  templates: any[]
  stats: any
  isLoading: boolean
  subTab: 'catalog' | 'pricing' | 'feeds' | 'executions'
  onSubTabChange: (tab: 'catalog' | 'pricing' | 'feeds' | 'executions') => void
  onNewRule: () => void
  onEditRule: (rule: ProductRule) => void
  onTestRule: (rule: ProductRule) => void
  onDuplicateRule: (rule: ProductRule) => void
  onDeleteRule: (ruleId: string) => void
  onToggleRule: (params: { id: string; enabled: boolean }) => void
  onSelectTemplate: (templateId: string) => void
}

export function ProductsRulesView({
  rules,
  templates,
  stats,
  isLoading,
  subTab,
  onSubTabChange,
  onNewRule,
  onEditRule,
  onTestRule,
  onDuplicateRule,
  onDeleteRule,
  onToggleRule,
  onSelectTemplate
}: ProductsRulesViewProps) {
  return (
    <div className="space-y-6">
      <Tabs value={subTab} onValueChange={(v) => onSubTabChange(v as any)} className="space-y-6">
        <TabsList className="w-full justify-start bg-muted/50 p-1 h-auto flex-wrap">
          <TabsTrigger value="catalog" className="gap-2 py-2">
            <Package className="h-4 w-4" />
            Catalogue
          </TabsTrigger>
          <TabsTrigger value="pricing" className="gap-2 py-2">
            <DollarSign className="h-4 w-4" />
            Prix
          </TabsTrigger>
          <TabsTrigger value="feeds" className="gap-2 py-2">
            <Rss className="h-4 w-4" />
            Feeds
          </TabsTrigger>
          <TabsTrigger value="executions" className="gap-2 py-2">
            <History className="h-4 w-4" />
            Exécutions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="catalog" className="space-y-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <CatalogRulesTab
              rules={rules}
              templates={templates}
              stats={stats}
              isLoading={isLoading}
              onNewRule={onNewRule}
              onEditRule={onEditRule}
              onTestRule={onTestRule}
              onDuplicateRule={onDuplicateRule}
              onDeleteRule={onDeleteRule}
              onToggleRule={onToggleRule}
              onSelectTemplate={onSelectTemplate}
            />
          </motion.div>
        </TabsContent>

        <TabsContent value="pricing" className="space-y-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <PriceRulesDashboard />
          </motion.div>
        </TabsContent>

        <TabsContent value="feeds" className="space-y-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <FeedRulesDashboard />
          </motion.div>
        </TabsContent>

        <TabsContent value="executions" className="space-y-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <RulesExecutionHistory />
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
