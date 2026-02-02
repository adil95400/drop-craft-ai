/**
 * QuotaDashboard - Vue d'ensemble de tous les quotas utilisateur
 */

import { useUnifiedQuotas } from '@/hooks/useUnifiedQuotas';
import { QuotaUsageCard } from './QuotaUsageCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Package, 
  Download, 
  Sparkles, 
  Store, 
  Truck, 
  Workflow, 
  HardDrive,
  Crown
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const QUOTA_ICONS: Record<string, React.ReactNode> = {
  products: <Package className="h-4 w-4 text-blue-500" />,
  imports_monthly: <Download className="h-4 w-4 text-green-500" />,
  ai_generations: <Sparkles className="h-4 w-4 text-purple-500" />,
  stores: <Store className="h-4 w-4 text-orange-500" />,
  suppliers: <Truck className="h-4 w-4 text-cyan-500" />,
  workflows: <Workflow className="h-4 w-4 text-pink-500" />,
  storage_mb: <HardDrive className="h-4 w-4 text-gray-500" />,
};

const PLAN_LABELS: Record<string, { label: string; color: string }> = {
  free: { label: 'Gratuit', color: 'bg-gray-500' },
  standard: { label: 'Standard', color: 'bg-blue-500' },
  pro: { label: 'Pro', color: 'bg-purple-500' },
  ultra_pro: { label: 'Ultra Pro', color: 'bg-gradient-to-r from-amber-500 to-orange-500' },
};

export function QuotaDashboard() {
  const { currentPlan, getAllQuotas, isLoading } = useUnifiedQuotas();
  const navigate = useNavigate();
  const quotas = getAllQuotas();
  const planInfo = PLAN_LABELS[currentPlan] || PLAN_LABELS.free;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
        </Card>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(7)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-20 mb-2" />
                <Skeleton className="h-2 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Plan Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-3">
                <Crown className="h-5 w-5 text-amber-500" />
                Mon Plan
                <Badge className={planInfo.color + " text-white"}>
                  {planInfo.label}
                </Badge>
              </CardTitle>
              <CardDescription className="mt-1">
                Gérez vos limites et suivez votre utilisation
              </CardDescription>
            </div>
            {currentPlan !== 'ultra_pro' && (
              <Button onClick={() => navigate('/dashboard/subscription')}>
                Passer à un plan supérieur
              </Button>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Quotas Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {quotas.map((quota) => (
          <QuotaUsageCard
            key={quota.key}
            label={quota.label}
            current={quota.current}
            limit={quota.limit}
            isUnlimited={quota.isUnlimited}
            icon={QUOTA_ICONS[quota.key]}
          />
        ))}
      </div>

      {/* Help Text */}
      <Card className="bg-muted/30">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h4 className="font-medium mb-1">Besoin de plus ?</h4>
              <p className="text-sm text-muted-foreground">
                Les limites se réinitialisent chaque mois. Passez à un plan supérieur 
                pour débloquer plus de ressources et des fonctionnalités avancées.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
