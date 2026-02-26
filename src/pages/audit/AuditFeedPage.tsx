/**
 * Page d'audit des feeds produits - Version Premium
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';
import { useAuditFeed } from '@/hooks/useAuditFeed';
import { 
  Rss, RefreshCw, CheckCircle2, AlertCircle, XCircle, Clock, FileText, 
  Download, ChevronRight, ExternalLink, BarChart3, Globe
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { getDateFnsLocale } from '@/utils/dateFnsLocale';
import { useTranslation } from 'react-i18next';

export default function AuditFeedPage() {
  const { feedChannels, stats, isLoading, refetch, selectedChannel, setSelectedChannel, selectedChannelData } = useAuditFeed();
  const { t } = useTranslation('audit');
  const [activeTab, setActiveTab] = useState('channels');

  const dateFnsLocale = getDateFnsLocale();

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'valid':
        return <Badge className="bg-green-100 text-green-800 gap-1"><CheckCircle2 className="h-3 w-3" />{t('feed.statusValid')}</Badge>;
      case 'warning':
        return <Badge className="bg-yellow-100 text-yellow-800 gap-1"><AlertCircle className="h-3 w-3" />{t('feed.statusWarning')}</Badge>;
      case 'error':
        return <Badge className="bg-red-100 text-red-800 gap-1"><XCircle className="h-3 w-3" />{t('feed.statusError')}</Badge>;
      default:
        return <Badge variant="outline" className="gap-1"><Clock className="h-3 w-3" />{t('feed.statusPending')}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <ChannablePageWrapper title={t('feed.title')} description={t('feed.loadingDesc')} heroImage="schema" badge={{ label: "Feed", icon: Rss }}>
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map(i => (<Card key={i} className="animate-pulse"><CardContent className="h-24" /></Card>))}
        </div>
      </ChannablePageWrapper>
    );
  }

  return (
    <ChannablePageWrapper
      title={t('feed.title')}
      description={t('feed.description')}
      heroImage="schema"
      badge={{ label: t('feed.badge'), icon: Rss }}
      actions={
        <div className="flex gap-2">
          <Button size="lg" onClick={() => refetch()} className="gap-2"><RefreshCw className="h-4 w-4" />{t('feed.validateAll')}</Button>
          <Button size="lg" variant="outline" className="gap-2"><Download className="h-4 w-4" />{t('feed.exportReport')}</Button>
        </div>
      }
    >
      <div className="grid gap-4 md:grid-cols-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card><CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">{t('feed.totalProducts')}</p>
            <div className="text-3xl font-bold">{stats.totalProducts}</div>
            <p className="text-xs text-muted-foreground">{t('feed.inNChannels', { count: stats.totalFeeds })}</p>
          </CardContent></Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="border-green-200 bg-green-50/50 dark:bg-green-900/10"><CardContent className="pt-6">
            <p className="text-sm text-green-700">{t('feed.validProducts')}</p>
            <div className="text-3xl font-bold text-green-700">{stats.validProducts}</div>
            <Progress value={(stats.validProducts / stats.totalProducts) * 100 || 0} className="h-2 mt-2" />
          </CardContent></Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="border-green-200 bg-green-50/50 dark:bg-green-900/10"><CardContent className="pt-6">
            <p className="text-sm text-green-700">{t('feed.healthyFeeds')}</p>
            <div className="text-3xl font-bold text-green-700">{stats.healthyFeeds}</div>
            <p className="text-xs text-muted-foreground">{t('feed.ofNChannels', { count: stats.totalFeeds })}</p>
          </CardContent></Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className={cn(stats.productsWithIssues > 0 ? 'border-orange-200 bg-orange-50/50 dark:bg-orange-900/10' : 'border-green-200 bg-green-50/50')}>
            <CardContent className="pt-6">
              <p className={cn('text-sm', stats.productsWithIssues > 0 ? 'text-orange-700' : 'text-green-700')}>{t('feed.productsWithIssues')}</p>
              <div className={cn('text-3xl font-bold', stats.productsWithIssues > 0 ? 'text-orange-700' : 'text-green-700')}>{stats.productsWithIssues}</div>
              <p className="text-xs text-muted-foreground">{t('feed.toFix')}</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="channels">{t('feed.channelsTab', { count: feedChannels.length })}</TabsTrigger>
          <TabsTrigger value="issues">{t('feed.commonIssuesTab')}</TabsTrigger>
        </TabsList>

        <TabsContent value="channels" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {feedChannels.map((feed, idx) => (
              <motion.div key={feed.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}>
                <Card className={cn('cursor-pointer hover:shadow-lg transition-all', selectedChannel === feed.id && 'ring-2 ring-primary')}
                  onClick={() => setSelectedChannel(feed.id === selectedChannel ? null : feed.id)}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{feed.icon}</span>
                        <CardTitle className="text-lg">{feed.name}</CardTitle>
                      </div>
                      {getStatusBadge(feed.status)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{t('feed.products')}</span>
                        <span className="font-medium">{feed.productsTotal}</span>
                      </div>
                      <Progress value={(feed.productsValid / feed.productsTotal) * 100 || 0} className="h-2" />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span className="text-green-600">{feed.productsValid} {t('feed.valid')}</span>
                        {feed.productsWarning > 0 && <span className="text-yellow-600">{feed.productsWarning} {t('feed.warnings')}</span>}
                        {feed.productsError > 0 && <span className="text-red-600">{feed.productsError} {t('feed.errors')}</span>}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t">
                        <Clock className="h-3 w-3" />
                        {t('feed.lastSync')} {feed.lastSync ? format(new Date(feed.lastSync), 'dd MMM HH:mm', { locale: dateFnsLocale }) : t('feed.never')}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {selectedChannelData && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span className="text-2xl">{selectedChannelData.icon}</span>
                    {selectedChannelData.name} - {t('feed.details')}
                  </CardTitle>
                  <CardDescription>{t('feed.errorsAndWarnings')}</CardDescription>
                </CardHeader>
                <CardContent>
                  {selectedChannelData.validationErrors.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-green-600" />
                      <p>{t('feed.noProblem')}</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {selectedChannelData.validationErrors.map((error, idx) => (
                        <div key={idx} className={cn(
                          'flex items-center justify-between p-4 border rounded-lg',
                          error.type === 'error' ? 'bg-red-50 dark:bg-red-900/10 border-red-200' : 'bg-yellow-50 dark:bg-yellow-900/10 border-yellow-200'
                        )}>
                          <div className="flex items-center gap-4">
                            {error.type === 'error' ? <XCircle className="h-5 w-5 text-red-600" /> : <AlertCircle className="h-5 w-5 text-yellow-600" />}
                            <div>
                              <p className="font-medium">{error.message}</p>
                              <p className="text-sm text-muted-foreground">{error.fixSuggestion}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge variant="outline">{t('feed.nProductsAffected', { count: error.affectedProducts })}</Badge>
                            <Button size="sm" variant="outline">{t('scoring.fix')}</Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </TabsContent>

        <TabsContent value="issues">
          <Card>
            <CardHeader>
              <CardTitle>{t('feed.mostFrequentIssues')}</CardTitle>
              <CardDescription>{t('feed.commonErrorsDesc')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {feedChannels.flatMap(f => f.validationErrors).sort((a, b) => b.affectedProducts - a.affectedProducts).slice(0, 10).map((error, idx) => (
                  <div key={idx} className={cn(
                    'flex items-center justify-between p-3 border rounded-lg',
                    error.type === 'error' ? 'bg-red-50 dark:bg-red-900/10' : 'bg-yellow-50 dark:bg-yellow-900/10'
                  )}>
                    <div className="flex items-center gap-3">
                      {error.type === 'error' ? <XCircle className="h-4 w-4 text-red-600" /> : <AlertCircle className="h-4 w-4 text-yellow-600" />}
                      <span className="font-medium">{error.message}</span>
                    </div>
                    <Badge variant={error.type === 'error' ? 'destructive' : 'secondary'}>
                      {t('feed.nProductsAffected', { count: error.affectedProducts })}
                    </Badge>
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