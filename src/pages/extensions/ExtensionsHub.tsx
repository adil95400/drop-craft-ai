import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { 
  Chrome, 
  Download, 
  Zap, 
  Star, 
  CheckCircle, 
  ArrowRight, 
  Store, 
  Terminal, 
  Palette, 
  Shield,
  Globe,
  Package,
  TrendingUp,
  Clock,
  Users
} from 'lucide-react';

export default function ExtensionsHub() {
  const navigate = useNavigate();

  const chromeFeatures = [
    { icon: <Zap className="h-4 w-4" />, text: 'Import 1-clic depuis 15+ plateformes' },
    { icon: <TrendingUp className="h-4 w-4" />, text: 'Surveillance des prix automatique' },
    { icon: <Package className="h-4 w-4" />, text: 'Import avis et images en masse' },
    { icon: <Clock className="h-4 w-4" />, text: 'Auto-Order vers fournisseurs' },
    { icon: <Globe className="h-4 w-4" />, text: 'Détection multi-langue' },
    { icon: <Users className="h-4 w-4" />, text: 'Gestion multi-boutiques' },
  ];

  const supportedPlatforms = [
    { name: 'AliExpress', color: 'bg-orange-500' },
    { name: 'Temu', color: 'bg-orange-600' },
    { name: 'Amazon', color: 'bg-yellow-500' },
    { name: 'eBay', color: 'bg-blue-500' },
    { name: 'CJDropshipping', color: 'bg-green-500' },
    { name: 'Banggood', color: 'bg-red-500' },
    { name: '1688', color: 'bg-orange-400' },
    { name: 'Taobao', color: 'bg-orange-300' },
  ];

  const extensions = [
    {
      id: 'marketplace',
      title: 'Marketplace',
      description: 'Découvrez et installez des extensions pour votre boutique',
      icon: Store,
      route: '/extensions/marketplace',
      badge: 'Nouveau'
    },
    {
      id: 'cli',
      title: 'Outils CLI',
      description: 'Gérez vos extensions en ligne de commande',
      icon: Terminal,
      route: '/extensions/cli',
      badge: 'Pro'
    },
    {
      id: 'white-label',
      title: 'White-Label',
      description: 'Personnalisez l\'interface à vos couleurs',
      icon: Palette,
      route: '/extensions/white-label',
      badge: 'Ultra Pro'
    },
    {
      id: 'sso',
      title: 'Enterprise SSO',
      description: 'Authentification unique pour votre équipe',
      icon: Shield,
      route: '/extensions/sso',
      badge: 'Ultra Pro'
    }
  ];

  return (
    <div className="space-y-8">
      {/* Hero Chrome Extension - Style AutoDS */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary/90 to-primary/70 p-1">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMtOS45NDEgMC0xOCA4LjA1OS0xOCAxOHM4LjA1OSAxOCAxOCAxOCAxOC04LjA1OSAxOC0xOC04LjA1OS0xOC0xOC0xOHptMCAzMmMtNy43MzIgMC0xNC02LjI2OC0xNC0xNHM2LjI2OC0xNCAxNC0xNCAxNCA2LjI2OCAxNCAxNC02LjI2OCAxNC0xNCAxNHoiIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iLjAzIi8+PC9nPjwvc3ZnPg==')] opacity-30" />
        
        <div className="relative bg-background/5 backdrop-blur-sm rounded-xl p-8">
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            {/* Left Content */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                  <Chrome className="h-10 w-10 text-white" />
                </div>
                <div>
                  <Badge className="bg-yellow-400 text-yellow-900 hover:bg-yellow-400 mb-1">
                    ⭐ #1 Extension Dropshipping
                  </Badge>
                  <h1 className="text-3xl lg:text-4xl font-bold text-white">
                    ShopOpti+ Chrome Extension
                  </h1>
                </div>
              </div>

              <p className="text-lg text-white/90 leading-relaxed">
                L'extension Chrome la plus puissante du marché. Importez des produits en 1-clic, 
                surveillez les prix, automatisez vos commandes fournisseurs - tout depuis votre navigateur.
              </p>

              {/* Features Grid */}
              <div className="grid grid-cols-2 gap-3">
                {chromeFeatures.map((feature, index) => (
                  <div key={index} className="flex items-center gap-2 text-white/90">
                    <div className="p-1.5 bg-white/20 rounded-lg">
                      {feature.icon}
                    </div>
                    <span className="text-sm">{feature.text}</span>
                  </div>
                ))}
              </div>

              {/* Stats */}
              <div className="flex items-center gap-6 pt-2">
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">50K+</div>
                  <div className="text-xs text-white/70">Utilisateurs</div>
                </div>
                <div className="h-10 w-px bg-white/20" />
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">4.9</div>
                  <div className="flex items-center gap-1 text-xs text-white/70">
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    <span>Rating</span>
                  </div>
                </div>
                <div className="h-10 w-px bg-white/20" />
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">15+</div>
                  <div className="text-xs text-white/70">Plateformes</div>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Button 
                  size="lg" 
                  className="bg-white text-primary hover:bg-white/90 shadow-xl"
                  onClick={() => navigate('/extensions/cli')}
                >
                  <Download className="h-5 w-5 mr-2" />
                  Télécharger Gratuitement
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="border-white/30 text-white hover:bg-white/10"
                  onClick={() => navigate('/integrations/extensions/chrome-config')}
                >
                  Configurer l'Extension
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
              </div>
            </div>

            {/* Right Content - Extension Preview */}
            <div className="hidden lg:block">
              <div className="relative">
                {/* Browser Mockup */}
                <div className="bg-gradient-to-b from-gray-800 to-gray-900 rounded-xl p-1 shadow-2xl">
                  <div className="bg-gray-700 rounded-t-lg px-3 py-2 flex items-center gap-2">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-red-500" />
                      <div className="w-3 h-3 rounded-full bg-yellow-500" />
                      <div className="w-3 h-3 rounded-full bg-green-500" />
                    </div>
                    <div className="flex-1 bg-gray-600 rounded px-3 py-1 text-xs text-gray-300">
                      aliexpress.com/item/123456789
                    </div>
                  </div>
                  <div className="bg-white p-4 rounded-b-lg">
                    {/* Product Card Mockup */}
                    <div className="space-y-3">
                      <div className="flex gap-3">
                        <div className="w-20 h-20 bg-gray-200 rounded-lg animate-pulse" />
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-gray-200 rounded w-3/4" />
                          <div className="h-3 bg-gray-100 rounded w-1/2" />
                          <div className="h-5 bg-primary/20 rounded w-20" />
                        </div>
                      </div>
                      
                      {/* Extension Popup Overlay */}
                      <div className="absolute right-4 top-16 w-48 bg-white rounded-lg shadow-2xl border-2 border-primary p-3 animate-bounce">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="p-1.5 bg-primary rounded">
                            <Zap className="h-4 w-4 text-white" />
                          </div>
                          <span className="text-sm font-semibold">ShopOpti+</span>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-xs text-green-600">
                            <CheckCircle className="h-3 w-3" />
                            <span>Produit détecté!</span>
                          </div>
                          <Button size="sm" className="w-full text-xs">
                            Importer en 1-clic
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Supported Platforms */}
          <div className="mt-8 pt-6 border-t border-white/10">
            <p className="text-sm text-white/70 mb-3">Plateformes supportées:</p>
            <div className="flex flex-wrap gap-2">
              {supportedPlatforms.map((platform, index) => (
                <Badge 
                  key={index} 
                  variant="secondary" 
                  className="bg-white/10 text-white border-white/20 hover:bg-white/20"
                >
                  <div className={`w-2 h-2 rounded-full ${platform.color} mr-2`} />
                  {platform.name}
                </Badge>
              ))}
              <Badge 
                variant="secondary" 
                className="bg-white/10 text-white border-white/20"
              >
                +7 autres
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Section Title */}
      <div>
        <h2 className="text-2xl font-bold">Autres Extensions</h2>
        <p className="text-muted-foreground mt-1">
          Étendez les fonctionnalités de votre plateforme
        </p>
      </div>

      {/* Other Extensions Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {extensions.map((extension) => {
          const Icon = extension.icon;
          return (
            <Card 
              key={extension.id} 
              className="group cursor-pointer hover:shadow-lg transition-all hover:border-primary/20"
              onClick={() => navigate(extension.route)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <Badge 
                    variant="secondary"
                    className={
                      extension.badge === 'Ultra Pro' 
                        ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs' 
                        : extension.badge === 'Pro' 
                        ? 'bg-blue-500 text-white text-xs' 
                        : 'text-xs'
                    }
                  >
                    {extension.badge}
                  </Badge>
                </div>
                <CardTitle className="text-lg group-hover:text-primary transition-colors">
                  {extension.title}
                </CardTitle>
                <CardDescription className="text-sm">
                  {extension.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <Button variant="ghost" className="w-full group-hover:bg-primary group-hover:text-primary-foreground">
                  Accéder
                  <ArrowRight className="h-4 w-4 ml-2 transition-transform group-hover:translate-x-1" />
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
