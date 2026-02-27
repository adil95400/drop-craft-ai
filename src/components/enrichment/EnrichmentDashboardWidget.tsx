import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Sparkles, 
  TrendingUp, 
  CheckCircle, 
  Zap,
  ArrowRight
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

interface EnrichmentStats {
  total_products: number;
  enriched_products: number;
  pending_enrichments: number;
  applied_enrichments: number;
  failed_enrichments: number;
}

export function EnrichmentDashboardWidget() {
  const [stats, setStats] = useState<EnrichmentStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get total products
      const { count: totalProducts } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      // Get enrichment stats from product_enrichment table
      const { data: enrichments } = await supabase
        .from('product_enrichment')
        .select('enrichment_status')
        .eq('user_id', user.id);

      const pending = enrichments?.filter(e => e.enrichment_status === 'pending').length || 0;
      const applied = enrichments?.filter(e => e.enrichment_status === 'applied' || e.enrichment_status === 'success').length || 0;
      const failed = enrichments?.filter(e => e.enrichment_status === 'failed').length || 0;

      setStats({
        total_products: totalProducts || 0,
        enriched_products: applied,
        pending_enrichments: pending,
        applied_enrichments: applied,
        failed_enrichments: failed,
      });
    } catch (error) {
      console.error('Error fetching enrichment stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const enrichmentRate = stats 
    ? Math.round((stats.enriched_products / Math.max(stats.total_products, 1)) * 100) 
    : 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          Enrichissement Automatique
        </CardTitle>
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => navigate('/products')}
          className="text-xs"
        >
          Voir tout
          <ArrowRight className="ml-1 h-3 w-3" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Produits enrichis</span>
            <span className="font-medium">{enrichmentRate}%</span>
          </div>
          <Progress value={enrichmentRate} className="h-2" />
          <p className="text-xs text-muted-foreground">
            {stats?.enriched_products || 0} / {stats?.total_products || 0} produits
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2 p-2 rounded-lg bg-success/10">
            <CheckCircle className="h-4 w-4 text-success" />
            <div>
              <p className="text-lg font-bold">{stats?.applied_enrichments || 0}</p>
              <p className="text-xs text-muted-foreground">Appliqués</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 p-2 rounded-lg bg-warning/10">
            <Zap className="h-4 w-4 text-warning" />
            <div>
              <p className="text-lg font-bold">{stats?.pending_enrichments || 0}</p>
              <p className="text-xs text-muted-foreground">En attente</p>
            </div>
          </div>
        </div>

        {/* Quick Action */}
        {stats && stats.total_products - stats.enriched_products > 0 && (
          <Button 
            variant="outline" 
            className="w-full gap-2"
            onClick={() => navigate('/products?action=bulk-enrich')}
          >
            <TrendingUp className="h-4 w-4" />
            Enrichir {stats.total_products - stats.enriched_products} produits
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
