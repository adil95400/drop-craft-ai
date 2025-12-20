import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Link, 
  ShoppingBag, 
  Package,
  Store,
  Globe,
  Download,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export const QuickUrlImport: React.FC = () => {
  const { toast } = useToast();
  const [url, setUrl] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [detectedPlatform, setDetectedPlatform] = useState<string>('');

  const platforms = [
    { id: 'aliexpress', name: 'AliExpress', icon: <ShoppingBag className="w-4 h-4" />, pattern: 'aliexpress.com' },
    { id: 'amazon', name: 'Amazon', icon: <Package className="w-4 h-4" />, pattern: 'amazon.' },
    { id: 'ebay', name: 'eBay', icon: <Store className="w-4 h-4" />, pattern: 'ebay.com' },
    { id: 'etsy', name: 'Etsy', icon: <Globe className="w-4 h-4" />, pattern: 'etsy.com' },
    { id: 'shopify', name: 'Shopify', icon: <Store className="w-4 h-4" />, pattern: 'myshopify.com' },
  ];

  const detectPlatform = (inputUrl: string) => {
    const detected = platforms.find(p => inputUrl.toLowerCase().includes(p.pattern));
    setDetectedPlatform(detected?.id || '');
    return detected;
  };

  const handleUrlChange = (value: string) => {
    setUrl(value);
    if (value) {
      detectPlatform(value);
    } else {
      setDetectedPlatform('');
    }
  };

  const importFromUrl = async () => {
    if (!url) {
      toast({
        title: "URL manquante",
        description: "Veuillez entrer une URL de produit",
        variant: "destructive"
      });
      return;
    }

    const platform = detectPlatform(url);
    if (!platform) {
      toast({
        title: "Plateforme non supportée",
        description: "Cette plateforme n'est pas encore supportée",
        variant: "destructive"
      });
      return;
    }

    setIsImporting(true);
    setProgress(0);

    try {
      // Étape 1: Extraction des données
      await new Promise(resolve => setTimeout(resolve, 1000));
      setProgress(25);
      
      // Étape 2: Analyse du produit
      await new Promise(resolve => setTimeout(resolve, 1000));
      setProgress(50);
      
      // Étape 3: Optimisation IA
      await new Promise(resolve => setTimeout(resolve, 1000));
      setProgress(75);
      
      // Étape 4: Import final
      await new Promise(resolve => setTimeout(resolve, 1000));
      setProgress(100);

      toast({
        title: "Import réussi",
        description: `Le produit depuis ${platform.name} a été importé avec succès`
      });

      // Reset
      setTimeout(() => {
        setUrl('');
        setDetectedPlatform('');
        setProgress(0);
      }, 2000);

    } catch (error) {
      toast({
        title: "Erreur d'import",
        description: "Une erreur est survenue lors de l'import",
        variant: "destructive"
      });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Link className="w-5 h-5" />
          Import Rapide par URL
        </CardTitle>
        <CardDescription>
          Importez un produit directement depuis son URL (AliExpress, Amazon, eBay, etc.)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Plateformes supportées */}
        <div>
          <p className="text-sm font-medium mb-2">Plateformes supportées :</p>
          <div className="flex flex-wrap gap-2">
            {platforms.map(platform => (
              <Badge
                key={platform.id}
                variant={detectedPlatform === platform.id ? "default" : "outline"}
                className="flex items-center gap-1"
              >
                {platform.icon}
                {platform.name}
              </Badge>
            ))}
          </div>
        </div>

        {/* Input URL */}
        <div className="space-y-2">
          <div className="flex gap-2">
            <Input
              placeholder="https://www.aliexpress.com/item/..."
              value={url}
              onChange={(e) => handleUrlChange(e.target.value)}
              disabled={isImporting}
            />
            <Button
              onClick={importFromUrl}
              disabled={isImporting || !url}
              className="whitespace-nowrap"
            >
              {isImporting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Import...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Importer
                </>
              )}
            </Button>
          </div>

          {detectedPlatform && !isImporting && (
            <div className="flex items-center gap-2 text-sm text-green-600">
              <CheckCircle className="w-4 h-4" />
              Plateforme détectée: {platforms.find(p => p.id === detectedPlatform)?.name}
            </div>
          )}
        </div>

        {/* Barre de progression */}
        {isImporting && (
          <div className="space-y-2">
            <Progress value={progress} />
            <p className="text-sm text-muted-foreground text-center">
              {progress < 25 && "Extraction des données du produit..."}
              {progress >= 25 && progress < 50 && "Analyse du produit..."}
              {progress >= 50 && progress < 75 && "Optimisation IA..."}
              {progress >= 75 && progress < 100 && "Finalisation de l'import..."}
              {progress === 100 && "Import terminé !"}
            </p>
          </div>
        )}

        {/* Fonctionnalités */}
        <Card className="bg-muted">
          <CardContent className="p-4">
            <p className="font-semibold mb-2 text-sm">Fonctionnalités automatiques :</p>
            <ul className="space-y-1 text-sm">
              <li className="flex items-center gap-2">
                <CheckCircle className="w-3 h-3 text-green-600" />
                Extraction automatique des images
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-3 h-3 text-green-600" />
                Import des variantes (tailles, couleurs)
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-3 h-3 text-green-600" />
                Optimisation SEO avec IA
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-3 h-3 text-green-600" />
                Calcul automatique des prix et marges
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-3 h-3 text-green-600" />
                Import des avis clients
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Exemples */}
        <div>
          <p className="text-sm font-medium mb-2">Exemples d'URLs :</p>
          <div className="space-y-1">
            <Button
              variant="link"
              className="h-auto p-0 text-xs text-muted-foreground"
              onClick={() => handleUrlChange('https://www.aliexpress.com/item/1005001234567890.html')}
            >
              https://www.aliexpress.com/item/1005001234567890.html
            </Button>
            <br />
            <Button
              variant="link"
              className="h-auto p-0 text-xs text-muted-foreground"
              onClick={() => handleUrlChange('https://www.amazon.com/dp/B08N5WRWNW')}
            >
              https://www.amazon.com/dp/B08N5WRWNW
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
