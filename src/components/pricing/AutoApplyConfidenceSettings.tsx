/**
 * Auto-Apply with Confidence Thresholds
 * Configure automatic application of AI pricing recommendations
 */
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import {
  Brain, Shield, Target, Zap, CheckCircle2, XCircle, Clock,
  AlertTriangle, Loader2, ArrowUpDown, TrendingUp, Eye, Settings
} from 'lucide-react';

interface AutoApplyConfig {
  enabled: boolean;
  confidence_threshold: number;
  max_price_change_pct: number;
  min_margin_floor: number;
  scope: 'all' | 'category' | 'high_margin';
  scope_categories: string[];
  require_human_review_above: number;
  max_daily_auto_changes: number;
  volatility_pause: boolean;
}

const DEFAULT_CONFIG: AutoApplyConfig = {
  enabled: false,
  confidence_threshold: 80,
  max_price_change_pct: 15,
  min_margin_floor: 10,
  scope: 'all',
  scope_categories: [],
  require_human_review_above: 20,
  max_daily_auto_changes: 50,
  volatility_pause: true,
};

export function AutoApplyConfidenceSettings() {
  const queryClient = useQueryClient();
  const [config, setConfig] = useState<AutoApplyConfig>(DEFAULT_CONFIG);

  // Load existing config
  const { data: savedConfig, isLoading: configLoading } = useQuery({
    queryKey: ['auto-apply-config'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data } = await supabase.from('ai_auto_action_configs')
        .select('*')
        .eq('user_id', user.id)
        .eq('action_type', 'auto_pricing')
        .maybeSingle();

      return data;
    },
  });

  useEffect(() => {
    if (savedConfig?.config) {
      const c = savedConfig.config as any;
      setConfig({
        enabled: savedConfig.is_enabled ?? false,
        confidence_threshold: c.confidence_threshold ?? 80,
        max_price_change_pct: c.max_price_change_pct ?? 15,
        min_margin_floor: c.min_margin_floor ?? 10,
        scope: c.scope ?? 'all',
        scope_categories: c.scope_categories ?? [],
        require_human_review_above: c.require_human_review_above ?? 20,
        max_daily_auto_changes: savedConfig.max_daily_actions ?? 50,
        volatility_pause: c.volatility_pause ?? true,
      });
    }
  }, [savedConfig]);

  // Load pending recommendations
  const { data: recommendations = [] } = useQuery({
    queryKey: ['ai-pricing-recommendations'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data } = await supabase.from('ai_recommendations')
        .select('*')
        .eq('user_id', user.id)
        .eq('recommendation_type', 'pricing')
        .eq('status', 'pending')
        .order('confidence_score', { ascending: false })
        .limit(20);

      return data || [];
    },
  });

  // Save config
  const saveConfigMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      const configData = {
        confidence_threshold: config.confidence_threshold,
        max_price_change_pct: config.max_price_change_pct,
        min_margin_floor: config.min_margin_floor,
        scope: config.scope,
        scope_categories: config.scope_categories,
        require_human_review_above: config.require_human_review_above,
        volatility_pause: config.volatility_pause,
      };

      if (savedConfig?.id) {
        await supabase.from('ai_auto_action_configs')
          .update({
            is_enabled: config.enabled,
            config: configData as any,
            max_daily_actions: config.max_daily_auto_changes,
            threshold_score: config.confidence_threshold,
          })
          .eq('id', savedConfig.id);
      } else {
        await supabase.from('ai_auto_action_configs').insert({
          user_id: user.id,
          action_type: 'auto_pricing',
          is_enabled: config.enabled,
          config: configData as any,
          max_daily_actions: config.max_daily_auto_changes,
          threshold_score: config.confidence_threshold,
          scope: config.scope,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auto-apply-config'] });
      toast.success('Configuration auto-apply sauvegardée');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // Apply single recommendation
  const applyRecommendation = useMutation({
    mutationFn: async (rec: any) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      // Update recommendation status
      await supabase.from('ai_recommendations')
        .update({ status: 'applied', applied_at: new Date().toISOString() })
        .eq('id', rec.id);

      // Apply price change if metadata contains it
      const meta = rec.metadata || {};
      if (meta.new_price && rec.target_product_id) {
        await supabase.from('products')
          .update({ price: meta.new_price })
          .eq('id', rec.target_product_id)
          .eq('user_id', user.id);

        await (supabase.from('price_change_history') as any).insert({
          user_id: user.id,
          product_id: rec.target_product_id,
          old_price: meta.old_price || 0,
          new_price: meta.new_price,
          change_percent: meta.change_percent || 0,
          change_type: 'ai_recommendation',
          source: 'auto_apply',
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-pricing-recommendations'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Recommandation appliquée');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const autoEligible = recommendations.filter((r: any) => (r.confidence_score || 0) * 100 >= config.confidence_threshold);
  const reviewNeeded = recommendations.filter((r: any) => {
    const score = (r.confidence_score || 0) * 100;
    return score < config.confidence_threshold && score > 0;
  });

  if (configLoading) {
    return (
      <div className="flex items-center justify-center py-12 gap-2">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <span className="text-muted-foreground">Chargement configuration...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main toggle */}
      <Card className={config.enabled ? 'border-success/30 bg-success/5' : 'border-muted'}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Brain className={`h-6 w-6 ${config.enabled ? 'text-success' : 'text-muted-foreground'}`} />
              <div>
                <p className="font-semibold">Auto-Apply IA</p>
                <p className="text-sm text-muted-foreground">
                  Application automatique des recommandations de prix au-dessus du seuil de confiance
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant={config.enabled ? 'default' : 'secondary'}>
                {config.enabled ? 'Actif' : 'Inactif'}
              </Badge>
              <Switch
                checked={config.enabled}
                onCheckedChange={v => setConfig(c => ({ ...c, enabled: v }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Configuration */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              Seuils de confiance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Seuil auto-apply</Label>
                <Badge variant="outline">{config.confidence_threshold}%</Badge>
              </div>
              <Slider
                value={[config.confidence_threshold]}
                onValueChange={([v]) => setConfig(c => ({ ...c, confidence_threshold: v }))}
                min={50}
                max={99}
                step={1}
              />
              <p className="text-xs text-muted-foreground">
                Les recommandations au-dessus de {config.confidence_threshold}% seront appliquées automatiquement
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Review humaine si Δ prix &gt;</Label>
                <Badge variant="outline">{config.require_human_review_above}%</Badge>
              </div>
              <Slider
                value={[config.require_human_review_above]}
                onValueChange={([v]) => setConfig(c => ({ ...c, require_human_review_above: v }))}
                min={5}
                max={50}
                step={1}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Max changements/jour</Label>
                <Badge variant="outline">{config.max_daily_auto_changes}</Badge>
              </div>
              <Slider
                value={[config.max_daily_auto_changes]}
                onValueChange={([v]) => setConfig(c => ({ ...c, max_daily_auto_changes: v }))}
                min={5}
                max={200}
                step={5}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Shield className="h-4 w-4 text-warning" />
              Garde-fous
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Variation prix max</Label>
                <Badge variant="outline">±{config.max_price_change_pct}%</Badge>
              </div>
              <Slider
                value={[config.max_price_change_pct]}
                onValueChange={([v]) => setConfig(c => ({ ...c, max_price_change_pct: v }))}
                min={3}
                max={30}
                step={1}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Marge plancher</Label>
                <Badge variant="outline">{config.min_margin_floor}%</Badge>
              </div>
              <Slider
                value={[config.min_margin_floor]}
                onValueChange={([v]) => setConfig(c => ({ ...c, min_margin_floor: v }))}
                min={0}
                max={40}
                step={1}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Scope</Label>
              <Select value={config.scope} onValueChange={(v: any) => setConfig(c => ({ ...c, scope: v }))}>
                <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les produits</SelectItem>
                  <SelectItem value="category">Par catégorie</SelectItem>
                  <SelectItem value="high_margin">Haute marge uniquement</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-3">
              <Switch
                checked={config.volatility_pause}
                onCheckedChange={v => setConfig(c => ({ ...c, volatility_pause: v }))}
              />
              <Label className="text-xs">Pause si volatilité marché élevée</Label>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Save button */}
      <div className="flex justify-end">
        <Button
          onClick={() => saveConfigMutation.mutate()}
          disabled={saveConfigMutation.isPending}
          className="gap-2"
        >
          {saveConfigMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Settings className="h-4 w-4" />}
          Sauvegarder la configuration
        </Button>
      </div>

      {/* Recommendations queue */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Auto-eligible */}
        <Card className="border-success/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Zap className="h-4 w-4 text-success" />
              Auto-apply éligibles ({autoEligible.length})
            </CardTitle>
            <CardDescription>Confiance ≥ {config.confidence_threshold}%</CardDescription>
          </CardHeader>
          <CardContent>
            {autoEligible.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground text-sm">
                <CheckCircle2 className="h-6 w-6 mx-auto mb-2 opacity-40" />
                Aucune recommandation éligible
              </div>
            ) : (
              <ScrollArea className="max-h-[300px]">
                <div className="space-y-2">
                  {autoEligible.map((rec: any, i: number) => (
                    <motion.div
                      key={rec.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.03 }}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
                    >
                      <div className="space-y-0.5 min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{rec.title}</p>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs text-success border-success/30">
                            {Math.round((rec.confidence_score || 0) * 100)}%
                          </Badge>
                          {rec.impact_estimate && (
                            <span className="text-xs text-muted-foreground">{rec.impact_estimate}</span>
                          )}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => applyRecommendation.mutate(rec)}
                        disabled={applyRecommendation.isPending}
                        className="shrink-0 text-xs h-7"
                      >
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Appliquer
                      </Button>
                    </motion.div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        {/* Needs review */}
        <Card className="border-warning/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Eye className="h-4 w-4 text-warning" />
              À vérifier ({reviewNeeded.length})
            </CardTitle>
            <CardDescription>Confiance &lt; {config.confidence_threshold}%</CardDescription>
          </CardHeader>
          <CardContent>
            {reviewNeeded.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground text-sm">
                <CheckCircle2 className="h-6 w-6 mx-auto mb-2 opacity-40" />
                Rien à vérifier
              </div>
            ) : (
              <ScrollArea className="max-h-[300px]">
                <div className="space-y-2">
                  {reviewNeeded.map((rec: any, i: number) => (
                    <motion.div
                      key={rec.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.03 }}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
                    >
                      <div className="space-y-0.5 min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{rec.title}</p>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs text-warning border-warning/30">
                            {Math.round((rec.confidence_score || 0) * 100)}%
                          </Badge>
                          {rec.description && (
                            <span className="text-xs text-muted-foreground truncate max-w-[180px]">{rec.description}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => applyRecommendation.mutate(rec)}
                          disabled={applyRecommendation.isPending}
                          className="text-xs h-7"
                        >
                          <CheckCircle2 className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={async () => {
                            await supabase.from('ai_recommendations')
                              .update({ status: 'dismissed', dismissed_at: new Date().toISOString() })
                              .eq('id', rec.id);
                            queryClient.invalidateQueries({ queryKey: ['ai-pricing-recommendations'] });
                            toast.info('Recommandation ignorée');
                          }}
                          className="text-xs h-7"
                        >
                          <XCircle className="h-3 w-3" />
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
