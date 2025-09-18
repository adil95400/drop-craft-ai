import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { 
  Code2, Download, Star, Eye, GitBranch, Zap, Layers, Box,
  Smartphone, ShoppingCart, BarChart3, Search, Filter, Copy,
  FileCode, Palette, Shield, Globe, Cpu, Database, Cloud, Clock
} from 'lucide-react'
import { toast } from 'sonner'

interface ExtensionTemplate {
  id: string
  name: string
  description: string
  category: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  rating: number
  downloads: number
  tags: string[]
  features: string[]
  technologies: string[]
  estimated_time: string
  preview_code: string
  full_template: boolean
  icon: React.ReactNode
  author: string
  last_updated: string
}

const TEMPLATES: ExtensionTemplate[] = [
  {
    id: 'product-importer',
    name: 'Importateur de Produits',
    description: 'Template complet pour créer un importateur de produits depuis des APIs externes avec validation automatique.',
    category: 'Import/Export',
    difficulty: 'intermediate',
    rating: 4.8,
    downloads: 2340,
    tags: ['api', 'import', 'validation', 'csv'],
    features: [
      'Import depuis CSV/JSON',
      'Validation des données',
      'Gestion des erreurs',
      'Interface de mapping',
      'Historique des imports'
    ],
    technologies: ['JavaScript', 'Node.js', 'CSV Parser', 'Joi Validation'],
    estimated_time: '4-6 heures',
    preview_code: `class ProductImporter {
  async importFromCSV(file) {
    const products = await this.parseCSV(file);
    return this.validateAndImport(products);
  }
}`,
    full_template: true,
    icon: <Download className="w-6 h-6" />,
    author: 'DevCorp',
    last_updated: '2024-01-15'
  },
  {
    id: 'ai-description-generator',
    name: 'Générateur de Descriptions IA',
    description: 'Générez automatiquement des descriptions de produits optimisées SEO avec GPT-4.',
    category: 'AI & Machine Learning',
    difficulty: 'advanced',
    rating: 4.9,
    downloads: 1890,
    tags: ['ai', 'gpt', 'seo', 'content'],
    features: [
      'Intégration OpenAI GPT-4',
      'Optimisation SEO',
      'Templates personnalisables',
      'Génération en lot',
      'Révision manuelle'
    ],
    technologies: ['OpenAI API', 'JavaScript', 'SEO Tools', 'NLP'],
    estimated_time: '6-8 heures',
    preview_code: `const aiGenerator = new AIDescriptionGenerator({
  apiKey: process.env.OPENAI_API_KEY,
  model: 'gpt-4'
});`,
    full_template: true,
    icon: <Zap className="w-6 h-6" />,
    author: 'AI Solutions',
    last_updated: '2024-01-18'
  },
  {
    id: 'inventory-tracker',
    name: 'Tracker d\'Inventaire',
    description: 'Système de suivi d\'inventaire en temps réel avec alertes de stock faible.',
    category: 'Inventory Management',
    difficulty: 'intermediate',
    rating: 4.6,
    downloads: 3420,
    tags: ['inventory', 'stock', 'alerts', 'tracking'],
    features: [
      'Suivi en temps réel',
      'Alertes automatiques',
      'Prédictions de stock',
      'Rapports détaillés',
      'Multi-entrepôts'
    ],
    technologies: ['React', 'WebSocket', 'Chart.js', 'Node.js'],
    estimated_time: '5-7 heures',
    preview_code: `class InventoryTracker {
  trackProduct(productId) {
    return this.realTimeUpdate(productId);
  }
}`,
    full_template: true,
    icon: <Box className="w-6 h-6" />,
    author: 'LogiCorp',
    last_updated: '2024-01-12'
  },
  {
    id: 'analytics-dashboard',
    name: 'Dashboard Analytics',
    description: 'Dashboard complet avec métriques de performance et visualisations interactives.',
    category: 'Analytics & Reporting',
    difficulty: 'advanced',
    rating: 4.7,
    downloads: 1560,
    tags: ['analytics', 'dashboard', 'charts', 'kpi'],
    features: [
      'Métriques en temps réel',
      'Graphiques interactifs',
      'Export de rapports',
      'Filtres avancés',
      'Tableaux de bord personnalisables'
    ],
    technologies: ['React', 'D3.js', 'Chart.js', 'API REST'],
    estimated_time: '8-10 heures',
    preview_code: `const dashboard = new AnalyticsDashboard({
  metrics: ['sales', 'traffic', 'conversion'],
  realTime: true
});`,
    full_template: true,
    icon: <BarChart3 className="w-6 h-6" />,
    author: 'DataViz Pro',
    last_updated: '2024-01-14'
  },
  {
    id: 'seo-optimizer',
    name: 'Optimiseur SEO',
    description: 'Analysez et optimisez automatiquement le référencement de vos pages produits.',
    category: 'Marketing & SEO',
    difficulty: 'intermediate',
    rating: 4.5,
    downloads: 2780,
    tags: ['seo', 'optimization', 'meta', 'keywords'],
    features: [
      'Analyse SEO automatique',
      'Suggestions d\'amélioration',
      'Optimisation des meta tags',
      'Analyse de mots-clés',
      'Score SEO en temps réel'
    ],
    technologies: ['JavaScript', 'SEO APIs', 'Cheerio', 'Keywords Analysis'],
    estimated_time: '4-6 heures',
    preview_code: `class SEOOptimizer {
  analyzePage(url) {
    return this.performSEOAudit(url);
  }
}`,
    full_template: true,
    icon: <Search className="w-6 h-6" />,
    author: 'SEO Masters',
    last_updated: '2024-01-16'
  },
  {
    id: 'payment-gateway',
    name: 'Gateway de Paiement',
    description: 'Intégration complète avec les principaux processeurs de paiement.',
    category: 'Payment & Billing',
    difficulty: 'advanced',
    rating: 4.8,
    downloads: 1240,
    tags: ['payment', 'stripe', 'paypal', 'gateway'],
    features: [
      'Multi-processeurs',
      'Gestion des remboursements',
      'Webhooks sécurisés',
      'Réconciliation automatique',
      'Reporting financier'
    ],
    technologies: ['Stripe API', 'PayPal SDK', 'Webhook Security', 'Node.js'],
    estimated_time: '6-8 heures',
    preview_code: `const gateway = new PaymentGateway({
  providers: ['stripe', 'paypal'],
  webhookSecret: process.env.WEBHOOK_SECRET
});`,
    full_template: true,
    icon: <Shield className="w-6 h-6" />,
    author: 'PayTech',
    last_updated: '2024-01-13'
  }
]

