import { useState } from 'react'
import { ArrowLeft, BookOpen, ExternalLink, CheckCircle2, AlertCircle, Image as ImageIcon, Video } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { useNavigate } from 'react-router-dom'
import { VideoTutorialPlayer, VideoGallery } from '@/components/guides/VideoTutorialPlayer'
import shopifyApiKeysImg from '@/assets/guides/shopify-api-keys.jpg'
import woocommerceRestApiImg from '@/assets/guides/woocommerce-rest-api.jpg'
import etsyDeveloperPortalImg from '@/assets/guides/etsy-developer-portal.jpg'
import prestashopWebserviceImg from '@/assets/guides/prestashop-webservice.jpg'
import apiPermissionsImg from '@/assets/guides/api-permissions.jpg'
import connectionSuccessImg from '@/assets/guides/connection-success.jpg'

const platforms = [
  {
    id: 'shopify',
    name: 'Shopify',
    icon: '🛍️',
    difficulty: 'Facile',
    time: '10-15 min',
    color: 'from-green-500 to-emerald-600'
  },
  {
    id: 'woocommerce',
    name: 'WooCommerce',
    icon: '🌐',
    difficulty: 'Moyen',
    time: '15-20 min',
    color: 'from-purple-500 to-violet-600'
  },
  {
    id: 'etsy',
    name: 'Etsy',
    icon: '🎨',
    difficulty: 'Facile',
    time: '10-15 min',
    color: 'from-orange-500 to-red-600'
  },
  {
    id: 'prestashop',
    name: 'PrestaShop',
    icon: '🏪',
    difficulty: 'Moyen',
    time: '15-20 min',
    color: 'from-blue-500 to-indigo-600'
  },
  {
    id: 'amazon',
    name: 'Amazon',
    icon: '📦',
    difficulty: 'Difficile',
    time: '30+ min',
    color: 'from-yellow-500 to-orange-600'
  },
  {
    id: 'ebay',
    name: 'eBay',
    icon: '🏷️',
    difficulty: 'Difficile',
    time: '30+ min',
    color: 'from-blue-600 to-indigo-700'
  }
]

