import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { usePublishProducts } from '@/hooks/usePublishProducts';
import { CheckCircle2, Clock, AlertCircle, TrendingUp } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export function PublishStatsCard() {
  const { stats, isLoadingStats } = usePublishProducts();

  if (isLoadingStats) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Statut de publication</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!stats) return null;

  const publishRate =
    stats.total > 0 ? Math.round((stats.published / stats.total) * 100) : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Statut de publication
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium">Produits publiés</p>
                <p className="text-xs text-muted-foreground">
                  {publishRate}% du catalogue
                </p>
              </div>
            </div>
            <span className="text-2xl font-bold">{stats.published}</span>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="h-4 w-4 text-orange-600" />
                <p className="text-xs text-muted-foreground">En attente</p>
              </div>
              <p className="text-xl font-bold">{stats.pending}</p>
            </div>

            <div className="p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <p className="text-xs text-muted-foreground">Synchronisés</p>
              </div>
              <p className="text-xl font-bold">{stats.synced}</p>
            </div>

            <div className="p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <p className="text-xs text-muted-foreground">Erreurs</p>
              </div>
              <p className="text-xl font-bold">{stats.errors}</p>
            </div>
          </div>

          {stats.outdated > 0 && (
            <div className="p-3 bg-orange-100 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-orange-600" />
                <p className="text-sm font-medium">
                  {stats.outdated} produit(s) nécessitent une mise à jour
                </p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
