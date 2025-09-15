import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  ShoppingBag, 
  Smartphone, 
  Home, 
  Heart, 
  Car, 
  Book,
  Gift,
  Sparkles,
  TrendingUp,
  Star
} from 'lucide-react'

interface ImportTemplate {
  id: string
  name: string
  description: string
  category: string
  icon: React.ReactNode
  color: string
  popularity: number
  examples: string[]
  config: Record<string, any>
}

interface ImportTemplatesProps {
  onSelectTemplate: (template: ImportTemplate, exampleUrl: string) => void
}

export const ImportTemplates = ({ onSelectTemplate }: ImportTemplatesProps) => {
  const templates: ImportTemplate[] = [
    {
      id: 'fashion',
      name: 'Mode & Vêtements',
      description: 'Optimisé pour les vêtements, chaussures et accessoires',
      category: 'Popular',
      icon: <ShoppingBag className="w-6 h-6" />,
      color: 'bg-pink-500',
      popularity: 95,
      examples: [
        'https://www.zara.com/fr/fr/robe-midi-structuree-p08574043.html',
        'https://www.hm.com/fr/productpage.0956262005.html',
        'https://www.asos.com/fr/nike/nike-air-force-1-07-baskets-blanches/prd/21873901'
      ],
      config: {
        extractSizes: true,
        extractColors: true,
        generateSizeChart: true,
        extractMaterials: true
      }
    },
    {
      id: 'electronics',
      name: 'Électronique & Tech',
      description: 'Spécialisé pour smartphones, ordinateurs et gadgets',
      category: 'Popular',
      icon: <Smartphone className="w-6 h-6" />,
      color: 'bg-blue-500',
      popularity: 92,
      examples: [
        'https://www.amazon.fr/dp/B08N5WRWNW',
        'https://www.fnac.com/Apple-iPhone-14-128-Go-Minuit/a16832544',
        'https://www.boulanger.com/ref/1151023'
      ],
      config: {
        extractSpecs: true,
        extractCompatibility: true,
        generateComparison: true,
        extractWarranty: true
      }
    },
    {
      id: 'home',
      name: 'Maison & Jardin',
      description: 'Parfait pour meubles, décoration et jardinage',
      category: 'Trending',
      icon: <Home className="w-6 h-6" />,
      color: 'bg-green-500',
      popularity: 88,
      examples: [
        'https://www.ikea.com/fr/fr/p/malm-commode-6-tiroirs-blanc-00360455/',
        'https://www.leroymerlin.fr/produits/jardin/mobilier-de-jardin/',
        'https://www.maisonsdumonde.com/FR/fr/p/canape-3-places-en-tissu-gris-anthracite-chicago-166951.htm'
      ],
      config: {
        extractDimensions: true,
        extractMaterials: true,
        extractAssembly: true,
        generateRoomVisualization: true
      }
    },
    {
      id: 'beauty',
      name: 'Beauté & Cosmétiques',
      description: 'Optimisé pour produits de beauté et soins',
      category: 'Trending',
      icon: <Heart className="w-6 h-6" />,
      color: 'bg-rose-500',
      popularity: 85,
      examples: [
        'https://www.sephora.fr/p/fond-de-teint-longue-tenue-P3525017.html',
        'https://www.nocibe.fr/estee-lauder-double-wear-stay-in-place-makeup/',
        'https://www.marionnaud.fr/dior-rouge-dior-ultra-care-999.html'
      ],
      config: {
        extractIngredients: true,
        extractSkinType: true,
        generateBeautyTips: true,
        extractShades: true
      }
    },
    {
      id: 'automotive',
      name: 'Auto & Moto',
      description: 'Spécialisé pour pièces automobiles et accessoires',
      category: 'Niche',
      icon: <Car className="w-6 h-6" />,
      color: 'bg-gray-700',
      popularity: 75,
      examples: [
        'https://www.norauto.fr/p/filtre-a-huile-mann-filter-w712-93-1549734.html',
        'https://www.feu-vert.fr/pneu-michelin-energy-saver-195-65-r15-91h.html',
        'https://www.midas.fr/pieces-detachees/plaquettes-de-frein/'
      ],
      config: {
        extractCompatibility: true,
        extractPartNumber: true,
        generateFitmentGuide: true,
        extractBrand: true
      }
    },
    {
      id: 'books',
      name: 'Livres & Médias',
      description: 'Adapté pour livres, ebooks et contenus éducatifs',
      category: 'Niche',
      icon: <Book className="w-6 h-6" />,
      color: 'bg-amber-600',
      popularity: 70,
      examples: [
        'https://www.amazon.fr/Atomic-Habits-Proven-Build-Break/dp/0735211299',
        'https://www.fnac.com/livre-numerique/a15149280/Tony-Robbins-MONEY-Master-the-Game',
        'https://www.cultura.com/p-sapiens-une-breve-histoire-de-l-humanite-9782226257017.html'
      ],
      config: {
        extractAuthor: true,
        extractISBN: true,
        extractPages: true,
        generateSummary: true
      }
    },
    {
      id: 'gifts',
      name: 'Cadeaux & Occasions',
      description: 'Optimisé pour cadeaux personnalisés et événements',
      category: 'Seasonal',
      icon: <Gift className="w-6 h-6" />,
      color: 'bg-purple-500',
      popularity: 82,
      examples: [
        'https://www.etsy.com/fr/listing/personalized-gift-custom-photo/',
        'https://www.amazon.fr/cadeau-personnalise-anniversaire/',
        'https://www.fnac.com/idees-cadeaux/'
      ],
      config: {
        extractPersonalization: true,
        extractOccasion: true,
        generateGiftGuide: true,
        extractAgeGroup: true
      }
    }
  ]

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Popular': return <TrendingUp className="w-4 h-4" />
      case 'Trending': return <Sparkles className="w-4 h-4" />
      case 'Seasonal': return <Star className="w-4 h-4" />
      default: return <Star className="w-4 h-4" />
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Popular': return 'bg-red-100 text-red-700 border-red-200'
      case 'Trending': return 'bg-blue-100 text-blue-700 border-blue-200'
      case 'Seasonal': return 'bg-purple-100 text-purple-700 border-purple-200'
      case 'Niche': return 'bg-gray-100 text-gray-700 border-gray-200'
      default: return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  const sortedTemplates = templates.sort((a, b) => b.popularity - a.popularity)

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Templates d'Import Intelligent</h2>
        <p className="text-muted-foreground">
          Utilisez nos templates pré-configurés pour des imports optimisés par catégorie de produits
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sortedTemplates.map((template) => (
          <Card 
            key={template.id}
            className="group hover:shadow-xl transition-all duration-300 cursor-pointer border-2 hover:border-primary/20"
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className={`p-3 ${template.color} rounded-xl text-white group-hover:scale-110 transition-transform`}>
                  {template.icon}
                </div>
                <div className="text-right">
                  <Badge className={getCategoryColor(template.category)}>
                    {getCategoryIcon(template.category)}
                    {template.category}
                  </Badge>
                  <div className="flex items-center gap-1 mt-1">
                    <div className="text-xs text-muted-foreground">
                      {template.popularity}% popularité
                    </div>
                    <div className="w-12 bg-gray-200 rounded-full h-1.5">
                      <div 
                        className={`${template.color} h-1.5 rounded-full`}
                        style={{ width: `${template.popularity}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
              <CardTitle className="text-lg group-hover:text-primary transition-colors">
                {template.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {template.description}
              </p>
              
              <div className="space-y-2">
                <div className="text-xs font-medium text-muted-foreground">
                  Exemples d'URLs compatibles :
                </div>
                <div className="space-y-1">
                  {template.examples.slice(0, 2).map((example, index) => (
                    <Button
                      key={index}
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start text-xs h-auto p-2 hover:bg-primary/5"
                      onClick={() => onSelectTemplate(template, example)}
                    >
                      <div className="truncate text-left">
                        {new URL(example).hostname}
                      </div>
                    </Button>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t">
                <Button 
                  className="w-full group-hover:bg-primary group-hover:text-white transition-colors"
                  variant="outline"
                  onClick={() => onSelectTemplate(template, template.examples[0])}
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Utiliser ce Template
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="text-center text-sm text-muted-foreground">
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded"></div>
            <span>Popular (90%+ utilisé)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded"></div>
            <span>Trending (80%+ utilisé)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-gray-500 rounded"></div>
            <span>Spécialisé</span>
          </div>
        </div>
      </div>
    </div>
  )
}