import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/integrations/supabase/client"
import { 
  Search,
  Star,
  Download,
  Eye,
  Play,
  Clock,
  Users,
  Zap,
  ShoppingCart,
  Mail,
  Database,
  BarChart3,
  Globe,
  Filter,
  Heart,
  TrendingUp,
  Award,
  CheckCircle,
  Plus
} from "lucide-react"

const TEMPLATE_CATEGORIES = [
  { id: 'all', name: 'Tous', icon: Globe },
  { id: 'ecommerce', name: 'E-commerce', icon: ShoppingCart },
  { id: 'marketing', name: 'Marketing', icon: BarChart3 },
  { id: 'crm', name: 'CRM', icon: Users },
  { id: 'productivity', name: 'Productivité', icon: Zap },
  { id: 'communication', name: 'Communication', icon: Mail },
  { id: 'analytics', name: 'Analytics', icon: TrendingUp }
]

const FEATURED_TEMPLATES = [
  {
    id: 'shopify-email-abandoned',
    name: 'Panier Abandonné → Email',
    description: 'Envoie automatiquement un email de relance pour les paniers abandonnés sur Shopify',
    category: 'ecommerce',
    integrations: ['Shopify', 'Mailchimp'],
    rating: 4.8,
    downloads: 12500,
    featured: true,
    complexity: 'Facile',
    estimatedTime: '5 min',
    steps: 3,
    tags: ['Email Marketing', 'Recovery', 'Automation'],
    author: {
      name: 'Lovable Team',
      verified: true
    },
    preview: {
      trigger: 'Shopify - Panier abandonné',
      actions: ['Délai 1h', 'Mailchimp - Envoyer email', 'Shopify - Marquer traité']
    }
  },
  {
    id: 'lead-crm-sync',
    name: 'Nouveau Lead → CRM',
    description: 'Synchronise automatiquement les nouveaux leads du site vers votre CRM',
    category: 'crm',
    integrations: ['Formulaire Web', 'HubSpot', 'Slack'],
    rating: 4.9,
    downloads: 8900,
    featured: true,
    complexity: 'Moyen',
    estimatedTime: '10 min',
    steps: 4,
    tags: ['Lead Generation', 'CRM', 'Notifications'],
    author: {
      name: 'CRM Expert',
      verified: true
    },
    preview: {
      trigger: 'Formulaire soumis',
      actions: ['Valider données', 'HubSpot - Créer contact', 'Slack - Notification équipe']
    }
  },
  {
    id: 'inventory-restock',
    name: 'Stock Bas → Commande Auto',
    description: 'Commande automatiquement auprès des fournisseurs quand le stock est bas',
    category: 'ecommerce',
    integrations: ['Base de données', 'Email', 'ERP'],
    rating: 4.7,
    downloads: 6700,
    featured: false,
    complexity: 'Avancé',
    estimatedTime: '20 min',
    steps: 6,
    tags: ['Inventory', 'Supplier', 'Automation'],
    author: {
      name: 'Supply Chain Pro',
      verified: false
    },
    preview: {
      trigger: 'Stock < seuil minimum',
      actions: ['Calculer quantité', 'Email fournisseur', 'Créer bon commande', 'Mettre à jour ERP']
    }
  }
]

