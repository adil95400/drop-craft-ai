import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAutoFulfillment } from '@/hooks/useAutoFulfillment';
import { Package, TrendingUp, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

export function FulfillmentDashboard() {
  const { stats, isLoadingStats } = useAutoFulfillment();

  if (isLoadingStats) {
    return <div className="p-4 text-center text-muted-foreground">Chargement...</div>;
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Stats Grid - 2 cols on mobile, 4 on desktop */}
      <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 md:p-6 pb-2">
            <CardTitle className="text-xs md:text-sm font-medium truncate pr-2">
              <span className="hidden xs:inline">Commandes </span>Aujourd'hui
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground shrink-0" />
          </CardHeader>
          <CardContent className="p-3 md:p-6 pt-0">
            <div className="text-xl md:text-2xl font-bold">{stats?.todayOrders || 0}</div>
            <p className="text-[10px] md:text-xs text-muted-foreground">
              Traitement auto
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 md:p-6 pb-2">
            <CardTitle className="text-xs md:text-sm font-medium truncate pr-2">Taux Succès</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600 shrink-0" />
          </CardHeader>
          <CardContent className="p-3 md:p-6 pt-0">
            <div className="text-xl md:text-2xl font-bold">{stats?.successRate || 0}%</div>
            <Progress value={stats?.successRate || 0} className="mt-2 h-1.5 md:h-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 md:p-6 pb-2">
            <CardTitle className="text-xs md:text-sm font-medium truncate pr-2">Temps Moyen</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
          </CardHeader>
          <CardContent className="p-3 md:p-6 pt-0">
            <div className="text-xl md:text-2xl font-bold">{stats?.avgProcessingTime || 0}s</div>
            <p className="text-[10px] md:text-xs text-muted-foreground truncate">
              Traitement auto
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 md:p-6 pb-2">
            <CardTitle className="text-xs md:text-sm font-medium truncate pr-2">En Attente</CardTitle>
            <AlertCircle className="h-4 w-4 text-yellow-600 shrink-0" />
          </CardHeader>
          <CardContent className="p-3 md:p-6 pt-0">
            <div className="text-xl md:text-2xl font-bold">{stats?.pendingOrders || 0}</div>
            <p className="text-[10px] md:text-xs text-muted-foreground truncate">
              Nécessitent attention
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Status and Suppliers Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="p-4 md:p-6">
            <CardTitle className="text-base md:text-lg">Statut des Commandes</CardTitle>
            <CardDescription className="text-xs md:text-sm">Répartition par statut</CardDescription>
          </CardHeader>
          <CardContent className="p-4 md:p-6 pt-0 space-y-3 md:space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />
                <span className="text-xs md:text-sm">Confirmées</span>
              </div>
              <span className="font-bold text-sm md:text-base">{stats?.completed || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-blue-600 shrink-0" />
                <span className="text-xs md:text-sm">Expédiées</span>
              </div>
              <span className="font-bold text-sm md:text-base">{(stats as any)?.unsyncedTracking || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-yellow-600 shrink-0" />
                <span className="text-xs md:text-sm">En traitement</span>
              </div>
              <span className="font-bold text-sm md:text-base">{stats?.processing || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <XCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span className="text-xs md:text-sm">Échouées</span>
              </div>
              <span className="font-bold text-sm md:text-base">{stats?.failed || 0}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-4 md:p-6">
            <CardTitle className="text-base md:text-lg">Fournisseurs Actifs</CardTitle>
            <CardDescription className="text-xs md:text-sm">Performance par fournisseur</CardDescription>
          </CardHeader>
          <CardContent className="p-4 md:p-6 pt-0 space-y-3 md:space-y-4">
            {stats?.topSuppliers?.map((supplier: any) => (
              <div key={supplier.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs md:text-sm font-medium truncate pr-2">{supplier.name}</span>
                  <span className="text-xs md:text-sm text-muted-foreground shrink-0">
                    {supplier.orders} cmd
                  </span>
                </div>
                <Progress value={supplier.successRate} className="h-1.5 md:h-2" />
              </div>
            )) || (
              <p className="text-xs md:text-sm text-muted-foreground">
                Aucun fournisseur connecté
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
