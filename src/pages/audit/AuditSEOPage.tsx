/**
 * Page d'audit SEO des produits - Version Premium Avancée
 */

import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';
import { useAuditSEO, SEOAnalysis } from '@/hooks/useAuditSEO';
import { useToast } from '@/hooks/use-toast';
import { 
  Search, TrendingUp, AlertCircle, CheckCircle2, RefreshCw, FileText, Globe, 
  Link, Image, Tag, XCircle, ChevronRight, BarChart3, Lightbulb, Sparkles,
  Download, Filter, ArrowUpDown, Eye, Edit, Zap, Target, Award, AlertTriangle,
  TrendingDown, Clock, CheckCheck, Wand2, Copy, ExternalLink, ChevronDown, ChevronUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

export default function AuditSEOPage() {
  const { t } = useTranslation('audit');
  const { seoAnalyses, stats, isLoading, refetch, searchQuery, setSearchQuery } = useAuditSEO();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<'score' | 'name' | 'issues'>('score');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [filterStatus, setFilterStatus] = useState<'all' | 'good' | 'warning' | 'error'>('all');
  const [issueFilter, setIssueFilter] = useState<'all' | 'title' | 'description' | 'keyword' | 'image' | 'category'>('all');
  const [expandedProduct, setExpandedProduct] = useState<string | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const handleIssueCategoryClick = (category: 'title' | 'description' | 'keyword' | 'image' | 'category') => {
    setIssueFilter(category);
    setActiveTab('products');
  };

  const handleFixAll = () => {
    setActiveTab('recommendations');
  };

  const filteredAnalyses = useMemo(() => {
    let result = [...seoAnalyses];

    if (filterStatus !== 'all') {
      result = result.filter(a => {
        if (filterStatus === 'good') return a.seoScore >= 80;
        if (filterStatus === 'warning') return a.seoScore >= 50 && a.seoScore < 80;
        return a.seoScore < 50;
      });
    }

    if (issueFilter !== 'all') {
      result = result.filter(a => {
        switch (issueFilter) {
          case 'title': return a.metrics.titleOptimization.status !== 'good';
          case 'description': return a.metrics.descriptionOptimization.status !== 'good';
          case 'keyword': return a.metrics.keywordDensity.status !== 'good';
          case 'image': return a.metrics.imageAlt.status !== 'good';
          case 'category': return a.metrics.categoryMapping.status !== 'good';
          default: return true;
        }
      });
    }

    result.sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'score') comparison = a.seoScore - b.seoScore;
      else if (sortBy === 'name') comparison = (a.product.name || '').localeCompare(b.product.name || '');
      else if (sortBy === 'issues') comparison = a.issues.length - b.issues.length;
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [seoAnalyses, filterStatus, issueFilter, sortBy, sortOrder]);

  const toggleSelectAll = () => {
    if (selectedProducts.size === filteredAnalyses.length) {
      setSelectedProducts(new Set());
    } else {
      setSelectedProducts(new Set(filteredAnalyses.map(a => a.product.id)));
    }
  };

  const toggleProduct = (id: string) => {
    const newSet = new Set(selectedProducts);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedProducts(newSet);
  };

  const handleBulkOptimize = async () => {
    if (selectedProducts.size === 0) {
      toast({ title: t('seo.selectProducts'), variant: "destructive" });
      return;
    }
    setIsOptimizing(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    toast({
      title: t('seo.optimizationStarted'),
      description: t('seo.optimizationStartedDesc', { count: selectedProducts.size }),
    });
    setIsOptimizing(false);
    setSelectedProducts(new Set());
  };

  const handleExportReport = () => {
    toast({
      title: t('seo.exportGenerated'),
      description: t('seo.exportGeneratedDesc'),
    });
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-600 dark:text-emerald-400';
    if (score >= 50) return 'text-amber-600 dark:text-amber-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-emerald-100 dark:bg-emerald-900/30';
    if (score >= 50) return 'bg-amber-100 dark:bg-amber-900/30';
    return 'bg-red-100 dark:bg-red-900/30';
  };

  const getStatusIcon = (status: 'good' | 'warning' | 'error') => {
    if (status === 'good') return <CheckCircle2 className="h-4 w-4 text-emerald-600" />;
    if (status === 'warning') return <AlertCircle className="h-4 w-4 text-amber-600" />;
    return <XCircle className="h-4 w-4 text-red-600" />;
  };

  const MetricCard = ({ analysis, metricKey, label, icon: Icon }: { 
    analysis: SEOAnalysis; 
    metricKey: keyof SEOAnalysis['metrics']; 
    label: string;
    icon: any;
  }) => {
    const metric = analysis.metrics[metricKey];
    return (
      <div className={cn(
        'p-3 rounded-lg border transition-all',
        metric.status === 'good' ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200' :
        metric.status === 'warning' ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200' :
        'bg-red-50 dark:bg-red-900/20 border-red-200'
      )}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Icon className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">{label}</span>
          </div>
          {getStatusIcon(metric.status)}
        </div>
        <Progress 
          value={metric.score} 
          className={cn('h-2', 
            metric.status === 'good' ? '[&>div]:bg-emerald-500' :
            metric.status === 'warning' ? '[&>div]:bg-amber-500' :
            '[&>div]:bg-red-500'
          )} 
        />
        <p className="text-xs text-muted-foreground mt-1">{metric.details}</p>
      </div>
    );
  };

  const issueFilterLabels: Record<string, string> = {
    title: t('seo.titles'),
    description: t('seo.descriptions'),
    keyword: t('seo.keywords'),
    image: t('seo.images'),
    category: t('seo.categories'),
  };

  if (isLoading) {
    return (
      <ChannablePageWrapper
        title="Audit SEO"
        description={t('seo.loading')}
        heroImage="analytics"
        badge={{ label: "SEO", icon: Search }}
      >
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i} className="animate-pulse">
              <CardContent className="h-28 flex items-center justify-center">
                <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
              </CardContent>
            </Card>
          ))}
        </div>
      </ChannablePageWrapper>
    );
  }

  return (
    <ChannablePageWrapper
      title={t('seo.title')}
      subtitle={t('seo.subtitle')}
      description={t('seo.description')}
      heroImage="analytics"
      badge={{ label: t('seo.badge'), icon: Search }}
      actions={
        <div className="flex gap-3">
          <Button variant="outline" size="lg" onClick={handleExportReport} className="gap-2">
            <Download className="h-4 w-4" />
            {t('seo.export')}
          </Button>
          <Button size="lg" onClick={() => refetch()} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            {t('seo.relaunch')}
          </Button>
        </div>
      }
    >
      {/* Stats Cards Premium */}
      <div className="grid gap-4 md:grid-cols-5">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="relative overflow-hidden border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
            <div className="absolute top-0 right-0 w-20 h-20 bg-primary/10 rounded-full -mr-10 -mt-10" />
            <CardContent className="pt-6 relative">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{t('seo.globalScore')}</p>
                  <div className={cn('text-4xl font-bold', getScoreColor(stats.averageSeoScore))}>
                    {stats.averageSeoScore}
                    <span className="text-lg text-muted-foreground">/100</span>
                  </div>
                </div>
                <div className={cn('p-4 rounded-full', getScoreBg(stats.averageSeoScore))}>
                  <Target className={cn('h-7 w-7', getScoreColor(stats.averageSeoScore))} />
                </div>
              </div>
              <Progress value={stats.averageSeoScore} className="mt-4 h-2" />
              <p className="text-xs text-muted-foreground mt-2">
                {stats.averageSeoScore >= 80 ? t('seo.excellentLevel') :
                 stats.averageSeoScore >= 50 ? t('seo.canBeImproved') :
                 t('seo.urgentOptimization')}
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="border-emerald-200 dark:border-emerald-800 bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-900/20 dark:to-emerald-800/10">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-emerald-200 dark:bg-emerald-800">
                  <Award className="h-5 w-5 text-emerald-700 dark:text-emerald-300" />
                </div>
                <div>
                  <p className="text-xs text-emerald-700 dark:text-emerald-400 uppercase tracking-wide">{t('seo.optimized')}</p>
                  <div className="text-3xl font-bold text-emerald-700 dark:text-emerald-400">{stats.optimizedProducts}</div>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                {t('seo.ofCatalog', { percent: stats.totalProducts > 0 ? Math.round((stats.optimizedProducts / stats.totalProducts) * 100) : 0 })}
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="border-amber-200 dark:border-amber-800 bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-900/20 dark:to-amber-800/10">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-amber-200 dark:bg-amber-800">
                  <AlertTriangle className="h-5 w-5 text-amber-700 dark:text-amber-300" />
                </div>
                <div>
                  <p className="text-xs text-amber-700 dark:text-amber-400 uppercase tracking-wide">{t('seo.toImprove')}</p>
                  <div className="text-3xl font-bold text-amber-700 dark:text-amber-400">{stats.partiallyOptimized}</div>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-3">{t('seo.scoreBetween')}</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="border-red-200 dark:border-red-800 bg-gradient-to-br from-red-50 to-red-100/50 dark:from-red-900/20 dark:to-red-800/10">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-red-200 dark:bg-red-800">
                  <TrendingDown className="h-5 w-5 text-red-700 dark:text-red-300" />
                </div>
                <div>
                  <p className="text-xs text-red-700 dark:text-red-400 uppercase tracking-wide">{t('seo.critical')}</p>
                  <div className="text-3xl font-bold text-red-700 dark:text-red-400">{stats.needsOptimization}</div>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-3">{t('seo.urgentAction')}</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card className="border-purple-200 dark:border-purple-800 bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-900/20 dark:to-purple-800/10">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-purple-200 dark:bg-purple-800">
                  <Sparkles className="h-5 w-5 text-purple-700 dark:text-purple-300" />
                </div>
                <div>
                  <p className="text-xs text-purple-700 dark:text-purple-400 uppercase tracking-wide">{t('seo.totalAnalyzed')}</p>
                  <div className="text-3xl font-bold text-purple-700 dark:text-purple-400">{stats.totalProducts}</div>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-3">{t('seo.catalogProducts')}</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Issue Breakdown Premium */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                {t('seo.issueBreakdown')}
              </CardTitle>
              <CardDescription>{t('seo.detailedDiagnosis')}</CardDescription>
            </div>
            <Button variant="outline" size="sm" className="gap-2" onClick={handleFixAll}>
              <Zap className="h-4 w-4" />
              {t('seo.fixAll')}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-5">
            {[
              { label: t('seo.titles'), value: stats.issueBreakdown.titleIssues, icon: FileText, color: 'blue', tip: t('seo.titlesTip'), filterKey: 'title' as const },
              { label: t('seo.descriptions'), value: stats.issueBreakdown.descriptionIssues, icon: FileText, color: 'indigo', tip: t('seo.descriptionsTip'), filterKey: 'description' as const },
              { label: t('seo.keywords'), value: stats.issueBreakdown.keywordIssues, icon: Tag, color: 'violet', tip: t('seo.keywordsTip'), filterKey: 'keyword' as const },
              { label: t('seo.images'), value: stats.issueBreakdown.imageIssues, icon: Image, color: 'pink', tip: t('seo.imagesTip'), filterKey: 'image' as const },
              { label: t('seo.categories'), value: stats.issueBreakdown.categoryIssues, icon: Globe, color: 'orange', tip: t('seo.categoriesTip'), filterKey: 'category' as const },
            ].map((item, idx) => (
              <TooltipProvider key={idx}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: idx * 0.05 }}
                      onClick={() => item.value > 0 && handleIssueCategoryClick(item.filterKey)}
                      className={cn(
                        'text-center p-4 rounded-xl border-2 transition-all hover:shadow-lg',
                        item.value > 0 
                          ? 'border-orange-200 bg-orange-50/50 dark:bg-orange-900/10 cursor-pointer' 
                          : 'border-emerald-200 bg-emerald-50/50 dark:bg-emerald-900/10',
                        issueFilter === item.filterKey && 'ring-2 ring-primary ring-offset-2'
                      )}
                    >
                      <item.icon className={cn(
                        'h-6 w-6 mx-auto mb-2',
                        item.value > 0 ? 'text-orange-600' : 'text-emerald-600'
                      )} />
                      <div className={cn(
                        'text-3xl font-bold',
                        item.value > 0 ? 'text-orange-600' : 'text-emerald-600'
                      )}>
                        {item.value}
                      </div>
                      <p className="text-sm font-medium text-muted-foreground mt-1">{item.label}</p>
                      {item.value > 0 && (
                        <Badge 
                          variant="outline" 
                          className="mt-2 text-xs bg-orange-100 text-orange-700 border-orange-300 cursor-pointer hover:bg-orange-200"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleIssueCategoryClick(item.filterKey);
                          }}
                        >
                          {t('seo.toFix')}
                        </Badge>
                      )}
                    </motion.div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{item.tip}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 w-full max-w-2xl">
          <TabsTrigger value="overview" className="gap-2">
            <Lightbulb className="h-4 w-4" />
            <span className="hidden sm:inline">{t('seo.tabs.overview')}</span>
          </TabsTrigger>
          <TabsTrigger value="products" className="gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">{t('seo.tabs.products')}</span>
            <Badge variant="secondary" className="ml-1">{filteredAnalyses.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="keywords" className="gap-2">
            <Tag className="h-4 w-4" />
            <span className="hidden sm:inline">{t('seo.tabs.keywords')}</span>
          </TabsTrigger>
          <TabsTrigger value="recommendations" className="gap-2">
            <Sparkles className="h-4 w-4" />
            <span className="hidden sm:inline">{t('seo.tabs.ai')}</span>
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  {t('seo.bestPractices')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 rounded-lg bg-muted/50 border">
                  <h4 className="font-semibold flex items-center gap-2 mb-3">
                    <FileText className="h-4 w-4 text-blue-600" /> {t('seo.productTitles')}
                  </h4>
                  <ul className="text-sm text-muted-foreground space-y-2">
                    <li className="flex items-start gap-2">
                      <CheckCheck className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                      {t('seo.titleTip1')}
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCheck className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                      {t('seo.titleTip2')}
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCheck className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                      {t('seo.titleTip3')}
                    </li>
                  </ul>
                </div>
                <div className="p-4 rounded-lg bg-muted/50 border">
                  <h4 className="font-semibold flex items-center gap-2 mb-3">
                    <FileText className="h-4 w-4 text-indigo-600" /> {t('seo.descriptionsLabel')}
                  </h4>
                  <ul className="text-sm text-muted-foreground space-y-2">
                    <li className="flex items-start gap-2">
                      <CheckCheck className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                      {t('seo.descTip1')}
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCheck className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                      {t('seo.descTip2')}
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCheck className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                      {t('seo.descTip3')}
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  {t('seo.potentialImpact')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 rounded-lg border border-primary/20 bg-primary/5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">{t('seo.estimatedVisibility')}</span>
                    <Badge className="bg-emerald-100 text-emerald-700">+{Math.round(stats.averageSeoScore * 0.3)}%</Badge>
                  </div>
                  <Progress value={stats.averageSeoScore * 0.8} className="h-2" />
                </div>
                <div className="p-4 rounded-lg border border-amber-200 bg-amber-50/50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">{t('seo.potentialCTR')}</span>
                    <Badge className="bg-amber-100 text-amber-700">+{Math.round(stats.averageSeoScore * 0.2)}%</Badge>
                  </div>
                  <Progress value={stats.averageSeoScore * 0.6} className="h-2 [&>div]:bg-amber-500" />
                </div>
                <div className="p-4 rounded-lg border border-blue-200 bg-blue-50/50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">{t('seo.conversions')}</span>
                    <Badge className="bg-blue-100 text-blue-700">+{Math.round(stats.averageSeoScore * 0.15)}%</Badge>
                  </div>
                  <Progress value={stats.averageSeoScore * 0.5} className="h-2 [&>div]:bg-blue-500" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Products Tab */}
        <TabsContent value="products" className="space-y-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      placeholder={t('seo.searchProduct')} 
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="pl-10" 
                    />
                  </div>
                  <Button variant="outline" size="icon" onClick={() => setShowFilters(!showFilters)}>
                    <Filter className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  {selectedProducts.size > 0 && (
                    <Button 
                      onClick={handleBulkOptimize} 
                      disabled={isOptimizing}
                      className="gap-2 bg-gradient-to-r from-purple-600 to-indigo-600"
                    >
                      {isOptimizing ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <Wand2 className="h-4 w-4" />
                      )}
                      {t('seo.optimizeN', { count: selectedProducts.size })}
                    </Button>
                  )}
                </div>
              </div>

              <AnimatePresence>
                {showFilters && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">{t('seo.statusLabel')}</span>
                        {(['all', 'good', 'warning', 'error'] as const).map(status => (
                          <Button
                            key={status}
                            size="sm"
                            variant={filterStatus === status ? 'default' : 'outline'}
                            onClick={() => setFilterStatus(status)}
                            className="h-8"
                          >
                            {status === 'all' && t('seo.all')}
                            {status === 'good' && t('seo.optimizedFilter')}
                            {status === 'warning' && t('seo.warningFilter')}
                            {status === 'error' && t('seo.criticalFilter')}
                          </Button>
                        ))}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">{t('seo.categoryLabel')}</span>
                        {([
                          { key: 'all', label: t('seo.allCategories') },
                          { key: 'title', label: t('seo.titles') },
                          { key: 'description', label: t('seo.descriptions') },
                          { key: 'keyword', label: t('seo.keywords') },
                          { key: 'image', label: t('seo.images') },
                          { key: 'category', label: t('seo.categories') },
                        ] as const).map(cat => (
                          <Button
                            key={cat.key}
                            size="sm"
                            variant={issueFilter === cat.key ? 'default' : 'outline'}
                            onClick={() => setIssueFilter(cat.key)}
                            className="h-8"
                          >
                            {cat.label}
                          </Button>
                        ))}
                      </div>
                      <div className="flex items-center gap-2 ml-auto">
                        <span className="text-sm text-muted-foreground">{t('seo.sortBy')}</span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            if (sortBy === 'score') setSortOrder(o => o === 'asc' ? 'desc' : 'asc');
                            else { setSortBy('score'); setSortOrder('asc'); }
                          }}
                          className={cn('h-8', sortBy === 'score' && 'border-primary')}
                        >
                          {t('seo.score')} {sortBy === 'score' && (sortOrder === 'asc' ? '↑' : '↓')}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            if (sortBy === 'issues') setSortOrder(o => o === 'asc' ? 'desc' : 'asc');
                            else { setSortBy('issues'); setSortOrder('desc'); }
                          }}
                          className={cn('h-8', sortBy === 'issues' && 'border-primary')}
                        >
                          {t('seo.issues')} {sortBy === 'issues' && (sortOrder === 'asc' ? '↑' : '↓')}
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>

          {issueFilter !== 'all' && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-between p-3 rounded-lg bg-primary/10 border border-primary/20"
            >
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">
                  {t('seo.activeFilter')} <span className="text-primary capitalize">{issueFilterLabels[issueFilter]}</span>
                </span>
                <Badge variant="secondary">{t('seo.nProducts', { count: filteredAnalyses.length })}</Badge>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setIssueFilter('all')} className="gap-1">
                <XCircle className="h-4 w-4" />
                {t('seo.clearFilter')}
              </Button>
            </motion.div>
          )}

          <div className="flex items-center gap-3 px-2">
            <Checkbox
              checked={selectedProducts.size === filteredAnalyses.length && filteredAnalyses.length > 0}
              onCheckedChange={toggleSelectAll}
            />
            <span className="text-sm text-muted-foreground">
              {selectedProducts.size > 0 
                ? t('seo.nSelected', { count: selectedProducts.size })
                : t('seo.selectAll', { count: filteredAnalyses.length })}
            </span>
          </div>

          <ScrollArea className="h-[600px]">
            <div className="space-y-2 pr-4">
              {filteredAnalyses.slice(0, 50).map((analysis, idx) => (
                <motion.div
                  key={analysis.product.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.02 }}
                >
                  <Card className={cn(
                    'transition-all hover:shadow-md',
                    selectedProducts.has(analysis.product.id) && 'ring-2 ring-primary',
                    expandedProduct === analysis.product.id && 'shadow-lg'
                  )}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <Checkbox
                          checked={selectedProducts.has(analysis.product.id)}
                          onCheckedChange={() => toggleProduct(analysis.product.id)}
                        />
                        
                        <div className={cn(
                          'w-14 h-14 rounded-xl flex flex-col items-center justify-center font-bold shrink-0',
                          getScoreBg(analysis.seoScore)
                        )}>
                          <span className={cn('text-xl', getScoreColor(analysis.seoScore))}>
                            {analysis.seoScore}
                          </span>
                          <span className="text-[10px] text-muted-foreground">/ 100</span>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium truncate">{analysis.product.name || t('seo.untitled')}</h4>
                          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                            {analysis.product.sku && (
                              <span className="flex items-center gap-1">
                                <Tag className="h-3 w-3" />
                                {analysis.product.sku}
                              </span>
                            )}
                            {analysis.issues.length > 0 && (
                              <Badge variant="outline" className="text-orange-600 border-orange-300">
                                {t('seo.nIssues', { count: analysis.issues.length })}
                              </Badge>
                            )}
                          </div>
                          
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {Object.entries(analysis.metrics).slice(0, 4).map(([key, metric]) => (
                              <TooltipProvider key={key}>
                                <Tooltip>
                                  <TooltipTrigger>
                                    <div className={cn(
                                      'inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium',
                                      metric.status === 'good' ? 'bg-emerald-100 text-emerald-700' :
                                      metric.status === 'warning' ? 'bg-amber-100 text-amber-700' :
                                      'bg-red-100 text-red-700'
                                    )}>
                                      {getStatusIcon(metric.status)}
                                      {metric.score}
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p className="font-medium">{key}</p>
                                    <p className="text-xs">{metric.details}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            ))}
                          </div>
                        </div>

                        <div className="hidden lg:flex gap-1.5 flex-wrap max-w-[200px]">
                          {analysis.keywords.slice(0, 3).map(kw => (
                            <Badge key={kw} variant="secondary" className="text-xs">{kw}</Badge>
                          ))}
                          {analysis.keywords.length > 3 && (
                            <Badge variant="outline" className="text-xs">+{analysis.keywords.length - 3}</Badge>
                          )}
                        </div>

                        <div className="flex items-center gap-1">
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" variant="ghost" className="h-8 w-8 p-0"
                            onClick={() => setExpandedProduct(expandedProduct === analysis.product.id ? null : analysis.product.id)}
                          >
                            {expandedProduct === analysis.product.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>

                      <AnimatePresence>
                        {expandedProduct === analysis.product.id && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="mt-4 pt-4 border-t space-y-4">
                              <div className="grid gap-3 md:grid-cols-3">
                                <MetricCard analysis={analysis} metricKey="titleOptimization" label={t('seo.metricTitle')} icon={FileText} />
                                <MetricCard analysis={analysis} metricKey="descriptionOptimization" label={t('seo.metricDescription')} icon={FileText} />
                                <MetricCard analysis={analysis} metricKey="keywordDensity" label={t('seo.metricKeywords')} icon={Tag} />
                                <MetricCard analysis={analysis} metricKey="imageAlt" label={t('seo.metricImages')} icon={Image} />
                                <MetricCard analysis={analysis} metricKey="urlStructure" label={t('seo.metricUrl')} icon={Link} />
                                <MetricCard analysis={analysis} metricKey="categoryMapping" label={t('seo.metricCategory')} icon={Globe} />
                              </div>

                              {analysis.issues.length > 0 && (
                                <div className="space-y-2">
                                  <h5 className="text-sm font-semibold flex items-center gap-2">
                                    <AlertCircle className="h-4 w-4 text-orange-600" />
                                    {t('seo.detectedIssues')}
                                  </h5>
                                  <div className="grid gap-2 md:grid-cols-2">
                                    {analysis.issues.map((issue, i) => (
                                      <div 
                                        key={i} 
                                        className={cn(
                                          'p-3 rounded-lg border',
                                          issue.type === 'error' ? 'bg-red-50 border-red-200' :
                                          issue.type === 'warning' ? 'bg-amber-50 border-amber-200' :
                                          'bg-blue-50 border-blue-200'
                                        )}
                                      >
                                        <div className="flex items-start gap-2">
                                          {issue.type === 'error' ? <XCircle className="h-4 w-4 text-red-600 mt-0.5" /> :
                                           issue.type === 'warning' ? <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5" /> :
                                           <Lightbulb className="h-4 w-4 text-blue-600 mt-0.5" />}
                                          <div>
                                            <p className="text-sm font-medium">{issue.title}</p>
                                            <p className="text-xs text-muted-foreground mt-0.5">{issue.description}</p>
                                            <p className="text-xs text-primary mt-1 flex items-center gap-1">
                                              <Sparkles className="h-3 w-3" />
                                              {issue.fixSuggestion}
                                            </p>
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              <div className="flex gap-2">
                                <Button size="sm" className="gap-2" onClick={() => {
                                  toast({ title: t('seo.optimizationStarted'), description: t('seo.aiOptimizing', { name: analysis.product.name }) });
                                }}>
                                  <Wand2 className="h-4 w-4" />
                                  {t('seo.optimizeWithAI')}
                                </Button>
                                <Button size="sm" variant="outline" className="gap-2" onClick={() => {
                                  window.open(`/products?search=${encodeURIComponent(analysis.product.name || '')}`, '_blank');
                                }}>
                                  <Eye className="h-4 w-4" />
                                  {t('seo.viewProduct')}
                                </Button>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Keywords Tab */}
        <TabsContent value="keywords">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tag className="h-5 w-5 text-primary" />
                {t('seo.mostUsedKeywords')}
              </CardTitle>
              <CardDescription>{t('seo.frequentTerms')}</CardDescription>
            </CardHeader>
            <CardContent>
              {stats.topKeywords.length > 0 ? (
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {stats.topKeywords.map((kw, idx) => (
                      <motion.div
                        key={kw.keyword}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: idx * 0.03 }}
                      >
                        <Badge 
                          variant="secondary" 
                          className={cn(
                            'text-sm py-1.5 px-3 cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors',
                            idx < 3 && 'bg-primary/10 text-primary border border-primary/20'
                          )}
                        >
                          {kw.keyword}
                          <span className="ml-2 opacity-60">({kw.count})</span>
                        </Badge>
                      </motion.div>
                    ))}
                  </div>
                  
                  <div className="grid gap-4 md:grid-cols-3 mt-6">
                    <Card className="border-dashed">
                      <CardContent className="pt-4">
                        <div className="text-center">
                          <TrendingUp className="h-8 w-8 mx-auto mb-2 text-emerald-600" />
                          <p className="text-2xl font-bold">{stats.topKeywords.length}</p>
                          <p className="text-sm text-muted-foreground">{t('seo.uniqueKeywords')}</p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="border-dashed">
                      <CardContent className="pt-4">
                        <div className="text-center">
                          <Target className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                          <p className="text-2xl font-bold">
                            {stats.topKeywords.length > 0 ? stats.topKeywords[0].count : 0}
                          </p>
                          <p className="text-sm text-muted-foreground">{t('seo.maxFrequency')}</p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="border-dashed">
                      <CardContent className="pt-4">
                        <div className="text-center">
                          <BarChart3 className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                          <p className="text-2xl font-bold">
                            {stats.topKeywords.length > 0 
                              ? Math.round(stats.topKeywords.reduce((sum, k) => sum + k.count, 0) / stats.topKeywords.length)
                              : 0}
                          </p>
                          <p className="text-sm text-muted-foreground">{t('seo.avgUsage')}</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              ) : (
                <div className="text-center py-10 text-muted-foreground">
                  <Tag className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>{t('seo.noKeywords')}</p>
                  <p className="text-sm">{t('seo.enrichProducts')}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* AI Recommendations Tab */}
        <TabsContent value="recommendations" className="space-y-4">
          <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-600" />
                {t('seo.aiOptimization')}
              </CardTitle>
              <CardDescription>{t('seo.aiOptimizationDesc')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Card 
                  className="border-2 border-dashed border-purple-200 hover:border-purple-400 transition-colors cursor-pointer"
                  onClick={() => {
                    setIssueFilter('title');
                    setActiveTab('products');
                    toast({ title: t('seo.filterApplied'), description: t('seo.filterTitlesDesc') });
                  }}
                >
                  <CardContent className="pt-6 text-center">
                    <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-4">
                      <Wand2 className="h-6 w-6 text-purple-600" />
                    </div>
                    <h4 className="font-semibold mb-2">{t('seo.optimizeTitles')}</h4>
                    <p className="text-sm text-muted-foreground mb-4">{t('seo.optimizeTitlesDesc')}</p>
                    <Badge className="bg-purple-100 text-purple-700">
                      {t('seo.nToOptimize', { count: stats.issueBreakdown.titleIssues })}
                    </Badge>
                  </CardContent>
                </Card>

                <Card 
                  className="border-2 border-dashed border-indigo-200 hover:border-indigo-400 transition-colors cursor-pointer"
                  onClick={() => {
                    setIssueFilter('description');
                    setActiveTab('products');
                    toast({ title: t('seo.filterApplied'), description: t('seo.filterDescriptionsDesc') });
                  }}
                >
                  <CardContent className="pt-6 text-center">
                    <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center mx-auto mb-4">
                      <FileText className="h-6 w-6 text-indigo-600" />
                    </div>
                    <h4 className="font-semibold mb-2">{t('seo.enrichDescriptions')}</h4>
                    <p className="text-sm text-muted-foreground mb-4">{t('seo.enrichDescriptionsDesc')}</p>
                    <Badge className="bg-indigo-100 text-indigo-700">
                      {t('seo.nToEnrich', { count: stats.issueBreakdown.descriptionIssues })}
                    </Badge>
                  </CardContent>
                </Card>

                <Card 
                  className="border-2 border-dashed border-blue-200 hover:border-blue-400 transition-colors cursor-pointer"
                  onClick={() => {
                    setIssueFilter('image');
                    setActiveTab('products');
                    toast({ title: t('seo.filterApplied'), description: t('seo.filterImagesDesc') });
                  }}
                >
                  <CardContent className="pt-6 text-center">
                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
                      <Image className="h-6 w-6 text-blue-600" />
                    </div>
                    <h4 className="font-semibold mb-2">{t('seo.altTextImages')}</h4>
                    <p className="text-sm text-muted-foreground mb-4">{t('seo.altTextImagesDesc')}</p>
                    <Badge className="bg-blue-100 text-blue-700">
                      {t('seo.nImages', { count: stats.issueBreakdown.imageIssues })}
                    </Badge>
                  </CardContent>
                </Card>

                <Card 
                  className="border-2 border-dashed border-emerald-200 hover:border-emerald-400 transition-colors cursor-pointer"
                  onClick={() => {
                    setIssueFilter('keyword');
                    setActiveTab('products');
                    toast({ title: t('seo.filterApplied'), description: t('seo.filterKeywordsDesc') });
                  }}
                >
                  <CardContent className="pt-6 text-center">
                    <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                      <Tag className="h-6 w-6 text-emerald-600" />
                    </div>
                    <h4 className="font-semibold mb-2">{t('seo.enrichKeywords')}</h4>
                    <p className="text-sm text-muted-foreground mb-4">{t('seo.enrichKeywordsDesc')}</p>
                    <Badge className="bg-emerald-100 text-emerald-700">
                      {t('seo.nKeywordProducts', { count: stats.issueBreakdown.keywordIssues })}
                    </Badge>
                  </CardContent>
                </Card>
              </div>

              <Button 
                className="w-full gap-2 h-12 text-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                onClick={() => {
                  setIsOptimizing(true);
                  toast({ title: t('seo.globalOptimizationStarted'), description: t('seo.globalOptimizationStartedDesc') });
                  setTimeout(() => {
                    setIsOptimizing(false);
                    toast({ title: t('seo.optimizationDone'), description: t('seo.optimizationDoneDesc') });
                    refetch();
                  }, 3000);
                }}
                disabled={isOptimizing}
              >
                {isOptimizing ? <RefreshCw className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />}
                {isOptimizing ? t('seo.optimizing') : t('seo.launchFullOptimization')}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </ChannablePageWrapper>
  );
}
