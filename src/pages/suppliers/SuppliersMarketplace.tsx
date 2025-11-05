import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Store,
  Search,
  Filter,
  Globe,
  Clock,
  Star,
  Zap,
  Package,
  TrendingUp,
  ExternalLink,
  Plus,
  Shield,
  BarChart3
} from 'lucide-react';

interface MarketplaceSupplier {
  id: string;
  name: string;
  logo_url?: string;
  description: string;
  sector: string;
  country: string;
  supplier_type: 'api' | 'xml' | 'csv' | 'manual';
  product_count: number;
  rating: number;
  tags: string[];
  is_featured: boolean;
  integration_complexity: 'easy' | 'medium' | 'hard';
  setup_time_minutes: number;
  min_order_value?: number;
  commission_rate?: number;
  shipping_countries: string[];
}

const MARKETPLACE_SUPPLIERS: MarketplaceSupplier[] = [
  {
    id: '1',
    name: 'AliExpress Dropshipping',
    logo_url: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=100&h=100&fit=crop',
    description: 'Plus grand marketplace chinois avec millions de produits à prix compétitifs',
    sector: 'Multimarché',
    country: 'Chine',
    supplier_type: 'api',
    product_count: 50000000,
    rating: 4.2,
    tags: ['Dropshipping', 'Électronique', 'Mode', 'Maison'],
    is_featured: true,
    integration_complexity: 'easy',
    setup_time_minutes: 15,
    min_order_value: 0,
    commission_rate: 5.5,
    shipping_countries: ['FR', 'DE', 'ES', 'IT', 'UK']
  },
  {
    id: '2',
    name: 'Faire Wholesale',
    logo_url: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=100&h=100&fit=crop',
    description: 'Marketplace B2B avec des marques indépendantes et artisanales',
    sector: 'Mode & Décoration',
    country: 'USA',
    supplier_type: 'api',
    product_count: 400000,
    rating: 4.7,
    tags: ['Wholesale', 'Artisanal', 'Premium'],
    is_featured: true,
    integration_complexity: 'medium',
    setup_time_minutes: 30,
    min_order_value: 100,
    commission_rate: 0,
    shipping_countries: ['FR', 'DE', 'ES', 'IT', 'UK', 'US']
  },
  {
    id: '3',
    name: 'Spocket EU',
    logo_url: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=100&h=100&fit=crop',
    description: 'Fournisseurs européens et américains pour le dropshipping premium',
    sector: 'Multimarché',
    country: 'Pays-Bas',
    supplier_type: 'api',
    product_count: 1000000,
    rating: 4.5,
    tags: ['Dropshipping', 'Premium', 'Livraison Rapide'],
    is_featured: true,
    integration_complexity: 'easy',
    setup_time_minutes: 10,
    min_order_value: 0,
    commission_rate: 0,
    shipping_countries: ['FR', 'DE', 'ES', 'IT', 'UK']
  },
  {
    id: '4',
    name: 'Oberlo by Shopify',
    logo_url: 'https://images.unsplash.com/photo-1556740758-90de374c12ad?w=100&h=100&fit=crop',
    description: 'Intégration native Shopify pour le dropshipping',
    sector: 'Multimarché',
    country: 'Canada',
    supplier_type: 'api',
    product_count: 8000000,
    rating: 4.3,
    tags: ['Shopify', 'Dropshipping', 'Auto-import'],
    is_featured: false,
    integration_complexity: 'easy',
    setup_time_minutes: 5,
    min_order_value: 0,
    commission_rate: 0,
    shipping_countries: ['Mondial']
  },
  {
    id: '5',
    name: 'BigBuy',
    logo_url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=100&h=100&fit=crop',
    description: 'Grossiste européen avec entrepôts en Europe',
    sector: 'Multimarché',
    country: 'Espagne',
    supplier_type: 'api',
    product_count: 150000,
    rating: 4.6,
    tags: ['Wholesale', 'Stock Europe', 'Livraison rapide'],
    is_featured: true,
    integration_complexity: 'medium',
    setup_time_minutes: 20,
    min_order_value: 0,
    commission_rate: 0,
    shipping_countries: ['FR', 'DE', 'ES', 'IT', 'UK', 'PT']
  },
  {
    id: '6',
    name: 'CJDropshipping',
    logo_url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=100&h=100&fit=crop',
    description: 'Service complet de dropshipping avec fulfillment',
    sector: 'Multimarché',
    country: 'Chine',
    supplier_type: 'api',
    product_count: 500000,
    rating: 4.4,
    tags: ['Dropshipping', 'Fulfillment', 'POD'],
    is_featured: false,
    integration_complexity: 'easy',
    setup_time_minutes: 12,
    min_order_value: 0,
    commission_rate: 0,
    shipping_countries: ['Mondial']
  }
];

const sectors = ['Tous', 'Multimarché', 'Mode & Décoration', 'Électronique', 'Beauté', 'Sports'];
const countries = ['Tous', 'Chine', 'USA', 'Europe', 'Pays-Bas', 'Espagne', 'Canada'];

