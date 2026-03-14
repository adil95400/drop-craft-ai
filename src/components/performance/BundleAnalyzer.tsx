/**
 * Bundle Analyzer - JS/CSS resource breakdown
 */
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Package, FileCode, Image, Type } from 'lucide-react';

interface BundleEntry {
  name: string;
  size: number;
  loadTime: number;
  type: 'js' | 'css' | 'font' | 'image';
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(2)} MB`;
}

const TYPE_META: Record<string, { icon: typeof Package; label: string }> = {
  js: { icon: FileCode, label: 'JavaScript' },
  css: { icon: FileCode, label: 'CSS' },
  font: { icon: Type, label: 'Polices' },
  image: { icon: Image, label: 'Images' },
};

export function BundleAnalyzer() {
  const [bundles, setBundles] = useState<BundleEntry[]>([]);

  useEffect(() => {
    const entries = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    const mapped: BundleEntry[] = entries
      .filter((e) => e.transferSize > 0)
      .map((e) => {
        let type: BundleEntry['type'] = 'js';
        if (e.name.endsWith('.css')) type = 'css';
        else if (/\.(woff2?|ttf|otf|eot)/.test(e.name)) type = 'font';
        else if (/\.(png|jpg|jpeg|gif|svg|webp|avif|ico)/.test(e.name)) type = 'image';
        else if (!e.name.endsWith('.js') && !e.name.includes('.js?')) type = 'js'; // default

        return {
          name: e.name.split('/').pop()?.split('?')[0] || e.name,
          size: e.transferSize,
          loadTime: e.responseEnd - e.startTime,
          type,
        };
      })
      .sort((a, b) => b.size - a.size);

    setBundles(mapped);
  }, []);

  const byType = bundles.reduce<Record<string, { count: number; totalSize: number }>>((acc, b) => {
    if (!acc[b.type]) acc[b.type] = { count: 0, totalSize: 0 };
    acc[b.type].count++;
    acc[b.type].totalSize += b.size;
    return acc;
  }, {});

  const totalSize = bundles.reduce((s, b) => s + b.size, 0);

  return (
    <div className="space-y-4">
      {/* Summary by type */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Object.entries(byType).map(([type, data]) => {
          const meta = TYPE_META[type] || TYPE_META.js;
          const Icon = meta.icon;
          const pct = totalSize > 0 ? (data.totalSize / totalSize) * 100 : 0;
          return (
            <Card key={type}>
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center gap-2 mb-2">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{meta.label}</span>
                </div>
                <div className="text-lg font-bold">{formatBytes(data.totalSize)}</div>
                <div className="flex items-center gap-2 mt-1">
                  <Progress value={pct} className="h-1.5 flex-1" />
                  <span className="text-xs text-muted-foreground">{pct.toFixed(0)}%</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{data.count} fichiers</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Top bundles */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Package className="h-4 w-4" />
            Top ressources par taille
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {bundles.slice(0, 15).map((b, i) => (
              <div key={i} className="flex items-center gap-3 text-sm">
                <span className="w-5 text-muted-foreground text-xs text-right">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <div className="truncate font-mono text-xs" title={b.name}>{b.name}</div>
                  <Progress
                    value={totalSize > 0 ? (b.size / totalSize) * 100 : 0}
                    className="h-1 mt-1"
                  />
                </div>
                <Badge variant="outline" className="text-xs shrink-0">
                  {formatBytes(b.size)}
                </Badge>
                <span className="text-xs text-muted-foreground w-[50px] text-right">
                  {b.loadTime.toFixed(0)}ms
                </span>
              </div>
            ))}
          </div>
          <div className="mt-3 pt-3 border-t flex justify-between text-sm">
            <span className="text-muted-foreground">Total transféré</span>
            <span className="font-semibold">{formatBytes(totalSize)}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
