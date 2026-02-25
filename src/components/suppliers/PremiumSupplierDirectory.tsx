/**
 * Premium Supplier Directory - Curated US/EU verified suppliers
 */
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  Crown, Shield, Star, Package, Truck, Search, Globe, Award,
  BadgeCheck, TrendingUp, Zap, ArrowRight, ExternalLink, Clock,
  Users, MapPin, DollarSign, Sparkles, ShoppingBag, Factory
} from 'lucide-react';

interface PremiumSupplierInfo {
  id: string;
  name: string;
  region: 'US' | 'EU';
  country: string;
  tier: 'platinum' | 'gold' | 'silver';
  categories: string[];
  description: string;
  avgDelivery: string;
  minOrder: string;
  productCount: string;
  rating: number;
  features: string[];
  apiType: 'REST' | 'SOAP' | 'EDI' | 'CSV';
  isVerified: boolean;
  marginRange: string;
  returnPolicy: string;
}

const PREMIUM_DIRECTORY: PremiumSupplierInfo[] = [
  // US Suppliers
  {
    id: 'spocket-us', name: 'Spocket', region: 'US', country: 'États-Unis', tier: 'platinum',
    categories: ['Mode', 'Accessoires', 'Maison', 'Beauté'],
    description: 'Fournisseurs vérifiés US/EU avec livraison rapide 2-5 jours',
    avgDelivery: '2-5 jours', minOrder: '1 unité', productCount: '100K+', rating: 4.8,
    features: ['Livraison rapide US', 'Branded invoicing', 'Auto-fulfillment', 'Échantillons gratuits'],
    apiType: 'REST', isVerified: true, marginRange: '30-60%', returnPolicy: '30 jours',
  },
  {
    id: 'salehoo-us', name: 'SaleHoo', region: 'US', country: 'États-Unis', tier: 'gold',
    categories: ['Électronique', 'Jouets', 'Sport', 'Jardin'],
    description: 'Annuaire de 8000+ fournisseurs vérifiés avec prix grossiste',
    avgDelivery: '3-7 jours', minOrder: 'Variable', productCount: '2.5M+', rating: 4.5,
    features: ['Market Research Lab', 'Fournisseurs vérifiés', 'Formation incluse', 'Support dédié'],
    apiType: 'REST', isVerified: true, marginRange: '25-50%', returnPolicy: 'Variable',
  },
  {
    id: 'wholesale-central', name: 'Wholesale Central', region: 'US', country: 'États-Unis', tier: 'silver',
    categories: ['Mode', 'Électronique', 'Maison', 'Beauté', 'Alimentaire'],
    description: 'Plus grand annuaire de grossistes US avec accès direct fabricants',
    avgDelivery: '3-10 jours', minOrder: 'Variable', productCount: '500K+', rating: 4.2,
    features: ['Accès direct fabricants', 'Prix grossiste', 'Large choix', 'Gratuit'],
    apiType: 'CSV', isVerified: true, marginRange: '20-45%', returnPolicy: 'Variable',
  },
  {
    id: 'us-direct', name: 'US Direct', region: 'US', country: 'États-Unis', tier: 'gold',
    categories: ['Électronique', 'Informatique', 'Gaming'],
    description: 'Distributeur tech US avec stock garanti et livraison express',
    avgDelivery: '1-3 jours', minOrder: '100$', productCount: '50K+', rating: 4.6,
    features: ['Stock en temps réel', 'Livraison express', 'Garantie fabricant', 'API robuste'],
    apiType: 'REST', isVerified: true, marginRange: '15-35%', returnPolicy: '14 jours',
  },
  // EU Suppliers
  {
    id: 'bigbuy-eu', name: 'BigBuy', region: 'EU', country: 'Espagne', tier: 'platinum',
    categories: ['Maison', 'Jardin', 'Électronique', 'Beauté', 'Sport'],
    description: 'Leader européen du dropshipping B2B avec entrepôts EU',
    avgDelivery: '3-5 jours', minOrder: '1 unité', productCount: '200K+', rating: 4.7,
    features: ['Multi-entrepôts EU', 'Stock temps réel', 'Packaging neutre', 'Multi-langues'],
    apiType: 'REST', isVerified: true, marginRange: '25-55%', returnPolicy: '14 jours',
  },
  {
    id: 'brandsdistribution', name: 'BrandsDistribution', region: 'EU', country: 'Italie', tier: 'platinum',
    categories: ['Mode luxe', 'Accessoires', 'Chaussures', 'Maroquinerie'],
    description: 'Distributeur officiel de marques de luxe européennes',
    avgDelivery: '2-4 jours', minOrder: '1 unité', productCount: '150K+', rating: 4.8,
    features: ['Marques authentiques', 'Photos HD', 'Dropshipping luxe', 'Certificats'],
    apiType: 'REST', isVerified: true, marginRange: '40-70%', returnPolicy: '14 jours',
  },
  {
    id: 'syncee-eu', name: 'Syncee', region: 'EU', country: 'Hongrie', tier: 'gold',
    categories: ['Mode', 'Beauté', 'Maison', 'Électronique'],
    description: 'Marketplace B2B avec fournisseurs pré-vérifiés EU & US',
    avgDelivery: '3-7 jours', minOrder: '1 unité', productCount: '4M+', rating: 4.4,
    features: ['Import auto', 'Mise à jour prix/stock', 'Plusieurs intégrations', 'Marketplace B2B'],
    apiType: 'REST', isVerified: true, marginRange: '20-50%', returnPolicy: 'Variable',
  },
  {
    id: 'vidaxl-eu', name: 'vidaXL', region: 'EU', country: 'Pays-Bas', tier: 'gold',
    categories: ['Maison', 'Jardin', 'Bricolage', 'Sport', 'Auto'],
    description: 'Grossiste hollandais spécialisé maison & jardin avec livraison EU',
    avgDelivery: '3-5 jours', minOrder: '1 unité', productCount: '90K+', rating: 4.3,
    features: ['Entrepôts EU', 'Livraison rapide', 'Large gamme', 'Programme dropship'],
    apiType: 'REST', isVerified: true, marginRange: '20-40%', returnPolicy: '30 jours',
  },
  {
    id: 'matterhorn-eu', name: 'Matterhorn', region: 'EU', country: 'Pologne', tier: 'silver',
    categories: ['Mode femme', 'Lingerie', 'Accessoires'],
    description: 'Grossiste mode femme polonais avec expédition rapide EU',
    avgDelivery: '2-5 jours', minOrder: '1 unité', productCount: '25K+', rating: 4.1,
    features: ['Mode tendance', 'Photos pro', 'Prix compétitifs', 'API simple'],
    apiType: 'CSV', isVerified: true, marginRange: '30-60%', returnPolicy: '14 jours',
  },
  {
    id: 'griffati-eu', name: 'Griffati', region: 'EU', country: 'Italie', tier: 'gold',
    categories: ['Mode homme/femme', 'Chaussures', 'Accessoires'],
    description: 'Grossiste mode italienne avec marques premium',
    avgDelivery: '2-4 jours', minOrder: '1 unité', productCount: '30K+', rating: 4.5,
    features: ['Made in Italy', 'Marques premium', 'Dropshipping', 'API temps réel'],
    apiType: 'REST', isVerified: true, marginRange: '35-65%', returnPolicy: '14 jours',
  },
];

