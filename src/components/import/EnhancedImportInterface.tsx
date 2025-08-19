import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Upload, 
  Link, 
  Image, 
  Zap, 
  Globe, 
  FileText,
  Bot,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Package,
  ArrowRight,
  Sparkles
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { usePlan } from '@/hooks/usePlan'

interface ImportMethodProps {
  icon: any
  title: string
  description: string
  features: string[]
  isActive: boolean
  isPremium?: boolean
  onClick: () => void
}

const ImportMethodCard = ({ icon: Icon, title, description, features, isActive, isPremium, onClick }: ImportMethodProps) => (
  <Card 
    className={`cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${
      isActive ? 'ring-2 ring-primary bg-primary/5' : 'hover:bg-muted/30'
    } ${isPremium ? 'border-gradient-to-r from-yellow-500 to-orange-500' : ''}`}
    onClick={onClick}
  >
    <CardHeader className="pb-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${isActive ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
            <Icon className="h-5 w-5" />
          </div>
          <CardTitle className="text-base">{title}</CardTitle>
        </div>
        {isPremium && (
          <Badge variant="secondary" className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white">
            Premium
          </Badge>
        )}
      </div>
    </CardHeader>
    <CardContent>
      <p className="text-sm text-muted-foreground mb-3">{description}</p>
      <div className="flex flex-wrap gap-1">
        {features.map((feature, index) => (
          <Badge key={index} variant="outline" className="text-xs">
            {feature}
          </Badge>
        ))}
      </div>
    </CardContent>
  </Card>
)

interface EnhancedImportInterfaceProps {
  selectedMethod: string
  isImporting: boolean
  importProgress: number
  onImport: (data: any) => void
}

