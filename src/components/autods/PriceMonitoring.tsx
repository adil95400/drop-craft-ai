import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Activity, Play, Pause, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export function PriceMonitoring() {
  const queryClient = useQueryClient();
  const [isChecking, setIsChecking] = useState(false);

  const { data: monitors, isLoading } = useQuery({
    queryKey: ['price-monitoring'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('price_monitoring')
        .select('*, catalog_products(*)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    }
  });

  const checkPricesMutation = useMutation({
    mutationFn: async (monitoringId?: string) => {
      setIsChecking(true);
      const { data, error } = await supabase.functions.invoke('price-monitor', {
        body: { action: 'check_prices', monitoringId }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast({
        title: 'Prix vérifiés',
        description: `${data.checked} produits vérifiés`
      });
      queryClient.invalidateQueries({ queryKey: ['price-monitoring'] });
      setIsChecking(false);
    },
    onError: (error: Error) => {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive'
      });
      setIsChecking(false);
    }
  });

  const toggleMonitorMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { error } = await supabase
        .from('price_monitoring')
        .update({ is_active: !isActive })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['price-monitoring'] });
    }
  });

  if (isLoading) {
    return <div className="flex items-center justify-center p-8">Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Monitoring des Prix</h2>
          <p className="text-muted-foreground">Surveillance automatique des changements de prix</p>
        </div>
        <Button
          onClick={() => checkPricesMutation.mutate()}
          disabled={isChecking}
          className="gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${isChecking ? 'animate-spin' : ''}`} />
          Vérifier tous les prix
        </Button>
      </div>

      <div className="grid gap-4">
        {monitors?.map((monitor) => (
          <Card key={monitor.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">{monitor.catalog_products?.name || 'Produit'}</CardTitle>
                  <CardDescription>{monitor.supplier_url}</CardDescription>
                </div>
                <Badge variant={monitor.is_active ? 'default' : 'secondary'}>
                  {monitor.is_active ? 'Actif' : 'Inactif'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Prix actuel</div>
                    <div className="text-2xl font-bold">
                      €{monitor.current_price?.toFixed(2) || '0.00'}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Changement</div>
                    <div className={`text-2xl font-bold flex items-center gap-1 ${
                      (monitor.price_change_percentage || 0) > 0 ? 'text-red-500' : 
                      (monitor.price_change_percentage || 0) < 0 ? 'text-green-500' : ''
                    }`}>
                      {monitor.price_change_percentage ? (
                        <>
                          {monitor.price_change_percentage > 0 ? (
                            <TrendingUp className="w-5 h-5" />
                          ) : (
                            <TrendingDown className="w-5 h-5" />
                          )}
                          {Math.abs(monitor.price_change_percentage).toFixed(2)}%
                        </>
                      ) : (
                        '—'
                      )}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Dernière vérification</div>
                    <div className="text-sm">
                      {monitor.last_checked_at
                        ? new Date(monitor.last_checked_at).toLocaleString('fr-FR')
                        : 'Jamais'}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => checkPricesMutation.mutate(monitor.id)}
                    disabled={isChecking}
                    className="gap-2"
                  >
                    <Activity className="w-4 h-4" />
                    Vérifier maintenant
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => toggleMonitorMutation.mutate({ id: monitor.id, isActive: monitor.is_active })}
                    className="gap-2"
                  >
                    {monitor.is_active ? (
                      <>
                        <Pause className="w-4 h-4" />
                        Mettre en pause
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4" />
                        Activer
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {monitors?.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center p-8 text-center">
              <Activity className="w-12 h-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium">Aucun monitoring configuré</p>
              <p className="text-sm text-muted-foreground mt-2">
                Ajoutez des produits à surveiller depuis le catalogue
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