const guides = {
  shopify: {
    videoTutorials: [
      {
        id: 'shopify-overview',
        title: 'Introduction à l\'intégration Shopify',
        description: 'Vue d\'ensemble complète du processus d\'intégration',
        duration: '5:30',
        thumbnailUrl: shopifyApiKeysImg,
        // youtubeId: 'YOUR_YOUTUBE_ID', // Ajoutez votre ID YouTube ici
      },
      {
        id: 'shopify-api-setup',
        title: 'Configuration pas à pas des API Shopify',
        description: 'Tutoriel détaillé avec enregistrement d\'écran',
        duration: '8:45',
        thumbnailUrl: apiPermissionsImg,
        // youtubeId: 'YOUR_YOUTUBE_ID',
      }
    ],
    steps: [
      {
        title: 'Accéder à l\'administration Shopify',
        description: 'Connectez-vous à votre boutique Shopify',
        details: [
          'Rendez-vous sur https://admin.shopify.com',
          'Connectez-vous avec vos identifiants Shopify',
          'Assurez-vous d\'avoir les permissions d\'administrateur'
        ]
      },
      {
        title: 'Créer une application privée',
        description: 'Générez les identifiants API nécessaires',
        details: [
          'Dans l\'admin, allez dans Paramètres > Applications et canaux de vente',
          'Cliquez sur "Développer des applications"',
          'Cliquez sur "Créer une application"',
          'Donnez un nom à votre application (ex: "Mon Intégration")',
          'Cliquez sur "Créer une application"'
        ],
        image: shopifyApiKeysImg
      },
      {
        title: 'Configurer les permissions',
        description: 'Accordez les accès nécessaires à l\'API',
        details: [
          'Allez dans l\'onglet "Configuration"',
          'Dans "Portées API Admin", sélectionnez les permissions:',
          '  • read_products et write_products',
          '  • read_orders et write_orders',
          '  • read_inventory et write_inventory',
          'Cliquez sur "Enregistrer"'
        ],
        image: apiPermissionsImg
      },
      {
        title: 'Générer le token d\'accès',
        description: 'Obtenez votre token d\'accès API',
        details: [
          'Cliquez sur "Installer l\'application"',
          'Confirmez l\'installation',
          'Copiez le "Token d\'accès Admin API" affiché',
          '⚠️ Attention: Ce token n\'apparaîtra qu\'une seule fois!',
          'Conservez-le en lieu sûr'
        ],
        image: connectionSuccessImg
      },
      {
        title: 'Récupérer l\'URL de la boutique',
        description: 'Identifiez votre domaine Shopify',
        details: [
          'Votre URL de boutique est au format: votre-boutique.myshopify.com',
          'Vous la trouverez dans Paramètres > Général > Domaines',
          'Utilisez uniquement le domaine .myshopify.com'
        ]
      },
      {
        title: 'Connecter dans l\'application',
        description: 'Complétez le formulaire de connexion',
        details: [
          'Dans notre application, allez dans Intégrations > Marketplace',
          'Cliquez sur "Connecter une marketplace"',
          'Sélectionnez "Shopify"',
          'Entrez votre URL: votre-boutique.myshopify.com',
          'Collez votre Token d\'accès Admin API',
          'Cliquez sur "Tester la connexion"',
          'Si le test réussit, cliquez sur "Connecter"'
        ]
      }
    ],
    troubleshooting: [
      {
        issue: 'Token d\'accès invalide (401)',
        solution: 'Vérifiez que vous avez bien copié le token complet. Assurez-vous que les permissions nécessaires sont accordées.'
      },
      {
        issue: 'Boutique non trouvée (404)',
        solution: 'Vérifiez le format de votre URL: elle doit être au format votre-boutique.myshopify.com sans http:// ou https://'
      },
      {
        issue: 'Permissions insuffisantes',
        solution: 'Retournez dans votre application Shopify et ajoutez les permissions manquantes dans Configuration > Portées API Admin'
      }
    ],
    documentation: 'https://help.shopify.com/en/manual/apps/custom-apps'
  },
  woocommerce: {
    videoTutorials: [
      {
        id: 'woocommerce-overview',
        title: 'Introduction à l\'intégration WooCommerce',
        description: 'Configuration complète de WooCommerce REST API',
        duration: '6:15',
        thumbnailUrl: woocommerceRestApiImg,
      },
      {
        id: 'woocommerce-troubleshooting',
        title: 'Résolution des problèmes courants WooCommerce',
        description: 'Guide de dépannage avec exemples réels',
        duration: '4:30',
        thumbnailUrl: woocommerceRestApiImg,
      }
    ],
    steps: [
      {
        title: 'Accéder à l\'administration WordPress',
        description: 'Connectez-vous à votre site WordPress',
        details: [
          'Rendez-vous sur votre-site.com/wp-admin',
          'Connectez-vous avec vos identifiants administrateur',
          'Assurez-vous que WooCommerce est installé et activé'
        ]
      },
      {
        title: 'Activer l\'API REST',
        description: 'Vérifiez que l\'API WooCommerce est activée',
        details: [
          'Allez dans WooCommerce > Réglages',
          'Cliquez sur l\'onglet "Avancé"',
          'Cliquez sur "REST API"',
          'L\'API REST doit être activée par défaut'
        ]
      },
      {
        title: 'Créer une clé API',
        description: 'Générez vos identifiants d\'API',
        details: [
          'Dans WooCommerce > Réglages > Avancé > REST API',
          'Cliquez sur "Ajouter une clé"',
          'Description: "Mon Intégration"',
          'Utilisateur: Sélectionnez votre compte admin',
          'Permissions: Lecture/Écriture',
          'Cliquez sur "Générer la clé API"'
        ],
        image: woocommerceRestApiImg
      },
      {
        title: 'Copier les identifiants',
        description: 'Conservez votre clé et secret',
        details: [
          'Copiez la "Clé du client" (Consumer Key)',
          'Copiez le "Secret du client" (Consumer Secret)',
          '⚠️ Ces informations n\'apparaîtront qu\'une fois!',
          'Conservez-les en lieu sûr'
        ],
        image: connectionSuccessImg
      },
      {
        title: 'Vérifier l\'URL de l\'API',
        description: 'Confirmez l\'accès à l\'API',
        details: [
          'Votre URL d\'API: https://votre-site.com/wp-json/wc/v3/',
          'Testez l\'accès en ouvrant: votre-site.com/wp-json/wc/v3/',
          'Vous devriez voir une liste des endpoints disponibles',
          'Si vous obtenez une erreur 404, vérifiez que WooCommerce est actif'
        ]
      },
      {
        title: 'Connecter dans l\'application',
        description: 'Complétez le formulaire de connexion',
        details: [
          'Dans notre application, allez dans Intégrations > Marketplace',
          'Cliquez sur "Connecter une marketplace"',
          'Sélectionnez "WooCommerce"',
          'URL du site: https://votre-site.com',
          'Clé API: Collez la Consumer Key',
          'Secret API: Collez le Consumer Secret',
          'Cliquez sur "Tester la connexion"',
          'Si le test réussit, cliquez sur "Connecter"'
        ]
      }
    ],
    troubleshooting: [
      {
        issue: 'Identifiants invalides (401)',
        solution: 'Vérifiez que vous avez copié la Consumer Key et le Consumer Secret correctement. Les clés sont sensibles à la casse.'
      },
      {
        issue: 'API WooCommerce non trouvée (404)',
        solution: 'Vérifiez que WooCommerce est installé et activé. Assurez-vous que les permaliens sont correctement configurés dans WordPress.'
      },
      {
        issue: 'Erreur de connexion',
        solution: 'Vérifiez que votre site est accessible publiquement et que le certificat SSL est valide si vous utilisez HTTPS.'
      }
    ],
    documentation: 'https://woocommerce.com/document/woocommerce-rest-api/'
  },
  etsy: {
    videoTutorials: [
      {
        id: 'etsy-developer-setup',
        title: 'Configuration du Developer Portal Etsy',
        description: 'Créer et configurer votre application Etsy',
        duration: '7:00',
        thumbnailUrl: etsyDeveloperPortalImg,
      }
    ],
    steps: [
      {
        title: 'Créer un compte développeur',
        description: 'Inscrivez-vous au programme développeur d\'Etsy',
        details: [
          'Rendez-vous sur https://www.etsy.com/developers',
          'Cliquez sur "Register as a developer"',
          'Acceptez les conditions d\'utilisation',
          'Vérifiez votre email'
        ]
      },
      {
        title: 'Créer une application',
        description: 'Enregistrez votre application',
        details: [
          'Allez sur le Developer Portal: https://www.etsy.com/developers/your-apps',
          'Cliquez sur "Create a New App"',
          'Remplissez les informations:',
          '  • App Name: "Mon Intégration"',
          '  • App Purpose: "Integration for store management"',
          'Cliquez sur "Create App"'
        ],
        image: etsyDeveloperPortalImg
      },
      {
        title: 'Obtenir la clé API',
        description: 'Récupérez vos identifiants',
        details: [
          'Dans votre application, allez dans l\'onglet "Keystring"',
          'Copiez le "Keystring" (votre clé API)',
          'Copiez le "Shared Secret" (si nécessaire)',
          'Conservez ces informations en sécurité'
        ],
        image: etsyDeveloperPortalImg
      },
      {
        title: 'Trouver votre Shop ID',
        description: 'Identifiez votre boutique Etsy',
        details: [
          'Allez sur votre boutique Etsy',
          'Dans l\'URL, cherchez le numéro après /shop/:',
          'Exemple: etsy.com/shop/MaBoutique → Shop ID: MaBoutique',
          'Ou utilisez l\'API pour le récupérer avec votre clé'
        ]
      },
      {
        title: 'Configurer les permissions',
        description: 'Définissez les scopes nécessaires',
        details: [
          'Dans votre app, allez dans "Permissions"',
          'Activez les scopes nécessaires:',
          '  • listings_r (lire les produits)',
          '  • listings_w (modifier les produits)',
          '  • shops_r (lire les infos boutique)',
          'Sauvegardez les changements'
        ]
      },
      {
        title: 'Connecter dans l\'application',
        description: 'Complétez le formulaire de connexion',
        details: [
          'Dans notre application, allez dans Intégrations > Marketplace',
          'Cliquez sur "Connecter une marketplace"',
          'Sélectionnez "Etsy"',
          'Clé API: Collez votre Keystring',
          'ID de boutique: Entrez votre Shop ID',
          'Cliquez sur "Tester la connexion"',
          'Si le test réussit, cliquez sur "Connecter"'
        ]
      }
    ],
    troubleshooting: [
      {
        issue: 'Clé API invalide (401/403)',
        solution: 'Vérifiez que vous utilisez le bon Keystring depuis le Developer Portal. Assurez-vous que l\'application est active.'
      },
      {
        issue: 'Boutique non trouvée (404)',
        solution: 'Vérifiez votre Shop ID. Il peut s\'agir du nom de votre boutique ou d\'un ID numérique. Assurez-vous que la boutique est publique.'
      },
      {
        issue: 'Permissions insuffisantes',
        solution: 'Retournez dans votre application Etsy et vérifiez que tous les scopes nécessaires sont activés.'
      }
    ],
    documentation: 'https://developer.etsy.com/documentation'
  },
  prestashop: {
    videoTutorials: [
      {
        id: 'prestashop-webservice',
        title: 'Activation et configuration du Webservice PrestaShop',
        description: 'Guide complet pour activer l\'API PrestaShop',
        duration: '9:20',
        thumbnailUrl: prestashopWebserviceImg,
      }
    ],
    steps: [
      {
        title: 'Activer le Webservice',
        description: 'Activez l\'API REST de PrestaShop',
        details: [
          'Connectez-vous au back-office PrestaShop',
          'Allez dans Paramètres avancés > Webservice',
          'Activez "Activer le webservice de PrestaShop"',
          'Cliquez sur "Enregistrer"'
        ]
      },
      {
        title: 'Créer une clé API',
        description: 'Générez une nouvelle clé d\'accès',
        details: [
          'Dans Paramètres avancés > Webservice',
          'Cliquez sur "Ajouter une nouvelle clé webservice"',
          'Remplissez les informations:',
          '  • Description: "Mon Intégration"',
          '  • État: Activé',
          'Cliquez sur "Générer" pour créer la clé'
        ],
        image: prestashopWebserviceImg
      },
      {
        title: 'Configurer les permissions',
        description: 'Définissez les droits d\'accès',
        details: [
          'Dans la configuration de votre clé API',
          'Sélectionnez les permissions pour chaque ressource:',
          '  • products: GET, PUT, POST, DELETE',
          '  • stock_availables: GET, PUT',
          '  • orders: GET, PUT',
          '  • categories: GET',
          'Cliquez sur "Enregistrer"'
        ],
        image: prestashopWebserviceImg
      },
      {
        title: 'Copier la clé API',
        description: 'Récupérez votre clé d\'accès',
        details: [
          'Dans la liste des clés, copiez la clé générée',
          'Format: une longue chaîne alphanumérique',
          'Conservez cette clé en sécurité'
        ]
      },
      {
        title: 'Vérifier l\'URL de l\'API',
        description: 'Confirmez l\'accès au Webservice',
        details: [
          'L\'URL de votre API: https://votre-boutique.com/api',
          'Testez l\'accès en ouvrant: votre-boutique.com/api',
          'Vous devriez voir une page XML ou être invité à vous authentifier',
          'Si erreur 404, vérifiez que le Webservice est activé'
        ]
      },
      {
        title: 'Connecter dans l\'application',
        description: 'Complétez le formulaire de connexion',
        details: [
          'Dans notre application, allez dans Intégrations > Marketplace',
          'Cliquez sur "Connecter une marketplace"',
          'Sélectionnez "PrestaShop"',
          'URL de la boutique: https://votre-boutique.com',
          'Clé API: Collez votre clé webservice',
          'Cliquez sur "Tester la connexion"',
          'Si le test réussit, cliquez sur "Connecter"'
        ]
      }
    ],
    troubleshooting: [
      {
        issue: 'Clé API invalide (401)',
        solution: 'Vérifiez que vous avez copié la clé complète. Assurez-vous que la clé est activée dans le back-office.'
      },
      {
        issue: 'API PrestaShop non trouvée (404)',
        solution: 'Vérifiez que le Webservice est activé dans Paramètres avancés > Webservice. Vérifiez aussi que le .htaccess autorise l\'accès.'
      },
      {
        issue: 'Permissions refusées',
        solution: 'Retournez dans la configuration de votre clé et vérifiez que toutes les permissions nécessaires sont cochées.'
      }
    ],
    documentation: 'https://devdocs.prestashop-project.org/8/webservice/'
  },
  amazon: {
    videoTutorials: [
      {
        id: 'amazon-sp-api',
        title: 'Introduction à Amazon Selling Partner API',
        description: 'Vue d\'ensemble du processus complexe d\'Amazon',
        duration: '12:00',
      }
    ],
    steps: [
      {
        title: 'Inscription Selling Partner API',
        description: 'Créez un compte développeur Amazon',
        details: [
          'Rendez-vous sur Seller Central',
          'Allez dans Paramètres > Accès et autorisations',
          'Suivez le processus d\'inscription à SP-API',
          '⚠️ Processus complexe nécessitant validation Amazon'
        ]
      },
      {
        title: 'Obtenir les identifiants',
        description: 'Configuration avancée requise',
        details: [
          'Ce processus nécessite:',
          '  • Un compte développeur vérifié',
          '  • Configuration AWS IAM',
          '  • Application enregistrée',
          'Suivez la documentation officielle pour les détails complets'
        ]
      }
    ],
    troubleshooting: [
      {
        issue: 'Configuration complexe',
        solution: 'Amazon SP-API nécessite une configuration avancée avec AWS. Consultez la documentation officielle pour un guide détaillé.'
      }
    ],
    documentation: 'https://developer-docs.amazon.com/sp-api/'
  },
  ebay: {
    videoTutorials: [
      {
        id: 'ebay-developer',
        title: 'Configuration développeur eBay',
        description: 'Créer votre application eBay developer',
        duration: '10:30',
      }
    ],
    steps: [
      {
        title: 'Créer un compte développeur',
        description: 'Inscrivez-vous au programme développeur eBay',
        details: [
          'Rendez-vous sur https://developer.ebay.com',
          'Créez un compte développeur',
          'Acceptez les conditions d\'utilisation',
          'Vérifiez votre email'
        ]
      },
      {
        title: 'Créer une application',
        description: 'Enregistrez votre keyset',
        details: [
          'Allez dans "My Account" > "Application Keys"',
          'Créez une nouvelle application',
          'Obtenez vos clés API:',
          '  • App ID (Client ID)',
          '  • Cert ID (Client Secret)',
          'Configuration OAuth requise'
        ]
      }
    ],
    troubleshooting: [
      {
        issue: 'Configuration OAuth complexe',
        solution: 'eBay nécessite une configuration OAuth avancée. Consultez la documentation officielle pour le flux d\'authentification complet.'
      }
    ],
    documentation: 'https://developer.ebay.com/api-docs/static/gs_landing.html'
  }
}

