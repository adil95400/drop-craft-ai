/**
 * Guide d'installation détaillé de l'extension Chrome
 */
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  Chrome, 
  Download, 
  FolderOpen, 
  Settings, 
  Upload, 
  CheckCircle, 
  AlertTriangle,
  Monitor,
  ArrowRight,
  Play,
  RefreshCw,
  Puzzle,
  Pin,
  Eye
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { generateExtensionZip } from '@/utils/extensionZipGenerator';
import { useState } from 'react';

export default function ExtensionInstallationPage() {
  const navigate = useNavigate();
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      await generateExtensionZip();
    } finally {
      setIsDownloading(false);
    }
  };

  const steps = [
    {
      icon: <Download className="h-8 w-8" />,
      title: "1. Téléchargez l'extension",
      content: (
        <div className="space-y-4">
          <p className="text-muted-foreground">
            Cliquez sur le bouton ci-dessous pour télécharger le fichier ZIP contenant 
            tous les fichiers de l'extension ShopOpti+.
          </p>
          <Button onClick={handleDownload} disabled={isDownloading} size="lg">
            {isDownloading ? (
              <><RefreshCw className="h-4 w-4 mr-2 animate-spin" /> Téléchargement...</>
            ) : (
              <><Download className="h-4 w-4 mr-2" /> Télécharger le ZIP</>
            )}
          </Button>
        </div>
      )
    },
    {
      icon: <FolderOpen className="h-8 w-8" />,
      title: "2. Décompressez le fichier",
      content: (
        <div className="space-y-4">
          <p className="text-muted-foreground">
            Localisez le fichier <code className="px-2 py-1 bg-muted rounded">shopopti-chrome-extension.zip</code> 
            téléchargé et extrayez son contenu dans un dossier permanent.
          </p>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Important</AlertTitle>
            <AlertDescription>
              Ne supprimez pas ce dossier après l'installation. Chrome a besoin d'y accéder 
              en permanence pour faire fonctionner l'extension.
            </AlertDescription>
          </Alert>
          <div className="bg-muted/50 p-4 rounded-lg">
            <p className="text-sm font-medium mb-2">Emplacements recommandés :</p>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Windows : <code>C:\Extensions\ShopOpti</code></li>
              <li>• Mac : <code>~/Applications/ShopOpti</code></li>
              <li>• Linux : <code>~/.local/share/ShopOpti</code></li>
            </ul>
          </div>
        </div>
      )
    },
    {
      icon: <Chrome className="h-8 w-8" />,
      title: "3. Ouvrez les extensions Chrome",
      content: (
        <div className="space-y-4">
          <p className="text-muted-foreground">
            Ouvrez Google Chrome et accédez à la page de gestion des extensions.
          </p>
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              <span className="text-sm">Méthode 1 :</span>
              <code className="px-2 py-1 bg-background rounded">chrome://extensions</code>
            </div>
            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              <span className="text-sm">Méthode 2 :</span>
              <span className="text-muted-foreground text-sm">Menu ⋮ → Plus d'outils → Extensions</span>
            </div>
          </div>
        </div>
      )
    },
    {
      icon: <Settings className="h-8 w-8" />,
      title: "4. Activez le Mode Développeur",
      content: (
        <div className="space-y-4">
          <p className="text-muted-foreground">
            En haut à droite de la page des extensions, activez le <strong>Mode développeur</strong> 
            en cliquant sur le toggle.
          </p>
          <div className="border rounded-lg p-4 bg-muted/30">
            <div className="flex items-center justify-between">
              <span className="font-medium">Mode développeur</span>
              <div className="w-12 h-6 bg-primary rounded-full relative">
                <div className="w-5 h-5 bg-white rounded-full absolute right-0.5 top-0.5 shadow" />
              </div>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Ce mode permet d'installer des extensions non publiées sur le Chrome Web Store.
          </p>
        </div>
      )
    },
    {
      icon: <Upload className="h-8 w-8" />,
      title: "5. Chargez l'extension",
      content: (
        <div className="space-y-4">
          <p className="text-muted-foreground">
            Trois nouveaux boutons apparaissent. Cliquez sur <strong>"Charger l'extension non empaquetée"</strong>.
          </p>
          <div className="grid grid-cols-3 gap-2">
            <Button variant="outline" size="sm" className="text-xs">
              Charger l'extension non empaquetée
            </Button>
            <Button variant="ghost" size="sm" className="text-xs text-muted-foreground">
              Empaqueter l'extension
            </Button>
            <Button variant="ghost" size="sm" className="text-xs text-muted-foreground">
              Mettre à jour
            </Button>
          </div>
          <p className="text-muted-foreground">
            Dans la fenêtre de sélection, naviguez vers le dossier décompressé à l'étape 2 
            et sélectionnez-le.
          </p>
        </div>
      )
    },
    {
      icon: <CheckCircle className="h-8 w-8 text-green-500" />,
      title: "6. Installation terminée !",
      content: (
        <div className="space-y-4">
          <p className="text-muted-foreground">
            L'extension ShopOpti+ est maintenant installée ! Vous devriez voir apparaître 
            une nouvelle carte d'extension sur la page.
          </p>
          <Alert className="bg-green-500/10 border-green-500/20">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <AlertTitle className="text-green-700">Extension active</AlertTitle>
            <AlertDescription className="text-green-600">
              ShopOpti+ est prêt à être utilisé sur AliExpress, Amazon et autres plateformes.
            </AlertDescription>
          </Alert>
        </div>
      )
    },
    {
      icon: <Pin className="h-8 w-8" />,
      title: "7. Épinglez l'extension (optionnel)",
      content: (
        <div className="space-y-4">
          <p className="text-muted-foreground">
            Pour un accès rapide, épinglez l'extension à votre barre d'outils Chrome.
          </p>
          <div className="flex items-center gap-2">
            <div className="p-2 border rounded-lg">
              <Puzzle className="h-5 w-5" />
            </div>
            <ArrowRight className="h-4 w-4" />
            <div className="p-2 border rounded-lg flex items-center gap-2">
              <img src="/chrome-extension/icons/icon32.png" alt="ShopOpti+" className="h-5 w-5" />
              <Pin className="h-3 w-3 text-primary" />
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Cliquez sur l'icône puzzle → Trouvez ShopOpti+ → Cliquez sur l'épingle
          </p>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="text-center space-y-2">
        <Badge variant="secondary">Guide d'Installation</Badge>
        <h1 className="text-3xl font-bold">Installation de l'Extension Chrome</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Suivez ce guide étape par étape pour installer l'extension ShopOpti+ sur Google Chrome
        </p>
      </div>

      {/* Video Tutorial Card */}
      <Card className="bg-gradient-to-br from-primary/5 to-blue-500/5 border-primary/20">
        <CardContent className="p-6 flex flex-col md:flex-row items-center gap-6">
          <div className="w-48 h-28 bg-slate-800 rounded-lg flex items-center justify-center">
            <Play className="h-12 w-12 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-lg">Tutoriel Vidéo</h3>
            <p className="text-muted-foreground">
              Préférez-vous regarder ? Suivez notre tutoriel vidéo de 2 minutes.
            </p>
            <Button variant="link" className="p-0 h-auto mt-2">
              <Play className="h-4 w-4 mr-2" /> Regarder le tutoriel
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Steps */}
      <div className="space-y-6">
        {steps.map((step, index) => (
          <Card key={index}>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-xl text-primary">
                  {step.icon}
                </div>
                <CardTitle className="text-xl">{step.title}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pl-20">
              {step.content}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Troubleshooting */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            Résolution des Problèmes
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border-l-4 border-yellow-500 pl-4">
            <p className="font-medium">L'extension ne s'affiche pas après l'installation</p>
            <p className="text-sm text-muted-foreground">
              Assurez-vous d'avoir sélectionné le bon dossier contenant le fichier <code>manifest.json</code>.
            </p>
          </div>
          <div className="border-l-4 border-yellow-500 pl-4">
            <p className="font-medium">Chrome affiche "Extension non vérifiée"</p>
            <p className="text-sm text-muted-foreground">
              C'est normal pour les extensions en mode développeur. Cliquez sur "Conserver" pour continuer.
            </p>
          </div>
          <div className="border-l-4 border-yellow-500 pl-4">
            <p className="font-medium">L'extension ne fonctionne pas sur certains sites</p>
            <p className="text-sm text-muted-foreground">
              Rechargez la page après l'installation. Si le problème persiste, désactivez puis réactivez l'extension.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={() => navigate('/extensions/download')}>
          ← Retour au téléchargement
        </Button>
        <Button onClick={() => navigate('/extensions/documentation')}>
          Documentation complète →
        </Button>
      </div>
    </div>
  );
}
