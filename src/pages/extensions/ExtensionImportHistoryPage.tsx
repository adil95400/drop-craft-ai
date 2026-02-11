/**
 * Extension Import History Page
 * Historique des imports par source avec filtrage avancé
 */
import { useState, useMemo } from 'react';
import { 
  Package, Chrome, Globe, FileSpreadsheet, Search, Filter,
  Download, RefreshCw, Eye, Trash2, MoreHorizontal, ExternalLink,
  CheckCircle, Clock, AlertCircle, TrendingUp
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { format, formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';

type ImportSource = 'all' | 'extension' | 'url' | 'csv' | 'manual';
type ImportStatus = 'all' | 'active' | 'pending' | 'draft';

export default function ExtensionImportHistoryPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [sourceFilter, setSourceFilter] = useState<ImportSource>('all');
  const [statusFilter, setStatusFilter] = useState<ImportStatus>('all');
  const [platformFilter, setPlatformFilter] = useState<string>('all');

  // Fetch imports
  const { data: imports = [], isLoading, refetch } = useQuery({
    queryKey: ['import-history', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('catalog_products')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(500);

      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  // Get unique platforms
  const platforms = useMemo(() => {
    const platformSet = new Set(imports.map(item => item.source_platform).filter(Boolean));
    return Array.from(platformSet) as string[];
  }, [imports]);

  // Filtered imports
  const filteredImports = useMemo(() => {
    return imports.filter(item => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (
          !item.title?.toLowerCase().includes(query) &&
          !item.source_platform?.toLowerCase().includes(query)
        ) {
          return false;
        }
      }

      // Source filter - determine source based on metadata
      if (sourceFilter !== 'all') {
        const importSource = detectImportSource(item);
        if (importSource !== sourceFilter) return false;
      }

      // Status filter
      if (statusFilter !== 'all') {
        if (item.status !== statusFilter) return false;
      }

      // Platform filter
      if (platformFilter !== 'all') {
        if (item.source_platform !== platformFilter) return false;
      }

      return true;
    });
  }, [imports, searchQuery, sourceFilter, statusFilter, platformFilter]);

  // Detect import source from metadata
  const detectImportSource = (item: any): ImportSource => {
    if (item.source_url?.includes('extension')) return 'extension';
    if (item.source_url) return 'url';
    if (item.metadata?.import_method === 'csv') return 'csv';
    if (item.metadata?.import_method === 'extension') return 'extension';
    return 'manual';
  };

  // Stats
  const stats = useMemo(() => {
    const total = imports.length;
    const extensionCount = imports.filter(i => detectImportSource(i) === 'extension').length;
    const urlCount = imports.filter(i => detectImportSource(i) === 'url').length;
    const activeCount = imports.filter(i => i.status === 'active').length;

    return { total, extensionCount, urlCount, activeCount };
  }, [imports]);

  const getSourceIcon = (source: ImportSource) => {
    switch (source) {
      case 'extension':
        return <Chrome className="h-4 w-4 text-cyan-500" />;
      case 'url':
        return <Globe className="h-4 w-4 text-blue-500" />;
      case 'csv':
        return <FileSpreadsheet className="h-4 w-4 text-green-500" />;
      default:
        return <Package className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500/10 text-green-600 border-green-500/20"><CheckCircle className="h-3 w-3 mr-1" />Actif</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20"><Clock className="h-3 w-3 mr-1" />En attente</Badge>;
      case 'draft':
        return <Badge className="bg-gray-500/10 text-gray-600 border-gray-500/20">Brouillon</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPlatformEmoji = (platform: string) => {
    const emojis: Record<string, string> = {
      aliexpress: '🛒',
      amazon: '📦',
      ebay: '🏷️',
      temu: '🎁',
      shopify: '🛍️',
      walmart: '🏪',
      etsy: '🎨',
    };
    return emojis[platform?.toLowerCase()] || '📦';
  };

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    setDeleteConfirmId(id);
  };

  const confirmDelete = async () => {
    if (!deleteConfirmId) return;

    try {
      const { error } = await supabase
        .from('catalog_products')
        .delete()
        .eq('id', deleteConfirmId);

      if (error) throw error;
      toast.success('Produit supprimé');
      refetch();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  return (
    <ChannablePageWrapper
      title="Historique des Imports"
      description={`${stats.total} produits importés • ${stats.activeCount} actifs`}
      heroImage="import"
      badge={{ label: 'Imports', icon: Package }}
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
          <Button onClick={() => navigate('/import')}>
            <Download className="h-4 w-4 mr-2" />
            Nouvel import
          </Button>
        </div>
      }
    >
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Package className="h-8 w-8 text-muted-foreground/30" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Via Extension</p>
                <p className="text-2xl font-bold text-cyan-600">{stats.extensionCount}</p>
              </div>
              <Chrome className="h-8 w-8 text-cyan-500/30" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Via URL</p>
                <p className="text-2xl font-bold text-blue-600">{stats.urlCount}</p>
              </div>
              <Globe className="h-8 w-8 text-blue-500/30" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Actifs</p>
                <p className="text-2xl font-bold text-green-600">{stats.activeCount}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500/30" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un produit..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select value={sourceFilter} onValueChange={(v) => setSourceFilter(v as ImportSource)}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes sources</SelectItem>
                <SelectItem value="extension">
                  <span className="flex items-center gap-2">
                    <Chrome className="h-4 w-4" /> Extension
                  </span>
                </SelectItem>
                <SelectItem value="url">
                  <span className="flex items-center gap-2">
                    <Globe className="h-4 w-4" /> URL
                  </span>
                </SelectItem>
                <SelectItem value="csv">
                  <span className="flex items-center gap-2">
                    <FileSpreadsheet className="h-4 w-4" /> CSV
                  </span>
                </SelectItem>
                <SelectItem value="manual">Manuel</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as ImportStatus)}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="active">Actif</SelectItem>
                <SelectItem value="pending">En attente</SelectItem>
                <SelectItem value="draft">Brouillon</SelectItem>
              </SelectContent>
            </Select>

            <Select value={platformFilter} onValueChange={setPlatformFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Plateforme" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes</SelectItem>
                {platforms.map(p => (
                  <SelectItem key={p} value={p}>
                    {getPlatformEmoji(p)} {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Badge variant="secondary">
              {filteredImports.length} résultats
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Import List */}
      <Card>
        <CardHeader>
          <CardTitle>Produits importés</CardTitle>
          <CardDescription>
            Cliquez sur un produit pour le modifier
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="flex items-center gap-4 p-4 border rounded-lg">
                  <Skeleton className="h-12 w-12 rounded" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredImports.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground">Aucun produit importé trouvé</p>
              <Button className="mt-4" onClick={() => navigate('/import')}>
                Importer des produits
              </Button>
            </div>
          ) : (
            <ScrollArea className="h-[500px]">
              <div className="space-y-3">
                {filteredImports.map((item) => {
                  const source = detectImportSource(item);
                  
                  return (
                    <div 
                      key={item.id}
                      className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/30 transition-colors cursor-pointer"
                      onClick={() => navigate(`/products/${item.id}`)}
                    >
                      {/* Image */}
                      <div className="h-14 w-14 rounded-lg bg-muted flex items-center justify-center overflow-hidden shrink-0">
                        {item.image_urls?.[0] ? (
                          <img 
                            src={item.image_urls[0]} 
                            alt={item.title} 
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <Package className="h-6 w-6 text-muted-foreground" />
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {getSourceIcon(source)}
                          <span className="font-medium truncate">{item.title}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          {item.source_platform && (
                            <span>{getPlatformEmoji(item.source_platform)} {item.source_platform}</span>
                          )}
                          <span>•</span>
                          <span>{formatDistanceToNow(new Date(item.created_at), { addSuffix: true, locale: fr })}</span>
                        </div>
                      </div>

                      {/* Price */}
                      {item.price && (
                        <div className="text-right">
                          <p className="font-semibold">{item.price.toFixed(2)} €</p>
                          {item.compare_at_price && (
                            <p className="text-xs text-muted-foreground line-through">
                              {item.compare_at_price.toFixed(2)} €
                            </p>
                          )}
                        </div>
                      )}

                      {/* Status */}
                      {getStatusBadge(item.status)}

                      {/* Actions */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/products/${item.id}`);
                          }}>
                            <Eye className="h-4 w-4 mr-2" />
                            Voir détails
                          </DropdownMenuItem>
                          {item.source_url && (
                            <DropdownMenuItem onClick={(e) => {
                              e.stopPropagation();
                              window.open(item.source_url, '_blank');
                            }}>
                              <ExternalLink className="h-4 w-4 mr-2" />
                              Voir source
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem 
                            className="text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(item.id);
                            }}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Supprimer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={!!deleteConfirmId}
        onOpenChange={(open) => { if (!open) setDeleteConfirmId(null) }}
        title="Supprimer ce produit importé ?"
        description="Cette action est irréversible."
        confirmText="Supprimer"
        variant="destructive"
        onConfirm={confirmDelete}
      />
    </ChannablePageWrapper>
  );
}
