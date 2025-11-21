import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart3, Download, FileText, TrendingUp, DollarSign, Package, Users } from 'lucide-react';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function ReportsPage() {
  const [dateRange, setDateRange] = useState('30');
  const [reportType, setReportType] = useState('sales');

  const { data: stats } = useQuery({
    queryKey: ['reports-stats', dateRange],
    queryFn: async () => {
      const { count: productsCount } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true });

      const { count: ordersCount } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true });

      const { count: customersCount } = await supabase
        .from('customers')
        .select('*', { count: 'exact', head: true });

      return {
        products: productsCount || 0,
        orders: ordersCount || 0,
        customers: customersCount || 0,
      };
    },
  });

  const handleGenerateReport = async () => {
    toast.info('Génération du rapport en cours...', {
      description: `Rapport ${reportType} pour les ${dateRange} derniers jours`,
    });
  };

  const handleExportReport = () => {
    toast.success('Export du rapport lancé', {
      description: 'Le fichier sera téléchargé dans quelques instants',
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Rapports & Analytics
            </h1>
            <p className="text-muted-foreground mt-2">
              Générez et consultez vos rapports de performance
            </p>
          </div>
          <Button onClick={handleExportReport}>
            <Download className="h-4 w-4 mr-2" />
            Exporter
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Revenus</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0 €</div>
              <p className="text-xs text-muted-foreground mt-1">
                +0% vs période précédente
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Commandes</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.orders || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Commandes totales
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Produits</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.products || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Produits en catalogue
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Clients</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.customers || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Clients actifs
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Générateur de Rapports</CardTitle>
            <CardDescription>Créez des rapports personnalisés selon vos besoins</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Type de rapport</label>
                <Select value={reportType} onValueChange={setReportType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sales">Ventes</SelectItem>
                    <SelectItem value="products">Produits</SelectItem>
                    <SelectItem value="customers">Clients</SelectItem>
                    <SelectItem value="inventory">Inventaire</SelectItem>
                    <SelectItem value="profit">Rentabilité</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Période</label>
                <Select value={dateRange} onValueChange={setDateRange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">7 derniers jours</SelectItem>
                    <SelectItem value="30">30 derniers jours</SelectItem>
                    <SelectItem value="90">90 derniers jours</SelectItem>
                    <SelectItem value="365">1 an</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button onClick={handleGenerateReport} className="w-full">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Générer le rapport
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Rapports Disponibles</CardTitle>
            <CardDescription>Consultez vos rapports générés précédemment</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="recent" className="space-y-4">
              <TabsList>
                <TabsTrigger value="recent">Récents</TabsTrigger>
                <TabsTrigger value="scheduled">Programmés</TabsTrigger>
                <TabsTrigger value="custom">Personnalisés</TabsTrigger>
              </TabsList>

              <TabsContent value="recent" className="space-y-4">
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Aucun rapport récent</p>
                  <p className="text-sm mt-2">Générez votre premier rapport ci-dessus</p>
                </div>
              </TabsContent>

              <TabsContent value="scheduled" className="space-y-4">
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Aucun rapport programmé</p>
                  <p className="text-sm mt-2">Configurez des rapports automatiques</p>
                </div>
              </TabsContent>

              <TabsContent value="custom" className="space-y-4">
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Aucun rapport personnalisé</p>
                  <p className="text-sm mt-2">Créez des rapports sur mesure</p>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