export default function SuppliersMarketplace() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSector, setSelectedSector] = useState('Tous');
  const [selectedCountry, setSelectedCountry] = useState('Tous');
  const [showOnlyFeatured, setShowOnlyFeatured] = useState(false);

  const filteredSuppliers = MARKETPLACE_SUPPLIERS.filter(supplier => {
    const matchesSearch = supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         supplier.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSector = selectedSector === 'Tous' || supplier.sector === selectedSector;
    const matchesCountry = selectedCountry === 'Tous' || supplier.country === selectedCountry;
    const matchesFeatured = !showOnlyFeatured || supplier.is_featured;
    
    return matchesSearch && matchesSector && matchesCountry && matchesFeatured;
  });

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'easy': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'hard': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-muted text-muted-foreground';
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

  return (
    <>
      <Helmet>
        <title>Marketplace Fournisseurs - Connectez vos fournisseurs en 1 clic</title>
        <meta name="description" content="Découvrez et connectez les meilleurs fournisseurs pour votre dropshipping. API, XML, CSV - Plus de 50M de produits disponibles." />
      </Helmet>

      <div className="container mx-auto py-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold flex items-center gap-3">
              <Store className="h-10 w-10 text-primary" />
              Marketplace Fournisseurs
            </h1>
            <p className="text-muted-foreground mt-2">
              Connectez-vous aux meilleurs fournisseurs en 1 clic
            </p>
          </div>
          <Button size="lg" className="gap-2">
            <Plus className="h-5 w-5" />
            Ajouter un fournisseur personnalisé
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Fournisseurs</p>
                  <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">{MARKETPLACE_SUPPLIERS.length}+</p>
                </div>
                <Store className="h-10 w-10 text-blue-600 dark:text-blue-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-700 dark:text-green-300">Produits</p>
                  <p className="text-3xl font-bold text-green-900 dark:text-green-100">50M+</p>
                </div>
                <Package className="h-10 w-10 text-green-600 dark:text-green-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border-purple-200 dark:border-purple-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-700 dark:text-purple-300">Pays couverts</p>
                  <p className="text-3xl font-bold text-purple-900 dark:text-purple-100">25+</p>
                </div>
                <Globe className="h-10 w-10 text-purple-600 dark:text-purple-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 border-orange-200 dark:border-orange-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-700 dark:text-orange-300">Intégrations</p>
                  <p className="text-3xl font-bold text-orange-900 dark:text-orange-100">API</p>
                </div>
                <Zap className="h-10 w-10 text-orange-600 dark:text-orange-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtres de recherche
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative md:col-span-2">
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
            </div>
            
            <div className="mt-4 flex items-center gap-2">
              <Button 
                variant={showOnlyFeatured ? "default" : "outline"} 
                size="sm"
                onClick={() => setShowOnlyFeatured(!showOnlyFeatured)}
              >
                <Star className="h-4 w-4 mr-2" />
                Seulement les populaires
              </Button>
              <span className="text-sm text-muted-foreground">
                {filteredSuppliers.length} fournisseur(s) trouvé(s)
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Suppliers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSuppliers.map(supplier => (
            <Card key={supplier.id} className="hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
              <CardHeader>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center overflow-hidden">
                      {supplier.logo_url ? (
                        <img 
                          src={supplier.logo_url} 
                          alt={supplier.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Store className="h-7 w-7 text-primary" />
                      )}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{supplier.name}</CardTitle>
                      <Badge variant="outline" className="text-xs mt-1">
                        {supplier.sector}
                      </Badge>
                    </div>
                  </div>
                  {supplier.is_featured && (
                    <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                      <Star className="h-3 w-3 mr-1" fill="currentColor" />
                      Populaire
                    </Badge>
                  )}
                </div>
                
                <Badge 
                  className={getComplexityColor(supplier.integration_complexity)}
                  variant="secondary"
                >
                  {getComplexityText(supplier.integration_complexity)}
                </Badge>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {supplier.description}
                </p>
                
                <div className="flex flex-wrap gap-1.5">
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
                
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs">{supplier.product_count.toLocaleString()} produits</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs">{supplier.country}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs">{supplier.setup_time_minutes}min setup</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-yellow-500" fill="currentColor" />
                    <span className="text-xs font-medium">{supplier.rating}/5</span>
                  </div>
                </div>
                
                {supplier.min_order_value !== undefined && (
                  <div className="text-xs text-muted-foreground">
                    Commande min: {supplier.min_order_value === 0 ? 'Aucune' : `${supplier.min_order_value}€`}
                  </div>
                )}
                
                <div className="flex gap-2 pt-2">
                  <Button className="flex-1 gap-2">
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

        {/* CTA Banner */}
        <Card className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground border-none">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="space-y-2 text-center md:text-left">
                <h3 className="text-2xl font-bold">Votre fournisseur n'est pas listé ?</h3>
                <p className="text-primary-foreground/90">
                  Ajoutez manuellement votre fournisseur ou contactez-nous pour l'intégrer au marketplace
                </p>
              </div>
              <div className="flex gap-3">
                <Button variant="secondary" size="lg">
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter manuellement
                </Button>
                <Button variant="outline" size="lg" className="bg-transparent border-primary-foreground text-primary-foreground hover:bg-primary-foreground/10">
                  Nous contacter
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
