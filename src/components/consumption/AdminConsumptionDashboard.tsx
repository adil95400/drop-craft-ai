/**
 * Dashboard Admin - Vue globale de la consommation de tous les utilisateurs
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Users, 
  AlertTriangle, 
  XCircle, 
  TrendingUp,
  Search,
  Eye,
  Filter,
  Crown,
  Activity,
  DollarSign,
  Zap,
  Package,
  Sparkles,
  Download
} from 'lucide-react';
import { useAdminConsumption } from '@/hooks/useConsumptionTracking';
import { QuotaKey } from '@/hooks/useUnifiedQuotas';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { getDateFnsLocale } from '@/utils/dateFnsLocale';

const STATUS_STYLES = {
  ok: { label: 'OK', icon: Activity, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-950/30' },
  warning: { label: 'Alerte', icon: AlertTriangle, color: 'text-yellow-500', bg: 'bg-yellow-50 dark:bg-yellow-950/30' },
  exhausted: { label: 'Épuisé', icon: XCircle, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-950/30' },
  unlimited: { label: 'Illimité', icon: Zap, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-950/30' },
};

const PLAN_BADGES: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
  free: { label: 'Gratuit', variant: 'secondary' },
  standard: { label: 'Standard', variant: 'default' },
  pro: { label: 'Pro', variant: 'default' },
  ultra_pro: { label: 'Ultra Pro', variant: 'default' },
};

interface UserDetailDialogProps {
  user: {
    user_id: string;
    email: string;
    full_name: string;
    company_name: string;
    plan: string;
    created_at: string;
    last_login_at: string;
    quotas: Array<{
      key: QuotaKey;
      limit: number;
      current: number;
      percentage: number;
      status: 'ok' | 'warning' | 'exhausted' | 'unlimited';
    }>;
    unread_alerts: number;
    addons: Array<{
      quota_key: QuotaKey;
      credits: number;
      expires_at: string | null;
    }>;
  };
}

function UserDetailDialog({ user }: UserDetailDialogProps) {
  return (
    <DialogContent className="max-w-2xl">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Crown className="h-5 w-5 text-amber-500" />
          Détail utilisateur
        </DialogTitle>
        <DialogDescription>
          {user.email}
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-6">
        {/* User Info */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Nom</p>
            <p className="font-medium">{user.full_name || '-'}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Entreprise</p>
            <p className="font-medium">{user.company_name || '-'}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Plan</p>
            <Badge variant={PLAN_BADGES[user.plan]?.variant || 'secondary'}>
              {PLAN_BADGES[user.plan]?.label || user.plan}
            </Badge>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Dernière connexion</p>
            <p className="font-medium">
              {user.last_login_at 
                ? format(new Date(user.last_login_at), 'PPp', { locale: getDateFnsLocale() })
                : 'Jamais'
              }
            </p>
          </div>
        </div>

        {/* Quotas */}
        <div>
          <h4 className="font-semibold mb-3">Quotas</h4>
          <div className="grid gap-3">
            {user.quotas.map((quota) => {
              const statusStyle = STATUS_STYLES[quota.status];
              const StatusIcon = statusStyle.icon;
              return (
                <div key={quota.key} className={cn('p-3 rounded-lg border', statusStyle.bg)}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <StatusIcon className={cn('h-4 w-4', statusStyle.color)} />
                      <span className="font-medium capitalize">{quota.key.replace('_', ' ')}</span>
                    </div>
                    <Badge variant="outline" className={statusStyle.color}>
                      {statusStyle.label}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress 
                      value={quota.status === 'unlimited' ? 0 : quota.percentage} 
                      className="flex-1 h-2"
                    />
                    <span className="text-sm text-muted-foreground min-w-24 text-right">
                      {quota.current} / {quota.status === 'unlimited' ? '∞' : quota.limit}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Add-ons */}
        {user.addons.length > 0 && (
          <div>
            <h4 className="font-semibold mb-3">Add-ons actifs</h4>
            <div className="grid gap-2">
              {user.addons.map((addon, i) => (
                <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                  <span className="capitalize">{addon.quota_key.replace('_', ' ')}</span>
                  <div className="text-right">
                    <span className="font-medium">+{addon.credits} crédits</span>
                    {addon.expires_at && (
                      <p className="text-xs text-muted-foreground">
                        Expire: {format(new Date(addon.expires_at), 'PP', { locale: getDateFnsLocale() })}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </DialogContent>
  );
}

export function AdminConsumptionDashboard() {
  const [searchTerm, setSearchTerm] = useState('');
  const [planFilter, setPlanFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  const { usersConsumption, overview, isLoading, isAdmin } = useAdminConsumption();

  if (!isAdmin) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-yellow-500" />
            <p className="font-medium">Accès non autorisé</p>
            <p className="text-sm">Vous devez être administrateur pour accéder à cette page.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  // Filter users
  const filteredUsers = usersConsumption.filter((user) => {
    const matchesSearch = 
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.full_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.company_name || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesPlan = planFilter === 'all' || user.plan === planFilter;
    
    const userStatus = user.quotas.some(q => q.status === 'exhausted') 
      ? 'exhausted' 
      : user.quotas.some(q => q.status === 'warning') 
        ? 'warning' 
        : 'ok';
    const matchesStatus = statusFilter === 'all' || userStatus === statusFilter;

    return matchesSearch && matchesPlan && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-500" />
              Total utilisateurs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview?.total_users || 0}</div>
            <div className="flex gap-1 mt-2 flex-wrap">
              {overview?.users_by_plan && Object.entries(overview.users_by_plan).map(([plan, count]) => (
                <Badge key={plan} variant="secondary" className="text-xs">
                  {plan}: {count}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-red-200 dark:border-red-900">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-500" />
              Quotas épuisés
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{overview?.users_at_limit || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              utilisateurs bloqués (24h)
            </p>
          </CardContent>
        </Card>

        <Card className="border-yellow-200 dark:border-yellow-900">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              Proche de la limite
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-500">{overview?.users_near_limit || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              utilisateurs à surveiller (24h)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-500" />
              Coût estimé (aujourd'hui)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${(overview?.total_consumption_today?.cost || 0).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {overview?.total_consumption_today?.actions || 0} actions / {overview?.total_consumption_today?.tokens || 0} tokens
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Consumption by Quota */}
      {overview?.consumption_by_quota && Object.keys(overview.consumption_by_quota).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Consommation globale par type
            </CardTitle>
            <CardDescription>Nombre d'actions par quota sur différentes périodes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {Object.entries(overview.consumption_by_quota).map(([key, data]) => {
                const icons: Record<string, React.ReactNode> = {
                  ai_generations: <Sparkles className="h-5 w-5 text-purple-500" />,
                  products: <Package className="h-5 w-5 text-blue-500" />,
                  imports_monthly: <Download className="h-5 w-5 text-green-500" />,
                };
                return (
                  <div key={key} className="p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-2 mb-2">
                      {icons[key] || <Activity className="h-5 w-5 text-gray-500" />}
                      <span className="text-sm font-medium capitalize">{key.replace('_', ' ')}</span>
                    </div>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Aujourd'hui:</span>
                        <span className="font-medium">{data.today}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Semaine:</span>
                        <span className="font-medium">{data.week}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Mois:</span>
                        <span className="font-medium">{data.month}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Users Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Tous les utilisateurs</CardTitle>
              <CardDescription>{filteredUsers.length} utilisateur(s) trouvé(s)</CardDescription>
            </div>
          </div>
          
          {/* Filters */}
          <div className="flex flex-wrap gap-3 mt-4">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par email, nom, entreprise..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={planFilter} onValueChange={setPlanFilter}>
              <SelectTrigger className="w-[140px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Plan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les plans</SelectItem>
                <SelectItem value="free">Gratuit</SelectItem>
                <SelectItem value="standard">Standard</SelectItem>
                <SelectItem value="pro">Pro</SelectItem>
                <SelectItem value="ultra_pro">Ultra Pro</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="ok">OK</SelectItem>
                <SelectItem value="warning">Alerte</SelectItem>
                <SelectItem value="exhausted">Épuisé</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Utilisateur</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Statut global</TableHead>
                  <TableHead>Quotas critiques</TableHead>
                  <TableHead>Alertes</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Aucun utilisateur trouvé
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => {
                    const criticalQuotas = user.quotas.filter(q => q.status === 'exhausted' || q.status === 'warning');
                    const globalStatus = user.quotas.some(q => q.status === 'exhausted') 
                      ? 'exhausted' 
                      : user.quotas.some(q => q.status === 'warning') 
                        ? 'warning' 
                        : 'ok';
                    const statusStyle = STATUS_STYLES[globalStatus];
                    const StatusIcon = statusStyle.icon;

                    return (
                      <TableRow key={user.user_id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{user.full_name || user.email}</div>
                            <div className="text-xs text-muted-foreground">{user.email}</div>
                            {user.company_name && (
                              <div className="text-xs text-muted-foreground">{user.company_name}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={PLAN_BADGES[user.plan]?.variant || 'secondary'}>
                            {PLAN_BADGES[user.plan]?.label || user.plan}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className={cn('flex items-center gap-2 px-2 py-1 rounded-full w-fit', statusStyle.bg)}>
                            <StatusIcon className={cn('h-3 w-3', statusStyle.color)} />
                            <span className={cn('text-sm', statusStyle.color)}>{statusStyle.label}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {criticalQuotas.length === 0 ? (
                              <span className="text-sm text-muted-foreground">-</span>
                            ) : (
                              criticalQuotas.slice(0, 3).map((q) => (
                                <Badge 
                                  key={q.key} 
                                  variant="outline"
                                  className={cn(
                                    'text-xs',
                                    q.status === 'exhausted' ? 'border-red-500 text-red-500' : 'border-yellow-500 text-yellow-500'
                                  )}
                                >
                                  {q.key}: {q.current}/{q.limit}
                                </Badge>
                              ))
                            )}
                            {criticalQuotas.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{criticalQuotas.length - 3}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {user.unread_alerts > 0 ? (
                            <Badge variant="destructive">{user.unread_alerts}</Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <Eye className="h-4 w-4 mr-1" />
                                Détail
                              </Button>
                            </DialogTrigger>
                            <UserDetailDialog user={user} />
                          </Dialog>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
