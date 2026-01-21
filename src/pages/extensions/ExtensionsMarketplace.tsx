import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Star, Download, Store, Sparkles, TrendingUp, Shield, Zap, BarChart3, Globe, Bell, Package } from 'lucide-react';
import { useExtensionActions } from '@/hooks/useExtensionActions';
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';
import { useState } from 'react';

export default function ExtensionsMarketplace() {
  const { installExtension, isInstalling } = useExtensionActions();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const handleInstall = async (extensionId: number) => {
    await installExtension(extensionId.toString());
  };

  const categories = [
    { id: 'all', label: 'Tous', icon: Package },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'seo', label: 'SEO', icon: TrendingUp },
    { id: 'pricing', label: 'Prix', icon: Zap },
    { id: 'security', label: 'Sécurité', icon: Shield },
    { id: 'notifications', label: 'Alertes', icon: Bell },
  ];

  const extensions = [
    {
      id: 1,
      name: 'Advanced Analytics',
      description: 'Analyses approfondies de vos ventes et performances produits',
      rating: 4.8,
      downloads: 1234,
      price: 'Gratuit',
      category: 'analytics',
      badge: 'Populaire',
      icon: <BarChart3 className="h-6 w-6" />
    },
    {
      id: 2,
      name: 'SEO Optimizer Pro',
      description: 'Optimisez automatiquement vos titres et descriptions pour le référencement',
      rating: 4.6,
      downloads: 892,
      price: '29€/mois',
      category: 'seo',
      badge: 'Pro',
      icon: <TrendingUp className="h-6 w-6" />
    },
    {
      id: 3,
      name: 'Multi-Currency Support',
      description: 'Gestion automatique des devises et conversions en temps réel',
      rating: 4.9,
      downloads: 2156,
      price: '19€/mois',
      category: 'pricing',
      badge: 'Nouveau',
      icon: <Globe className="h-6 w-6" />
    },
    {
      id: 4,
      name: 'Price Monitor Plus',
      description: 'Surveillance avancée des prix avec alertes personnalisables',
      rating: 4.7,
      downloads: 1567,
      price: 'Gratuit',
      category: 'pricing',
      icon: <Zap className="h-6 w-6" />
    },
    {
      id: 5,
      name: 'Security Shield',
      description: 'Protection avancée contre la fraude et sécurité des transactions',
      rating: 4.9,
      downloads: 3421,
      price: '49€/mois',
      category: 'security',
      badge: 'Recommandé',
      icon: <Shield className="h-6 w-6" />
    },
    {
      id: 6,
      name: 'Smart Notifications',
      description: 'Alertes intelligentes par email, SMS et push notifications',
      rating: 4.5,
      downloads: 987,
      price: '9€/mois',
      category: 'notifications',
      icon: <Bell className="h-6 w-6" />
    },
    {
      id: 7,
      name: 'Competitor Tracker',
      description: 'Suivez les prix et stocks de vos concurrents en temps réel',
      rating: 4.8,
      downloads: 1876,
      price: '39€/mois',
      category: 'analytics',
      badge: 'Tendance',
      icon: <BarChart3 className="h-6 w-6" />
    },
    {
      id: 8,
      name: 'Auto SEO Tags',
      description: 'Génération automatique de tags et mots-clés optimisés',
      rating: 4.4,
      downloads: 654,
      price: 'Gratuit',
      category: 'seo',
      icon: <TrendingUp className="h-6 w-6" />
    },
    {
      id: 9,
      name: 'Dynamic Pricing AI',
      description: 'Ajustement automatique des prix basé sur l\'IA et la demande',
      rating: 4.9,
      downloads: 2341,
      price: '79€/mois',
      category: 'pricing',
      badge: 'IA',
      icon: <Sparkles className="h-6 w-6" />
    }
  ];

  const filteredExtensions = extensions.filter(ext => {
    const matchesSearch = ext.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         ext.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || selectedCategory === 'all' || ext.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getBadgeVariant = (badge?: string) => {
    switch (badge) {
      case 'Populaire': return 'default';
      case 'Pro': return 'secondary';
      case 'Nouveau': return 'outline';
      case 'Recommandé': return 'default';
      case 'Tendance': return 'secondary';
      case 'IA': return 'default';
      default: return 'outline';
    }
  };

  return (
    <ChannablePageWrapper
      title="Marketplace Extensions"
      subtitle="Découvrez & Installez"
      description="Étendez les fonctionnalités de votre plateforme avec nos extensions certifiées."
      heroImage="extensions"
      badge={{
        label: `${extensions.length} Extensions`,
        icon: Store
      }}
    >
      {/* Search and Filters */}
      <div className="space-y-4">
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Rechercher une extension..." 
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        
        {/* Categories */}
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <Button
              key={cat.id}
              variant={selectedCategory === cat.id || (!selectedCategory && cat.id === 'all') ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(cat.id === 'all' ? null : cat.id)}
              className="gap-2"
            >
              <cat.icon className="h-4 w-4" />
              {cat.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Extensions Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredExtensions.map((extension) => (
          <Card key={extension.id} className="p-6 border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all group">
            <div className="flex items-start gap-4 mb-4">
              <div className="p-3 bg-primary/10 rounded-xl text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                {extension.icon}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-lg">{extension.name}</h3>
                  {extension.badge && (
                    <Badge variant={getBadgeVariant(extension.badge)} className="text-xs">
                      {extension.badge}
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">{extension.description}</p>
              </div>
            </div>
            
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span className="text-sm font-medium">{extension.rating}</span>
              </div>
              <div className="flex items-center gap-1 text-muted-foreground text-sm">
                <Download className="h-4 w-4" />
                <span>{extension.downloads.toLocaleString()}</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="font-semibold text-primary">{extension.price}</span>
              <Button 
                size="sm" 
                onClick={() => handleInstall(extension.id)}
                disabled={isInstalling}
              >
                {isInstalling ? 'Installation...' : 'Installer'}
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* No Results */}
      {filteredExtensions.length === 0 && (
        <Card className="p-8 text-center">
          <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="font-semibold mb-2">Aucune extension trouvée</h3>
          <p className="text-muted-foreground mb-4">
            Essayez de modifier vos filtres ou votre recherche
          </p>
          <Button variant="outline" onClick={() => { setSearchQuery(''); setSelectedCategory(null); }}>
            Réinitialiser les filtres
          </Button>
        </Card>
      )}
    </ChannablePageWrapper>
  );
}
