import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, 
  Filter, 
  Plus, 
  Eye, 
  Edit, 
  Mail, 
  Phone, 
  MapPin,
  User,
  Users,
  TrendingUp,
  DollarSign,
  ShoppingCart
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useLegacyPlan } from '@/lib/migration-helper';

interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  status: string;
  total_spent: number;
  total_orders: number;
  address?: any;
  created_at: string;
  updated_at: string;
}

const Customers = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { isUltraPro, isPro } = useLegacyPlan(user);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    email: '',
    phone: '',
    status: 'active'
  });

  useEffect(() => {
    fetchCustomers();
  }, [user]);

  const fetchCustomers = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCustomers(data || []);
    } catch (error) {
      console.error('Error fetching customers:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les clients",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createCustomer = async () => {
    if (!user || !newCustomer.name || !newCustomer.email) return;

    try {
      const { data, error } = await supabase
        .from('customers')
        .insert([{
          ...newCustomer,
          user_id: user.id,
          total_spent: 0,
          total_orders: 0
        }])
        .select()
        .single();

      if (error) throw error;

      setCustomers([data, ...customers]);
      setNewCustomer({ name: '', email: '', phone: '', status: 'active' });
      setShowCreateDialog(false);
      
      toast({
        title: "Succès",
        description: "Client créé avec succès",
      });
    } catch (error) {
      console.error('Error creating customer:', error);
      toast({
        title: "Erreur",
        description: "Impossible de créer le client",
        variant: "destructive"
      });
    }
  };

  const updateCustomerStatus = async (customerId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('customers')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', customerId)
        .eq('user_id', user?.id);

      if (error) throw error;

      setCustomers(customers.map(customer => 
        customer.id === customerId ? { ...customer, status: newStatus } : customer
      ));

      toast({
        title: "Succès",
        description: "Statut du client mis à jour",
      });
    } catch (error) {
      console.error('Error updating customer status:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le statut",
        variant: "destructive"
      });
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'inactive': return 'secondary';
      case 'blocked': return 'destructive';
      default: return 'secondary';
    }
  };

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || customer.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const customerStats = {
    total: customers.length,
    active: customers.filter(c => c.status === 'active').length,
    inactive: customers.filter(c => c.status === 'inactive').length,
    totalRevenue: customers.reduce((sum, customer) => sum + customer.total_spent, 0),
    averageOrderValue: customers.length > 0 
      ? customers.reduce((sum, customer) => sum + (customer.total_spent / Math.max(customer.total_orders, 1)), 0) / customers.length
      : 0
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">Clients</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-muted rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Clients</h2>
          <p className="text-muted-foreground">
            Gérez votre base de clients et suivez leurs achats
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Nouveau client
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Créer un nouveau client</DialogTitle>
              <DialogDescription>
                Ajoutez un nouveau client à votre base de données
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Nom complet *</Label>
                <Input
                  id="name"
                  value={newCustomer.name}
                  onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                  placeholder="Nom du client"
                />
              </div>
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={newCustomer.email}
                  onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                  placeholder="email@exemple.com"
                />
              </div>
              <div>
                <Label htmlFor="phone">Téléphone</Label>
                <Input
                  id="phone"
                  value={newCustomer.phone}
                  onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                  placeholder="+33 6 12 34 56 78"
                />
              </div>
              <div>
                <Label htmlFor="status">Statut</Label>
                <Select value={newCustomer.status} onValueChange={(value: string) => setNewCustomer({ ...newCustomer, status: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-background border shadow-md z-50">
                    <SelectItem value="active">Actif</SelectItem>
                    <SelectItem value="inactive">Inactif</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Annuler
                </Button>
                <Button onClick={createCustomer} disabled={!newCustomer.name || !newCustomer.email}>
                  Créer
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total clients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{customerStats.total}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clients actifs</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{customerStats.active}</div>
            <p className="text-xs text-muted-foreground">
              {((customerStats.active / Math.max(customerStats.total, 1)) * 100).toFixed(0)}% du total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Chiffre d'affaires</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(customerStats.totalRevenue)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Panier moyen</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(customerStats.averageOrderValue)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Customers Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Liste des clients</CardTitle>
              <CardDescription>
                {filteredCustomers.length} client(s) trouvé(s)
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher un client..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 w-[300px]"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-background border shadow-md z-50">
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="active">Actifs</SelectItem>
                  <SelectItem value="inactive">Inactifs</SelectItem>
                  <SelectItem value="blocked">Bloqués</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredCustomers.map((customer) => (
              <div key={customer.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{customer.name}</p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        <span>{customer.email}</span>
                      </div>
                      {customer.phone && (
                        <div className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          <span>{customer.phone}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="font-medium">{formatCurrency(customer.total_spent)}</p>
                    <p className="text-sm text-muted-foreground">
                      {customer.total_orders} commande(s)
                    </p>
                  </div>
                  
                  <Badge variant={getStatusColor(customer.status)}>
                    {customer.status}
                  </Badge>
                  
                  <div className="flex items-center gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" onClick={() => setSelectedCustomer(customer)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Profil client - {customer.name}</DialogTitle>
                          <DialogDescription>
                            Informations détaillées du client
                          </DialogDescription>
                        </DialogHeader>
                        
                        {selectedCustomer && (
                          <Tabs defaultValue="info" className="w-full">
                            <TabsList className="grid w-full grid-cols-3">
                              <TabsTrigger value="info">Informations</TabsTrigger>
                              <TabsTrigger value="orders">Commandes</TabsTrigger>
                              <TabsTrigger value="analytics">Analyse</TabsTrigger>
                            </TabsList>
                            
                            <TabsContent value="info" className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label>Nom</Label>
                                  <p className="text-sm">{selectedCustomer.name}</p>
                                </div>
                                <div>
                                  <Label>Email</Label>
                                  <p className="text-sm">{selectedCustomer.email}</p>
                                </div>
                                <div>
                                  <Label>Téléphone</Label>
                                  <p className="text-sm">{selectedCustomer.phone || 'Non renseigné'}</p>
                                </div>
                                <div>
                                  <Label>Statut</Label>
                                  <div className="flex items-center gap-2 mt-1">
                                    <Badge variant={getStatusColor(selectedCustomer.status)}>
                                      {selectedCustomer.status}
                                    </Badge>
                                    <Select
                                      value={selectedCustomer.status}
                                      onValueChange={(value) => updateCustomerStatus(selectedCustomer.id, value)}
                                    >
                                      <SelectTrigger className="w-[120px]">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent className="bg-background border shadow-md z-50">
                                        <SelectItem value="active">Actif</SelectItem>
                                        <SelectItem value="inactive">Inactif</SelectItem>
                                        <SelectItem value="blocked">Bloqué</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>
                                <div>
                                  <Label>Client depuis</Label>
                                  <p className="text-sm">{new Date(selectedCustomer.created_at).toLocaleDateString()}</p>
                                </div>
                                <div>
                                  <Label>Dernière mise à jour</Label>
                                  <p className="text-sm">{new Date(selectedCustomer.updated_at).toLocaleDateString()}</p>
                                </div>
                              </div>
                            </TabsContent>
                            
                            <TabsContent value="orders" className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <Card>
                                  <CardHeader>
                                    <CardTitle className="text-lg">Total dépensé</CardTitle>
                                  </CardHeader>
                                  <CardContent>
                                    <div className="text-2xl font-bold">
                                      {formatCurrency(selectedCustomer.total_spent)}
                                    </div>
                                  </CardContent>
                                </Card>
                                <Card>
                                  <CardHeader>
                                    <CardTitle className="text-lg">Nombre de commandes</CardTitle>
                                  </CardHeader>
                                  <CardContent>
                                    <div className="text-2xl font-bold">
                                      {selectedCustomer.total_orders}
                                    </div>
                                  </CardContent>
                                </Card>
                              </div>
                              <div className="text-center text-muted-foreground py-4">
                                Historique des commandes détaillé disponible dans la section Commandes
                              </div>
                            </TabsContent>
                            
                            <TabsContent value="analytics" className="space-y-4">
                              {isPro ? (
                                <div className="space-y-4">
                                  <Card>
                                    <CardHeader>
                                      <CardTitle className="text-lg">Panier moyen</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                      <div className="text-2xl font-bold">
                                        {formatCurrency(selectedCustomer.total_orders > 0 
                                          ? selectedCustomer.total_spent / selectedCustomer.total_orders 
                                          : 0
                                        )}
                                      </div>
                                    </CardContent>
                                  </Card>
                                  <div className="text-center text-muted-foreground py-4">
                                    <TrendingUp className="mx-auto h-8 w-8 mb-2" />
                                    Analyses avancées du comportement client
                                  </div>
                                </div>
                              ) : (
                                <div className="text-center text-muted-foreground py-8">
                                  <TrendingUp className="mx-auto h-12 w-12 mb-4 opacity-50" />
                                  <p>Analyses avancées disponibles avec le plan Pro</p>
                                </div>
                              )}
                            </TabsContent>
                          </Tabs>
                        )}
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </div>
            ))}
            
            {filteredCustomers.length === 0 && (
              <div className="text-center py-8">
                <Users className="mx-auto h-12 w-12 text-muted-foreground" />
                <p className="mt-2 text-muted-foreground">
                  {searchTerm || statusFilter !== 'all' 
                    ? 'Aucun client ne correspond aux critères de recherche'
                    : 'Aucun client trouvé'
                  }
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Customers;