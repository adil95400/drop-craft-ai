/**
 * ExtensionImportHistoryTable - Complete import history with table, filters and CSV export
 * Provides visibility of all imports from extension with detailed logs
 */

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Download, Search, Filter, RefreshCw, ExternalLink, 
  CheckCircle2, Clock, XCircle, Package, Calendar, TrendingUp
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { getDateFnsLocale } from '@/utils/dateFnsLocale';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ImportRecord {
  id: string;
  title: string;
  source_platform: string;
  source_url: string;
  status: 'active' | 'pending' | 'draft' | 'error';
  price: number;
  created_at: string;
}

const statusConfig = {
  active: { label: 'Réussi', color: 'bg-green-500/10 text-green-600 border-green-500/30', icon: CheckCircle2 },
  pending: { label: 'En cours', color: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30', icon: Clock },
  draft: { label: 'Brouillon', color: 'bg-blue-500/10 text-blue-600 border-blue-500/30', icon: Package },
  error: { label: 'Erreur', color: 'bg-red-500/10 text-red-600 border-red-500/30', icon: XCircle },
};

const platformIcons: Record<string, string> = {
  aliexpress: '🛒',
  amazon: '📦',
  ebay: '🏷️',
  temu: '🎯',
  shein: '👗',
  etsy: '🎨',
  banggood: '📱',
  dhgate: '🏭',
  cjdropshipping: '🚚',
  '1688': '🇨🇳',
  wish: '⭐',
  shopify: '🛍️',
  unknown: '📦',
};

export function ExtensionImportHistoryTable() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [platformFilter, setPlatformFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<string>('all');

  // Fetch import history
  const { data: imports = [], isLoading, refetch } = useQuery({
    queryKey: ['extension-import-history'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await (supabase
        .from('products') as any)
        .select('id, title, source_type, source_url, status, price, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(500);

      if (error) {
        console.error('Error fetching imports:', error);
        return [];
      }

      return (data || []) as ImportRecord[];
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Filter imports
  const filteredImports = useMemo(() => {
    let result = [...imports];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(item => 
        item.title?.toLowerCase().includes(query) ||
        item.source_platform?.toLowerCase().includes(query) ||
        item.source_url?.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter(item => item.status === statusFilter);
    }

    // Platform filter
    if (platformFilter !== 'all') {
      result = result.filter(item => item.source_platform?.toLowerCase() === platformFilter);
    }

    // Date range filter
    if (dateRange !== 'all') {
      const now = new Date();
      let cutoff: Date;
      switch (dateRange) {
        case 'today':
          cutoff = new Date(now.setHours(0, 0, 0, 0));
          break;
        case 'week':
          cutoff = new Date(now.setDate(now.getDate() - 7));
          break;
        case 'month':
          cutoff = new Date(now.setMonth(now.getMonth() - 1));
          break;
        default:
          cutoff = new Date(0);
      }
      result = result.filter(item => new Date(item.created_at) >= cutoff);
    }

    return result;
  }, [imports, searchQuery, statusFilter, platformFilter, dateRange]);

  // Get unique platforms
  const platforms = useMemo(() => {
    const unique = new Set(imports.map(i => i.source_platform?.toLowerCase()).filter(Boolean));
    return Array.from(unique);
  }, [imports]);

  // Stats
  const stats = useMemo(() => {
    const total = filteredImports.length;
    const success = filteredImports.filter(i => i.status === 'active').length;
    const pending = filteredImports.filter(i => i.status === 'pending').length;
    const errors = filteredImports.filter(i => i.status === 'error').length;
    const successRate = total > 0 ? Math.round((success / total) * 100) : 100;
    return { total, success, pending, errors, successRate };
  }, [filteredImports]);

  // Export to CSV
  const handleExportCSV = () => {
    if (filteredImports.length === 0) {
      toast.error('Aucune donnée à exporter');
      return;
    }

    const headers = ['ID', 'Titre', 'Plateforme', 'URL Source', 'Statut', 'Prix', 'Date Import'];
    const rows = filteredImports.map(item => [
      item.id,
      `"${(item.title || '').replace(/"/g, '""')}"`,
      item.source_platform || 'unknown',
      item.source_url || '',
      item.status || 'pending',
      item.price || 0,
      item.created_at ? format(new Date(item.created_at), 'yyyy-MM-dd HH:mm:ss') : ''
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `shopopti-imports-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success(`${filteredImports.length} imports exportés en CSV`);
  };

  const getPlatformIcon = (platform: string) => {
    return platformIcons[platform?.toLowerCase()] || platformIcons.unknown;
  };

  const getStatusBadge = (status: string) => {
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;
    return (
      <Badge variant="outline" className={cn('gap-1', config.color)}>
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array(5).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card className="p-3">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Package className="h-4 w-4" />
            <span className="text-xs">Total</span>
          </div>
          <p className="text-xl font-bold">{stats.total}</p>
        </Card>
        <Card className="p-3">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <span className="text-xs">Réussis</span>
          </div>
          <p className="text-xl font-bold text-green-600">{stats.success}</p>
        </Card>
        <Card className="p-3">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Clock className="h-4 w-4 text-yellow-500" />
            <span className="text-xs">En cours</span>
          </div>
          <p className="text-xl font-bold text-yellow-600">{stats.pending}</p>
        </Card>
        <Card className="p-3">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <XCircle className="h-4 w-4 text-red-500" />
            <span className="text-xs">Erreurs</span>
          </div>
          <p className="text-xl font-bold text-red-600">{stats.errors}</p>
        </Card>
        <Card className="p-3">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <TrendingUp className="h-4 w-4" />
            <span className="text-xs">Taux succès</span>
          </div>
          <p className="text-xl font-bold">{stats.successRate}%</p>
        </Card>
      </div>

      {/* Filters and Actions */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle className="text-lg">Historique des Imports</CardTitle>
              <CardDescription>
                {filteredImports.length} import{filteredImports.length > 1 ? 's' : ''} trouvé{filteredImports.length > 1 ? 's' : ''}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                <RefreshCw className="h-4 w-4 mr-1" />
                Actualiser
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportCSV}>
                <Download className="h-4 w-4 mr-1" />
                Export CSV
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters Row */}
          <div className="flex flex-wrap gap-3 mb-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par nom, plateforme..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous statuts</SelectItem>
                <SelectItem value="active">Réussis</SelectItem>
                <SelectItem value="pending">En cours</SelectItem>
                <SelectItem value="draft">Brouillon</SelectItem>
                <SelectItem value="error">Erreurs</SelectItem>
              </SelectContent>
            </Select>
            <Select value={platformFilter} onValueChange={setPlatformFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Plateforme" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes plateformes</SelectItem>
                {platforms.map(p => (
                  <SelectItem key={p} value={p}>
                    {getPlatformIcon(p)} {p.charAt(0).toUpperCase() + p.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-[140px]">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Période" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tout</SelectItem>
                <SelectItem value="today">Aujourd'hui</SelectItem>
                <SelectItem value="week">7 derniers jours</SelectItem>
                <SelectItem value="month">30 derniers jours</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <ScrollArea className="h-[500px] rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]"></TableHead>
                  <TableHead>Produit</TableHead>
                  <TableHead>Plateforme</TableHead>
                  <TableHead>Prix</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredImports.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-32 text-center">
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <Package className="h-8 w-8" />
                        <p>Aucun import trouvé</p>
                        {(searchQuery || statusFilter !== 'all' || platformFilter !== 'all') && (
                          <Button 
                            variant="link" 
                            size="sm"
                            onClick={() => {
                              setSearchQuery('');
                              setStatusFilter('all');
                              setPlatformFilter('all');
                              setDateRange('all');
                            }}
                          >
                            Réinitialiser les filtres
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredImports.map((item) => (
                    <TableRow key={item.id} className="group">
                      <TableCell>
                        <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center">
                          <Package className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-[250px]">
                          <p className="font-medium truncate">{item.title || 'Sans titre'}</p>
                          <p className="text-xs text-muted-foreground truncate">{item.source_url}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{getPlatformIcon(item.source_platform)}</span>
                          <span className="text-sm capitalize">{item.source_platform || 'inconnu'}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {item.price ? `${item.price.toFixed(2)} €` : '-'}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(item.status)}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p>{format(new Date(item.created_at), 'dd/MM/yyyy')}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(item.created_at), { addSuffix: true, locale: getDateFnsLocale() })}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {item.source_url && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => window.open(item.source_url, '_blank')}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