export const TemplateMarketplace = () => {
  const [templates, setTemplates] = useState(FEATURED_TEMPLATES)
  const [filteredTemplates, setFilteredTemplates] = useState(FEATURED_TEMPLATES)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [sortBy, setSortBy] = useState('popular')
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null)
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  const { toast } = useToast()

  useEffect(() => {
    filterTemplates()
  }, [searchTerm, selectedCategory, sortBy, templates])

  const filterTemplates = () => {
    let filtered = [...templates]

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(t => t.category === selectedCategory)
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(t => 
        t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    }

    // Sort templates
    switch (sortBy) {
      case 'popular':
        filtered.sort((a, b) => b.downloads - a.downloads)
        break
      case 'rating':
        filtered.sort((a, b) => b.rating - a.rating)
        break
      case 'newest':
        // For demo, reverse order
        filtered.reverse()
        break
      case 'name':
        filtered.sort((a, b) => a.name.localeCompare(b.name))
        break
    }

    setFilteredTemplates(filtered)
  }

  const useTemplate = async (template: any) => {
    try {
      // Create workflow from template directly (no artificial delay)
      
      // Create workflow from template
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const workflowData = {
        name: `${template.name} (depuis template)`,
        description: template.description,
        trigger_type: 'template',
        trigger_config: template.preview,
        steps: template.preview.actions.map((action: string, index: number) => ({
          step_type: 'action',
          step_config: { action },
          position: index
        })),
        status: 'draft',
        user_id: user.id
      }

      const { error } = await supabase
        .from('automation_workflows')
        .insert([workflowData])

      if (error) throw error

      toast({
        title: "Template utilisé",
        description: `Le template "${template.name}" a été ajouté à vos workflows`
      })
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible d'utiliser ce template",
        variant: "destructive"
      })
    }
  }

  const toggleFavorite = (templateId: string) => {
    const newFavorites = new Set(favorites)
    if (newFavorites.has(templateId)) {
      newFavorites.delete(templateId)
    } else {
      newFavorites.add(templateId)
    }
    setFavorites(newFavorites)
    
    toast({
      title: newFavorites.has(templateId) ? "Ajouté aux favoris" : "Retiré des favoris",
      description: "Vos préférences ont été mises à jour"
    })
  }

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'Facile': return 'bg-green-100 text-green-800'
      case 'Moyen': return 'bg-yellow-100 text-yellow-800'
      case 'Avancé': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const TemplateCard = ({ template }: { template: any }) => (
    <Card className="group hover:shadow-lg transition-all duration-300 border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <CardTitle className="text-base group-hover:text-primary transition-colors">
                {template.name}
              </CardTitle>
              {template.featured && (
                <Award className="w-4 h-4 text-yellow-500" />
              )}
              {template.author.verified && (
                <CheckCircle className="w-3 h-3 text-blue-500" />
              )}
            </div>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {template.description}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => toggleFavorite(template.id)}
            className="shrink-0 ml-2"
          >
            <Heart className={`w-4 h-4 ${favorites.has(template.id) ? 'fill-red-500 text-red-500' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-1">
          {template.integrations.slice(0, 3).map((integration: string) => (
            <Badge key={integration} variant="secondary" className="text-xs">
              {integration}
            </Badge>
          ))}
          {template.integrations.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{template.integrations.length - 3}
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
            {template.rating}
          </div>
          <div className="flex items-center gap-1">
            <Download className="w-3 h-3" />
            {template.downloads.toLocaleString()}
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {template.estimatedTime}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <Badge className={getComplexityColor(template.complexity)} variant="outline">
            {template.complexity}
          </Badge>
          <div className="flex gap-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" onClick={() => setSelectedTemplate(template)}>
                  <Eye className="w-3 h-3" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>{template.name}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <p className="text-muted-foreground">{template.description}</p>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium mb-2">Informations</h4>
                      <div className="space-y-1 text-sm">
                        <div>Complexité: {template.complexity}</div>
                        <div>Temps estimé: {template.estimatedTime}</div>
                        <div>Étapes: {template.steps}</div>
                        <div>Auteur: {template.author.name}</div>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Intégrations</h4>
                      <div className="flex flex-wrap gap-1">
                        {template.integrations.map((integration: string) => (
                          <Badge key={integration} variant="secondary" className="text-xs">
                            {integration}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Aperçu du Workflow</h4>
                    <div className="bg-muted/30 rounded-lg p-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <Zap className="w-4 h-4 text-blue-600" />
                          <span className="font-medium">Déclencheur:</span>
                          <span>{template.preview.trigger}</span>
                        </div>
                        <div className="ml-6 space-y-1">
                          {template.preview.actions.map((action: string, index: number) => (
                            <div key={index} className="flex items-center gap-2 text-sm">
                              <Play className="w-3 h-3 text-green-600" />
                              <span>{index + 1}. {action}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={() => useTemplate(template)} className="flex-1">
                      <Download className="w-4 h-4 mr-2" />
                      Utiliser ce Template
                    </Button>
                    <Button variant="outline" onClick={() => toggleFavorite(template.id)}>
                      <Heart className={`w-4 h-4 ${favorites.has(template.id) ? 'fill-red-500 text-red-500' : ''}`} />
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            <Button size="sm" onClick={() => useTemplate(template)}>
              <Download className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Marketplace de Templates</h3>
          <p className="text-sm text-muted-foreground">
            Découvrez des templates prêts à utiliser créés par la communauté
          </p>
        </div>
        <Button variant="outline">
          <Plus className="w-4 h-4 mr-2" />
          Proposer un Template
        </Button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Rechercher un template..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <select 
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-3 py-2 border rounded-md bg-background text-foreground"
        >
          {TEMPLATE_CATEGORIES.map(category => (
            <option key={category.id} value={category.id}>{category.name}</option>
          ))}
        </select>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="px-3 py-2 border rounded-md bg-background text-foreground"
        >
          <option value="popular">Plus populaires</option>
          <option value="rating">Mieux notés</option>
          <option value="newest">Plus récents</option>
          <option value="name">Nom A-Z</option>
        </select>

        <Badge variant="secondary" className="flex items-center justify-center">
          {filteredTemplates.length} template{filteredTemplates.length > 1 ? 's' : ''}
        </Badge>
      </div>

      {/* Featured Templates */}
      {selectedCategory === 'all' && searchTerm === '' && (
        <div>
          <h4 className="font-medium mb-4 flex items-center gap-2">
            <Award className="w-4 h-4 text-yellow-500" />
            Templates Vedettes
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.filter(t => t.featured).map(template => (
              <TemplateCard key={template.id} template={template} />
            ))}
          </div>
        </div>
      )}

      {/* All Templates */}
      <Tabs defaultValue="all" className="space-y-6">
        <TabsList>
          <TabsTrigger value="all">Tous les Templates</TabsTrigger>
          <TabsTrigger value="favorites">Mes Favoris ({favorites.size})</TabsTrigger>
          <TabsTrigger value="recent">Récemment Utilisés</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemplates.map(template => (
              <TemplateCard key={template.id} template={template} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="favorites">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.filter(t => favorites.has(t.id)).map(template => (
              <TemplateCard key={template.id} template={template} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="recent">
          <div className="text-center py-12 text-muted-foreground">
            <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Aucun template utilisé récemment</p>
          </div>
        </TabsContent>
      </Tabs>

      {filteredTemplates.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Aucun template trouvé pour cette recherche</p>
          <p className="text-sm">Essayez de modifier vos critères de recherche</p>
        </div>
      )}
    </div>
  )
}