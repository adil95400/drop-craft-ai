/**
 * Page d'audit SEO des produits - Version Premium
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';
import { useAuditSEO } from '@/hooks/useAuditSEO';
import { 
  Search, TrendingUp, AlertCircle, CheckCircle2, RefreshCw, FileText, Globe, 
  Link, Image, Tag, XCircle, ChevronRight, BarChart3, Lightbulb
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export default function AuditSEOPage() {
  const { seoAnalyses, stats, isLoading, refetch, searchQuery, setSearchQuery } = useAuditSEO();
  const [activeTab, setActiveTab] = useState('overview');

  const getStatusIcon = (status: 'good' | 'warning' | 'error') => {
    if (status === 'good') return <CheckCircle2 className="h-4 w-4 text-green-600" />;
    if (status === 'warning') return <AlertCircle className="h-4 w-4 text-yellow-600" />;
    return <XCircle className="h-4 w-4 text-red-600" />;
  };

  const getStatusBg = (status: 'good' | 'warning' | 'error') => {
    if (status === 'good') return 'bg-green-50 dark:bg-green-900/20 border-green-200';
    if (status === 'warning') return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200';
    return 'bg-red-50 dark:bg-red-900/20 border-red-200';
  };

  if (isLoading) {
    return (
      <ChannablePageWrapper
        title="Audit SEO"
        description="Chargement de l'analyse SEO..."
        heroImage="analytics"
        badge={{ label: "SEO", icon: Search }}
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
      title="Audit SEO"
      description="Analysez et optimisez le référencement de vos produits"
      heroImage="analytics"
      badge={{ label: "SEO Pro", icon: Search }}
      actions={
        <Button size="lg" onClick={() => refetch()} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Relancer l'audit
        </Button>
      }
    >
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="border-primary/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Score SEO Moyen</p>
                  <div className={cn('text-3xl font-bold', 
                    stats.averageSeoScore >= 70 ? 'text-green-600' : 
                    stats.averageSeoScore >= 50 ? 'text-yellow-600' : 'text-red-600'
                  )}>
                    {stats.averageSeoScore}/100
                  </div>
                </div>
                <div className="p-3 rounded-full bg-primary/10">
                  <BarChart3 className="h-6 w-6 text-primary" />
                </div>
              </div>
              <Progress value={stats.averageSeoScore} className="mt-3" />
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="border-green-200 bg-green-50/50 dark:bg-green-900/10">
            <CardContent className="pt-6">
              <p className="text-sm text-green-700 dark:text-green-400">Optimisés</p>
              <div className="text-3xl font-bold text-green-700 dark:text-green-400">{stats.optimizedProducts}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.totalProducts > 0 ? Math.round((stats.optimizedProducts / stats.totalProducts) * 100) : 0}% du catalogue
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="border-yellow-200 bg-yellow-50/50 dark:bg-yellow-900/10">
            <CardContent className="pt-6">
              <p className="text-sm text-yellow-700 dark:text-yellow-400">Partiellement</p>
              <div className="text-3xl font-bold text-yellow-700 dark:text-yellow-400">{stats.partiallyOptimized}</div>
              <p className="text-xs text-muted-foreground mt-1">À améliorer</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="border-red-200 bg-red-50/50 dark:bg-red-900/10">
            <CardContent className="pt-6">
              <p className="text-sm text-red-700 dark:text-red-400">Non optimisés</p>
              <div className="text-3xl font-bold text-red-700 dark:text-red-400">{stats.needsOptimization}</div>
              <p className="text-xs text-muted-foreground mt-1">Action requise</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Issue Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Répartition des Problèmes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-5">
            {[
              { label: 'Titres', value: stats.issueBreakdown.titleIssues, icon: FileText },
              { label: 'Descriptions', value: stats.issueBreakdown.descriptionIssues, icon: FileText },
              { label: 'Mots-clés', value: stats.issueBreakdown.keywordIssues, icon: Tag },
              { label: 'Images', value: stats.issueBreakdown.imageIssues, icon: Image },
              { label: 'Catégories', value: stats.issueBreakdown.categoryIssues, icon: Globe },
            ].map((item, idx) => (
              <div key={idx} className="text-center p-4 border rounded-lg">
                <item.icon className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
                <div className={cn('text-2xl font-bold', item.value > 0 ? 'text-orange-600' : 'text-green-600')}>
                  {item.value}
                </div>
                <p className="text-xs text-muted-foreground">{item.label}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="products">Produits ({seoAnalyses.length})</TabsTrigger>
          <TabsTrigger value="keywords">Mots-clés ({stats.topKeywords.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-yellow-600" />
                Bonnes Pratiques SEO
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-3">
                  <h4 className="font-semibold flex items-center gap-2">
                    <FileText className="h-4 w-4" /> Titres produits
                  </h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Entre 50 et 60 caractères idéalement</li>
                    <li>• Inclure marque + produit + caractéristique clé</li>
                    <li>• Éviter les majuscules excessives</li>
                  </ul>
                </div>
                <div className="space-y-3">
                  <h4 className="font-semibold flex items-center gap-2">
                    <FileText className="h-4 w-4" /> Descriptions
                  </h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Minimum 150-300 caractères</li>
                    <li>• Points clés en premier</li>
                    <li>• Mots-clés naturellement intégrés</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products" className="space-y-4">
          <Card>
            <CardContent className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Rechercher un produit..." 
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-10" 
                />
              </div>
            </CardContent>
          </Card>

          <div className="space-y-2">
            {seoAnalyses.slice(0, 15).map((analysis, idx) => (
              <motion.div
                key={analysis.product.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.02 }}
              >
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className={cn('w-12 h-12 rounded-lg flex items-center justify-center font-bold text-lg',
                        analysis.seoScore >= 70 ? 'bg-green-100 text-green-700' :
                        analysis.seoScore >= 50 ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      )}>
                        {analysis.seoScore}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium truncate">{analysis.product.name || 'Sans titre'}</h4>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {Object.entries(analysis.metrics).slice(0, 4).map(([key, metric]) => (
                            <div key={key} className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border', getStatusBg(metric.status))}>
                              {getStatusIcon(metric.status)}
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="hidden md:flex gap-2">
                        {analysis.keywords.slice(0, 3).map(kw => (
                          <Badge key={kw} variant="outline" className="text-xs">{kw}</Badge>
                        ))}
                      </div>
                      <Button size="sm" variant="ghost">
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="keywords">
          <Card>
            <CardHeader>
              <CardTitle>Mots-clés les plus utilisés</CardTitle>
              <CardDescription>Termes fréquents dans vos fiches produits</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {stats.topKeywords.map((kw, idx) => (
                  <Badge key={kw.keyword} variant="secondary" className="text-sm py-1 px-3">
                    {kw.keyword} <span className="ml-1 text-muted-foreground">({kw.count})</span>
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </ChannablePageWrapper>
  );
}
