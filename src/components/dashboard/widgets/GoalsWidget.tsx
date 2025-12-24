import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Target, TrendingUp, Calendar, Award, Loader2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { useProductionData } from '@/hooks/useProductionData';
import { useMemo } from 'react';

interface GoalsWidgetProps {
  timeRange: string;
  settings?: {
    showDetails?: boolean;
  };
}

export function GoalsWidget({ settings }: GoalsWidgetProps) {
  const showDetails = settings?.showDetails ?? true;
  const { orders, customers, products, isLoadingOrders, isLoadingCustomers, isLoadingProducts } = useProductionData();

  const goals = useMemo(() => {
    const currentMonth = new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
    
    // Calculate current values from real data
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const monthlyOrders = (orders || []).filter(o => 
      new Date(o.created_at || '') >= monthStart
    );
    const monthlyRevenue = monthlyOrders.reduce((sum, o) => sum + Number(o.total_amount || 0), 0);
    
    const monthlyCustomers = (customers || []).filter(c => 
      new Date(c.created_at || '') >= monthStart
    );

    // Define goals based on current data (can be adjusted)
    const revenueTarget = Math.max(50000, Math.ceil(monthlyRevenue * 1.2 / 10000) * 10000);
    const ordersTarget = Math.max(100, Math.ceil(monthlyOrders.length * 1.3 / 10) * 10);
    const customersTarget = Math.max(50, Math.ceil(monthlyCustomers.length * 1.5 / 10) * 10);
    const productsTarget = Math.max(100, (products?.length || 0) + 20);

    return [
      { 
        id: 1, 
        name: 'Ventes mensuelles', 
        target: revenueTarget, 
        current: monthlyRevenue, 
        unit: '€',
        deadline: currentMonth,
        color: 'bg-blue-500'
      },
      { 
        id: 2, 
        name: 'Nouveaux clients', 
        target: customersTarget, 
        current: monthlyCustomers.length, 
        unit: '',
        deadline: currentMonth,
        color: 'bg-green-500'
      },
      { 
        id: 3, 
        name: 'Commandes', 
        target: ordersTarget, 
        current: monthlyOrders.length, 
        unit: '',
        deadline: currentMonth,
        color: 'bg-purple-500'
      },
      { 
        id: 4, 
        name: 'Produits en catalogue', 
        target: productsTarget, 
        current: products?.length || 0, 
        unit: '',
        deadline: 'Objectif annuel',
        color: 'bg-orange-500'
      },
    ];
  }, [orders, customers, products]);

  const isLoading = isLoadingOrders || isLoadingCustomers || isLoadingProducts;

  if (isLoading) {
    return (
      <Card className="h-full">
        <CardContent className="flex items-center justify-center h-full">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Target className="h-4 w-4 text-primary" />
          Objectifs
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {goals.map((goal) => {
          const progress = goal.target > 0 ? Math.min((goal.current / goal.target) * 100, 100) : 0;
          const isCompleted = progress >= 100;
          const isNearComplete = progress >= 80 && progress < 100;
          
          return (
            <div key={goal.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {isCompleted && <Award className="h-4 w-4 text-yellow-500" />}
                  <span className="text-sm font-medium">{goal.name}</span>
                </div>
                <span className={`text-sm font-bold ${isCompleted ? 'text-green-500' : isNearComplete ? 'text-orange-500' : ''}`}>
                  {goal.current.toLocaleString('fr-FR')}{goal.unit} / {goal.target.toLocaleString('fr-FR')}{goal.unit}
                </span>
              </div>
              <div className="relative">
                <Progress 
                  value={progress} 
                  className="h-2"
                />
                <div 
                  className={`absolute top-0 left-0 h-2 rounded-full ${goal.color}`}
                  style={{ width: `${progress}%` }}
                />
              </div>
              {showDetails && (
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>{goal.deadline}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {isCompleted ? (
                      <span className="text-green-500">Objectif atteint!</span>
                    ) : (
                      <>
                        <TrendingUp className="h-3 w-3" />
                        <span>{progress.toFixed(0)}% complété</span>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
