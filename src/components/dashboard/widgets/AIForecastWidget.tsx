/**
 * AI Forecast Widget - Prévisions intelligentes pour le Dashboard
 * Affiche les prédictions IA et alertes proactives
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Brain,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Target,
  Sparkles,
  ChevronRight,
  Loader2,
  Zap,
  DollarSign,
  Package,
  Users,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { TimeRange } from '@/hooks/useDashboardConfig';

interface AIForecastWidgetProps {
  timeRange: TimeRange;
  settings: {
    showChart?: boolean;
  };
  lastRefresh: Date;
}

interface Forecast {
  id: string;
  type: 'revenue' | 'orders' | 'stock' | 'churn';
  title: string;
  prediction: string;
  value: string;
  change: number;
  confidence: number;
  timeframe: string;
  priority: 'high' | 'medium' | 'low';
}

const forecasts: Forecast[] = [
  {
    id: '1',
    type: 'revenue',
    title: 'Prévision CA',
    prediction: 'Croissance attendue cette semaine',
    value: '+18.5%',
    change: 18.5,
    confidence: 89,
    timeframe: '7 jours',
    priority: 'high'
  },
  {
    id: '2',
    type: 'orders',
    title: 'Volume commandes',
    prediction: 'Pic prévu vendredi-samedi',
    value: '+32%',
    change: 32,
    confidence: 92,
    timeframe: '3 jours',
    priority: 'medium'
  },
  {
    id: '3',
    type: 'stock',
    title: 'Alerte rupture',
    prediction: '3 produits critiques',
    value: '8j',
    change: -15,
    confidence: 95,
    timeframe: 'urgent',
    priority: 'high'
  },
  {
    id: '4',
    type: 'churn',
    title: 'Risque clients',
    prediction: '12 clients VIP inactifs',
    value: '5.2%',
    change: 2.1,
    confidence: 78,
    timeframe: '30 jours',
    priority: 'medium'
  }
];

const getIcon = (type: Forecast['type']) => {
  switch (type) {
    case 'revenue': return DollarSign;
    case 'orders': return TrendingUp;
    case 'stock': return Package;
    case 'churn': return Users;
  }
};

const getIconColor = (type: Forecast['type']) => {
  switch (type) {
    case 'revenue': return 'text-green-500 bg-green-500/10';
    case 'orders': return 'text-blue-500 bg-blue-500/10';
    case 'stock': return 'text-amber-500 bg-amber-500/10';
    case 'churn': return 'text-red-500 bg-red-500/10';
  }
};

export function AIForecastWidget({ timeRange, settings, lastRefresh }: AIForecastWidgetProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsRefreshing(false);
  };

  return (
    <>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-purple-500/10">
              <Brain className="h-5 w-5 text-purple-500" />
            </div>
            <span>Prévisions IA</span>
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs gap-1">
              <Sparkles className="h-3 w-3" />
              Auto-update
            </Badge>
            <Button 
              variant="ghost" 
              size="icon"
              className="h-8 w-8"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <AnimatePresence mode="popLayout">
          {forecasts.map((forecast, index) => {
            const Icon = getIcon(forecast.type);
            const iconColor = getIconColor(forecast.type);
            const isExpanded = expandedId === forecast.id;
            
            return (
              <motion.div
                key={forecast.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={cn(
                  "p-3 rounded-lg border cursor-pointer transition-all hover:shadow-sm",
                  forecast.priority === 'high' && "border-l-4 border-l-red-500",
                  isExpanded && "bg-muted/50"
                )}
                onClick={() => setExpandedId(isExpanded ? null : forecast.id)}
              >
                <div className="flex items-center gap-3">
                  <div className={cn("p-2 rounded-lg", iconColor)}>
                    <Icon className="h-4 w-4" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{forecast.title}</span>
                      {forecast.priority === 'high' && (
                        <Badge variant="destructive" className="text-[10px] h-5">
                          Urgent
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {forecast.prediction}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className={cn(
                      "font-bold",
                      forecast.change > 0 ? "text-green-600" : "text-red-600"
                    )}>
                      {forecast.value}
                    </p>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      {forecast.change > 0 ? (
                        <ArrowUpRight className="h-3 w-3 text-green-500" />
                      ) : (
                        <ArrowDownRight className="h-3 w-3 text-red-500" />
                      )}
                      {forecast.timeframe}
                    </div>
                  </div>

                  <ChevronRight className={cn(
                    "h-4 w-4 text-muted-foreground transition-transform",
                    isExpanded && "rotate-90"
                  )} />
                </div>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="mt-3 pt-3 border-t space-y-2"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Confiance IA</span>
                        <span className="font-medium">{forecast.confidence}%</span>
                      </div>
                      <Progress value={forecast.confidence} className="h-1.5" />
                      
                      <div className="flex gap-2 mt-3">
                        <Button size="sm" variant="outline" className="flex-1 text-xs h-8">
                          Voir détails
                        </Button>
                        <Button size="sm" className="flex-1 text-xs h-8">
                          <Zap className="h-3 w-3 mr-1" />
                          Agir
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </AnimatePresence>

        <div className="pt-2 border-t">
          <Button variant="ghost" className="w-full text-sm gap-2">
            <Target className="h-4 w-4" />
            Voir toutes les prévisions
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </>
  );
}
