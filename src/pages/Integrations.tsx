import { useState } from "react"
import { useEnhancedAuth } from "@/hooks/useEnhancedAuth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  ExternalLink,
  Plus,
  FileText,
  Database,
  Image,
  Code,
  Download,
  Sheet
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

const Integrations = () => {
  const { user, loading } = useEnhancedAuth()
  const [selectedPlatform, setSelectedPlatform] = useState<any>(null)
  const [configDialog, setConfigDialog] = useState(false)
  const { toast } = useToast()

  // Données des plateformes inspirées de l'image de référence
  const platforms = [
    {
      id: "afosto",
      name: "Afosto",
      logo: "https://images.g2crowd.com/uploads/product/image/social_landscape/social_landscape_4c9b6c1e9c4a4c9b6a1c9b6a1c9b6a1c/afosto.png",
      category: "E-commerce"
    },
    {
      id: "bigcommerce", 
      name: "BigCommerce",
      logo: "https://logos-world.net/wp-content/uploads/2021/02/BigCommerce-Logo.png",
      category: "E-commerce"
    },
    {
      id: "ccv",
      name: "CCV Shop",
      logo: "https://www.ccv.eu/app/uploads/2023/03/ccv-shop-logo.svg",
      category: "E-commerce"
    },
    {
      id: "crawler",
      name: "Crawler",
      logo: "https://via.placeholder.com/120x60/6366f1/ffffff?text=Crawler",
      category: "Tools"
    },
    {
      id: "itsperfect",
      name: "ItsPerfect",
      logo: "https://via.placeholder.com/120x60/059669/ffffff?text=ItsPerfect",
      category: "E-commerce"
    },
    {
      id: "lightspeed",
      name: "Lightspeed",
      logo: "https://logos-world.net/wp-content/uploads/2021/05/Lightspeed-Logo.png",
      category: "E-commerce"
    },
    {
      id: "lightspeed-e",
      name: "Lightspeed E - Series",
      logo: "https://logos-world.net/wp-content/uploads/2021/05/Lightspeed-Logo.png",
      category: "E-commerce"
    },
    {
      id: "magento",
      name: "Magento",
      logo: "https://logos-world.net/wp-content/uploads/2020/09/Magento-Logo.png",
      category: "E-commerce"
    },
    {
      id: "mijnwebwinkel",
      name: "Mijnwebwinkel",
      logo: "https://via.placeholder.com/120x60/22c55e/ffffff?text=Mijnwebwinkel",
      category: "E-commerce"
    },
    {
      id: "oxid",
      name: "Oxid",
      logo: "https://via.placeholder.com/120x60/1f2937/ffffff?text=OXID",
      category: "E-commerce"
    },
    {
      id: "prestashop",
      name: "PrestaShop",
      logo: "https://logos-world.net/wp-content/uploads/2020/11/PrestaShop-Logo.png",
      category: "E-commerce"
    },
    {
      id: "shopify",
      name: "Shopify", 
      logo: "https://logos-world.net/wp-content/uploads/2020/11/Shopify-Logo.png",
      category: "E-commerce"
    },
    {
      id: "shoptrader",
      name: "Shoptrader",
      logo: "https://via.placeholder.com/120x60/3b82f6/ffffff?text=SHOPTRADER",
      category: "E-commerce"
    },
    {
      id: "shopware5",
      name: "Shopware 5",
      logo: "https://via.placeholder.com/120x60/0ea5e9/ffffff?text=shopware",
      category: "E-commerce"
    },
    {
      id: "shopware6",
      name: "Shopware 6", 
      logo: "https://via.placeholder.com/120x60/0ea5e9/ffffff?text=shopware",
      category: "E-commerce"
    },
    {
      id: "squarespace",
      name: "Squarespace",
      logo: "https://logos-world.net/wp-content/uploads/2020/11/Squarespace-Logo.png",
      category: "E-commerce"
    },
    {
      id: "woocommerce",
      name: "WooCommerce",
      logo: "https://logos-world.net/wp-content/uploads/2020/11/WooCommerce-Logo.png",
      category: "E-commerce"
    },
    {
      id: "akeneo",
      name: "Akeneo",
      logo: "https://via.placeholder.com/120x60/8b5cf6/ffffff?text=akeneo",
      category: "PIM"
    }
  ]

  // Fiches techniques
  const technicalFiles = [
    {
      id: "xml",
      name: "XML",
      icon: <Code className="w-8 h-8 text-orange-600" />,
      description: "Configuration XML"
    },
    {
      id: "csv", 
      name: "CSV",
      icon: <Sheet className="w-8 h-8 text-green-600" />,
      description: "Format CSV"
    },
    {
      id: "text",
      name: "Text",
      icon: <FileText className="w-8 h-8 text-red-600" />,
      description: "Fichier texte"
    },
    {
      id: "json",
      name: "JSON", 
      icon: <Database className="w-8 h-8 text-blue-600" />,
      description: "Format JSON"
    },
    {
      id: "google",
      name: "Google Sheets",
      icon: <Sheet className="w-8 h-8 text-green-600" />,
      description: "Google Sheets"
    }
  ]

  const handlePlatformClick = (platform: any) => {
    setSelectedPlatform(platform)
    setConfigDialog(true)
  }

  const handleConnect = () => {
    toast({
      title: "Connexion en cours",
      description: `Configuration de ${selectedPlatform?.name} en cours...`
    })
    setConfigDialog(false)
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="container mx-auto p-6 space-y-8">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold mb-4">Authentification requise</h2>
          <p className="text-muted-foreground">Connectez-vous pour accéder aux intégrations.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xs">i</span>
            </div>
            <p className="text-sm text-blue-800">
              Vous débutez avec Channable ? Commencez par notre démo interactive pour voir comment cela fonctionne: aucun import de données n'est nécessaire !
            </p>
            <Button variant="link" className="text-blue-600 p-0 h-auto">
              Voir la démo de Channable
            </Button>
          </div>
        </div>
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">
          Configurez votre import avec des plugins
        </h1>
      </div>

      {/* Grille des plateformes */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-4 mb-12">
        {platforms.map((platform) => (
          <Card 
            key={platform.id}
            className="cursor-pointer hover:shadow-lg transition-shadow duration-200 border border-gray-200 bg-white"
            onClick={() => handlePlatformClick(platform)}
          >
            <CardContent className="p-4 flex flex-col items-center text-center space-y-3">
              <div className="w-16 h-16 flex items-center justify-center">
                <img 
                  src={platform.logo} 
                  alt={platform.name}
                  className="max-w-full max-h-full object-contain"
                  onError={(e) => {
                    e.currentTarget.src = `https://via.placeholder.com/80x40/6366f1/ffffff?text=${platform.name.charAt(0)}`
                  }}
                />
              </div>
              <h3 className="font-medium text-sm text-gray-900 leading-tight">
                {platform.name}
              </h3>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Section fiches techniques */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-gray-900">
          Ou configuration à l'aide de fiches techniques
        </h2>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {technicalFiles.map((file) => (
            <Card 
              key={file.id}
              className="cursor-pointer hover:shadow-lg transition-shadow duration-200 border border-gray-200 bg-white"
            >
              <CardContent className="p-4 flex flex-col items-center text-center space-y-3">
                <div className="w-16 h-16 flex items-center justify-center">
                  {file.icon}
                </div>
                <h3 className="font-medium text-sm text-gray-900">
                  {file.name}
                </h3>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Dialog de configuration */}
      <Dialog open={configDialog} onOpenChange={setConfigDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-4">
              <ExternalLink className="w-5 h-5 text-blue-600" />
              <DialogTitle>Connecter avec</DialogTitle>
            </div>
            {selectedPlatform && (
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                <img 
                  src={selectedPlatform.logo} 
                  alt={selectedPlatform.name}
                  className="w-12 h-12 object-contain"
                  onError={(e) => {
                    e.currentTarget.src = `https://via.placeholder.com/48x24/6366f1/ffffff?text=${selectedPlatform.name.charAt(0)}`
                  }}
                />
                <span className="font-medium">{selectedPlatform.name}</span>
              </div>
            )}
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nom *</Label>
              <Input 
                id="name" 
                placeholder={selectedPlatform?.name} 
                defaultValue={selectedPlatform?.name}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="url">URL de la plateforme *</Label>
              <Input 
                id="url" 
                placeholder="ex: https://www.exempleboutique.fr"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="credentials">Clé API / Token *</Label>
              <Input 
                id="credentials" 
                placeholder="Votre clé d'API ou token d'accès"
                type="password"
              />
            </div>

            <div className="flex items-center justify-between pt-4">
              <Button variant="ghost" className="text-blue-600">
                Aide
              </Button>
              <div className="space-x-2">
                <Button variant="outline" onClick={() => setConfigDialog(false)}>
                  Fermer
                </Button>
                <Button onClick={handleConnect} className="bg-blue-600 hover:bg-blue-700">
                  Se connecter avec {selectedPlatform?.name}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default Integrations