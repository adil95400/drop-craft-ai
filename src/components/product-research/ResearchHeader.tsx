import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  Eye, 
  Zap, 
  Target, 
  Sparkles,
  BarChart3
} from 'lucide-react';
import { ResearchStats } from '@/hooks/useRealProductResearch';
import { formatDistanceToNow } from 'date-fns';
import { getDateFnsLocale } from '@/utils/dateFnsLocale';

interface ResearchHeaderProps {
  stats?: ResearchStats;
}

export function ResearchHeader({ stats }: ResearchHeaderProps) {
  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const lastUpdatedText = stats?.lastUpdated 
    ? formatDistanceToNow(new Date(stats.lastUpdated), { addSuffix: true, locale: getDateFnsLocale() })
    : 'il y a quelques secondes';

  const displayStats = {
    totalProducts: stats?.totalProducts || 0,
    trendingNow: stats?.activeTrends || 0,
    winnersFound: Math.floor((stats?.avgScore || 0) * 10),
    avgScore: stats?.avgScore || 0
  };

  const statCards = [
    {
      label: 'Produits analysés',
      value: formatNumber(displayStats.totalProducts),
      icon: BarChart3,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10'
    },
    {
      label: 'Tendances actives',
      value: formatNumber(displayStats.trendingNow),
      icon: TrendingUp,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10'
    },
    {
      label: 'Score moyen',
      value: `${displayStats.avgScore}%`,
      icon: Target,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10'
    },
    {
      label: 'Mise à jour',
      value: lastUpdatedText,
      icon: Zap,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10'
    }
  ];

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border">
      {/* Decorative elements */}
      <div className="absolute inset-0 bg-grid-white/[0.02] pointer-events-none" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      
      <div className="relative p-6 md:p-8">
        {/* Title Section */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary/20">
                <Sparkles className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                  Product Research AI
                </h1>
                <p className="text-muted-foreground">
                  Trouvez les produits gagnants avant vos concurrents
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="gap-1.5 px-3 py-1.5">
              <Eye className="w-3.5 h-3.5" />
              Live Data
            </Badge>
            <Badge className="gap-1.5 px-3 py-1.5 bg-gradient-to-r from-orange-500 to-red-500 border-0">
              <TrendingUp className="w-3.5 h-3.5" />
              Données réelles
            </Badge>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {statCards.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="p-4 rounded-xl bg-background/50 backdrop-blur-sm border hover:border-primary/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`w-4 h-4 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-xl font-bold">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
