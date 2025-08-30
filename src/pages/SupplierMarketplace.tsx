import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Store,
  Search,
  Filter,
  Globe,
  Clock,
  Star,
  Zap,
  Users,
  Package,
  TrendingUp,
  CheckCircle,
  ExternalLink,
  Plus
} from 'lucide-react';
import { useModals } from '@/hooks/useModals';

interface MarketplaceSupplier {
  id: string;
  name: string;
  logo_url?: string;
  description: string;
  sector: string;
  country: string;
  supplier_type: 'api' | 'xml' | 'csv' | 'manual';
  connection_status: 'connected' | 'disconnected' | 'error';
  product_count: number;
  rating: number;
  tags: string[];
  is_featured: boolean;
  integration_complexity: 'easy' | 'medium' | 'hard';
  setup_time_minutes: number;
  supported_countries: string[];
  min_order_value?: number;
  commission_rate?: number;
}

// Mock data - will be replaced with real API call
const mockSuppliers: MarketplaceSupplier[] = [
  {
    id: '1',
    name: 'AliExpress Dropshipping',
    logo_url: '/logos/aliexpress.png',
    description: 'Plus grand marketplace chinois avec millions de produits à prix compétitifs',
    sector: 'Electronics',
    country: 'China',
    supplier_type: 'api',
    connection_status: 'disconnected',
    product_count: 50000000,
    rating: 4.2,
    tags: ['Dropshipping', 'Electronique', 'Mode', 'Maison'],
    is_featured: true,
    integration_complexity: 'easy',
    setup_time_minutes: 15,
    supported_countries: ['FR', 'DE', 'ES', 'IT', 'UK'],
    min_order_value: 0,
    commission_rate: 5.5
  },
  {
    id: '2',
    name: 'Faire Wholesale',
    description: 'Marketplace B2B avec des marques indépendantes et artisanales',
    sector: 'Fashion',
    country: 'USA',
    supplier_type: 'api',
    connection_status: 'disconnected',
    product_count: 400000,
    rating: 4.7,
    tags: ['Wholesale', 'Artisanal', 'Mode', 'Décoration'],
    is_featured: true,
    integration_complexity: 'medium',
    setup_time_minutes: 30,
    supported_countries: ['FR', 'DE', 'ES', 'IT', 'UK', 'US'],
    min_order_value: 100,
    commission_rate: 0
  },
  {
    id: '3',
    name: 'Spocket EU',
    description: 'Fournisseurs européens et américains pour le dropshipping premium',
    sector: 'General',
    country: 'Netherlands',
    supplier_type: 'api',
    connection_status: 'disconnected',
    product_count: 1000000,
    rating: 4.5,
    tags: ['Dropshipping', 'Premium', 'Livraison Rapide', 'Europe'],
    is_featured: true,
    integration_complexity: 'easy',
    setup_time_minutes: 10,
    supported_countries: ['FR', 'DE', 'ES', 'IT', 'UK'],
    min_order_value: 0,
    commission_rate: 0
  }
];

const sectors = ['Tous', 'Electronics', 'Fashion', 'Home', 'Beauty', 'Sports', 'General'];
const countries = ['Tous', 'France', 'China', 'USA', 'Germany', 'Netherlands', 'UK'];
const complexities = ['Tous', 'easy', 'medium', 'hard'];