export default function MarketplaceIntegrationGuidesPage() {
  const navigate = useNavigate()
  const [selectedPlatform, setSelectedPlatform] = useState('shopify')

  const currentGuide = guides[selectedPlatform as keyof typeof guides]
  const currentPlatform = platforms.find(p => p.id === selectedPlatform)

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/integrations/marketplace/integrations')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour aux intégrations
          </Button>

          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-primary/10 rounded-lg">
              <BookOpen className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Guides d'Intégration Marketplace</h1>
              <p className="text-muted-foreground">
                Tutoriels pas à pas pour connecter vos plateformes de vente
              </p>
            </div>
          </div>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Suivez attentivement chaque étape et conservez vos identifiants API en lieu sûr. 
              Ne partagez jamais vos clés API publiquement.
            </AlertDescription>
          </Alert>
        </div>

        {/* Platform Selection */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Sélectionnez une plateforme</CardTitle>
            <CardDescription>Choisissez la marketplace que vous souhaitez intégrer</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {platforms.map((platform) => (
                <button
                  key={platform.id}
                  onClick={() => setSelectedPlatform(platform.id)}
                  className={`p-4 rounded-lg border-2 transition-all hover:scale-105 ${
                    selectedPlatform === platform.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className="text-3xl mb-2">{platform.icon}</div>
                  <div className="font-medium text-sm">{platform.name}</div>
                  <Badge variant="outline" className="mt-2 text-xs">
                    {platform.difficulty}
                  </Badge>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Guide Content */}
        {currentPlatform && currentGuide && (
          <Tabs defaultValue="videos" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="videos">
                <Video className="h-4 w-4 mr-2" />
                Tutoriels Vidéo
              </TabsTrigger>
              <TabsTrigger value="steps">Étapes d'intégration</TabsTrigger>
              <TabsTrigger value="troubleshooting">Dépannage</TabsTrigger>
            </TabsList>

            <TabsContent value="videos" className="space-y-6">
              {/* Platform Info */}
              <Card className={`bg-gradient-to-br ${currentPlatform.color} text-white`}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="text-5xl">{currentPlatform.icon}</div>
                      <div>
                        <h2 className="text-2xl font-bold mb-1">{currentPlatform.name}</h2>
                        <p className="opacity-90">
                          Tutoriels vidéo pour {currentPlatform.name}
                        </p>
                      </div>
                    </div>
                    <a
                      href={currentGuide.documentation}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Documentation officielle
                    </a>
                  </div>
                </CardContent>
              </Card>

              {/* Video Tutorials */}
              {currentGuide.videoTutorials && currentGuide.videoTutorials.length > 0 ? (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Tutoriels Vidéo</h3>
                    <p className="text-muted-foreground text-sm">
                      Suivez ces tutoriels vidéo pour une configuration guidée pas à pas
                    </p>
                  </div>
                  <VideoGallery 
                    videos={currentGuide.videoTutorials} 
                    platform={currentPlatform.name}
                  />
                </div>
              ) : (
                <Alert>
                  <Video className="h-4 w-4" />
                  <AlertDescription>
                    Les tutoriels vidéo pour {currentPlatform.name} sont en cours de préparation. 
                    Consultez les étapes écrites dans l'onglet "Étapes d'intégration".
                  </AlertDescription>
                </Alert>
              )}

              {/* Quick Links */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Ressources complémentaires</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => {
                      const stepsTab = document.querySelector('[value="steps"]') as HTMLButtonElement
                      stepsTab?.click()
                    }}
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Voir les étapes écrites détaillées
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => {
                      const troubleshootingTab = document.querySelector('[value="troubleshooting"]') as HTMLButtonElement
                      troubleshootingTab?.click()
                    }}
                  >
                    <AlertCircle className="h-4 w-4 mr-2" />
                    Guide de dépannage
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    asChild
                  >
                    <a href={currentGuide.documentation} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Documentation officielle
                    </a>
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="steps" className="space-y-6">
              {/* Platform Info */}
              <Card className={`bg-gradient-to-br ${currentPlatform.color} text-white`}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="text-5xl">{currentPlatform.icon}</div>
                      <div>
                        <h2 className="text-2xl font-bold mb-1">{currentPlatform.name}</h2>
                        <p className="opacity-90">
                          Difficulté: {currentPlatform.difficulty} • Temps estimé: {currentPlatform.time}
                        </p>
                      </div>
                    </div>
                    <a
                      href={currentGuide.documentation}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Documentation officielle
                    </a>
                  </div>
                </CardContent>
              </Card>

              {/* Steps */}
              <div className="space-y-4">
                {currentGuide.steps.map((step, index) => (
                  <Card key={index}>
                    <CardHeader>
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <CardTitle className="text-xl mb-2">{step.title}</CardTitle>
                          <CardDescription className="text-base">{step.description}</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {step.image && (
                        <div className="relative rounded-lg overflow-hidden border bg-muted">
                          <img
                            src={step.image}
                            alt={step.title}
                            className="w-full h-auto"
                          />
                          <div className="absolute top-2 right-2">
                            <Badge className="bg-background/80 backdrop-blur-sm">
                              <ImageIcon className="h-3 w-3 mr-1" />
                              Exemple
                            </Badge>
                          </div>
                        </div>
                      )}
                      <ul className="space-y-2">
                        {step.details.map((detail, detailIndex) => (
                          <li key={detailIndex} className="flex items-start gap-2">
                            <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                            <span className="text-sm">{detail}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Success Message */}
              <Alert className="bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800">
                <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                <AlertDescription className="text-green-800 dark:text-green-200">
                  Une fois ces étapes complétées, votre boutique {currentPlatform.name} sera connectée et prête à synchroniser vos produits et commandes!
                </AlertDescription>
              </Alert>
            </TabsContent>

            <TabsContent value="troubleshooting" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Problèmes courants et solutions</CardTitle>
                  <CardDescription>
                    Solutions aux erreurs les plus fréquentes lors de la connexion à {currentPlatform.name}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {currentGuide.troubleshooting.map((item, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <h3 className="font-semibold text-destructive mb-2 flex items-center gap-2">
                        <AlertCircle className="h-4 w-4" />
                        {item.issue}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        <strong>Solution:</strong> {item.solution}
                      </p>
                    </div>
                  ))}

                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Si vous rencontrez d'autres problèmes, consultez la{' '}
                      <a
                        href={currentGuide.documentation}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline inline-flex items-center gap-1"
                      >
                        documentation officielle
                        <ExternalLink className="h-3 w-3" />
                      </a>{' '}
                      ou contactez notre support.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  )
}
