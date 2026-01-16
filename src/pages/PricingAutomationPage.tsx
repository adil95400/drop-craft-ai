import { PricingAutomationHub } from '@/components/pricing/PricingAutomationHub';
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, TrendingUp, Target, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

const StatCard = ({ 
  title, 
  value, 
  subtitle, 
  icon: Icon,
  trend 
}: { 
  title: string
  value: string | number
  subtitle: string
  icon: any
  trend?: { value: number; positive: boolean }
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

export default function PricingAutomationPage() {
  return (
    <ChannablePageWrapper
      title="Automatisation des Prix & Bénéfices"
      subtitle="Gérez vos prix de manière intelligente avec l'IA"
      heroImage="analytics"
    >
      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          title="Règles Actives"
          value="12"
          subtitle="Automatisations en cours"
          icon={Target}
        />
        <StatCard
          title="Marge Moyenne"
          value="32.5%"
          subtitle="+4.2% ce mois"
          icon={TrendingUp}
        />
        <StatCard
          title="Prix Optimisés"
          value="1,247"
          subtitle="Produits concernés"
          icon={DollarSign}
        />
        <StatCard
          title="Actions IA"
          value="342"
          subtitle="Cette semaine"
          icon={Zap}
        />
      </div>

      <PricingAutomationHub />
    </ChannablePageWrapper>
  );
}
