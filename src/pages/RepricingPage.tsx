import { RepricingDashboard } from '@/components/repricing/RepricingDashboard';
import { CompetitorRepricingPanel } from '@/components/repricing/CompetitorRepricingPanel';
import { RepricingSchedulePanel } from '@/components/repricing/RepricingSchedulePanel';
import { RepricingLogsPanel } from '@/components/repricing/RepricingLogsPanel';
import { PriceSyncPanel } from '@/components/price-rules/PriceSyncPanel';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Users, Calendar, FileText, Target, DollarSign, Zap, Store, Download } from 'lucide-react';
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';
import { motion } from 'framer-motion';
import { useRepricingDashboard, useRepricingHistory } from '@/hooks/useRepricingRules';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useCallback } from 'react';

const StatCard = ({ 
  title, 
  value, 
  subtitle, 
  icon: Icon,
  isLoading = false
}: { 
  title: string
  value: string | number
  subtitle: string
  icon: any
  isLoading?: boolean
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    whileHover={{ scale: 1.02 }}
    transition={{ duration: 0.2 }}
  >
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className="p-2 rounded-lg bg-primary/10">
          <Icon className="h-4 w-4 text-primary" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{isLoading ? '...' : value}</div>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </CardContent>
    </Card>
  </motion.div>
)

export default function RepricingPage() {
  const { data: dashboard, isLoading } = useRepricingDashboard();
  const { data: history = [] } = useRepricingHistory(100);

  const handleExportHistory = useCallback(() => {
    if (history.length === 0) {
      toast.error('Aucun historique à exporter');
      return;
    }

    const headers = ['Date', 'Produit', 'Ancien Prix', 'Nouveau Prix', 'Variation %', 'Raison', 'Règle'];
    const rows = history.map((h: any) => [
      format(new Date(h.changed_at || h.created_at), 'yyyy-MM-dd HH:mm:ss'),
      h.product_name || h.product_id,
      h.old_price?.toFixed(2) || '0.00',
      h.new_price?.toFixed(2) || '0.00',
      ((h.new_price - h.old_price) / h.old_price * 100).toFixed(2),
      h.change_reason || 'N/A',
      h.rule_name || 'N/A'
    ]);

    const csvContent = [headers.join(','), ...rows.map((r: any) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `repricing-history-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Export CSV téléchargé');
  }, [history]);

  return (
    <ChannablePageWrapper
      title="Repricing Auto"
      subtitle="Repricing temps réel synchronisé avec vos boutiques connectées"
      heroImage="automation"
    >
      {/* Stats - Données réelles */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          title="Règles Actives"
          value={dashboard?.active_rules || 0}
          subtitle="Stratégies en cours"
          icon={Target}
          isLoading={isLoading}
        />
        <StatCard
          title="Produits Monitorés"
          value={dashboard?.products_monitored?.toLocaleString() || 0}
          subtitle="Surveillance continue"
          icon={TrendingUp}
          isLoading={isLoading}
        />
        <StatCard
          title="Repricing Aujourd'hui"
          value={dashboard?.repricing_executions_today || 0}
          subtitle="Modifications auto"
          icon={Zap}
          isLoading={isLoading}
        />
        <StatCard
          title="Gain Marge"
          value={`${(dashboard?.avg_margin_change || 0) >= 0 ? '+' : ''}${(dashboard?.avg_margin_change || 0).toFixed(1)}%`}
          subtitle="Ce mois"
          icon={DollarSign}
          isLoading={isLoading}
        />
      </div>

      <Tabs defaultValue="dashboard" className="w-full">
        <TabsList className="grid grid-cols-5 w-full max-w-3xl bg-muted/50 backdrop-blur-sm">
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="competitors" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Concurrents
          </TabsTrigger>
          <TabsTrigger value="stores" className="flex items-center gap-2">
            <Store className="h-4 w-4" />
            Boutiques
          </TabsTrigger>
          <TabsTrigger value="schedule" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Planification
          </TabsTrigger>
          <TabsTrigger value="logs" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Logs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="mt-6">
          <RepricingDashboard />
        </TabsContent>

        <TabsContent value="competitors" className="mt-6">
          <CompetitorRepricingPanel />
        </TabsContent>

        <TabsContent value="stores" className="mt-6">
          <PriceSyncPanel />
        </TabsContent>

        <TabsContent value="schedule" className="mt-6">
          <RepricingSchedulePanel />
        </TabsContent>

        <TabsContent value="logs" className="mt-6">
          <div className="flex justify-end mb-4">
            <Button variant="outline" size="sm" onClick={handleExportHistory}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
          <RepricingLogsPanel />
        </TabsContent>
      </Tabs>
    </ChannablePageWrapper>
  );
}
