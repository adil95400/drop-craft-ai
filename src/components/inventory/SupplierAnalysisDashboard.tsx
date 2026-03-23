/**
 * Supplier Analysis Dashboard — Scoring et recommandations fournisseurs
 * Affiche les vrais noms de fournisseurs depuis la table suppliers
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import {
  Award, AlertTriangle, Loader2, Star,
  Truck, ShieldCheck, Package, BarChart3
} from 'lucide-react';
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  Radar, ResponsiveContainer, Tooltip
} from 'recharts';

interface SupplierScore {
  supplier_id: string;
  supplier_name: string;
  tier: string;
  overall_score: number;
  reliability_score: number;
  delivery_score: number;
  stock_availability: number;
  avg_delivery_days: number;
  total_products: number;
  active_products: number;
  total_orders: number;
  completed_orders: number;
  failed_orders: number;
  recommendation: string;
}

const recColors: Record<string, string> = {
  preferred: 'bg-green-500/20 text-green-700 dark:text-green-300',
  recommended: 'bg-blue-500/20 text-blue-700 dark:text-blue-300',
  neutral: 'bg-muted text-muted-foreground',
  caution: 'bg-orange-500/20 text-orange-700 dark:text-orange-300',
  avoid: 'bg-destructive text-destructive-foreground',
};

const recLabels: Record<string, string> = {
  preferred: '⭐ Préféré',
  recommended: '✅ Recommandé',
  neutral: '➖ Neutre',
  caution: '⚠️ Prudence',
  avoid: '🚫 À éviter',
};

export function SupplierAnalysisDashboard() {
  const { user } = useUnifiedAuth();
  const queryClient = useQueryClient();

  const analyzeSuppliers = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('smart-inventory-engine', {
        body: { action: 'supplier_analysis', userId: user!.id },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['supplier-analysis'] });
      toast.success(`${data?.suppliers?.length || 0} fournisseurs analysés — Score moyen: ${data?.summary?.avg_score || 0}/100`);
    },
    onError: (e: Error) => toast.error(`Erreur: ${e.message}`),
  });

  // Get supplier scores + join with suppliers table for names
  const { data: suppliers = [], isLoading } = useQuery({
    queryKey: ['supplier-analysis', user?.id],
    queryFn: async () => {
      // Get scores
      const { data: scores, error: scoresError } = await (supabase as any)
        .from('supplier_scores')
        .select('*')
        .eq('user_id', user!.id)
        .order('overall_score', { ascending: false });
      if (scoresError) throw scoresError;
      if (!scores || scores.length === 0) return [];

      // Get supplier names
      const supplierIds = scores.map((s: any) => s.supplier_id);
      const { data: supplierData } = await supabase
        .from('suppliers')
        .select('id, name, tier')
        .in('id', supplierIds);

      const nameMap = new Map((supplierData || []).map(s => [s.id, s]));

      return scores.map((s: any) => {
        const supplier = nameMap.get(s.supplier_id);
        return {
          supplier_id: s.supplier_id,
          supplier_name: supplier?.name || s.supplier_id.slice(0, 12),
          tier: supplier?.tier || 'standard',
          overall_score: s.overall_score || 0,
          reliability_score: s.reliability_score || 0,
          delivery_score: s.delivery_score || 0,
          stock_availability: s.quality_score || 0,
          avg_delivery_days: s.avg_delivery_days || 14,
          total_products: 0,
          active_products: 0,
          total_orders: s.total_orders || 0,
          completed_orders: s.total_orders - (s.total_issues || 0),
          failed_orders: s.total_issues || 0,
          recommendation: s.recommendation || 'neutral',
        } as SupplierScore;
      });
    },
    enabled: !!user?.id,
  });

  const topSupplier = suppliers[0];
  const radarData = topSupplier ? [
    { metric: 'Fiabilité', value: topSupplier.reliability_score },
    { metric: 'Livraison', value: topSupplier.delivery_score },
    { metric: 'Disponibilité', value: topSupplier.stock_availability },
    { metric: 'Score global', value: topSupplier.overall_score },
  ] : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold">Analyse Fournisseurs</h3>
          <p className="text-sm text-muted-foreground">Scoring automatique et recommandations</p>
        </div>
        <Button
          onClick={() => analyzeSuppliers.mutate()}
          disabled={analyzeSuppliers.isPending}
          className="gap-2"
        >
          {analyzeSuppliers.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Award className="h-4 w-4" />}
          Analyser les fournisseurs
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <Package className="h-3.5 w-3.5" /> Total
            </div>
            <p className="text-2xl font-bold">{suppliers.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <Star className="h-3.5 w-3.5 text-green-500" /> Préférés
            </div>
            <p className="text-2xl font-bold">{suppliers.filter(s => s.recommendation === 'preferred').length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <AlertTriangle className="h-3.5 w-3.5 text-orange-500" /> Prudence
            </div>
            <p className="text-2xl font-bold">{suppliers.filter(s => s.recommendation === 'caution' || s.recommendation === 'avoid').length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <BarChart3 className="h-3.5 w-3.5 text-primary" /> Score moy.
            </div>
            <p className="text-2xl font-bold">
              {suppliers.length > 0 ? Math.round(suppliers.reduce((s, sup) => s + sup.overall_score, 0) / suppliers.length) : '—'}
            </p>
          </CardContent>
        </Card>
      </div>

      {topSupplier && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Meilleur fournisseur: {topSupplier.supplier_name} — Score {topSupplier.overall_score}/100</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <RadarChart data={radarData}>
                <PolarGrid className="stroke-border" />
                <PolarAngleAxis dataKey="metric" className="text-xs" />
                <PolarRadiusAxis domain={[0, 100]} />
                <Radar dataKey="value" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.3} />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : suppliers.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Award className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">Aucun fournisseur analysé</p>
            <p className="text-sm text-muted-foreground mt-1">Lancez l'analyse pour scorer vos fournisseurs</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {suppliers.map((supplier, i) => (
            <motion.div
              key={supplier.supplier_id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
            >
              <Card className="hover:shadow-sm transition-shadow">
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-sm font-bold text-primary">{supplier.overall_score}</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium">{supplier.supplier_name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge className={recColors[supplier.recommendation] || recColors.neutral} variant="secondary">
                            {recLabels[supplier.recommendation] || supplier.recommendation}
                          </Badge>
                          {supplier.tier !== 'standard' && (
                            <Badge variant="outline" className="text-xs">{supplier.tier}</Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <ShieldCheck className="h-3 w-3" /> Fiabilité
                        </div>
                        <Progress value={supplier.reliability_score} className="h-1.5 w-20" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Truck className="h-3 w-3" /> Livraison
                        </div>
                        <Progress value={supplier.delivery_score} className="h-1.5 w-20" />
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{supplier.avg_delivery_days}j</p>
                        <p className="text-xs text-muted-foreground">délai moy.</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{supplier.total_orders}</p>
                        <p className="text-xs text-muted-foreground">commandes</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