const TIER_CONFIG = {
  platinum: { label: 'Platinum', className: 'bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-200', icon: Crown },
  gold: { label: 'Gold', className: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200', icon: Award },
  silver: { label: 'Silver', className: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300', icon: Shield },
};

export function PremiumSupplierDirectory() {
  const [search, setSearch] = useState('');
  const [regionFilter, setRegionFilter] = useState<'all' | 'US' | 'EU'>('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [tierFilter, setTierFilter] = useState('all');

  const allCategories = [...new Set(PREMIUM_DIRECTORY.flatMap(s => s.categories))].sort();

  const filtered = PREMIUM_DIRECTORY.filter(s => {
    const matchesSearch = !search || s.name.toLowerCase().includes(search.toLowerCase()) || s.description.toLowerCase().includes(search.toLowerCase());
    const matchesRegion = regionFilter === 'all' || s.region === regionFilter;
    const matchesCategory = categoryFilter === 'all' || s.categories.includes(categoryFilter);
    const matchesTier = tierFilter === 'all' || s.tier === tierFilter;
    return matchesSearch && matchesRegion && matchesCategory && matchesTier;
  });

  const handleConnect = (supplier: PremiumSupplierInfo) => {
    toast.success(`Demande de connexion envoyée à ${supplier.name}`);
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Factory className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{PREMIUM_DIRECTORY.length}</p>
              <p className="text-xs text-muted-foreground">Fournisseurs vérifiés</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
              <MapPin className="h-5 w-5 text-blue-600 dark:text-blue-300" />
            </div>
            <div>
              <p className="text-2xl font-bold">{PREMIUM_DIRECTORY.filter(s => s.region === 'US').length}</p>
              <p className="text-xs text-muted-foreground">Fournisseurs US</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center">
              <Globe className="h-5 w-5 text-emerald-600 dark:text-emerald-300" />
            </div>
            <div>
              <p className="text-2xl font-bold">{PREMIUM_DIRECTORY.filter(s => s.region === 'EU').length}</p>
              <p className="text-xs text-muted-foreground">Fournisseurs EU</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-violet-100 dark:bg-violet-900 flex items-center justify-center">
              <Crown className="h-5 w-5 text-violet-600 dark:text-violet-300" />
            </div>
            <div>
              <p className="text-2xl font-bold">{PREMIUM_DIRECTORY.filter(s => s.tier === 'platinum').length}</p>
              <p className="text-xs text-muted-foreground">Platinum</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Rechercher un fournisseur..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Tabs value={regionFilter} onValueChange={v => setRegionFilter(v as any)}>
          <TabsList>
            <TabsTrigger value="all">Tous</TabsTrigger>
            <TabsTrigger value="US">🇺🇸 US</TabsTrigger>
            <TabsTrigger value="EU">🇪🇺 EU</TabsTrigger>
          </TabsList>
        </Tabs>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Catégorie" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes catégories</SelectItem>
            {allCategories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={tierFilter} onValueChange={setTierFilter}>
          <SelectTrigger className="w-[150px]"><SelectValue placeholder="Tier" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous tiers</SelectItem>
            <SelectItem value="platinum">Platinum</SelectItem>
            <SelectItem value="gold">Gold</SelectItem>
            <SelectItem value="silver">Silver</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Supplier Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {filtered.map(supplier => {
          const tierCfg = TIER_CONFIG[supplier.tier];
          const TierIcon = tierCfg.icon;
          return (
            <Card key={supplier.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-primary font-bold text-lg">
                      {supplier.name.charAt(0)}
                    </div>
                    <div>
                      <CardTitle className="text-base flex items-center gap-2">
                        {supplier.name}
                        {supplier.isVerified && <BadgeCheck className="h-4 w-4 text-green-500" />}
                      </CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className={cn('text-xs gap-1', tierCfg.className)}>
                          <TierIcon className="h-3 w-3" /> {tierCfg.label}
                        </Badge>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> {supplier.region === 'US' ? '🇺🇸' : '🇪🇺'} {supplier.country}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                    <span className="text-sm font-semibold">{supplier.rating}</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">{supplier.description}</p>
                
                <div className="grid grid-cols-4 gap-2 text-center">
                  <div>
                    <Clock className="h-3.5 w-3.5 mx-auto text-blue-500" />
                    <p className="text-xs font-medium mt-1">{supplier.avgDelivery}</p>
                    <p className="text-[10px] text-muted-foreground">Livraison</p>
                  </div>
                  <div>
                    <Package className="h-3.5 w-3.5 mx-auto text-emerald-500" />
                    <p className="text-xs font-medium mt-1">{supplier.productCount}</p>
                    <p className="text-[10px] text-muted-foreground">Produits</p>
                  </div>
                  <div>
                    <DollarSign className="h-3.5 w-3.5 mx-auto text-green-500" />
                    <p className="text-xs font-medium mt-1">{supplier.marginRange}</p>
                    <p className="text-[10px] text-muted-foreground">Marge</p>
                  </div>
                  <div>
                    <ShoppingBag className="h-3.5 w-3.5 mx-auto text-purple-500" />
                    <p className="text-xs font-medium mt-1">{supplier.minOrder}</p>
                    <p className="text-[10px] text-muted-foreground">MOQ</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1">
                  {supplier.categories.slice(0, 4).map(c => (
                    <Badge key={c} variant="outline" className="text-[10px]">{c}</Badge>
                  ))}
                  {supplier.categories.length > 4 && (
                    <Badge variant="outline" className="text-[10px]">+{supplier.categories.length - 4}</Badge>
                  )}
                </div>

                <div className="flex flex-wrap gap-1">
                  {supplier.features.slice(0, 3).map(f => (
                    <Badge key={f} variant="secondary" className="text-[10px] gap-1">
                      <Sparkles className="h-2.5 w-2.5" /> {f}
                    </Badge>
                  ))}
                </div>

                <div className="flex gap-2">
                  <Button size="sm" className="flex-1" onClick={() => handleConnect(supplier)}>
                    <Zap className="h-3.5 w-3.5 mr-1" /> Connecter
                  </Button>
                  <Button size="sm" variant="outline">
                    Catalogue <ArrowRight className="h-3.5 w-3.5 ml-1" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Search className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Aucun fournisseur trouvé</h3>
            <p className="text-muted-foreground">Essayez de modifier vos filtres</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
