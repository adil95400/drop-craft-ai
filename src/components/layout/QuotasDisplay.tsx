import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useUnifiedPlan } from '@/lib/unified-plan-system';
import { NavLink } from 'react-router-dom';
import { 
  Package, 
  Truck, 
  ShoppingCart, 
  FileDown, 
  BarChart3, 
  Zap,
  Crown,
  Infinity
} from 'lucide-react';

interface QuotaItem {
  label: string;
  current: number;
  max: number | 'unlimited';
  icon: React.ElementType;
  color: string;
}

export function QuotasDisplay() {
  const { effectivePlan } = useUnifiedPlan();

  // Données fictives mais réalistes pour la démo
  const quotas: QuotaItem[] = [
    {
      label: 'Produits',
      current: 1247,
      max: effectivePlan === 'ultra_pro' ? 'unlimited' : effectivePlan === 'pro' ? 50000 : 1000,
      icon: Package,
      color: 'text-blue-600'
    },
    {
      label: 'Fournisseurs',
      current: 23,
      max: effectivePlan === 'ultra_pro' ? 'unlimited' : effectivePlan === 'pro' ? 500 : 50,
      icon: Truck,
      color: 'text-green-600'
    },
    {
      label: 'Commandes',
      current: 834,
      max: effectivePlan === 'ultra_pro' ? 'unlimited' : effectivePlan === 'pro' ? 10000 : 500,
      icon: ShoppingCart,
      color: 'text-purple-600'
    },
    {
      label: 'Exports',
      current: 12,
      max: effectivePlan === 'ultra_pro' ? 'unlimited' : effectivePlan === 'pro' ? 100 : 10,
      icon: FileDown,
      color: 'text-orange-600'
    },
    {
      label: 'Analyses IA',
      current: 8,
      max: effectivePlan === 'ultra_pro' ? 'unlimited' : effectivePlan === 'pro' ? 50 : 5,
      icon: BarChart3,
      color: 'text-indigo-600'
    },
    {
      label: 'Automations',
      current: 3,
      max: effectivePlan === 'ultra_pro' ? 'unlimited' : effectivePlan === 'pro' ? 20 : 0,
      icon: Zap,
      color: 'text-yellow-600'
    }
  ];

  const getUsagePercentage = (current: number, max: number | 'unlimited') => {
    if (max === 'unlimited') return 0;
    return Math.min((current / max) * 100, 100);
  };

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 75) return 'bg-orange-500';
    if (percentage >= 50) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Quotas d'utilisation
          <Button size="sm" variant="ghost" className="ml-auto" asChild>
            <NavLink to="/subscription">
              Améliorer le plan
            </NavLink>
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {quotas.map((quota) => {
          const Icon = quota.icon;
          const percentage = getUsagePercentage(quota.current, quota.max);
          const isUnlimited = quota.max === 'unlimited';
          
          return (
            <div key={quota.label} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon className={`h-4 w-4 ${quota.color}`} />
                  <span className="text-sm font-medium">{quota.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  {isUnlimited ? (
                    <Badge variant="default" className="text-xs">
                      <Infinity className="h-3 w-3 mr-1" />
                      Illimité
                    </Badge>
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      {quota.current.toLocaleString()} / {(quota.max as number).toLocaleString()}
                    </span>
                  )}
                </div>
              </div>
              
              {!isUnlimited && (
                <Progress 
                  value={percentage} 
                  className="h-2"
                  // Apply dynamic color based on usage
                />
              )}
            </div>
          );
        })}

        {/* White Label section */}
        <div className="pt-3 border-t">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Crown className="h-4 w-4 text-amber-600" />
              <span className="text-sm font-medium">White Label</span>
            </div>
            <div className="text-right">
              <div className="text-xs text-muted-foreground">
                Personnalisation de la marque
              </div>
              <div className="text-xs text-muted-foreground">
                Réinitialisation : 19/10/2025
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-muted-foreground">0 / 1</span>
            <div className="w-20 h-2 bg-muted rounded-full">
              <div className="w-0 h-full bg-primary rounded-full" />
            </div>
          </div>
        </div>

        <Button variant="outline" className="w-full mt-4" asChild>
          <NavLink to="/subscription">
            <Crown className="h-4 w-4 mr-2" />
            Voir tous les plans
          </NavLink>
        </Button>
      </CardContent>
    </Card>
  );
}