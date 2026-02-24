import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  ClipboardCheck, TrendingUp, AlertCircle, CheckCircle2,
  ArrowRight, Sparkles, FileText, BarChart3, Package, Zap, Target
} from 'lucide-react'
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext'
import { useProductAudits, useAuditAnalytics } from '@/hooks/useProductAudit'
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'

const StatCard = ({ title, value, subtitle, icon: Icon, trend, onClick }: { 
  title: string; value: string | number; subtitle: string; icon: any;
  trend?: { value: number; positive: boolean }; onClick?: () => void
}) => (
  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} whileHover={{ scale: 1.02 }} transition={{ duration: 0.2 }}>
    <Card className="cursor-pointer hover:shadow-lg transition-all border-border/50 bg-card/50 backdrop-blur-sm" onClick={onClick}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className="p-2 rounded-lg bg-primary/10"><Icon className="h-4 w-4 text-primary" /></div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <div className="flex items-center gap-2 mt-1">
          <p className="text-xs text-muted-foreground">{subtitle}</p>
          {trend && (
            <Badge variant={trend.positive ? 'default' : 'destructive'} className="text-xs">
              {trend.positive ? '+' : ''}{trend.value}%
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  </motion.div>
)

export default function AuditDashboard() {
  const navigate = useNavigate()
  const { user } = useUnifiedAuth()
  const { t } = useTranslation('audit')
  const { data: audits, isLoading: auditsLoading } = useProductAudits(user?.id || '', 10)
  const { data: analytics } = useAuditAnalytics(user?.id || '')

  const latestAnalytics = analytics?.[0]
  const avgScore = latestAnalytics?.metric_value || 0
  const totalAudits = audits?.length || 0
  const productsWithErrors = audits?.filter(a => a.errors?.length > 0).length || 0
  const productsOptimized = audits?.filter(a => a.overall_score >= 80).length || 0

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getScoreBadge = (score: number) => {
    if (score >= 80) return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">{t('dashboard.excellent')}</Badge>
    if (score >= 60) return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">{t('dashboard.average')}</Badge>
    return <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">{t('scoring.toImproveLabel')}</Badge>
  }

  return (
    <ChannablePageWrapper
      title={t('dashboard.title')}
      subtitle={t('dashboard.subtitle')}
      heroImage="analytics"
      actions={
        <div className="flex gap-2">
          <Button onClick={() => navigate('/audit/products')} size="lg" className="gap-2">
            <Sparkles className="h-4 w-4" />
            {t('dashboard.auditProducts')}
          </Button>
          <Button onClick={() => navigate('/audit/batch')} size="lg" variant="outline" className="gap-2">
            <Zap className="h-4 w-4" />
            {t('dashboard.batchAudit')}
          </Button>
        </div>
      }
    >
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title={t('dashboard.avgScore')} value={`${avgScore.toFixed(1)}/100`} subtitle={t('dashboard.nAuditsPerformed', { count: totalAudits })} icon={BarChart3} onClick={() => navigate('/audit/products')} />
        <StatCard title={t('dashboard.productsWithErrors')} value={productsWithErrors} subtitle={t('dashboard.needAttention')} icon={AlertCircle} onClick={() => navigate('/audit/products')} />
        <StatCard title={t('dashboard.optimizedProducts')} value={productsOptimized} subtitle={t('dashboard.readyForSale')} icon={CheckCircle2} onClick={() => navigate('/audit/products')} />
        <StatCard title={t('dashboard.trend')} value="+12%" subtitle={t('dashboard.vsLastMonth')} icon={TrendingUp} trend={{ value: 12, positive: true }} onClick={() => navigate('/audit/analytics')} />
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl">{t('dashboard.recentAudits')}</CardTitle>
                <CardDescription>{t('dashboard.lastAuditsPerformed')}</CardDescription>
              </div>
              <Button variant="ghost" onClick={() => navigate('/audit/products')} className="gap-2">
                {t('dashboard.viewAll')}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {auditsLoading ? (
              <div className="text-center py-8 text-muted-foreground">{t('dashboard.loading')}</div>
            ) : audits && audits.length > 0 ? (
              <div className="space-y-3">
                {audits.slice(0, 5).map((audit, index) => (
                  <motion.div key={audit.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.1 }}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer group"
                    onClick={() => navigate(`/audit/${audit.id}`)}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`text-2xl font-bold ${getScoreColor(audit.overall_score)}`}>{audit.overall_score.toFixed(0)}</div>
                      <div>
                        <div className="font-medium">{t('dashboard.product')} {audit.product_id.slice(0, 8)}</div>
                        <div className="text-sm text-muted-foreground">
                          {t('dashboard.nErrors', { errors: audit.errors.length, warnings: audit.warnings.length })}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getScoreBadge(audit.overall_score)}
                      <Badge variant="outline">{audit.audit_type}</Badge>
                      <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">{t('dashboard.noAuditsYet')}</h3>
                <p className="text-muted-foreground mb-4">{t('dashboard.startByAuditing')}</p>
                <Button onClick={() => navigate('/audit/products')} className="gap-2">
                  <Sparkles className="h-4 w-4" />
                  {t('dashboard.startAudit')}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      <div className="grid gap-4 md:grid-cols-3">
        {[
          { title: t('dashboard.quickActions.auditProducts'), description: t('dashboard.quickActions.auditProductsDesc'), icon: ClipboardCheck, path: '/audit/products' },
          { title: t('dashboard.quickActions.generateContent'), description: t('dashboard.quickActions.generateContentDesc'), icon: Sparkles, path: '/rewrite/generator' },
          { title: t('dashboard.quickActions.viewStats'), description: t('dashboard.quickActions.viewStatsDesc'), icon: BarChart3, path: '/audit/analytics' }
        ].map((action, index) => (
          <motion.div key={action.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + index * 0.1 }} whileHover={{ scale: 1.02 }}>
            <Card className="cursor-pointer hover:shadow-lg transition-all border-border/50 bg-card/50 backdrop-blur-sm h-full" onClick={() => navigate(action.path)}>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-primary/10"><action.icon className="h-5 w-5 text-primary" /></div>
                  {action.title}
                </CardTitle>
              </CardHeader>
              <CardContent><p className="text-sm text-muted-foreground">{action.description}</p></CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </ChannablePageWrapper>
  )
}