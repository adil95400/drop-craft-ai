import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Download, Chrome, Globe, CheckCircle, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export const ExtensionDownloadPage = () => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadStep, setDownloadStep] = useState(0);
  const { toast } = useToast();

  const handleDownload = async () => {
    setIsDownloading(true);
    setDownloadStep(1);
    
    try {
      const { data, error } = await supabase.functions.invoke('extension-download');
      
      if (error) throw error;
      
      // Create download link
      const blob = new Blob([data], { type: 'application/zip' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'dropcraft-extension.zip';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      setDownloadStep(2);
      toast({
        title: "Extension téléchargée !",
        description: "Suivez les instructions ci-dessous pour l'installer.",
      });
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: "Erreur de téléchargement",
        description: "Impossible de télécharger l'extension. Réessayez plus tard.",
        variant: "destructive"
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const installationSteps = [
    {
      title: "Télécharger l'extension",
      description: "Cliquez sur le bouton de téléchargement ci-dessus",
      completed: downloadStep >= 1
    },
    {
      title: "Extraire le fichier ZIP",
      description: "Décompressez le fichier dropcraft-extension.zip dans un dossier",
      completed: downloadStep >= 2
    },
    {
      title: "Ouvrir Chrome Extensions",
      description: "Allez dans Chrome → Plus d'outils → Extensions (chrome://extensions/)",
      completed: false
    },
    {
      title: "Activer le mode développeur",
      description: "Activez le bouton 'Mode développeur' en haut à droite",
      completed: false
    },
    {
      title: "Charger l'extension",
      description: "Cliquez sur 'Charger l'extension non empaquetée' et sélectionnez le dossier extrait",
      completed: false
    }
  ];

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4">Extension Drop Craft AI</h1>
        <p className="text-xl text-muted-foreground mb-6">
          Scrapez automatiquement les produits e-commerce depuis n'importe quel site web
        </p>
        
        <div className="flex justify-center gap-4 mb-8">
          <Badge variant="secondary" className="flex items-center gap-2">
            <Chrome className="w-4 h-4" />
            Chrome
          </Badge>
          <Badge variant="outline" className="flex items-center gap-2">
            <Globe className="w-4 h-4" />
            Firefox (Bientôt)
          </Badge>
          <Badge variant="outline" className="flex items-center gap-2">
            <Globe className="w-4 h-4" />
            Edge (Bientôt)
          </Badge>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="w-5 h-5" />
              Téléchargement
            </CardTitle>
            <CardDescription>
              Téléchargez l'extension pour commencer à scraper
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={handleDownload}
              disabled={isDownloading}
              className="w-full"
              size="lg"
            >
              {isDownloading ? "Téléchargement..." : "Télécharger l'Extension"}
            </Button>
            {downloadStep > 0 && (
              <p className="text-sm text-green-600 mt-2 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Extension téléchargée avec succès !
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Fonctionnalités</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                Scraping automatique des produits
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                Détection intelligente des données
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                Import en un clic vers Drop Craft
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                Synchronisation en temps réel
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                Support multi-plateformes
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Guide d'installation</CardTitle>
          <CardDescription>
            Suivez ces étapes pour installer l'extension dans Chrome
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {installationSteps.map((step, index) => (
              <div key={index} className="flex items-start gap-4 p-4 rounded-lg border">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  step.completed ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'
                }`}>
                  {step.completed ? <CheckCircle className="w-5 h-5" /> : index + 1}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">{step.title}</h3>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-semibold text-blue-900 dark:text-blue-100">Note importante</h4>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Cette extension est actuellement en mode développeur. 
                  Les versions officielles pour Chrome Web Store, Firefox et Edge arriveront bientôt.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="text-center mt-8">
        <p className="text-sm text-muted-foreground">
          Besoin d'aide ? Consultez notre{" "}
          <a href="/help" className="text-primary hover:underline">
            documentation complète
          </a>{" "}
          ou{" "}
          <a href="/contact" className="text-primary hover:underline">
            contactez le support
          </a>
        </p>
      </div>
    </div>
  );
};