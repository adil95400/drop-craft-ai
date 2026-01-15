/**
 * Chrome Extension Page - Installation et configuration
 */
import { useState } from 'react';
import { 
  Chrome, Download, Play, CheckCircle, Settings, Zap, Star,
  Package, RefreshCw, Shield, Globe, ArrowRight, ExternalLink,
  Copy, Check, MonitorSmartphone, Puzzle
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

export default function ChromeExtensionPage() {
  const [apiKey, setApiKey] = useState('');
  const [copied, setCopied] = useState(false);
  const [settings, setSettings] = useState({
    autoImport: true,
    importReviews: true,
    importImages: true,
    priceTracking: true,
    notifications: true,
  });

  const handleCopyApiKey = () => {
    navigator.clipboard.writeText('shp_xxxxx_demo_key_xxxxx');
    setCopied(true);
    toast.success('Clé API copiée');
    setTimeout(() => setCopied(false), 2000);
  };

  const features = [
    {
      icon: Zap,
      title: 'Import 1-clic',
      description: 'Importez n\'importe quel produit en un seul clic',
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/10',
    },
    {
      icon: Star,
      title: 'Import des avis',
      description: 'Récupérez automatiquement les avis clients',
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
    },
    {
      icon: RefreshCw,
      title: 'Suivi des prix',
      description: 'Alertes automatiques sur les changements de prix',
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      icon: Package,
      title: 'Multi-plateformes',
      description: 'AliExpress, Amazon, eBay, Temu et plus',
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
  ];

  const platforms = [
    { name: 'AliExpress', logo: '🛒', status: 'full' },
    { name: 'Amazon', logo: '📦', status: 'full' },
    { name: 'eBay', logo: '🏷️', status: 'full' },
    { name: 'Temu', logo: '🎯', status: 'full' },
    { name: 'Banggood', logo: '📱', status: 'full' },
    { name: 'CJ Dropshipping', logo: '🚚', status: 'partial' },
    { name: 'Wish', logo: '⭐', status: 'beta' },
    { name: 'DHgate', logo: '🏪', status: 'beta' },
  ];

  const installSteps = [
    {
      step: 1,
      title: 'Télécharger l\'extension',
      description: 'Installez depuis le Chrome Web Store',
      action: 'Installer',
    },
    {
      step: 2,
      title: 'Connecter votre compte',
      description: 'Utilisez votre clé API pour vous connecter',
      action: 'Copier la clé',
    },
    {
      step: 3,
      title: 'Configurer les options',
      description: 'Personnalisez le comportement de l\'extension',
      action: 'Configurer',
    },
    {
      step: 4,
      title: 'Commencer à importer',
      description: 'Naviguez sur vos sites fournisseurs préférés',
      action: 'C\'est parti !',
    },
  ];

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-cyan-500/20 via-blue-500/10 to-purple-500/20 border p-6 md:p-8"
      >
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-6">
          <div className="flex-1 space-y-4">
            <div className="flex items-center gap-2">
              <Badge className="bg-cyan-500">Extension Chrome</Badge>
              <Badge variant="outline">v2.5.0</Badge>
            </div>
            
            <h1 className="text-3xl md:text-4xl font-bold">
              Extension Navigateur
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl">
              Importez des produits directement depuis votre navigateur. 
              Un clic suffit pour ajouter n'importe quel produit à votre catalogue.
            </p>
            
            <div className="flex flex-wrap gap-3 pt-2">
              <Button size="lg" className="bg-gradient-to-r from-cyan-500 to-blue-500">
                <Chrome className="h-5 w-5 mr-2" />
                Installer l'extension
                <ExternalLink className="h-4 w-4 ml-2" />
              </Button>
              <Button variant="outline" size="lg">
                <Play className="h-5 w-5 mr-2" />
                Voir la démo
              </Button>
            </div>
            
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Gratuit
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle className="h-4 w-4 text-green-500" />
                15+ plateformes
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle className="h-4 w-4 text-green-500" />
                10k+ utilisateurs
              </span>
            </div>
          </div>
          
          <div className="hidden md:block">
            <div className="relative">
              <div className="w-48 h-48 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-xl">
                <Chrome className="h-24 w-24 text-white" />
              </div>
              <div className="absolute -bottom-4 -right-4 bg-green-500 text-white rounded-full p-2">
                <CheckCircle className="h-6 w-6" />
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {features.map((feature, index) => (
          <motion.div
            key={feature.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className={`h-12 w-12 rounded-lg ${feature.bgColor} flex items-center justify-center mb-4`}>
                  <feature.icon className={`h-6 w-6 ${feature.color}`} />
                </div>
                <h3 className="font-semibold mb-1">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Installation & Configuration */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Installation Steps */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Installation
            </CardTitle>
            <CardDescription>
              Installez l'extension en quelques étapes simples
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {installSteps.map((step, index) => (
                <div 
                  key={step.step}
                  className="flex items-start gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold flex-shrink-0">
                    {step.step}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">{step.title}</p>
                    <p className="text-sm text-muted-foreground">{step.description}</p>
                  </div>
                  <Button variant="ghost" size="sm" className="flex-shrink-0">
                    {step.action}
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Configuration
            </CardTitle>
            <CardDescription>
              Personnalisez le comportement de l'extension
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* API Key */}
            <div className="space-y-2">
              <Label>Clé API</Label>
              <div className="flex gap-2">
                <Input 
                  type="password" 
                  value="shp_xxxxx_demo_key_xxxxx" 
                  readOnly 
                  className="font-mono"
                />
                <Button variant="outline" onClick={handleCopyApiKey}>
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            
            {/* Settings Toggles */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Import automatique</p>
                  <p className="text-sm text-muted-foreground">Ajouter directement au catalogue</p>
                </div>
                <Switch 
                  checked={settings.autoImport}
                  onCheckedChange={(v) => setSettings(s => ({ ...s, autoImport: v }))}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Importer les avis</p>
                  <p className="text-sm text-muted-foreground">Récupérer les avis clients</p>
                </div>
                <Switch 
                  checked={settings.importReviews}
                  onCheckedChange={(v) => setSettings(s => ({ ...s, importReviews: v }))}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Images HD</p>
                  <p className="text-sm text-muted-foreground">Télécharger toutes les images</p>
                </div>
                <Switch 
                  checked={settings.importImages}
                  onCheckedChange={(v) => setSettings(s => ({ ...s, importImages: v }))}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Suivi des prix</p>
                  <p className="text-sm text-muted-foreground">Alertes de changement</p>
                </div>
                <Switch 
                  checked={settings.priceTracking}
                  onCheckedChange={(v) => setSettings(s => ({ ...s, priceTracking: v }))}
                />
              </div>
            </div>
            
            <Button className="w-full">
              Sauvegarder les paramètres
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Supported Platforms */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Plateformes supportées
          </CardTitle>
          <CardDescription>
            L'extension fonctionne sur toutes ces plateformes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
            {platforms.map((platform) => (
              <div 
                key={platform.name}
                className="flex flex-col items-center gap-2 p-4 rounded-lg border hover:bg-muted/50 transition-colors"
              >
                <span className="text-3xl">{platform.logo}</span>
                <span className="text-sm font-medium text-center">{platform.name}</span>
                <Badge 
                  variant={platform.status === 'full' ? 'default' : 'secondary'}
                  className="text-xs"
                >
                  {platform.status === 'full' ? 'Complet' : 
                   platform.status === 'partial' ? 'Partiel' : 'Bêta'}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
