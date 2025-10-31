import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Users, Plus, Search, Filter, Mail, Phone } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  total_orders: number;
  total_spent: number;
  created_at: string;
}

export default function CustomersPage() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');

  const { data: customers = [], isLoading } = useQuery({
    queryKey: ['customers', searchTerm],
    queryFn: async () => {
      let query = supabase
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false });

      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Customer[];
    }
  });

  const stats = {
    total: customers.length,
    new: customers.filter(c => {
      const createdDate = new Date(c.created_at);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return createdDate > weekAgo;
    }).length,
    active: customers.filter(c => c.total_orders > 0).length,
    totalRevenue: customers.reduce((sum, c) => sum + (c.total_spent || 0), 0)
  };

  return (
    <>
      <Helmet>
        <title>Clients - Gestion CRM | Drop Craft AI</title>
        <meta name="description" content="Gérez vos clients, suivez leurs commandes et optimisez votre relation client." />
      </Helmet>

      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Gestion Clients</h1>
            <p className="text-muted-foreground">
              Suivez et gérez votre base clients
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Filter className="mr-2 h-4 w-4" />
              Filtres
            </Button>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nouveau client
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">
                Base clients totale
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Nouveaux (7j)</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.new}</div>
              <p className="text-xs text-muted-foreground">
                Cette semaine
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Clients Actifs</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.active}</div>
              <p className="text-xs text-muted-foreground">
                Avec commandes
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">CA Total</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">€{stats.totalRevenue.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                Chiffre d'affaires cumulé
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Liste clients */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Mes Clients</CardTitle>
                <CardDescription>
                  Liste complète de vos clients
                </CardDescription>
              </div>
              <div className="relative w-72">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher un client..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : customers.length > 0 ? (
              <div className="space-y-4">
                {customers.map((customer) => (
                  <div key={customer.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                        <Users className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-semibold">{customer.name}</h4>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {customer.email}
                          </span>
                          {customer.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {customer.phone}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className="font-semibold">€{customer.total_spent?.toFixed(2) || '0.00'}</div>
                        <div className="text-sm text-muted-foreground">
                          {customer.total_orders || 0} commandes
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        Voir détails
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Users className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Aucun client trouvé</h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm ? 'Essayez un autre terme de recherche' : 'Commencez par ajouter votre premier client'}
                </p>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Ajouter un client
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