export const SupplierMarketplace: React.FC = () => {
  const { openModal } = useModals();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSector, setSelectedSector] = useState('Tous');
  const [selectedCountry, setSelectedCountry] = useState('Tous');
  const [selectedComplexity, setSelectedComplexity] = useState('Tous');
  const [suppliers] = useState<MarketplaceSupplier[]>(mockSuppliers);

  const filteredSuppliers = suppliers.filter(supplier => {
    const matchesSearch = supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         supplier.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSector = selectedSector === 'Tous' || supplier.sector === selectedSector;
    const matchesCountry = selectedCountry === 'Tous' || supplier.country === selectedCountry;
    const matchesComplexity = selectedComplexity === 'Tous' || supplier.integration_complexity === selectedComplexity;
    
    return matchesSearch && matchesSector && matchesCountry && matchesComplexity;
  });

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'easy': return 'text-green-600 bg-green-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'hard': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getComplexityText = (complexity: string) => {
    switch (complexity) {
      case 'easy': return 'Facile';
      case 'medium': return 'Moyen';
      case 'hard': return 'Difficile';
      default: return complexity;
    }
  };

  const handleConnect = (supplier: MarketplaceSupplier) => {
    openModal('createSupplier', { supplierId: supplier.id, supplierData: supplier });
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Store className="h-8 w-8 text-primary" />
            Marketplace Fournisseurs
          </h1>
          <p className="text-muted-foreground mt-2">
            Connectez-vous aux meilleurs fournisseurs en 1 clic
          </p>
        </div>
        <Button onClick={() => openModal('createSupplier')} className="gap-2">
          <Plus className="h-4 w-4" />
          Ajouter un fournisseur
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Fournisseurs</p>
                <p className="text-2xl font-bold">{suppliers.length}+</p>
              </div>
              <Store className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Produits</p>
                <p className="text-2xl font-bold">50M+</p>
              </div>
              <Package className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pays</p>
                <p className="text-2xl font-bold">25+</p>
              </div>
              <Globe className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Intégrations</p>
                <p className="text-2xl font-bold">API+</p>
              </div>
              <Zap className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtres
          </CardTitle>
        </CardHeader>
        <CardContent>
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
            
            <Select value={selectedSector} onValueChange={setSelectedSector}>
              <SelectTrigger>
                <SelectValue placeholder="Secteur" />
              </SelectTrigger>
              <SelectContent>
                {sectors.map(sector => (
                  <SelectItem key={sector} value={sector}>{sector}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={selectedCountry} onValueChange={setSelectedCountry}>
              <SelectTrigger>
                <SelectValue placeholder="Pays" />
              </SelectTrigger>
              <SelectContent>
                {countries.map(country => (
                  <SelectItem key={country} value={country}>{country}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={selectedComplexity} onValueChange={setSelectedComplexity}>
              <SelectTrigger>
                <SelectValue placeholder="Difficulté" />
              </SelectTrigger>
              <SelectContent>
                {complexities.map(complexity => (
                  <SelectItem key={complexity} value={complexity}>
                    {complexity === 'Tous' ? complexity : getComplexityText(complexity)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Suppliers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSuppliers.map(supplier => (
          <Card key={supplier.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  {supplier.logo_url ? (
                    <img 
                      src={supplier.logo_url} 
                      alt={supplier.name}
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Store className="h-6 w-6 text-primary" />
                    </div>
                  )}
                  <div>
                    <CardTitle className="text-lg">{supplier.name}</CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {supplier.sector}
                      </Badge>
                      {supplier.is_featured && (
                        <Badge className="text-xs bg-yellow-100 text-yellow-800">
                          <Star className="h-3 w-3 mr-1" fill="currentColor" />
                          Populaire
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                <Badge 
                  className={getComplexityColor(supplier.integration_complexity)}
                  variant="secondary"
                >
                  {getComplexityText(supplier.integration_complexity)}
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground line-clamp-2">
                {supplier.description}
              </p>
              
              <div className="flex flex-wrap gap-1">
                {supplier.tags.slice(0, 3).map(tag => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
                {supplier.tags.length > 3 && (
                  <Badge variant="secondary" className="text-xs">
                    +{supplier.tags.length - 3}
                  </Badge>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <span>{supplier.product_count.toLocaleString()} produits</span>
                </div>
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <span>{supplier.country}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>{supplier.setup_time_minutes}min setup</span>
                </div>
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-muted-foreground" />
                  <span>{supplier.rating}/5</span>
                </div>
              </div>
              
              {supplier.min_order_value && (
                <div className="text-xs text-muted-foreground">
                  Commande min: {supplier.min_order_value}€
                </div>
              )}
              
              <div className="flex gap-2">
                <Button 
                  onClick={() => handleConnect(supplier)}
                  className="flex-1 gap-2"
                >
                  <Zap className="h-4 w-4" />
                  Connecter
                </Button>
                <Button variant="outline" size="icon">
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Featured Banner */}
      <Card className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
        <CardContent className="p-8">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <h3 className="text-2xl font-bold">Votre fournisseur n'est pas listé ?</h3>
              <p className="text-blue-100">
                Ajoutez manuellement votre fournisseur ou contactez-nous pour l'intégrer
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => openModal('createSupplier')}>
                Ajouter manuellement
              </Button>
              <Button variant="outline" className="text-white border-white hover:bg-white/10">
                Nous contacter
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};