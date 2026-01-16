import { RepricingDashboard } from '@/components/repricing/RepricingDashboard';
import { CompetitorRepricingPanel } from '@/components/repricing/CompetitorRepricingPanel';
import { RepricingSchedulePanel } from '@/components/repricing/RepricingSchedulePanel';
import { RepricingLogsPanel } from '@/components/repricing/RepricingLogsPanel';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Users, Calendar, FileText, Target, DollarSign, Zap } from 'lucide-react';
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';
import { motion } from 'framer-motion';

const StatCard = ({ 
  title, 
  value, 
  subtitle, 
  icon: Icon 
}: { 
  title: string
  value: string | number
  subtitle: string
  icon: any
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
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </CardContent>
    </Card>
  </motion.div>
)

export default function RepricingPage() {
  return (
    <ChannablePageWrapper
      title="Repricing Dynamique"
      subtitle="Optimisez vos prix automatiquement en fonction de la concurrence et de vos marges"
      heroImage="automation"
    >
      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          title="Règles Actives"
          value="8"
          subtitle="Stratégies en cours"
          icon={Target}
        />
        <StatCard
          title="Produits Monitorés"
          value="1,456"
          subtitle="Surveillance continue"
          icon={TrendingUp}
        />
        <StatCard
          title="Repricing Aujourd'hui"
          value="234"
          subtitle="Modifications auto"
          icon={Zap}
        />
        <StatCard
          title="Gain Marge"
          value="+5.2%"
          subtitle="Ce mois"
          icon={DollarSign}
        />
      </div>

      <Tabs defaultValue="dashboard" className="w-full">
        <TabsList className="grid grid-cols-4 w-full max-w-2xl bg-muted/50 backdrop-blur-sm">
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="competitors" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Concurrents
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

        <TabsContent value="schedule" className="mt-6">
          <RepricingSchedulePanel />
        </TabsContent>

        <TabsContent value="logs" className="mt-6">
          <RepricingLogsPanel />
        </TabsContent>
      </Tabs>
    </ChannablePageWrapper>
  );
}
