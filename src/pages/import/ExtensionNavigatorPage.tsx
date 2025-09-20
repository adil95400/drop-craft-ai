import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PageHeader } from '@/components/ui/page-header';
import { useNavigate } from 'react-router-dom';
import { 
  Puzzle, Download, Star, Search, Filter, 
  Chrome, Globe, ShoppingBag, Package, 
  ArrowRight, CheckCircle, Clock, Zap 
} from 'lucide-react';
import { toast } from 'sonner';

const ExtensionNavigatorPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedExtensions, setSelectedExtensions] = useState<string[]>([]);

  const extensions = [
    {
      id: 'amazon-scraper',
      name: 'Amazon Scraper Pro',
      description: 'Scrapez les produits Amazon avec méta-données complètes',
      category: 'ecommerce',
      platform: 'Amazon',
      rating: 4.8,
      downloads: 12500,
      premium: true,
      features: ['Prix en temps réel', 'Images HD', 'Reviews automatiques', 'Stock tracking'],
      icon: ShoppingBag,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100'
    },
    {
      id: 'aliexpress-importer',
      name: 'AliExpress Importer',
      description: 'Import massif depuis AliExpress avec optimisation SEO',
      category: 'ecommerce',
      platform: 'AliExpress',
      rating: 4.6,
      downloads: 8200,
      premium: false,
      features: ['Import en masse', 'SEO automatique', 'Prix dynamiques', 'Variants'],
      icon: Package,
      color: 'text-red-600',
      bgColor: 'bg-red-100'
    },
    {
      id: 'shopify-connector',
      name: 'Shopify Connector',
      description: 'Synchronisation bidirectionnelle avec Shopify',
      category: 'ecommerce',
      platform: 'Shopify',
      rating: 4.9,
      downloads: 15300,
      premium: true,
      features: ['Sync temps réel', 'Inventaire', 'Commandes', 'Clients'],
      icon: Globe,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      id: 'universal-scraper',
      name: 'Universal Web Scraper',
      description: 'Scrapez n\'importe quel site web avec IA',
      category: 'tools',
      platform: 'Universal',
      rating: 4.7,
      downloads: 9800,
      premium: true,
      features: ['IA detection', 'Anti-bot', 'Proxy rotation', 'JS rendering'],
      icon: Chrome,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    }
  ];

  const filteredExtensions = extensions.filter(ext => {
    const matchesSearch = ext.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ext.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || ext.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleInstallExtension = (extensionId: string) => {
    toast.success(`Extension ${extensions.find(e => e.id === extensionId)?.name} installée avec succès!`);
    setSelectedExtensions(prev => [...prev, extensionId]);
  };

  const handleBulkInstall = () => {
    if (selectedExtensions.length === 0) {
      toast.error('Veuillez sélectionner au moins une extension');
      return;
    }
    toast.success(`${selectedExtensions.length} extensions installées avec succès!`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30">
      <PageHeader
        title="Extension Navigator"
        description="Découvrez et installez des extensions pour étendre vos capacités d'import"
      />

      <div className="container mx-auto p-6 space-y-6">
        {/* Filtres et recherche */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Rechercher des extensions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Rechercher par nom ou description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes catégories</SelectItem>
                  <SelectItem value="ecommerce">E-commerce</SelectItem>
                  <SelectItem value="tools">Outils</SelectItem>
                  <SelectItem value="ai">Intelligence Artificielle</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {selectedExtensions.length > 0 && (
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <span className="text-sm font-medium">
                  {selectedExtensions.length} extension(s) sélectionnée(s)
                </span>
                <Button onClick={handleBulkInstall} size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Installer sélectionnées
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Extensions disponibles */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredExtensions.map((extension) => (
            <Card key={extension.id} className="group hover:shadow-lg transition-all duration-300">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className={`p-3 ${extension.bgColor} rounded-full`}>
                    <extension.icon className={`w-6 h-6 ${extension.color}`} />
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {extension.premium && (
                      <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white">
                        Premium
                      </Badge>
                    )}
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      {extension.rating}
                    </div>
                  </div>
                </div>
                <CardTitle className="text-lg">{extension.name}</CardTitle>
                <CardDescription>{extension.description}</CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  <div className="flex items-center justify-between">
                    <span>Plateforme: {extension.platform}</span>
                    <span>{extension.downloads.toLocaleString()} téléchargements</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium">Fonctionnalités:</p>
                  <div className="flex flex-wrap gap-1">
                    {extension.features.slice(0, 2).map((feature) => (
                      <Badge key={feature} variant="outline" className="text-xs">
                        {feature}
                      </Badge>
                    ))}
                    {extension.features.length > 2 && (
                      <Badge variant="outline" className="text-xs">
                        +{extension.features.length - 2} autres
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button 
                    className="flex-1" 
                    onClick={() => handleInstallExtension(extension.id)}
                    disabled={selectedExtensions.includes(extension.id)}
                  >
                    {selectedExtensions.includes(extension.id) ? (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Installée
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-2" />
                        Installer
                      </>
                    )}
                  </Button>
                  <Button variant="outline" size="sm">
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredExtensions.length === 0 && (
          <Card className="text-center py-12">
            <CardContent>
              <Puzzle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Aucune extension trouvée</h3>
              <p className="text-muted-foreground">
                Essayez de modifier vos critères de recherche ou de sélectionner une autre catégorie.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Actions rapides */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Actions rapides
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button variant="outline" className="justify-start" onClick={() => navigate('/import/xml-config')}>
                <Clock className="h-4 w-4 mr-2" />
                Config XML
              </Button>
              <Button variant="outline" className="justify-start" onClick={() => navigate('/import/ftp-config')}>
                <Clock className="h-4 w-4 mr-2" />
                Config FTP
              </Button>
              <Button variant="outline" className="justify-start" onClick={() => navigate('/import/history')}>
                <Clock className="h-4 w-4 mr-2" />
                Historique
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ExtensionNavigatorPage;