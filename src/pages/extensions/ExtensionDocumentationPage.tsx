/**
 * Documentation complète de l'extension Chrome
 */
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BookOpen, 
  Code, 
  Settings, 
  Zap, 
  Shield, 
  Globe,
  Package,
  Star,
  RefreshCw,
  Bell,
  ShoppingCart,
  Download,
  ArrowRight,
  FileText,
  Eye,
  Target
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';

export default function ExtensionDocumentationPage() {
  const navigate = useNavigate();

  const sections = [
    {
      id: 'getting-started',
      title: 'Démarrage Rapide',
      icon: <Zap className="h-5 w-5" />,
      content: (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-2">Première utilisation</h3>
            <p className="text-muted-foreground mb-4">
              Après avoir installé l'extension, vous pouvez commencer à importer des produits immédiatement.
            </p>
            <ol className="list-decimal list-inside space-y-3 text-muted-foreground">
              <li>Ouvrez AliExpress, Amazon ou une autre plateforme supportée</li>
              <li>Naviguez vers un produit que vous souhaitez importer</li>
              <li>Cliquez sur l'icône ShopOpti+ dans votre barre d'outils</li>
              <li>Cliquez sur "Importer le produit"</li>
              <li>Configurez les options d'import et validez</li>
            </ol>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-2">Connexion à votre compte</h3>
            <p className="text-muted-foreground">
              Pour synchroniser vos imports avec votre boutique, connectez-vous à votre compte ShopOpti 
              directement depuis l'extension.
            </p>
          </div>
        </div>
      )
    },
    {
      id: 'features',
      title: 'Fonctionnalités',
      icon: <Package className="h-5 w-5" />,
      content: (
        <div className="space-y-6">
          <div className="grid gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4" />
                  Import de Produits
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                <ul className="space-y-2">
                  <li>• Import 1-clic avec toutes les variantes</li>
                  <li>• Récupération automatique des images HD</li>
                  <li>• Extraction des spécifications produit</li>
                  <li>• Calcul automatique des marges</li>
                </ul>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Star className="h-4 w-4" />
                  Import d'Avis
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                <ul className="space-y-2">
                  <li>• Import d'avis avec photos clients</li>
                  <li>• Filtrage par note et langue</li>
                  <li>• Traduction automatique</li>
                  <li>• Modération IA des avis</li>
                </ul>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Surveillance des Prix
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                <ul className="space-y-2">
                  <li>• Alertes de variation de prix</li>
                  <li>• Historique des prix</li>
                  <li>• Mise à jour automatique des marges</li>
                  <li>• Comparaison multi-fournisseurs</li>
                </ul>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Auto-Order
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                <ul className="space-y-2">
                  <li>• Commande automatique fournisseur</li>
                  <li>• Remplissage automatique des formulaires</li>
                  <li>• Suivi des commandes intégré</li>
                  <li>• Gestion multi-fournisseurs</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      )
    },
    {
      id: 'platforms',
      title: 'Plateformes Supportées',
      icon: <Globe className="h-5 w-5" />,
      content: (
        <div className="space-y-6">
          <p className="text-muted-foreground">
            L'extension ShopOpti+ fonctionne sur les plateformes suivantes :
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
              { name: 'AliExpress', status: 'Complet' },
              { name: 'Temu', status: 'Complet' },
              { name: 'Amazon', status: 'Complet' },
              { name: 'eBay', status: 'Complet' },
              { name: 'CJDropshipping', status: 'Complet' },
              { name: 'Banggood', status: 'Complet' },
              { name: '1688', status: 'Complet' },
              { name: 'Taobao', status: 'Bêta' },
              { name: 'DHgate', status: 'Complet' },
              { name: 'Wish', status: 'Complet' },
              { name: 'Shein', status: 'Bêta' },
              { name: 'Walmart', status: 'Complet' },
            ].map((platform) => (
              <div key={platform.name} className="flex items-center justify-between p-3 border rounded-lg">
                <span className="font-medium">{platform.name}</span>
                <Badge variant={platform.status === 'Complet' ? 'default' : 'secondary'} className="text-xs">
                  {platform.status}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )
    },
    {
      id: 'settings',
      title: 'Configuration',
      icon: <Settings className="h-5 w-5" />,
      content: (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-2">Options Générales</h3>
            <ul className="space-y-3 text-muted-foreground">
              <li className="flex items-start gap-2">
                <Bell className="h-4 w-4 mt-1 shrink-0" />
                <div>
                  <strong>Notifications</strong> - Activez/désactivez les alertes de prix et de stock
                </div>
              </li>
              <li className="flex items-start gap-2">
                <Globe className="h-4 w-4 mt-1 shrink-0" />
                <div>
                  <strong>Langue</strong> - Choisissez la langue de l'interface et des traductions
                </div>
              </li>
              <li className="flex items-start gap-2">
                <ShoppingCart className="h-4 w-4 mt-1 shrink-0" />
                <div>
                  <strong>Boutique par défaut</strong> - Sélectionnez la boutique de destination pour les imports
                </div>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-2">Options d'Import</h3>
            <ul className="space-y-3 text-muted-foreground">
              <li>• Multiplicateur de prix par défaut</li>
              <li>• Arrondi des prix (0.99, 0.95, etc.)</li>
              <li>• Import automatique des variantes</li>
              <li>• Limite du nombre d'images</li>
              <li>• Traduction automatique activée/désactivée</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      id: 'api',
      title: 'API & Développeurs',
      icon: <Code className="h-5 w-5" />,
      content: (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-2">Intégration API</h3>
            <p className="text-muted-foreground mb-4">
              L'extension communique avec l'API ShopOpti pour synchroniser vos données.
            </p>
            <pre className="p-4 bg-muted rounded-lg overflow-x-auto text-sm">
{`// Endpoint principal
POST https://api.shopopti.io/v1/products/import

// Headers requis
Authorization: Bearer YOUR_API_TOKEN
Content-Type: application/json

// Exemple de payload
{
  "source_url": "https://aliexpress.com/item/...",
  "store_id": "store_123",
  "options": {
    "import_reviews": true,
    "price_multiplier": 2.5
  }
}`}
            </pre>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-2">Webhooks</h3>
            <p className="text-muted-foreground">
              Configurez des webhooks pour recevoir des notifications en temps réel 
              lorsqu'un produit est importé ou qu'un prix change.
            </p>
          </div>
        </div>
      )
    },
    {
      id: 'security',
      title: 'Sécurité & Confidentialité',
      icon: <Shield className="h-5 w-5" />,
      content: (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-2">Données collectées</h3>
            <p className="text-muted-foreground mb-4">
              L'extension ShopOpti+ respecte votre vie privée. Voici ce que nous collectons :
            </p>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-green-500" />
                Données produit des pages visitées (uniquement sur les sites supportés)
              </li>
              <li className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-green-500" />
                Préférences de configuration de l'extension
              </li>
              <li className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-red-500" />
                Aucune donnée de navigation personnelle
              </li>
              <li className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-red-500" />
                Aucun mot de passe ou information bancaire
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-2">Permissions</h3>
            <ul className="space-y-2 text-muted-foreground">
              <li><strong>activeTab</strong> - Pour lire le contenu de la page active</li>
              <li><strong>storage</strong> - Pour sauvegarder vos préférences</li>
              <li><strong>notifications</strong> - Pour les alertes de prix</li>
              <li><strong>host_permissions</strong> - Accès aux sites e-commerce supportés</li>
            </ul>
          </div>
        </div>
      )
    }
  ];

  return (
    <ChannablePageWrapper
      title="Documentation Extension"
      subtitle="Guide Complet"
      description="Tout ce que vous devez savoir sur l'utilisation de l'extension Chrome ShopOpti+"
      heroImage="extensions"
      badge={{ label: 'Documentation', icon: BookOpen }}
      actions={
        <Button onClick={() => navigate('/extensions/download')}>
          <Download className="h-4 w-4 mr-2" />
          Télécharger
        </Button>
      }
    >
      <Tabs defaultValue="getting-started" className="space-y-6">
        <TabsList className="flex flex-wrap h-auto gap-1">
          {sections.map((section) => (
            <TabsTrigger key={section.id} value={section.id} className="flex items-center gap-2">
              {section.icon}
              <span className="hidden md:inline">{section.title}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {sections.map((section) => (
          <TabsContent key={section.id} value={section.id}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {section.icon}
                  {section.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {section.content}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {/* Related Links */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => navigate('/extensions/tutorials')}>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-xl text-primary">
              <FileText className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">Tutoriels</h3>
              <p className="text-sm text-muted-foreground">Guides pratiques pas à pas</p>
            </div>
            <ArrowRight className="h-5 w-5 text-muted-foreground" />
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => navigate('/extensions/faq')}>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-xl text-primary">
              <BookOpen className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">FAQ</h3>
              <p className="text-sm text-muted-foreground">Questions fréquentes</p>
            </div>
            <ArrowRight className="h-5 w-5 text-muted-foreground" />
          </CardContent>
        </Card>
      </div>
    </ChannablePageWrapper>
  );
}
