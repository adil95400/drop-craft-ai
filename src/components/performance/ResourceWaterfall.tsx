/**
 * Resource Waterfall - Visualize resource loading timeline
 */
import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RefreshCw, Search, Filter } from 'lucide-react';

interface ResourceEntry {
  name: string;
  shortName: string;
  type: string;
  startTime: number;
  duration: number;
  transferSize: number;
  decodedSize: number;
  protocol: string;
}

const TYPE_COLORS: Record<string, string> = {
  script: 'bg-warning',
  css: 'bg-purple-500',
  img: 'bg-success',
  font: 'bg-info',
  fetch: 'bg-warning',
  xmlhttprequest: 'bg-warning',
  other: 'bg-muted-foreground',
};

function getResourceType(name: string, initiatorType: string): string {
  if (initiatorType === 'script' || name.endsWith('.js')) return 'script';
  if (initiatorType === 'css' || initiatorType === 'link' || name.endsWith('.css')) return 'css';
  if (initiatorType === 'img' || /\.(png|jpg|jpeg|gif|svg|webp|avif)/.test(name)) return 'img';
  if (/\.(woff2?|ttf|otf|eot)/.test(name)) return 'font';
  if (initiatorType === 'fetch' || initiatorType === 'xmlhttprequest') return 'fetch';
  return 'other';
}

function formatSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

export function ResourceWaterfall() {
  const [resources, setResources] = useState<ResourceEntry[]>([]);
  const [filter, setFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState<string | null>(null);

  const loadResources = useCallback(() => {
    const entries = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    const mapped = entries.map((e) => {
      const type = getResourceType(e.name, e.initiatorType);
      const parts = e.name.split('/');
      return {
        name: e.name,
        shortName: parts[parts.length - 1]?.split('?')[0] || e.name,
        type,
        startTime: e.startTime,
        duration: e.responseEnd - e.startTime,
        transferSize: e.transferSize || 0,
        decodedSize: e.decodedBodySize || 0,
        protocol: e.nextHopProtocol || '',
      };
    });
    setResources(mapped.sort((a, b) => a.startTime - b.startTime));
  }, []);

  useEffect(() => {
    loadResources();
  }, [loadResources]);

  const maxTime = Math.max(...resources.map((r) => r.startTime + r.duration), 1);

  const filtered = resources.filter((r) => {
    if (filter && !r.shortName.toLowerCase().includes(filter.toLowerCase())) return false;
    if (typeFilter && r.type !== typeFilter) return false;
    return true;
  });

  const typeCounts = resources.reduce<Record<string, number>>((acc, r) => {
    acc[r.type] = (acc[r.type] || 0) + 1;
    return acc;
  }, {});

  const totalSize = resources.reduce((s, r) => s + r.transferSize, 0);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">Waterfall des ressources</CardTitle>
          <Button variant="ghost" size="sm" onClick={loadResources}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center gap-2 flex-wrap mt-2">
          <div className="relative flex-1 min-w-[180px]">
            <Search className="h-3.5 w-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
            <Input
              placeholder="Filtrer..."
              className="h-8 pl-8 text-xs"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
          </div>
          <div className="flex gap-1">
            {Object.entries(typeCounts).map(([type, count]) => (
              <Badge
                key={type}
                variant={typeFilter === type ? 'default' : 'outline'}
                className="cursor-pointer text-xs"
                onClick={() => setTypeFilter(typeFilter === type ? null : type)}
              >
                {type} ({count})
              </Badge>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
          <span>{resources.length} ressources</span>
          <span>Total : {formatSize(totalSize)}</span>
          <span>Durée : {(maxTime / 1000).toFixed(2)}s</span>
        </div>
      </CardHeader>
      <CardContent className="max-h-[400px] overflow-y-auto">
        <div className="space-y-0.5">
          {filtered.slice(0, 60).map((r, i) => (
            <div key={i} className="flex items-center gap-2 text-xs group hover:bg-muted/50 rounded px-1 py-0.5">
              <div className="w-[140px] truncate font-mono text-muted-foreground" title={r.name}>
                {r.shortName}
              </div>
              <div className="w-[50px] text-right text-muted-foreground">{formatSize(r.transferSize)}</div>
              <div className="flex-1 h-4 relative bg-muted/30 rounded-sm overflow-hidden">
                <div
                  className={`absolute h-full rounded-sm ${TYPE_COLORS[r.type] || TYPE_COLORS.other} opacity-80`}
                  style={{
                    left: `${(r.startTime / maxTime) * 100}%`,
                    width: `${Math.max((r.duration / maxTime) * 100, 0.5)}%`,
                  }}
                />
              </div>
              <div className="w-[50px] text-right font-mono text-muted-foreground">
                {r.duration.toFixed(0)}ms
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