export const ExtensionTemplates = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedDifficulty, setSelectedDifficulty] = useState('')
  const [sortBy, setSortBy] = useState('popular')

  const categories = [
    'Toutes les catégories',
    'AI & Machine Learning',
    'Analytics & Reporting',
    'Import/Export',
    'Inventory Management',
    'Marketing & SEO',
    'Payment & Billing',
    'Design & UX',
    'Development Tools'
  ]

  const difficulties = [
    { value: '', label: 'Tous les niveaux' },
    { value: 'beginner', label: 'Débutant' },
    { value: 'intermediate', label: 'Intermédiaire' },
    { value: 'advanced', label: 'Avancé' }
  ]

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800'
      case 'intermediate': return 'bg-yellow-100 text-yellow-800'
      case 'advanced': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getDifficultyLabel = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'Débutant'
      case 'intermediate': return 'Intermédiaire'
      case 'advanced': return 'Avancé'
      default: return difficulty
    }
  }

  const filteredTemplates = TEMPLATES.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    
    const matchesCategory = !selectedCategory || selectedCategory === 'Toutes les catégories' || 
                           template.category === selectedCategory
    
    const matchesDifficulty = !selectedDifficulty || template.difficulty === selectedDifficulty
    
    return matchesSearch && matchesCategory && matchesDifficulty
  })

  const sortedTemplates = [...filteredTemplates].sort((a, b) => {
    switch (sortBy) {
      case 'popular':
        return b.downloads - a.downloads
      case 'rating':
        return b.rating - a.rating
      case 'newest':
        return new Date(b.last_updated).getTime() - new Date(a.last_updated).getTime()
      case 'name':
        return a.name.localeCompare(b.name)
      default:
        return 0
    }
  })

  const handleUseTemplate = (template: ExtensionTemplate) => {
    toast.success(`Template "${template.name}" copié dans votre éditeur!`)
  }

  const handlePreviewCode = (template: ExtensionTemplate) => {
    // Ouvrir une modal avec le code complet
    toast.info('Aperçu du code disponible')
  }

  const handleDownloadTemplate = (template: ExtensionTemplate) => {
    // Simuler le téléchargement d'un template
    toast.success(`Template "${template.name}" téléchargé!`)
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600">
              <Code2 className="w-8 h-8 text-white" />
            </div>
            Templates d'Extensions
          </h1>
          <p className="text-muted-foreground mt-1">
            Démarrez rapidement avec nos templates pré-construits
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <GitBranch className="w-4 h-4 mr-2" />
            Mes Templates
          </Button>
          <Button>
            <Code2 className="w-4 h-4 mr-2" />
            Créer un Template
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher des templates..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-[200px]">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Catégorie" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
                <SelectTrigger className="w-[160px]">
                  <Layers className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Niveau" />
                </SelectTrigger>
                <SelectContent>
                  {difficulties.map(diff => (
                    <SelectItem key={diff.value} value={diff.value}>
                      {diff.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="popular">Plus populaires</SelectItem>
                  <SelectItem value="rating">Mieux notés</SelectItem>
                  <SelectItem value="newest">Plus récents</SelectItem>
                  <SelectItem value="name">Par nom</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{filteredTemplates.length} template{filteredTemplates.length > 1 ? 's' : ''} trouvé{filteredTemplates.length > 1 ? 's' : ''}</span>
            <span>Temps d'intégration estimé: 4-8 heures</span>
          </div>
        </CardContent>
      </Card>

      {/* Templates Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sortedTemplates.map(template => (
          <Card key={template.id} className="group hover:shadow-lg transition-all duration-300 relative overflow-hidden">
            <div className="absolute top-4 right-4 z-10">
              <Badge className={getDifficultyColor(template.difficulty)}>
                {getDifficultyLabel(template.difficulty)}
              </Badge>
            </div>

            <CardHeader className="pb-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  {template.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-lg line-clamp-1">{template.name}</CardTitle>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm text-muted-foreground">{template.author}</span>
                    <span className="text-xs text-muted-foreground">•</span>
                    <span className="text-xs text-muted-foreground">{template.category}</span>
                  </div>
                </div>
              </div>
              
              <CardDescription className="line-clamp-2 mt-2">
                {template.description}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Rating and Downloads */}
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-medium">{template.rating}</span>
                </div>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Download className="w-4 h-4" />
                  <span>{template.downloads.toLocaleString()}</span>
                </div>
              </div>

              {/* Technologies */}
              <div className="space-y-2">
                <div className="text-sm font-medium">Technologies:</div>
                <div className="flex flex-wrap gap-1">
                  {template.technologies.slice(0, 3).map(tech => (
                    <Badge key={tech} variant="outline" className="text-xs">
                      {tech}
                    </Badge>
                  ))}
                  {template.technologies.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{template.technologies.length - 3}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Features Preview */}
              <div className="space-y-2">
                <div className="text-sm font-medium">Fonctionnalités clés:</div>
                <div className="text-xs text-muted-foreground space-y-1">
                  {template.features.slice(0, 3).map(feature => (
                    <div key={feature} className="flex items-center gap-1">
                      <div className="w-1 h-1 bg-primary rounded-full"></div>
                      {feature}
                    </div>
                  ))}
                </div>
              </div>

              {/* Estimated Time */}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span>Temps estimé: {template.estimated_time}</span>
              </div>

              {/* Code Preview */}
              <div className="bg-muted/50 rounded-lg p-3">
                <div className="text-xs font-mono text-muted-foreground">
                  {template.preview_code}
                </div>
              </div>

              <Separator />

              {/* Actions */}
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  className="flex-1"
                  onClick={() => handleUseTemplate(template)}
                >
                  <Copy className="w-4 h-4 mr-1" />
                  Utiliser
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handlePreviewCode(template)}
                >
                  <Eye className="w-4 h-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleDownloadTemplate(template)}
                >
                  <Download className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {sortedTemplates.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
              <Code2 className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Aucun template trouvé</h3>
            <p className="text-muted-foreground mb-4">
              Essayez de modifier vos critères de recherche ou créez votre propre template
            </p>
            <div className="flex gap-2 justify-center">
              <Button onClick={() => {
                setSearchQuery('')
                setSelectedCategory('')
                setSelectedDifficulty('')
              }}>
                Réinitialiser les filtres
              </Button>
              <Button variant="outline">
                <Code2 className="w-4 h-4 mr-2" />
                Créer un Template
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-primary">{TEMPLATES.length}</div>
            <div className="text-sm text-muted-foreground">Templates disponibles</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {TEMPLATES.reduce((sum, t) => sum + t.downloads, 0).toLocaleString()}
            </div>
            <div className="text-sm text-muted-foreground">Téléchargements totaux</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {(TEMPLATES.reduce((sum, t) => sum + t.rating, 0) / TEMPLATES.length).toFixed(1)}
            </div>
            <div className="text-sm text-muted-foreground">Note moyenne</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">4-8h</div>
            <div className="text-sm text-muted-foreground">Temps moyen d'intégration</div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default ExtensionTemplates