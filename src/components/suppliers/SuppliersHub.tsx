import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Globe, MapPin, Package, Star, Plus, Settings, CheckCircle, XCircle, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';
import { useToast } from '@/hooks/use-toast';
import { QuickConnectSuppliers } from './QuickConnectSuppliers';

interface Supplier {
  id: string;
  name: string;
  description?: string;
  website?: string;
  country?: string;
  category?: string;
  supplier_type?: string;
  status: string;
  logo_url?: string;
  connection_status?: string;
  product_count?: number;
  rating?: number;
  tags?: string[];
  created_at: string;
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'connected': return <CheckCircle className="h-4 w-4 text-green-500" />;
    case 'error': return <XCircle className="h-4 w-4 text-red-500" />;
    case 'connecting': return <Clock className="h-4 w-4 text-yellow-500" />;
    default: return <XCircle className="h-4 w-4 text-gray-400" />;
  }
};

const getStatusBadgeVariant = (status: string) => {
  switch (status) {
    case 'connected': return 'default';
    case 'error': return 'destructive';
    case 'connecting': return 'secondary';
    default: return 'outline';
  }
};

export const SuppliersHub: React.FC = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedCountry, setSelectedCountry] = useState<string>('all');
  const [connectDialogOpen, setConnectDialogOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<{ id: string; name: string } | null>(null);
  const { user, effectivePlan, canAccess } = useUnifiedAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchSuppliers();
    }
  }, [user]);

  const fetchSuppliers = async () => {
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      // Map database fields to component interface
      const mappedSuppliers: Supplier[] = (data || []).map((s: any) => ({
        ...s,
        supplier_type: s.supplier_type || 'standard',
        connection_status: s.status === 'active' ? 'connected' : 'disconnected',
        product_count: s.product_count || 0,
        rating: s.rating || 4.5,
        tags: s.tags || []
      }));
      setSuppliers(mappedSuppliers);
    } catch (error: any) {
      console.error('Error fetching suppliers:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les fournisseurs",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const openConnectDialog = (supplierId: string, supplierName: string) => {
    setSelectedSupplier({ id: supplierId, name: supplierName });
    setConnectDialogOpen(true);
  };

  const handleConnectionSuccess = () => {
    fetchSuppliers();
  };

  const disconnectSupplier = async (supplierId: string) => {
    try {
      const { error } = await supabase
        .from('suppliers')
        .update({ 
          status: 'inactive',
        } as any)
        .eq('id', supplierId);

      if (error) throw error;

      toast({
        title: "Fournisseur déconnecté",
        description: "La connexion a été fermée",
      });
      
      fetchSuppliers();
    } catch (error: any) {
      console.error('Error disconnecting supplier:', error);
      toast({
        title: "Erreur",
        description: "Impossible de déconnecter le fournisseur",
        variant: "destructive"
      });
    }
  };

  const filteredSuppliers = suppliers.filter(supplier => {
    const matchesSearch = supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         supplier.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || supplier.category === selectedCategory;
    const matchesCountry = selectedCountry === 'all' || supplier.country === selectedCountry;
    
    return matchesSearch && matchesCategory && matchesCountry;
  });

  const categories = Array.from(new Set(suppliers.map(s => s.category).filter(Boolean)));
  const countries = Array.from(new Set(suppliers.map(s => s.country).filter(Boolean)));

  const connectedSuppliers = filteredSuppliers.filter(s => s.connection_status === 'connected' || s.status === 'active');
  const availableSuppliers = filteredSuppliers.filter(s => s.connection_status !== 'connected' && s.status !== 'active');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Hub Fournisseurs</h1>
          <p className="text-muted-foreground mt-1">
            Connectez-vous à des milliers de fournisseurs dans le monde entier
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="capitalize">
            Plan: {effectivePlan.replace('_', ' ')}
          </Badge>
          <Button onClick={() => window.location.reload()}>
            <Plus className="mr-2 h-4 w-4" />
            Actualiser
          </Button>
        </div>
      </div>

      {/* Filtres */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un fournisseur..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Catégorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les catégories</SelectItem>
                {categories.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedCountry} onValueChange={setSelectedCountry}>
              <SelectTrigger>
                <SelectValue placeholder="Pays" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les pays</SelectItem>
                {countries.map(country => (
                  <SelectItem key={country} value={country}>{country}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="text-sm text-muted-foreground flex items-center">
              <Package className="mr-2 h-4 w-4" />
              {filteredSuppliers.length} fournisseur(s)
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs pour connectés/disponibles */}
      <Tabs defaultValue="available" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="available" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Disponibles ({availableSuppliers.length})
          </TabsTrigger>
          <TabsTrigger value="connected" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Connectés ({connectedSuppliers.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="available" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {availableSuppliers.map((supplier) => (
              <Card key={supplier.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {supplier.logo_url ? (
                        <img 
                          src={supplier.logo_url} 
                          alt={supplier.name}
                          className="w-10 h-10 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Package className="h-5 w-5 text-primary" />
                        </div>
                      )}
                      <div>
                        <CardTitle className="text-lg">{supplier.name}</CardTitle>
                        <div className="flex items-center gap-2 mt-1">
                          {supplier.country && (
                            <Badge variant="outline" className="text-xs">
                              <MapPin className="mr-1 h-3 w-3" />
                              {supplier.country}
                            </Badge>
                          )}
                          <div className="flex items-center gap-1">
                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                            <span className="text-xs text-muted-foreground">
                              {(supplier.rating || 4.5).toFixed(1)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    {getStatusIcon(supplier.connection_status)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <CardDescription className="line-clamp-2">
                    {supplier.description}
                  </CardDescription>
                  
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      <Package className="inline mr-1 h-4 w-4" />
                      {(supplier.product_count || 0).toLocaleString()} produits
                    </div>
                    <Badge variant="outline" className="capitalize">
                      {supplier.supplier_type || 'standard'}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button 
                      onClick={() => openConnectDialog(supplier.id, supplier.name)}
                      disabled={supplier.connection_status === 'connecting'}
                      className="flex-1"
                    >
                      {supplier.connection_status === 'connecting' ? (
                        <>
                          <Clock className="mr-2 h-4 w-4 animate-spin" />
                          Connexion...
                        </>
                      ) : (
                        <>
                          <Plus className="mr-2 h-4 w-4" />
                          Se connecter
                        </>
                      )}
                    </Button>
                    <Button variant="outline" size="icon">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {availableSuppliers.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Package className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium">Aucun fournisseur disponible</p>
                <p className="text-muted-foreground text-center mt-2">
                  Modifiez vos filtres pour voir plus de fournisseurs
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="connected" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {connectedSuppliers.map((supplier) => (
              <Card key={supplier.id} className="border-green-200 bg-green-50/50">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {supplier.logo_url ? (
                        <img 
                          src={supplier.logo_url} 
                          alt={supplier.name}
                          className="w-10 h-10 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        </div>
                      )}
                      <div>
                        <CardTitle className="text-lg">{supplier.name}</CardTitle>
                        <Badge variant="default" className="mt-1">
                          Connecté
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <CardDescription className="line-clamp-2">
                    {supplier.description}
                  </CardDescription>
                  
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      <Package className="inline mr-1 h-4 w-4" />
                      {(supplier.product_count || 0).toLocaleString()} produits
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      <span className="text-xs">{(supplier.rating || 4.5).toFixed(1)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline"
                      onClick={() => disconnectSupplier(supplier.id)}
                      className="flex-1"
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      Déconnecter
                    </Button>
                    <Button size="icon">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {connectedSuppliers.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <CheckCircle className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium">Aucun fournisseur connecté</p>
                <p className="text-muted-foreground text-center mt-2">
                  Connectez-vous à des fournisseurs dans l'onglet "Disponibles"
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      <QuickConnectSuppliers
        open={connectDialogOpen}
        onOpenChange={(open) => {
          setConnectDialogOpen(open);
          if (!open) {
            handleConnectionSuccess();
          }
        }}
        supplierId={selectedSupplier?.id}
        supplierName={selectedSupplier?.name}
      />
    </div>
  );
};