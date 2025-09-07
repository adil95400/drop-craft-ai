import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Upload, 
  Link, 
  FileText, 
  Server, 
  Calendar, 
  Zap, 
  Camera, 
  Database, 
  Globe, 
  Bot,
  Smartphone,
  Mail,
  FileImage,
  QrCode,
  Webhook,
  Cloud,
  Rss,
  ShoppingCart,
  FileSpreadsheet
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface ImportMethod {
  id: string
  title: string
  description: string
  category: 'Basic' | 'Advanced' | 'AI' | 'Enterprise'
  icon: any
  features: string[]
  complexity: 'easy' | 'medium' | 'advanced'
  premium: boolean
}

const importMethods: ImportMethod[] = [
  {
    id: 'url',
    title: 'Import par URL',
    description: 'Importez directement depuis une URL de produit avec détection automatique',
    category: 'Basic',
    icon: Link,
    features: ['Auto-détection', 'Multi-sites', 'Métadonnées'],
    complexity: 'easy',
    premium: false
  },
  {
    id: 'xml',
    title: 'Import XML/RSS',
    description: 'Flux XML/RSS compatibles Google Shopping et autres standards',
    category: 'Basic',
    icon: FileText,
    features: ['Google Shopping', 'Mapping avancé', 'Validation schema'],
    complexity: 'medium',
    premium: false
  },
  {
    id: 'csv-excel',
    title: 'CSV/Excel Avancé',
    description: 'Import de fichiers CSV/Excel avec mapping intelligent des colonnes',
    category: 'Basic',
    icon: FileSpreadsheet,
    features: ['Auto-mapping', 'Validation', 'Aperçu'],
    complexity: 'easy',
    premium: false
  },
  {
    id: 'ftp',
    title: 'FTP/SFTP',
    description: 'Connexion automatique aux serveurs FTP avec synchronisation',
    category: 'Advanced',
    icon: Server,
    features: ['Auto-sync', 'Chiffrement', 'Monitoring'],
    complexity: 'advanced',
    premium: true
  },
  {
    id: 'api-rest',
    title: 'API REST',
    description: 'Intégration avec APIs REST personnalisées et webhooks',
    category: 'Advanced',
    icon: Database,
    features: ['Auth flexible', 'Rate limiting', 'Error handling'],
    complexity: 'advanced',
    premium: true
  },
  {
    id: 'image-ai',
    title: 'Import par Image IA',
    description: 'Analysez des images pour extraire informations produits automatiquement',
    category: 'AI',
    icon: Camera,
    features: ['OCR avancé', 'Reconnaissance produit', 'Extraction métadonnées'],
    complexity: 'easy',
    premium: true
  },
  {
    id: 'qr-barcode',
    title: 'QR Code/Code Barres',
    description: 'Scan de QR codes et codes barres pour import rapide',
    category: 'Basic',
    icon: QrCode,
    features: ['Scan multiple', 'API base de données', 'Validation EAN'],
    complexity: 'easy',
    premium: false
  },
  {
    id: 'ai-scraper',
    title: 'Scraper IA Intelligent',
    description: 'IA pour scraper automatiquement n\'importe quel site e-commerce',
    category: 'AI',
    icon: Bot,
    features: ['Anti-détection', 'Adaptation automatique', 'JS rendering'],
    complexity: 'medium',
    premium: true
  },
  {
    id: 'marketplace-bulk',
    title: 'Import Marketplace',
    description: 'Import en masse depuis Amazon, eBay, AliExpress et autres',
    category: 'Advanced',
    icon: ShoppingCart,
    features: ['Multi-marketplace', 'Gestion quota', 'Déduplication'],
    complexity: 'advanced',
    premium: true
  },
  {
    id: 'mobile-app',
    title: 'Application Mobile',
    description: 'Scannez et importez depuis votre smartphone',
    category: 'Basic',
    icon: Smartphone,
    features: ['Scan camera', 'Mode hors-ligne', 'Géolocalisation'],
    complexity: 'easy',
    premium: false
  },
  {
    id: 'email-import',
    title: 'Import par Email',
    description: 'Recevez des catalogues par email et importez automatiquement',
    category: 'Advanced',
    icon: Mail,
    features: ['Parsing intelligent', 'Pièces jointes', 'Règles auto'],
    complexity: 'medium',
    premium: true
  },
  {
    id: 'cloud-drive',
    title: 'Cloud Drive Sync',
    description: 'Synchronisation avec Google Drive, Dropbox, OneDrive',
    category: 'Advanced',
    icon: Cloud,
    features: ['Auto-sync', 'Versioning', 'Collaboration'],
    complexity: 'medium',
    premium: true
  },
  {
    id: 'ai-generator',
    title: 'Générateur IA',
    description: 'Créez des produits automatiquement basés sur des tendances IA',
    category: 'AI',
    icon: Zap,
    features: ['Génération auto', 'Analyse tendances', 'SEO optimisé'],
    complexity: 'easy',
    premium: true
  },
  {
    id: 'webhook-listener',
    title: 'Webhook Listener',
    description: 'Écoutez des webhooks pour imports en temps réel',
    category: 'Enterprise',
    icon: Webhook,
    features: ['Temps réel', 'Authentification', 'Rate limiting'],
    complexity: 'advanced',
    premium: true
  },
  {
    id: 'scheduled-bulk',
    title: 'Import Programmé',
    description: 'Planifiez vos imports avec des règles avancées',
    category: 'Advanced',
    icon: Calendar,
    features: ['Cron avancé', 'Conditions', 'Notifications'],
    complexity: 'medium',
    premium: true
  }
]

