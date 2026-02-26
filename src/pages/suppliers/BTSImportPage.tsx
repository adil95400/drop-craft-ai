import { Helmet } from 'react-helmet-async';
import { ArrowLeft, Package, RefreshCw, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BTSImportUploader } from '@/components/suppliers/BTSImportUploader';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { getDateFnsLocale } from '@/utils/dateFnsLocale';

interface ImportJob {
  id: string;
  created_at: string;
  status: string;
  processed_products: number;
  total_products: number;
  source: string;
}

export default function BTSImportPage() {
  // Get BTS Wholesaler supplier ID
  const { data: btsSupplier } = useQuery({
    queryKey: ['bts-supplier'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('suppliers')
        .select('id, name')
        .ilike('name', '%bts%wholesaler%')
        .single();
      
      if (error) {
        console.error('Error fetching BTS supplier:', error);
        return null;
      }
      return data;
    }
  });

  const btsSupplierUUID = btsSupplier?.id || '34997271-66ee-492a-ac16-f5bf8eb0c37a';

  // Fetch recent import jobs for BTS
  const { data: recentJobs } = useQuery<ImportJob[]>({
    queryKey: ['bts-import-jobs', btsSupplierUUID],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('import_jobs')
        .select('id, created_at, status, successful_imports, total_products, source_platform')
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (error) throw error;
      return (data || []).map(d => ({ 
        id: d.id,
        created_at: d.created_at,
        status: d.status,
        processed_products: d.successful_imports || 0,
        total_products: d.total_products || 0,
        source: d.source_platform || ''
      })) as ImportJob[];
    }
  });

  // Count BTS products
  const { data: productCount } = useQuery({
    queryKey: ['bts-products-count', btsSupplierUUID],
    queryFn: async (): Promise<number> => {
      const { count, error } = await supabase
        .from('products')
        .select('id', { count: 'exact', head: true })
        .or(`supplier_id.eq.${btsSupplierUUID},vendor.ilike.%bts%`);
      
      if (error) throw error;
      return count || 0;
    }
  });

  return (
    <>
      <Helmet>
        <title>Import BTSWholesaler | ShopOpti</title>
      </Helmet>

      <div className="container max-w-4xl py-8 space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/suppliers">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Import BTSWholesaler</h1>
            <p className="text-muted-foreground">
              Importez vos produits depuis un fichier CSV
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Package className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{productCount?.toLocaleString() || 0}</p>
                  <p className="text-sm text-muted-foreground">Produits BTS</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <RefreshCw className="h-8 w-8 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold">{recentJobs?.length || 0}</p>
                  <p className="text-sm text-muted-foreground">Imports récents</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Clock className="h-8 w-8 text-green-500" />
                <div>
                  <p className="text-2xl font-bold">
                    {recentJobs?.[0]?.created_at 
                      ? format(new Date(recentJobs[0].created_at), 'dd MMM', { locale: getDateFnsLocale() })
                      : '-'
                    }
                  </p>
                  <p className="text-sm text-muted-foreground">Dernier import</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Uploader */}
        <BTSImportUploader supplierId={btsSupplierUUID} />

        {/* Recent imports */}
        {recentJobs && recentJobs.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Historique des imports</CardTitle>
              <CardDescription>Vos 5 derniers imports BTSWholesaler</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentJobs.map((job) => (
                  <div
                    key={job.id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-card"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${
                        job.status === 'completed' ? 'bg-green-500' :
                        job.status === 'partial' ? 'bg-yellow-500' :
                        job.status === 'failed' ? 'bg-red-500' :
                        'bg-blue-500 animate-pulse'
                      }`} />
                      <div>
                        <p className="font-medium">
                          {job.processed_products || 0} / {job.total_products || 0} produits
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(job.created_at), 'dd/MM/yyyy HH:mm', { locale: getDateFnsLocale() })}
                        </p>
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded ${
                      job.status === 'completed' ? 'bg-green-100 text-green-700' :
                      job.status === 'partial' ? 'bg-yellow-100 text-yellow-700' :
                      job.status === 'failed' ? 'bg-red-100 text-red-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {job.status === 'completed' ? 'Terminé' :
                       job.status === 'partial' ? 'Partiel' :
                       job.status === 'failed' ? 'Échoué' :
                       'En cours'}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