export const EnhancedImportInterface = ({ selectedMethod, isImporting, importProgress, onImport }: EnhancedImportInterfaceProps) => {
  const [url, setUrl] = useState("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [activeMethod, setActiveMethod] = useState("")
  const { toast } = useToast()
  const { isPro, isUltraPro } = usePlan()

  const importMethods = [
    {
      id: "url",
      icon: Link,
      title: "Import URL",
      description: "Extrayez automatiquement les données depuis n'importe quelle URL de produit",
      features: ["IA Extraction", "Images HD", "SEO Auto", "Multi-plateformes"]
    },
    {
      id: "csv",
      icon: Upload,
      title: "Import CSV/Excel",
      description: "Importez en masse depuis vos fichiers CSV ou Excel existants",
      features: ["Mapping Auto", "Validation IA", "Doublons", "1000+ produits"]
    },
    {
      id: "image",
      icon: Image,
      title: "Import Image",
      description: "Trouvez des produits similaires à partir d'une simple photo",
      features: ["Reverse Search", "OCR Text", "Prix Détecté", "Sources Multi"]
    },
    {
      id: "ai-winners",
      icon: Bot,
      title: "Winners IA",
      description: "Découvrez automatiquement les produits gagnants du moment",
      features: ["Trends IA", "Profit Auto", "Niches Hot", "Score 90+"],
      isPremium: true
    },
    {
      id: "competitors",
      icon: TrendingUp,
      title: "Concurrents",
      description: "Analysez et importez les meilleures ventes de vos concurrents",
      features: ["Spy Mode", "Prix Optimaux", "Stock Live", "Notifications"],
      isPremium: true
    },
    {
      id: "bulk-api",
      icon: Globe,
      title: "API Bulk",
      description: "Synchronisez directement avec vos fournisseurs via API",
      features: ["Sync Auto", "Stock Live", "Prix Temps Réel", "Automatisation"],
      isPremium: true
    }
  ]

  // Animations d'étapes d'import
  const importSteps = [
    { step: 1, label: "Analyse des données", progress: 0-30 },
    { step: 2, label: "Traitement IA", progress: 30-60 },
    { step: 3, label: "Optimisation SEO", progress: 60-80 },
    { step: 4, label: "Validation finale", progress: 80-100 }
  ]

  const getCurrentStep = () => {
    if (importProgress < 30) return 0
    if (importProgress < 60) return 1
    if (importProgress < 80) return 2
    return 3
  }

  if (isImporting) {
    return (
      <div className="space-y-6 animate-fade-in">
        <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="relative">
                <Zap className="w-6 h-6 text-primary animate-pulse" />
                <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping"></div>
              </div>
              Import en cours...
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>Progression globale</span>
                <span className="font-medium">{importProgress}%</span>
              </div>
              <Progress value={importProgress} className="h-3 animate-pulse" />
            </div>

            {/* Étapes détaillées */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {importSteps.map((step, index) => (
                <div 
                  key={step.step}
                  className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-500 ${
                    getCurrentStep() === index 
                      ? 'bg-primary/10 border border-primary/20 animate-scale-in' 
                      : getCurrentStep() > index
                      ? 'bg-green-50 border border-green-200'
                      : 'bg-muted/30'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                    getCurrentStep() === index 
                      ? 'bg-primary text-primary-foreground animate-pulse' 
                      : getCurrentStep() > index
                      ? 'bg-green-500 text-white'
                      : 'bg-muted text-muted-foreground'
                  }`}>
                    {getCurrentStep() > index ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      <span className="text-sm font-medium">{step.step}</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{step.label}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Messages dynamiques */}
            <div className="bg-muted/50 p-4 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Sparkles className="w-4 h-4" />
                {importProgress < 30 && "Analyse intelligente des données en cours..."}
                {importProgress >= 30 && importProgress < 60 && "IA en action - Optimisation du contenu..."}
                {importProgress >= 60 && importProgress < 80 && "Génération automatique du SEO..."}
                {importProgress >= 80 && "Finalisation et validation qualité..."}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Sélection de méthode d'import */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Choisissez votre méthode d'import</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {importMethods.map((method) => (
            <ImportMethodCard
              key={method.id}
              icon={method.icon}
              title={method.title}
              description={method.description}
              features={method.features}
              isActive={activeMethod === method.id}
              isPremium={method.isPremium && !isPro()}
              onClick={() => {
                if (method.isPremium && !isPro()) {
                  toast({
                    title: "Fonctionnalité Premium",
                    description: "Cette fonctionnalité nécessite un plan Pro ou Ultra Pro",
                    variant: "default"
                  })
                  return
                }
                setActiveMethod(method.id)
              }}
            />
          ))}
        </div>
      </div>

      {/* Interface d'import selon la méthode */}
      {activeMethod && (
        <div className="animate-scale-in">
          {activeMethod === "url" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Link className="w-5 h-5" />
                  Import via URL
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="product-url">URL du produit</Label>
                  <Input
                    id="product-url"
                    placeholder="https://example.com/product-page"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="mt-1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Supports: Amazon, AliExpress, Shopify, WooCommerce, et plus
                  </p>
                </div>
                <Button 
                  onClick={() => onImport({ type: "url", data: url })} 
                  disabled={!url} 
                  className="w-full animate-fade-in"
                >
                  <Zap className="w-4 h-4 mr-2" />
                  Extraire les données
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          )}

          {activeMethod === "csv" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="w-5 h-5" />
                  Import CSV/Excel
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="csv-file">Fichier CSV/Excel</Label>
                  <Input
                    id="csv-file"
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                    className="mt-1"
                  />
                  {selectedFile && (
                    <p className="text-sm text-green-600 mt-1 animate-fade-in">
                      ✓ {selectedFile.name} sélectionné
                    </p>
                  )}
                </div>
                <Button 
                  onClick={() => onImport({ type: "csv", data: selectedFile })} 
                  disabled={!selectedFile} 
                  className="w-full"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Analyser et importer
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          )}

          {activeMethod === "image" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Image className="w-5 h-5" />
                  Import via Image
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="image-file">Image du produit</Label>
                  <Input
                    id="image-file"
                    type="file"
                    accept="image/*"
                    onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                    className="mt-1"
                  />
                  {imageFile && (
                    <p className="text-sm text-green-600 mt-1 animate-fade-in">
                      ✓ {imageFile.name} sélectionné
                    </p>
                  )}
                </div>
                <Button 
                  onClick={() => onImport({ type: "image", data: imageFile })} 
                  disabled={!imageFile} 
                  className="w-full"
                >
                  <Image className="w-4 h-4 mr-2" />
                  Analyser l'image
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          )}

          {activeMethod === "ai-winners" && (
            <Card className="border-gradient-to-r from-yellow-500 to-orange-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bot className="w-5 h-5 text-yellow-600" />
                  Import Winners IA
                  <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white">
                    Ultra Pro
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Laissez notre IA découvrir automatiquement les produits gagnants du moment
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-yellow-50 rounded-lg">
                    <p className="text-sm font-medium">🔥 Tendances</p>
                    <p className="text-xs text-muted-foreground">Produits viraux détectés</p>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg">
                    <p className="text-sm font-medium">💰 Profit</p>
                    <p className="text-xs text-muted-foreground">Marges optimisées</p>
                  </div>
                </div>
                <Button className="w-full bg-gradient-to-r from-yellow-500 to-orange-500">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Découvrir les Winners
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}