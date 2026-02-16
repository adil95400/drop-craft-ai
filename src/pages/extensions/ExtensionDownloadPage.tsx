/**
 * Page de téléchargement de l'extension Chrome
 * Guide complet d'installation et accès direct au ZIP
 */
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { 
  Download, 
  Chrome, 
  CheckCircle, 
  ArrowRight, 
  FolderOpen, 
  Settings, 
  Puzzle,
  Upload,
  RefreshCw,
  AlertCircle,
  FileArchive,
  Monitor,
  Zap,
  Star,
  Shield,
  HelpCircle,
  ExternalLink,
  Copy,
  Check
} from 'lucide-react';
import { generateExtensionZip } from '@/utils/extensionZipGenerator';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';

export default function ExtensionDownloadPage() {
  const [isDownloading, setIsDownloading] = useState(false);
  const [copiedStep, setCopiedStep] = useState<number | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      await generateExtensionZip();
      toast({
        title: "Téléchargement réussi !",
        description: "L'extension a été téléchargée. Suivez le guide d'installation ci-dessous.",
      });
    } catch (error) {
      toast({
        title: "Erreur de téléchargement",
        description: "Une erreur est survenue. Veuillez réessayer.",
        variant: "destructive"
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const copyToClipboard = (text: string, step: number) => {
    navigator.clipboard.writeText(text);
    setCopiedStep(step);
    setTimeout(() => setCopiedStep(null), 2000);
  };

  const installSteps = [
    {
      number: 1,
      title: "Téléchargez l'extension",
      description: "Cliquez sur le bouton de téléchargement pour obtenir le fichier ZIP de l'extension.",
      icon: <Download className="h-6 w-6" />,
      action: (
        <Button onClick={handleDownload} disabled={isDownloading} className="mt-4">
          {isDownloading ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Téléchargement...
            </>
          ) : (
            <>
              <FileArchive className="h-4 w-4 mr-2" />
              Télécharger le ZIP
            </>
          )}
        </Button>
      )
    },
    {
      number: 2,
      title: "Décompressez le fichier",
      description: "Extrayez le contenu du fichier ZIP dans un dossier de votre choix sur votre ordinateur.",
      icon: <FolderOpen className="h-6 w-6" />,
      tip: "Choisissez un emplacement permanent car Chrome aura besoin d'accéder à ce dossier."
    },
    {
      number: 3,
      title: "Ouvrez les extensions Chrome",
      description: "Ouvrez Chrome et accédez à la page des extensions.",
      icon: <Chrome className="h-6 w-6" />,
      copyText: "chrome://extensions",
      action: (
        <div className="flex items-center gap-2 mt-4">
          <code className="px-3 py-2 bg-muted rounded-lg text-sm">chrome://extensions</code>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => copyToClipboard("chrome://extensions", 3)}
          >
            {copiedStep === 3 ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </Button>
        </div>
      )
    },
    {
      number: 4,
      title: "Activez le mode développeur",
      description: "Activez le \"Mode développeur\" en cliquant sur le toggle en haut à droite de la page.",
      icon: <Settings className="h-6 w-6" />,
      tip: "Ce mode est nécessaire pour installer des extensions non publiées sur le Chrome Web Store."
    },
    {
      number: 5,
      title: "Chargez l'extension",
      description: "Cliquez sur \"Charger l'extension non empaquetée\" et sélectionnez le dossier décompressé.",
      icon: <Upload className="h-6 w-6" />,
    },
    {
      number: 6,
      title: "Extension installée !",
      description: "L'extension ShopOpti+ apparaît maintenant dans votre barre d'outils Chrome.",
      icon: <CheckCircle className="h-6 w-6 text-green-500" />,
      tip: "Épinglez l'extension pour un accès rapide en cliquant sur l'icône puzzle puis sur l'épingle."
    }
  ];

  const features = [
    { icon: <Zap className="h-5 w-5" />, title: "Import 1-Clic", description: "Importez des produits instantanément" },
    { icon: <Star className="h-5 w-5" />, title: "Import Avis", description: "Récupérez les avis clients avec photos" },
    { icon: <RefreshCw className="h-5 w-5" />, title: "Sync Prix", description: "Surveillance des prix en temps réel" },
    { icon: <Shield className="h-5 w-5" />, title: "Auto-Order", description: "Commandes automatiques fournisseurs" },
  ];

  const faqs = [
    {
      question: "L'extension est-elle sécurisée ?",
      answer: "Oui, l'extension ne collecte aucune donnée personnelle et fonctionne uniquement sur les sites e-commerce pris en charge. Tout le code est open-source et auditable."
    },
    {
      question: "Chrome affiche un avertissement, est-ce normal ?",
      answer: "Oui, Chrome affiche un avertissement pour toutes les extensions installées en mode développeur. C'est normal et ne présente aucun risque pour notre extension."
    },
    {
      question: "Comment mettre à jour l'extension ?",
      answer: "Téléchargez la nouvelle version, remplacez les fichiers dans votre dossier d'extension, puis cliquez sur le bouton 'Actualiser' dans chrome://extensions."
    },
    {
      question: "L'extension fonctionne-t-elle sur d'autres navigateurs ?",
      answer: "Actuellement, l'extension est optimisée pour Chrome et les navigateurs basés sur Chromium (Edge, Brave, Opera). Une version Firefox est en développement."
    },
    {
      question: "Comment signaler un bug ?",
      answer: "Vous pouvez signaler un bug via notre page de support ou directement depuis l'extension en cliquant sur 'Aide > Signaler un problème'."
    }
  ];

  return (
    <ChannablePageWrapper
      title="Extension Chrome ShopOpti+"
      subtitle="Téléchargement"
      description="Téléchargez et installez l'extension Chrome pour importer des produits en un clic."
      heroImage="extensions"
      badge={{ label: 'v5.9.0', icon: Chrome }}
      actions={
        <Button 
          size="lg" 
          onClick={handleDownload}
          disabled={isDownloading}
          className="bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90"
        >
          {isDownloading ? (
            <>
              <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
              Téléchargement...
            </>
          ) : (
            <>
              <Download className="h-5 w-5 mr-2" />
              Télécharger l'Extension
            </>
          )}
        </Button>
      }
    >
      {/* Features Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {features.map((feature, index) => (
          <Card key={index} className="text-center">
            <CardContent className="pt-6">
              <div className="p-3 bg-primary/10 rounded-xl w-fit mx-auto mb-3 text-primary">
                {feature.icon}
              </div>
              <h4 className="font-medium">{feature.title}</h4>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Installation Guide */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Monitor className="h-5 w-5" />
            Guide d'Installation
          </CardTitle>
          <CardDescription>
            Suivez ces étapes pour installer l'extension sur Chrome
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {installSteps.map((step, index) => (
              <div key={step.number} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    step.number === 6 
                      ? 'bg-green-500 text-white' 
                      : 'bg-primary/10 text-primary'
                  }`}>
                    {step.icon}
                  </div>
                  {index < installSteps.length - 1 && (
                    <div className="w-px h-full bg-border mt-2" />
                  )}
                </div>
                <div className="flex-1 pb-6">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-muted-foreground">Étape {step.number}</span>
                  </div>
                  <h4 className="font-semibold mt-1">{step.title}</h4>
                  <p className="text-muted-foreground mt-1">{step.description}</p>
                  {step.tip && (
                    <Alert className="mt-3 bg-muted/50">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{step.tip}</AlertDescription>
                    </Alert>
                  )}
                  {step.action}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* FAQ */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5" />
            Questions Fréquentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`faq-${index}`}>
                <AccordionTrigger className="text-left">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>

      {/* Navigation Links */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => navigate('/extensions')}>
          <CardContent className="p-4 flex items-center gap-3">
            <Puzzle className="h-8 w-8 text-primary" />
            <div>
              <h4 className="font-medium">Extensions Hub</h4>
              <p className="text-sm text-muted-foreground">Toutes les extensions</p>
            </div>
            <ArrowRight className="h-4 w-4 ml-auto text-muted-foreground" />
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => navigate('/extensions/documentation')}>
          <CardContent className="p-4 flex items-center gap-3">
            <ExternalLink className="h-8 w-8 text-primary" />
            <div>
              <h4 className="font-medium">Documentation</h4>
              <p className="text-sm text-muted-foreground">Guide complet</p>
            </div>
            <ArrowRight className="h-4 w-4 ml-auto text-muted-foreground" />
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => navigate('/support')}>
          <CardContent className="p-4 flex items-center gap-3">
            <HelpCircle className="h-8 w-8 text-primary" />
            <div>
              <h4 className="font-medium">Support</h4>
              <p className="text-sm text-muted-foreground">Besoin d'aide ?</p>
            </div>
            <ArrowRight className="h-4 w-4 ml-auto text-muted-foreground" />
          </CardContent>
        </Card>
      </div>
    </ChannablePageWrapper>
  );
}
