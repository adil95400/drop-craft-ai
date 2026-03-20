/**
 * AI Performance Advisor - Generates optimization recommendations via AI
 */
import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, BrainCircuit, CheckCircle2, AlertTriangle, Lightbulb, Zap } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Recommendation {
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  effort: string;
}

function gatherPerformanceSnapshot() {
  const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
  const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
  const mem = (performance as any).memory;

  const jsResources = resources.filter((r) => r.name.endsWith('.js') || r.initiatorType === 'script');
  const cssResources = resources.filter((r) => r.name.endsWith('.css') || r.initiatorType === 'css' || r.initiatorType === 'link');
  const imgResources = resources.filter((r) => /\.(png|jpg|jpeg|gif|svg|webp|avif)/.test(r.name) || r.initiatorType === 'img');

  return {
    navigation: nav
      ? {
          loadTime: Math.round(nav.loadEventEnd),
          domContentLoaded: Math.round(nav.domContentLoadedEventEnd),
          ttfb: Math.round(nav.responseStart - nav.requestStart),
          domInteractive: Math.round(nav.domInteractive),
          protocol: nav.nextHopProtocol,
        }
      : null,
    resources: {
      total: resources.length,
      jsCount: jsResources.length,
      jsSize: jsResources.reduce((s, r) => s + (r.transferSize || 0), 0),
      cssCount: cssResources.length,
      cssSize: cssResources.reduce((s, r) => s + (r.transferSize || 0), 0),
      imgCount: imgResources.length,
      imgSize: imgResources.reduce((s, r) => s + (r.transferSize || 0), 0),
      totalTransferred: resources.reduce((s, r) => s + (r.transferSize || 0), 0),
      slowResources: resources.filter((r) => r.responseEnd - r.startTime > 500).length,
    },
    memory: mem
      ? {
          usedMB: Math.round(mem.usedJSHeapSize / 1048576),
          totalMB: Math.round(mem.totalJSHeapSize / 1048576),
          limitMB: Math.round(mem.jsHeapSizeLimit / 1048576),
          usagePercent: Math.round((mem.usedJSHeapSize / mem.jsHeapSizeLimit) * 100),
        }
      : null,
  };
}

const IMPACT_STYLES: Record<string, { class: string; icon: typeof AlertTriangle }> = {
  critical: { class: 'border-destructive/30 bg-destructive/5', icon: AlertTriangle },
  high: { class: 'border-orange-500/30 bg-warning/5', icon: Zap },
  medium: { class: 'border-yellow-500/30 bg-warning/5', icon: Lightbulb },
  low: { class: 'border-muted bg-muted/30', icon: Lightbulb },
};

export function AIPerformanceAdvisor() {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [analyzed, setAnalyzed] = useState(false);

  const analyze = useCallback(async () => {
    setLoading(true);
    try {
      const snapshot = gatherPerformanceSnapshot();
      const { data, error } = await supabase.functions.invoke('ai-performance-advisor', {
        body: { snapshot },
      });
      if (error) throw error;
      setRecommendations(data?.recommendations || []);
      setAnalyzed(true);
      toast.success('Analyse terminée');
    } catch (err) {
      // Fallback : local recommendations based on snapshot
      const snapshot = gatherPerformanceSnapshot();
      const fallback: Recommendation[] = [];

      if (snapshot.resources.jsSize > 1048576) {
        fallback.push({
          title: 'Réduire la taille des bundles JS',
          description: `${(snapshot.resources.jsSize / 1048576).toFixed(1)} MB de JavaScript transféré. Utilisez le code splitting et le tree-shaking pour réduire la taille.`,
          impact: 'high',
          category: 'Bundle',
          effort: 'Moyen',
        });
      }

      if (snapshot.resources.imgSize > 524288) {
        fallback.push({
          title: 'Optimiser les images',
          description: `${(snapshot.resources.imgSize / 1048576).toFixed(1)} MB d'images. Convertissez en WebP/AVIF et utilisez le lazy loading.`,
          impact: 'medium',
          category: 'Images',
          effort: 'Faible',
        });
      }

      if (snapshot.navigation && snapshot.navigation.ttfb > 600) {
        fallback.push({
          title: 'Améliorer le TTFB',
          description: `TTFB de ${snapshot.navigation.ttfb}ms (cible < 600ms). Vérifiez la mise en cache CDN et la configuration serveur.`,
          impact: 'high',
          category: 'Réseau',
          effort: 'Moyen',
        });
      }

      if (snapshot.memory && snapshot.memory.usagePercent > 60) {
        fallback.push({
          title: 'Réduire l\'utilisation mémoire',
          description: `${snapshot.memory.usagePercent}% du heap utilisé (${snapshot.memory.usedMB} MB). Vérifiez les fuites mémoire et les composants non démontés.`,
          impact: 'medium',
          category: 'Mémoire',
          effort: 'Élevé',
        });
      }

      if (snapshot.resources.slowResources > 3) {
        fallback.push({
          title: 'Ressources lentes détectées',
          description: `${snapshot.resources.slowResources} ressources prennent plus de 500ms. Ajoutez du prefetch pour les ressources critiques.`,
          impact: 'medium',
          category: 'Réseau',
          effort: 'Faible',
        });
      }

      if (fallback.length === 0) {
        fallback.push({
          title: 'Performances correctes',
          description: 'Aucun problème majeur détecté. Continuez à monitorer régulièrement.',
          impact: 'low',
          category: 'Général',
          effort: 'N/A',
        });
      }

      setRecommendations(fallback);
      setAnalyzed(true);
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <BrainCircuit className="h-4 w-4 text-primary" />
            Conseiller IA Performance
          </CardTitle>
          <Button onClick={analyze} disabled={loading} size="sm">
            {loading ? (
              <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Analyse...</>
            ) : (
              <><BrainCircuit className="h-4 w-4 mr-1" /> {analyzed ? 'Re-analyser' : 'Analyser'}</>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {!analyzed && !loading && (
          <div className="text-center py-8 text-muted-foreground">
            <BrainCircuit className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Lancez l'analyse pour obtenir des recommandations personnalisées</p>
          </div>
        )}

        {analyzed && (
          <div className="space-y-3">
            {recommendations.map((rec, i) => {
              const style = IMPACT_STYLES[rec.impact] || IMPACT_STYLES.low;
              const Icon = style.icon;
              return (
                <div key={i} className={`border rounded-lg p-3 ${style.class}`}>
                  <div className="flex items-start gap-2">
                    <Icon className="h-4 w-4 mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm">{rec.title}</span>
                        <Badge variant="outline" className="text-xs">{rec.category}</Badge>
                        <Badge
                          variant={rec.impact === 'critical' ? 'destructive' : rec.impact === 'high' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {rec.impact}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{rec.description}</p>
                      <p className="text-xs mt-1">
                        <span className="text-muted-foreground">Effort :</span>{' '}
                        <span className="font-medium">{rec.effort}</span>
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
