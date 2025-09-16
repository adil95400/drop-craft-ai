import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Database, Users, ShoppingCart, Zap, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface DataStats {
  suppliers: number;
  customers: number;
  orders: number;
  products: number;
  automations: number;
}

export const RealisticDataButton = () => {
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<DataStats | null>(null);
  const { toast } = useToast();

  const generateData = async () => {
    setLoading(true);
    try {
      // Call the edge function to generate realistic data
      const { data, error } = await supabase.functions.invoke('generate-realistic-data');
      
      if (error) throw error;
      
      if (data?.success) {
        setStats(data.stats);
        toast({
          title: "Données réalistes créées !",
          description: `${data.stats.suppliers} fournisseurs, ${data.stats.customers} clients, ${data.stats.orders} commandes générés`,
        });
      } else {
        throw new Error(data?.error || 'Erreur inconnue');
      }
    } catch (error) {
      console.error('Error generating data:', error);
      toast({
        title: "Erreur",
        description: "Impossible de générer les données de démonstration",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrentStats = async () => {
    try {
      // Get current data counts
      const [suppliers, customers, orders, products] = await Promise.all([
        supabase.from('suppliers').select('id', { count: 'exact', head: true }),
        supabase.from('customers').select('id', { count: 'exact', head: true }),
        supabase.from('orders').select('id', { count: 'exact', head: true }),
        supabase.from('catalog_products').select('id', { count: 'exact', head: true })
      ]);

      setStats({
        suppliers: suppliers.count || 0,
        customers: customers.count || 0,
        orders: orders.count || 0,
        products: products.count || 0,
        automations: 0
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  React.useEffect(() => {
    fetchCurrentStats();
  }, []);

  return (
    <Card className="border-dashed border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Database className="h-6 w-6 text-primary" />
          </div>
          <div>
            <CardTitle className="text-lg">Données de Démonstration</CardTitle>
            <CardDescription>
              Générez des données réalistes pour tester l'application complète
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="flex items-center gap-2 p-2 bg-background/50 rounded-lg">
              <Users className="h-4 w-4 text-muted-foreground" />
              <div className="text-sm">
                <div className="font-medium">{stats.suppliers}</div>
                <div className="text-xs text-muted-foreground">Fournisseurs</div>
              </div>
            </div>
            <div className="flex items-center gap-2 p-2 bg-background/50 rounded-lg">
              <Users className="h-4 w-4 text-muted-foreground" />
              <div className="text-sm">
                <div className="font-medium">{stats.customers}</div>
                <div className="text-xs text-muted-foreground">Clients</div>
              </div>
            </div>
            <div className="flex items-center gap-2 p-2 bg-background/50 rounded-lg">
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              <div className="text-sm">
                <div className="font-medium">{stats.orders}</div>
                <div className="text-xs text-muted-foreground">Commandes</div>
              </div>
            </div>
            <div className="flex items-center gap-2 p-2 bg-background/50 rounded-lg">
              <Database className="h-4 w-4 text-muted-foreground" />
              <div className="text-sm">
                <div className="font-medium">{stats.products}</div>
                <div className="text-xs text-muted-foreground">Produits</div>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CheckCircle className="h-4 w-4 text-green-500" />
            Fournisseurs réalistes avec données de contact
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CheckCircle className="h-4 w-4 text-green-500" />
            Clients avec historique d'achats cohérent
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CheckCircle className="h-4 w-4 text-green-500" />
            Commandes avec statuts et produits réalistes
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CheckCircle className="h-4 w-4 text-green-500" />
            Automatisations et workflows fonctionnels
          </div>
        </div>

        <Button 
          onClick={generateData} 
          disabled={loading}
          className="w-full"
          size="lg"
        >
          {loading ? (
            <>
              <Zap className="h-4 w-4 mr-2 animate-spin" />
              Génération en cours...
            </>
          ) : (
            <>
              <Database className="h-4 w-4 mr-2" />
              Générer des Données Réalistes
            </>
          )}
        </Button>

        <div className="text-xs text-muted-foreground text-center">
          💡 Ces données vous permettront de tester toutes les fonctionnalités de l'application
        </div>
      </CardContent>
    </Card>
  );
};