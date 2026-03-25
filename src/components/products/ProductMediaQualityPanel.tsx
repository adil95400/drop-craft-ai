/**
 * ProductMediaQualityPanel — Phase 1 Media Quality panel
 * Shows score, status, assets, and actions (collect, search, deduplicate)
 */
import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Images, Search, Trash2, RefreshCw, CheckCircle2, AlertTriangle,
  XCircle, Loader2, Sparkles, ArrowUpRight, ImagePlus, Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  getMediaStatus, collectMedia, searchSimilarImages,
  deduplicateMedia, scoreMedia,
  type MediaStatus, type MediaAsset
} from '@/services/media-engine';

interface ProductMediaQualityPanelProps {
  productId: string;
  onImagesUpdated?: () => void;
}

const STATUS_CONFIG = {
  ready_to_publish: {
    label: 'Prêt à publier',
    color: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800',
    icon: CheckCircle2,
    badge: 'default' as const,
  },
  needs_enrichment: {
    label: 'À enrichir',
    color: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800',
    icon: AlertTriangle,
    badge: 'secondary' as const,
  },
  blocked: {
    label: 'Bloqué',
    color: 'text-red-600 dark:text-red-400',
    bg: 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800',
    icon: XCircle,
    badge: 'destructive' as const,
  },
};

export function ProductMediaQualityPanel({ productId, onImagesUpdated }: ProductMediaQualityPanelProps) {
  const [status, setStatus] = useState<MediaStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getMediaStatus(productId);
      setStatus(data);
    } catch (err) {
      console.error('Failed to fetch media status:', err);
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const handleAction = async (action: string, fn: () => Promise<any>, successMsg: string) => {
    setActionLoading(action);
    try {
      const result = await fn();
      toast.success(successMsg);
      await fetchStatus();
      onImagesUpdated?.();
      return result;
    } catch (err) {
      toast.error(`Erreur: ${err instanceof Error ? err.message : 'Inconnue'}`);
    } finally {
      setActionLoading(null);
    }
  };

  const statusConfig = STATUS_CONFIG[status?.status || 'blocked'];
  const StatusIcon = statusConfig.icon;

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Score Overview */}
      <Card className={cn('border', statusConfig.bg)}>
        <CardContent className="pt-5 pb-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={cn('h-10 w-10 rounded-xl flex items-center justify-center', statusConfig.bg)}>
                <StatusIcon className={cn('h-5 w-5', statusConfig.color)} />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Score Média</h3>
                <p className={cn('text-2xl font-bold', statusConfig.color)}>
                  {status?.score ?? 0}/100
                </p>
              </div>
            </div>
            <Badge variant={statusConfig.badge}>{statusConfig.label}</Badge>
          </div>
          <Progress value={status?.score ?? 0} className="h-2" />
          <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
            <span>{status?.totalAssets ?? 0} images</span>
            {status?.lastEnrichedAt && (
              <span>Enrichi {new Date(status.lastEnrichedAt).toLocaleDateString('fr-FR')}</span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Score Breakdown */}
      {status?.breakdown && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Détail du score
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(status.breakdown).map(([key, item]) => (
              <div key={key}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-muted-foreground">{item.label}</span>
                  <span className="font-medium">{item.score}/{item.max}</span>
                </div>
                <Progress value={(item.score / item.max) * 100} className="h-1.5" />
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Actions Média
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start gap-2"
            disabled={!!actionLoading}
            onClick={() => handleAction(
              'collect',
              () => collectMedia(productId),
              'Images collectées depuis le produit'
            )}
          >
            {actionLoading === 'collect' ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
            Collecter les images du produit
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start gap-2"
            disabled={!!actionLoading}
            onClick={() => handleAction(
              'search',
              () => searchSimilarImages(productId),
              'Recherche d\'images terminée'
            )}
          >
            {actionLoading === 'search' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            Rechercher d'autres images
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start gap-2"
            disabled={!!actionLoading || (status?.totalAssets ?? 0) < 2}
            onClick={() => handleAction(
              'dedup',
              () => deduplicateMedia(productId),
              'Doublons supprimés'
            )}
          >
            {actionLoading === 'dedup' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            Dédupliquer les images
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start gap-2"
            disabled={!!actionLoading}
            onClick={() => handleAction(
              'score',
              () => scoreMedia(productId),
              'Score recalculé'
            )}
          >
            {actionLoading === 'score' ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Recalculer le score
          </Button>
        </CardContent>
      </Card>

      {/* Asset Grid */}
      {status?.assets && status.assets.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Images className="h-4 w-4" />
              Assets média ({status.assets.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="max-h-[300px]">
              <div className="grid grid-cols-4 gap-2">
                {status.assets.map((asset) => (
                  <div key={asset.id} className="relative group aspect-square rounded-lg overflow-hidden border bg-muted">
                    <img
                      src={asset.url}
                      alt=""
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/placeholder.svg';
                      }}
                    />
                    {asset.is_primary && (
                      <Badge className="absolute top-1 left-1 text-[9px] h-4 px-1">
                        Principal
                      </Badge>
                    )}
                    <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <p className="text-[9px] text-white truncate">{asset.source}</p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
