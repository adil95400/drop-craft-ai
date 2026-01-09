import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Zap, Trophy, Flame, TrendingUp, DollarSign, Target, Star } from 'lucide-react';

interface QuickFiltersProps {
  onSelectFilter: (filter: string) => void;
  activeFilter: string | null;
}

export function QuickFilters({ onSelectFilter, activeFilter }: QuickFiltersProps) {
  const quickFilters = [
    {
      id: 'winners_week',
      label: 'Winners de la semaine',
      icon: Trophy,
      color: 'from-yellow-500 to-orange-500',
      description: 'Top pubs des 7 derniers jours',
      badge: 'HOT',
    },
    {
      id: 'winners_month',
      label: 'Winners du mois',
      icon: Star,
      color: 'from-blue-500 to-indigo-500',
      description: 'Meilleures performances ce mois',
    },
    {
      id: 'cash_machines',
      label: 'Cash Machines',
      icon: DollarSign,
      color: 'from-green-500 to-emerald-500',
      description: 'Pubs à fort ROI',
      badge: 'NEW',
    },
    {
      id: 'viral_now',
      label: 'Viral en ce moment',
      icon: Flame,
      color: 'from-red-500 to-pink-500',
      description: 'Pubs qui explosent maintenant',
    },
    {
      id: 'trending_products',
      label: 'Produits tendance',
      icon: TrendingUp,
      color: 'from-purple-500 to-violet-500',
      description: 'Produits en croissance',
    },
    {
      id: 'quick_test',
      label: 'À tester rapidement',
      icon: Zap,
      color: 'from-cyan-500 to-blue-500',
      description: 'Faible concurrence, fort potentiel',
    },
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Target className="w-5 h-5 text-primary" />
          Recherche Rapide
          <Badge variant="secondary" className="ml-2">Magic Search</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {quickFilters.map((filter) => (
            <Button
              key={filter.id}
              variant={activeFilter === filter.id ? 'default' : 'outline'}
              className={`h-auto py-3 px-4 flex flex-col items-start gap-1 relative group transition-all ${
                activeFilter === filter.id 
                  ? `bg-gradient-to-r ${filter.color} text-white border-0` 
                  : 'hover:border-primary/50'
              }`}
              onClick={() => onSelectFilter(filter.id)}
            >
              {filter.badge && (
                <Badge 
                  className="absolute -top-2 -right-2 text-[10px] px-1.5 py-0.5 bg-red-500 text-white border-0"
                >
                  {filter.badge}
                </Badge>
              )}
              <filter.icon className="w-5 h-5" />
              <span className="font-medium text-xs leading-tight">{filter.label}</span>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