export const AdvancedImportMethods: React.FC = () => {
  const { importMethods, loading, executeImport } = useImportMethods()
  
  if (loading) {
    return <div className="flex justify-center p-8"><div className="animate-spin h-6 w-6 border-2 border-primary rounded-full border-t-transparent"></div></div>
  }

  const categories = ['all', 'Basic', 'Advanced', 'AI', 'Enterprise']

  const filteredMethods = importMethods.filter(method => 
    selectedCategory === 'all' || method.category === selectedCategory
  )

  const handleConfigure = (method: ImportMethod) => {
    if (method.premium) {
      toast({
        title: "Fonctionnalité Premium",
        description: `${method.title} nécessite un abonnement Pro ou Ultra`,
        variant: "destructive"
      })
    } else {
      toast({
        title: "Configuration",
        description: `Configuration de ${method.title} en cours...`
      })
    }
  }

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'easy': return 'bg-green-100 text-green-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'advanced': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Méthodes d'Import Avancées</h2>
        <p className="text-muted-foreground">
          Choisissez la méthode d'import qui convient le mieux à vos besoins
        </p>
      </div>

      {/* Category Filters */}
      <div className="flex gap-2 flex-wrap justify-center">
        {categories.map(category => (
          <Button
            key={category}
            variant={selectedCategory === category ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory(category)}
          >
            {category === 'all' ? 'Toutes' : category}
          </Button>
        ))}
      </div>

      {/* Import Methods Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredMethods.map((method) => {
          const Icon = method.icon
          return (
            <Card key={method.id} className="relative h-full hover:shadow-lg transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{method.title}</CardTitle>
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${getComplexityColor(method.complexity)}`}
                      >
                        {method.complexity}
                      </Badge>
                    </div>
                  </div>
                  {method.premium && (
                    <Badge variant="default" className="bg-gradient-to-r from-yellow-400 to-yellow-600">
                      Premium
                    </Badge>
                  )}
                </div>
                <CardDescription className="mt-2">
                  {method.description}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Fonctionnalités :</h4>
                  <div className="flex flex-wrap gap-1">
                    {method.features.map((feature, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {feature}
                      </Badge>
                    ))}
                  </div>
                </div>

                <Button 
                  onClick={() => handleConfigure(method)}
                  className="w-full"
                  variant={method.premium ? "outline" : "default"}
                >
                  {method.premium ? 'Upgrade Required' : 'Configurer'}
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}