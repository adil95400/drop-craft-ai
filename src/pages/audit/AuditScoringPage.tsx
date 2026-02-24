/**
 * Page de scoring qualité des produits - Version Premium
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';
import { AuditScoreGauge } from '@/components/audit/AuditScoreGauge';
import { useAuditScoring } from '@/hooks/useAuditScoring';
import { 
  Star, TrendingUp, AlertCircle, CheckCircle2, RefreshCw, Download, Search, 
  FileText, Image, Tag, DollarSign, Settings, Globe, ChevronRight, Sparkles,
  ArrowUp, ArrowDown, Filter
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

export default function AuditScoringPage() {
  const { scoredProducts, stats, isLoading, refetch } = useAuditScoring();
  const { t } = useTranslation('audit');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [filterScore, setFilterScore] = useState<'all' | 'excellent' | 'good' | 'needs' | 'poor'>('all');

  const filteredProducts = scoredProducts.filter(p => {
    const matchesSearch = !searchQuery || 
      p.product.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.product.sku?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterScore === 'all' ||
      (filterScore === 'excellent' && p.globalScore >= 80) ||
      (filterScore === 'good' && p.globalScore >= 60 && p.globalScore < 80) ||
      (filterScore === 'needs' && p.globalScore >= 40 && p.globalScore < 60) ||
      (filterScore === 'poor' && p.globalScore < 40);
    return matchesSearch && matchesFilter;
  });

  const categoryConfig = [
    { key: 'title', label: t('seo.titles'), icon: FileText, color: 'text-blue-600' },
    { key: 'description', label: t('seo.descriptions'), icon: FileText, color: 'text-purple-600' },
    { key: 'images', label: t('seo.images'), icon: Image, color: 'text-green-600' },
    { key: 'price', label: t('scoring.fix'), icon: DollarSign, color: 'text-yellow-600' },
    { key: 'attributes', label: t('seo.categories'), icon: Tag, color: 'text-orange-600' },
    { key: 'seo', label: 'SEO', icon: Globe, color: 'text-pink-600' },
  ];

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-green-50 dark:bg-green-900/20';
    if (score >= 60) return 'bg-yellow-50 dark:bg-yellow-900/20';
    if (score >= 40) return 'bg-orange-50 dark:bg-orange-900/20';
    return 'bg-red-50 dark:bg-red-900/20';
  };

  if (isLoading) {
    return (
      <ChannablePageWrapper
        title={t('scoring.title')}
        description={t('scoring.loadingDesc')}
        heroImage="analytics"
        badge={{ label: "Scoring", icon: Star }}
      >
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i} className="animate-pulse"><CardContent className="h-24" /></Card>
          ))}
        </div>
      </ChannablePageWrapper>
    );
  }

  return (
    <ChannablePageWrapper
      title={t('scoring.title')}
      description={t('scoring.description')}
      heroImage="analytics"
      badge={{ label: t('scoring.badge'), icon: Star }}
      actions={
        <div className="flex gap-2">
          <Button size="lg" onClick={() => refetch()} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            {t('scoring.recalculate')}
          </Button>
          <Button size="lg" variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            {t('scoring.export')}
          </Button>
        </div>
      }
    >
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-8">
                <AuditScoreGauge score={stats.averageScore} size="lg" label={t('productsList.globalScoreLabel')} />
                <div>
                  <h2 className="text-lg font-semibold text-muted-foreground">{t('scoring.catalogQuality')}</h2>
                  <div className={cn('text-4xl font-bold', getScoreColor(stats.averageScore))}>
                    {stats.averageScore >= 80 ? t('scoring.excellentLabel') : stats.averageScore >= 60 ? t('scoring.goodLabel') : stats.averageScore >= 40 ? t('scoring.toImproveLabel') : t('scoring.criticalLabel')}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {t('scoring.basedOnN', { count: stats.totalProducts })}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-4 text-center">
                <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20">
                  <div className="text-2xl font-bold text-green-600">{stats.excellentCount}</div>
                  <div className="text-xs text-muted-foreground">{t('scoring.excellents')}</div>
                </div>
                <div className="p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20">
                  <div className="text-2xl font-bold text-yellow-600">{stats.goodCount}</div>
                  <div className="text-xs text-muted-foreground">{t('scoring.goods')}</div>
                </div>
                <div className="p-3 rounded-lg bg-orange-50 dark:bg-orange-900/20">
                  <div className="text-2xl font-bold text-orange-600">{stats.needsWorkCount}</div>
                  <div className="text-xs text-muted-foreground">{t('scoring.toImproveLabel')}</div>
                </div>
                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20">
                  <div className="text-2xl font-bold text-red-600">{stats.poorCount}</div>
                  <div className="text-xs text-muted-foreground">{t('scoring.criticalLabel')}</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
        {categoryConfig.map((cat, idx) => (
          <motion.div key={cat.key} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}>
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <cat.icon className={cn('h-4 w-4', cat.color)} />
                  <span className="text-sm font-medium">{cat.label}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className={cn('text-2xl font-bold', getScoreColor(stats.categoryAverages[cat.key as keyof typeof stats.categoryAverages]))}>
                    {stats.categoryAverages[cat.key as keyof typeof stats.categoryAverages]}
                  </div>
                  <Progress value={stats.categoryAverages[cat.key as keyof typeof stats.categoryAverages]} className="flex-1 h-2" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">{t('scoring.tabOverview')}</TabsTrigger>
          <TabsTrigger value="products">{t('scoring.tabProducts', { count: filteredProducts.length })}</TabsTrigger>
          <TabsTrigger value="issues">{t('scoring.tabIssues', { count: stats.topIssues.length })}</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-destructive" />
                {t('scoring.priorityIssues')}
              </CardTitle>
              <CardDescription>{t('scoring.fixToImproveScore')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {stats.topIssues.slice(0, 5).map((issue, idx) => (
                <div key={idx} className={cn(
                  'flex items-center justify-between p-4 border rounded-lg',
                  issue.type === 'error' ? 'bg-red-50 dark:bg-red-900/10 border-red-200' :
                  issue.type === 'warning' ? 'bg-yellow-50 dark:bg-yellow-900/10 border-yellow-200' :
                  'bg-blue-50 dark:bg-blue-900/10 border-blue-200'
                )}>
                  <div className="flex items-center gap-4">
                    <AlertCircle className={cn('h-5 w-5',
                      issue.type === 'error' ? 'text-red-600' : 
                      issue.type === 'warning' ? 'text-yellow-600' : 'text-blue-600'
                    )} />
                    <div>
                      <span className="font-medium">{issue.message}</span>
                      <p className="text-sm text-muted-foreground">{t('scoring.nProductsAffected', { count: issue.count })}</p>
                    </div>
                  </div>
                  <Button size="sm" variant={issue.type === 'error' ? 'destructive' : 'outline'}>
                    {t('scoring.fix')}
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products" className="space-y-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder={t('scoring.searchPlaceholder')} value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-10" />
                </div>
                <div className="flex gap-2">
                  {(['all', 'excellent', 'good', 'needs', 'poor'] as const).map(f => (
                    <Button key={f} size="sm" variant={filterScore === f ? 'default' : 'outline'} onClick={() => setFilterScore(f)}>
                      {f === 'all' ? t('scoring.filterAll') : f === 'excellent' ? '≥80' : f === 'good' ? '60-79' : f === 'needs' ? '40-59' : '<40'}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-2">
            {filteredProducts.slice(0, 20).map((scored, idx) => (
              <motion.div key={scored.product.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.02 }}>
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <AuditScoreGauge score={scored.globalScore} size="sm" showLabel={false} />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium truncate">{scored.product.name || t('seo.untitled')}</h4>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>{scored.product.sku || t('scoring.noSku')}</span>
                          {scored.issues.length > 0 && (
                            <Badge variant="outline" className="text-xs">
                              {t('scoring.nIssuesLabel', { count: scored.issues.length })}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="hidden md:flex gap-2">
                        {categoryConfig.slice(0, 4).map(cat => (
                          <div key={cat.key} className={cn('px-2 py-1 rounded text-xs font-medium', getScoreBg(scored.scores[cat.key as keyof typeof scored.scores]))}>
                            {scored.scores[cat.key as keyof typeof scored.scores]}
                          </div>
                        ))}
                      </div>
                      <Button size="sm" variant="ghost"><ChevronRight className="h-4 w-4" /></Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="issues">
          <Card>
            <CardContent className="p-6">
              <div className="space-y-3">
                {stats.topIssues.map((issue, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Badge variant={issue.type === 'error' ? 'destructive' : 'secondary'}>{issue.count}</Badge>
                      <span>{issue.message}</span>
                    </div>
                    <Button size="sm" variant="outline">{t('scoring.viewProducts')}</Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </ChannablePageWrapper>
  );
}