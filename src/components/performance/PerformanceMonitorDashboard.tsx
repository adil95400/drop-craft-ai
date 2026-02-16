/**
 * Sprint 18: Real-time Performance Monitoring Dashboard
 * Web Vitals, memory, cache stats, and query performance
 */
import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Activity, Cpu, Database, Gauge, HardDrive, RefreshCw, Zap } from 'lucide-react';
import { unifiedCache } from '@/services/UnifiedCacheService';
import { useQueryClient } from '@tanstack/react-query';

interface WebVital {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  target: number;
  unit: string;
}

interface MemoryInfo {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
}

export function PerformanceMonitorDashboard() {
  const [webVitals, setWebVitals] = useState<WebVital[]>([]);
  const [memoryInfo, setMemoryInfo] = useState<MemoryInfo | null>(null);
  const [cacheStats, setCacheStats] = useState({ total: 0, active: 0, expired: 0, hitRate: 0 });
  const [queryStats, setQueryStats] = useState({ total: 0, fetching: 0, stale: 0, fresh: 0 });
  const [fps, setFps] = useState(0);
  const queryClient = useQueryClient();

  const measureWebVitals = useCallback(() => {
    const vitals: WebVital[] = [];

    // Navigation timing
    const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (nav) {
      const lcp = nav.loadEventEnd - nav.startTime;
      vitals.push({
        name: 'LCP',
        value: Math.round(lcp),
        rating: lcp < 2500 ? 'good' : lcp < 4000 ? 'needs-improvement' : 'poor',
        target: 2500,
        unit: 'ms',
      });

      const fcp = nav.domContentLoadedEventEnd - nav.startTime;
      vitals.push({
        name: 'FCP',
        value: Math.round(fcp),
        rating: fcp < 1800 ? 'good' : fcp < 3000 ? 'needs-improvement' : 'poor',
        target: 1800,
        unit: 'ms',
      });

      const ttfb = nav.responseStart - nav.requestStart;
      vitals.push({
        name: 'TTFB',
        value: Math.round(ttfb),
        rating: ttfb < 800 ? 'good' : ttfb < 1800 ? 'needs-improvement' : 'poor',
        target: 800,
        unit: 'ms',
      });
    }

    // CLS from layout shift entries
    const clsEntries = performance.getEntriesByType('layout-shift') as any[];
    const cls = clsEntries.reduce((sum, e) => sum + (e.hadRecentInput ? 0 : e.value), 0);
    vitals.push({
      name: 'CLS',
      value: Math.round(cls * 1000) / 1000,
      rating: cls < 0.1 ? 'good' : cls < 0.25 ? 'needs-improvement' : 'poor',
      target: 0.1,
      unit: '',
    });

    setWebVitals(vitals);
  }, []);

  const measureMemory = useCallback(() => {
    if ('memory' in performance) {
      const mem = (performance as any).memory;
      setMemoryInfo({
        usedJSHeapSize: mem.usedJSHeapSize,
        totalJSHeapSize: mem.totalJSHeapSize,
        jsHeapSizeLimit: mem.jsHeapSizeLimit,
      });
    }
  }, []);

  const measureCacheStats = useCallback(() => {
    setCacheStats(unifiedCache.getStats());
  }, []);

  const measureQueryStats = useCallback(() => {
    const cache = queryClient.getQueryCache();
    const queries = cache.getAll();
    const fetching = queries.filter(q => q.state.fetchStatus === 'fetching').length;
    const stale = queries.filter(q => q.isStale()).length;
    setQueryStats({
      total: queries.length,
      fetching,
      stale,
      fresh: queries.length - stale,
    });
  }, [queryClient]);

  // FPS counter
  useEffect(() => {
    let frameCount = 0;
    let lastTime = performance.now();
    let animId: number;

    const countFrames = () => {
      frameCount++;
      const now = performance.now();
      if (now - lastTime >= 1000) {
        setFps(frameCount);
        frameCount = 0;
        lastTime = now;
      }
      animId = requestAnimationFrame(countFrames);
    };
    animId = requestAnimationFrame(countFrames);
    return () => cancelAnimationFrame(animId);
  }, []);

  // Refresh all metrics
  const refreshAll = useCallback(() => {
    measureWebVitals();
    measureMemory();
    measureCacheStats();
    measureQueryStats();
  }, [measureWebVitals, measureMemory, measureCacheStats, measureQueryStats]);

  useEffect(() => {
    refreshAll();
    const interval = setInterval(refreshAll, 5000);
    return () => clearInterval(interval);
  }, [refreshAll]);

  const ratingColor = (rating: string) => {
    switch (rating) {
      case 'good': return 'bg-green-500/10 text-green-700 border-green-500/20';
      case 'needs-improvement': return 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20';
      case 'poor': return 'bg-red-500/10 text-red-700 border-red-500/20';
      default: return '';
    }
  };

  const formatBytes = (bytes: number) => `${(bytes / 1048576).toFixed(1)} MB`;

  const memoryPercent = memoryInfo
    ? (memoryInfo.usedJSHeapSize / memoryInfo.jsHeapSizeLimit) * 100
    : 0;

  return (
    <div className="space-y-6">
      {/* FPS + Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 text-center">
            <Gauge className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
            <div className="text-2xl font-bold">{fps}</div>
            <p className="text-xs text-muted-foreground">FPS</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <Database className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
            <div className="text-2xl font-bold">{queryStats.total}</div>
            <p className="text-xs text-muted-foreground">Queries en cache</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <HardDrive className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
            <div className="text-2xl font-bold">{cacheStats.active}</div>
            <p className="text-xs text-muted-foreground">Entrées cache actives</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <Cpu className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
            <div className="text-2xl font-bold">{memoryInfo ? formatBytes(memoryInfo.usedJSHeapSize) : 'N/A'}</div>
            <p className="text-xs text-muted-foreground">Mémoire utilisée</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="vitals" className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="vitals" className="flex items-center gap-1.5">
              <Activity className="h-4 w-4" /> Web Vitals
            </TabsTrigger>
            <TabsTrigger value="memory" className="flex items-center gap-1.5">
              <Cpu className="h-4 w-4" /> Mémoire
            </TabsTrigger>
            <TabsTrigger value="cache" className="flex items-center gap-1.5">
              <Database className="h-4 w-4" /> Cache
            </TabsTrigger>
            <TabsTrigger value="queries" className="flex items-center gap-1.5">
              <Zap className="h-4 w-4" /> Queries
            </TabsTrigger>
          </TabsList>
          <Button variant="outline" size="sm" onClick={refreshAll}>
            <RefreshCw className="h-4 w-4 mr-1" /> Rafraîchir
          </Button>
        </div>

        <TabsContent value="vitals">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {webVitals.map((vital) => (
              <Card key={vital.name}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium">{vital.name}</CardTitle>
                    <Badge variant="outline" className={ratingColor(vital.rating)}>
                      {vital.rating === 'good' ? 'Bon' : vital.rating === 'needs-improvement' ? 'À améliorer' : 'Faible'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{vital.value}{vital.unit}</div>
                  <p className="text-xs text-muted-foreground mt-1">Cible : &lt; {vital.target}{vital.unit}</p>
                  <Progress
                    value={Math.min((vital.value / (vital.target * 2)) * 100, 100)}
                    className="mt-2 h-2"
                  />
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="memory">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Utilisation mémoire JavaScript</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {memoryInfo ? (
                <>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Heap utilisé</span>
                      <span>{formatBytes(memoryInfo.usedJSHeapSize)} / {formatBytes(memoryInfo.jsHeapSizeLimit)}</span>
                    </div>
                    <Progress value={memoryPercent} className="h-3" />
                    <p className="text-xs text-muted-foreground mt-1">{memoryPercent.toFixed(1)}% utilisé</p>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-lg font-semibold">{formatBytes(memoryInfo.usedJSHeapSize)}</div>
                      <p className="text-xs text-muted-foreground">Utilisé</p>
                    </div>
                    <div>
                      <div className="text-lg font-semibold">{formatBytes(memoryInfo.totalJSHeapSize)}</div>
                      <p className="text-xs text-muted-foreground">Total alloué</p>
                    </div>
                    <div>
                      <div className="text-lg font-semibold">{formatBytes(memoryInfo.jsHeapSizeLimit)}</div>
                      <p className="text-xs text-muted-foreground">Limite</p>
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-muted-foreground text-sm">API Memory non disponible dans ce navigateur.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cache">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Cache unifié</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between"><span className="text-sm">Total entrées</span><span className="font-semibold">{cacheStats.total}</span></div>
                <div className="flex justify-between"><span className="text-sm">Actives</span><span className="font-semibold text-green-600">{cacheStats.active}</span></div>
                <div className="flex justify-between"><span className="text-sm">Expirées</span><span className="font-semibold text-red-600">{cacheStats.expired}</span></div>
                <div className="flex justify-between"><span className="text-sm">Hit rate</span><span className="font-semibold">{(cacheStats.hitRate * 100).toFixed(1)}%</span></div>
                <Button variant="outline" size="sm" className="w-full mt-2" onClick={() => { unifiedCache.cleanup(); measureCacheStats(); }}>
                  Nettoyer le cache
                </Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Stratégies TTL</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {[
                  { name: 'Static', ttl: '1h', desc: 'Catalogue, catégories' },
                  { name: 'User', ttl: '30min', desc: 'Profil, préférences' },
                  { name: 'Transactional', ttl: '30s', desc: 'Commandes, stocks' },
                  { name: 'Realtime', ttl: '5s', desc: 'Notifications, stats live' },
                  { name: 'Analytics', ttl: '5min', desc: 'Dashboard, rapports' },
                ].map((s) => (
                  <div key={s.name} className="flex items-center justify-between text-sm">
                    <div>
                      <span className="font-medium">{s.name}</span>
                      <span className="text-muted-foreground ml-2">({s.desc})</span>
                    </div>
                    <Badge variant="outline">{s.ttl}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="queries">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">React Query — État du cache</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold">{queryStats.total}</div>
                  <p className="text-xs text-muted-foreground">Total queries</p>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-600">{queryStats.fetching}</div>
                  <p className="text-xs text-muted-foreground">En cours</p>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">{queryStats.fresh}</div>
                  <p className="text-xs text-muted-foreground">Fraîches</p>
                </div>
                <div>
                  <div className="text-2xl font-bold text-yellow-600">{queryStats.stale}</div>
                  <p className="text-xs text-muted-foreground">Périmées</p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full mt-4"
                onClick={() => { queryClient.invalidateQueries(); measureQueryStats(); }}
              >
                Invalider toutes les queries
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
