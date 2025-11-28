import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Puzzle, Search, Star, Download, Zap, ShoppingCart, Mail, BarChart3, Package, Globe, TrendingUp, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ExtensionsMarketplacePage = () => {
  const navigate = useNavigate();

  const extensions = [
    {
      name: 'AliExpress Connector',
      description: 'Importez des millions de produits depuis AliExpress en 1 clic',
      icon: ShoppingCart,
      downloads: '12.5k',
      rating: 4.9,
      category: 'Import',
      isPremium: false
    },
    {
      name: 'Email Automation Pro',
      description: 'Automatisez vos campagnes email et SMS avec segmentation IA',
      icon: Mail,
      downloads: '8.3k',
      rating: 4.8,
      category: 'Marketing',
      isPremium: true
    },
    {
      name: 'Advanced Analytics',
      description: 'Dashboards personnalisés et prévisions de ventes IA',
      icon: BarChart3,
      downloads: '15.2k',
      rating: 4.9,
      category: 'Analytics',
      isPremium: true
    },
    {
      name: 'Multi-Store Sync',
      description: 'Synchronisez vos produits entre plusieurs boutiques automatiquement',
      icon: Globe,
      downloads: '6.7k',
      rating: 4.7,
      category: 'Synchronisation',
      isPremium: false
    },
    {
      name: 'Price Optimizer',
      description: 'Optimisation dynamique des prix basée sur le marché et la concurrence',
      icon: TrendingUp,
      downloads: '9.8k',
      rating: 4.8,
      category: 'Pricing',
      isPremium: true
    },
    {
      name: 'BigBuy Integration',
      description: 'Connectez-vous au catalogue BigBuy (10M+ produits EU)',
      icon: Package,
      downloads: '5.4k',
      rating: 4.6,
      category: 'Import',
      isPremium: false
    },
    {
      name: 'Security Suite',
      description: 'Protection avancée contre la fraude et les chargebacks',
      icon: Shield,
      downloads: '7.1k',
      rating: 4.9,
      category: 'Sécurité',
      isPremium: true
    },
    {
      name: 'Quick Actions',
      description: 'Raccourcis clavier et automatisations rapides',
      icon: Zap,
      downloads: '11.2k',
      rating: 4.7,
      category: 'Productivité',
      isPremium: false
    }
  ];

  const categories = [
    'Tous',
    'Import',
    'Marketing',
    'Analytics',
    'Synchronisation',
    'Pricing',
    'Sécurité',
    'Productivité'
  ];

  return (
    <>
      <Helmet>
        <title>Extensions - ShopOpti</title>
        <meta name="description" content="Marketplace d'extensions pour étendre les fonctionnalités de ShopOpti. Plus de 50 extensions disponibles." />
      </Helmet>

      <div className="min-h-screen bg-background">
        {/* Hero */}
        <section className="py-20 bg-gradient-to-br from-primary/5 to-secondary/5">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="max-w-3xl mx-auto text-center space-y-6">
              <Badge className="px-4 py-2 bg-primary/10 text-primary border-primary/20">
                <Puzzle className="h-4 w-4 mr-2" />
                Marketplace d'extensions
              </Badge>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold">
                Étendez les capacités
                <span className="block bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
                  de votre plateforme
                </span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground">
                Plus de 50 extensions pour personnaliser ShopOpti selon vos besoins
              </p>
              
              {/* Search */}
              <div className="relative max-w-2xl mx-auto pt-4">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Rechercher une extension..."
                  className="pl-12 h-12 text-base"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Categories */}
        <section className="py-8 border-b bg-background sticky top-14 z-40">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="flex flex-wrap gap-2 justify-center">
              {categories.map((category, index) => (
                <Button key={index} variant="outline" size="sm">
                  {category}
                </Button>
              ))}
            </div>
          </div>
        </section>

        {/* Extensions Grid */}
        <section className="py-12">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {extensions.map((extension, index) => {
                const Icon = extension.icon;
                return (
                  <Card key={index} className="hover:shadow-lg transition-all group">
                    <CardHeader>
                      <div className="flex items-center justify-between mb-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <Icon className="h-5 w-5 text-primary" />
                        </div>
                        {extension.isPremium && (
                          <Badge variant="secondary">Premium</Badge>
                        )}
                      </div>
                      <CardTitle className="text-lg group-hover:text-primary transition-colors">
                        {extension.name}
                      </CardTitle>
                      <CardDescription className="text-sm">{extension.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-warning text-warning" />
                          <span className="font-medium">{extension.rating}</span>
                        </div>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Download className="h-4 w-4" />
                          {extension.downloads}
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs">{extension.category}</Badge>
                      <Button className="w-full" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Installer
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <div className="text-center mt-12">
              <Button variant="outline" size="lg" onClick={() => navigate('/extensions/developer')}>
                Développer une extension
              </Button>
            </div>
          </div>
        </section>
      </div>
    </>
  );
};

export default ExtensionsMarketplacePage;
