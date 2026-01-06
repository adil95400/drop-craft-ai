/**
 * Supplier Import Panel
 * Panel for importing products from connected suppliers
 */
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import {
  Download,
  Package,
  Search,
  Filter,
  RefreshCw,
  Check,
  AlertCircle,
  TrendingUp,
  Star,
  DollarSign,
  Clock,
  Truck,
  Settings2
} from 'lucide-react';

interface ImportFilters {
  category?: string;
  keywords?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  country?: string;
  limit: number;
}

interface ImportJob {
  id: string;
  supplier_id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  total_products: number;
  imported_count: number;
  failed_count: number;
  created_at: string;
}

export function SupplierImportPanel() {
  const queryClient = useQueryClient();
  const [selectedConnection, setSelectedConnection] = useState<string>('');
  const [importType, setImportType] = useState<string>('trending');
  const [filters, setFilters] = useState<ImportFilters>({
    limit: 50,
    minRating: 4.0
  });
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);

  // Fetch connected suppliers
  const { data: connections = [] } = useQuery({
    queryKey: ['supplier-connections'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('premium_supplier_connections')
        .select('*')
        .eq('user_id', user.id)
        .eq('connection_status', 'active');

      if (error) throw error;
      return (data || []).map(conn => ({
        ...conn,
        supplier_id: conn.premium_supplier_id
      }));
    }
  });

  // Fetch import history
  const { data: importHistory = [] } = useQuery({
    queryKey: ['import-history'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('import_jobs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data || [];
    }
  });

  // Import mutation
  const importMutation = useMutation({
    mutationFn: async () => {
      if (!selectedConnection) {
        throw new Error('Veuillez sélectionner un fournisseur');
      }

      const connection = connections.find((c: any) => c.id === selectedConnection);
      if (!connection) throw new Error('Connexion non trouvée');

      setIsImporting(true);
      setImportProgress(10);

      // Determine the edge function based on supplier
      let functionName = 'supplier-sync-products';
      if (connection.supplier_id === 'aliexpress') {
        functionName = 'aliexpress-integration';
      } else if (connection.supplier_id === 'cjdropshipping') {
        functionName = 'supplier-sync-products';
      }

      setImportProgress(30);

      const { data, error } = await supabase.functions.invoke(functionName, {
        body: {
          supplierId: connection.id,
          importType,
          filters,
          limit: filters.limit
        }
      });

      setImportProgress(90);

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      setImportProgress(100);
      queryClient.invalidateQueries({ queryKey: ['import-history'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      
      const imported = data?.syncStats?.imported || data?.data?.imported_count || 0;
      toast.success(`Import terminé: ${imported} produits importés`);
      
      setTimeout(() => {
        setIsImporting(false);
        setImportProgress(0);
      }, 1500);
    },
    onError: (error: any) => {
      setIsImporting(false);
      setImportProgress(0);
      toast.error(`Erreur: ${error.message}`);
    }
  });

  const importTypes = [
    { id: 'trending', label: 'Produits tendance', icon: TrendingUp, description: 'Produits populaires actuellement' },
    { id: 'bestsellers', label: 'Meilleures ventes', icon: Star, description: 'Top ventes du fournisseur' },
    { id: 'new_arrivals', label: 'Nouveautés', icon: Package, description: 'Derniers produits ajoutés' },
    { id: 'high_margin', label: 'Haute marge', icon: DollarSign, description: 'Produits avec marge élevée' }
  ];

  const getSupplierName = (supplierId: string) => {
    const names: Record<string, string> = {
      aliexpress: 'AliExpress',
      cjdropshipping: 'CJ Dropshipping',
      bigbuy: 'BigBuy',
      printful: 'Printful',
      vidaxl: 'VidaXL',
      matterhorn: 'Matterhorn'
    };
    return names[supplierId] || supplierId;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500"><Check className="h-3 w-3 mr-1" />Terminé</Badge>;
      case 'running':
        return <Badge className="bg-blue-500"><RefreshCw className="h-3 w-3 mr-1 animate-spin" />En cours</Badge>;
      case 'failed':
        return <Badge variant="destructive"><AlertCircle className="h-3 w-3 mr-1" />Échoué</Badge>;
      default:
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />En attente</Badge>;
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main Import Panel */}
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Importer des produits
            </CardTitle>
            <CardDescription>
              Importez des produits depuis vos fournisseurs connectés
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Supplier Selection */}
            <div className="space-y-2">
              <Label>Fournisseur source</Label>
              <Select value={selectedConnection} onValueChange={setSelectedConnection}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un fournisseur connecté" />
                </SelectTrigger>
                <SelectContent>
                  {connections.map((connection: any) => (
                    <SelectItem key={connection.id} value={connection.id}>
                      {getSupplierName(connection.supplier_id)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {connections.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Aucun fournisseur connecté. Connectez d'abord un fournisseur.
                </p>
              )}
            </div>

            {/* Import Type */}
            <div className="space-y-3">
              <Label>Type d'import</Label>
              <div className="grid grid-cols-2 gap-3">
                {importTypes.map((type) => {
                  const Icon = type.icon;
                  return (
                    <button
                      key={type.id}
                      onClick={() => setImportType(type.id)}
                      className={`p-3 rounded-lg border text-left transition-all ${
                        importType === type.id
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Icon className="h-4 w-4 text-primary" />
                        <span className="font-medium text-sm">{type.label}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{type.description}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Filters */}
            <div className="space-y-4">
              <Label className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Filtres
              </Label>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Mots-clés</Label>
                  <Input
                    placeholder="ex: electronics, fashion..."
                    value={filters.keywords || ''}
                    onChange={(e) => setFilters(prev => ({ ...prev, keywords: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Catégorie</Label>
                  <Input
                    placeholder="ex: Electronics"
                    value={filters.category || ''}
                    onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Prix min (€)</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={filters.minPrice || ''}
                    onChange={(e) => setFilters(prev => ({ ...prev, minPrice: Number(e.target.value) }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Prix max (€)</Label>
                  <Input
                    type="number"
                    placeholder="1000"
                    value={filters.maxPrice || ''}
                    onChange={(e) => setFilters(prev => ({ ...prev, maxPrice: Number(e.target.value) }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">
                  Note minimum: {filters.minRating?.toFixed(1) || '4.0'} ⭐
                </Label>
                <Slider
                  value={[filters.minRating || 4]}
                  onValueChange={([value]) => setFilters(prev => ({ ...prev, minRating: value }))}
                  min={1}
                  max={5}
                  step={0.1}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">
                  Nombre de produits: {filters.limit}
                </Label>
                <Slider
                  value={[filters.limit]}
                  onValueChange={([value]) => setFilters(prev => ({ ...prev, limit: value }))}
                  min={10}
                  max={500}
                  step={10}
                />
              </div>
            </div>

            {/* Progress */}
            {isImporting && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Import en cours...</span>
                  <span className="text-sm font-medium">{importProgress}%</span>
                </div>
                <Progress value={importProgress} />
              </div>
            )}

            {/* Import Button */}
            <Button
              className="w-full"
              size="lg"
              onClick={() => importMutation.mutate()}
              disabled={!selectedConnection || isImporting}
            >
              {isImporting ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Import en cours...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Lancer l'import ({filters.limit} produits)
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Sidebar - Import History */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Historique
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              <div className="space-y-3">
                {importHistory.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Aucun import récent
                  </p>
                ) : (
                  importHistory.map((job: any) => (
                    <div
                      key={job.id}
                      className="p-3 rounded-lg border bg-card space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">
                          {getSupplierName(job.source_type || 'unknown')}
                        </span>
                        {getStatusBadge(job.status)}
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{job.processed_count || 0} / {job.total_items || 0} produits</span>
                        <span>{new Date(job.created_at).toLocaleDateString('fr-FR')}</span>
                      </div>
                      {job.status === 'running' && (
                        <Progress value={((job.processed_count || 0) / (job.total_items || 1)) * 100} className="h-1" />
                      )}
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Statistiques
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total importés</span>
              <span className="font-bold">
                {importHistory.reduce((acc: number, job: any) => 
                  acc + (job.status === 'completed' ? (job.processed_count || 0) : 0), 0
                )}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Imports ce mois</span>
              <span className="font-bold">
                {importHistory.filter((job: any) => {
                  const jobDate = new Date(job.created_at);
                  const now = new Date();
                  return jobDate.getMonth() === now.getMonth() && jobDate.getFullYear() === now.getFullYear();
                }).length}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Taux de succès</span>
              <span className="font-bold text-green-500">
                {importHistory.length > 0
                  ? Math.round((importHistory.filter((j: any) => j.status === 'completed').length / importHistory.length) * 100)
                  : 0}%
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
