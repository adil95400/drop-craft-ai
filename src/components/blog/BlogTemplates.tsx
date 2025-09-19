import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { 
  FileText, Star, Crown, Zap, Eye, Download,
  Search, Filter, Plus, BookOpen, Target,
  TrendingUp, Award, ShoppingCart, Users,
  BarChart3, Lightbulb, Settings, Heart
} from 'lucide-react'

interface BlogTemplate {
  id: string
  name: string
  description: string
  category: string
  isPremium: boolean
  isPopular: boolean
  rating: number
  usageCount: number
  preview: string
  content: string
  tags: string[]
  estimatedTime: string
  difficulty: 'Facile' | 'Moyen' | 'Avancé'
}

interface BlogTemplatesProps {
  onSelectTemplate?: (template: BlogTemplate) => void
  onCreateTemplate?: (template: Partial<BlogTemplate>) => void
}

export function BlogTemplates({ onSelectTemplate, onCreateTemplate }: BlogTemplatesProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [selectedTemplate, setSelectedTemplate] = useState<BlogTemplate | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    description: '',
    category: '',
    content: '',
    tags: [] as string[]
  })

  const templates: BlogTemplate[] = [
    {
      id: '1',
      name: 'Guide Dropshipping Complet',
      description: 'Template pour créer un guide complet sur le dropshipping avec toutes les sections essentielles',
      category: 'Dropshipping',
      isPremium: false,
      isPopular: true,
      rating: 4.8,
      usageCount: 156,
      preview: '# Le Guide Complet du Dropshipping en 2024\n\n## Introduction\nDécouvrez les secrets du dropshipping...',
      content: `# Le Guide Complet du Dropshipping en 2024

## Introduction
Le dropshipping est devenu l'une des méthodes les plus populaires pour démarrer un business en ligne. Dans ce guide complet, nous allons explorer...

## Qu'est-ce que le Dropshipping ?
[Définition et explication détaillée]

## Avantages et Inconvénients
### Avantages
- Faible investissement initial
- Pas de gestion de stock
- Flexibilité géographique

### Inconvénients
- Marges réduites
- Dépendance aux fournisseurs
- Concurrence élevée

## Comment Choisir sa Niche
[Guide étape par étape]

## Trouver des Fournisseurs Fiables
[Conseils et ressources]

## Créer sa Boutique en Ligne
[Plateformes recommandées]

## Stratégies Marketing
[Techniques avancées]

## Conclusion
[Récapitulatif et prochaines étapes]`,
      tags: ['dropshipping', 'guide', 'débutant'],
      estimatedTime: '15-20 min',
      difficulty: 'Facile'
    },
    {
      id: '2',
      name: 'Analyse Produit Gagnant',
      description: 'Template pour analyser un produit et expliquer pourquoi il cartonne',
      category: 'Analyse',
      isPremium: true,
      isPopular: false,
      rating: 4.9,
      usageCount: 89,
      preview: '# Analyse : Pourquoi ce Produit Cartonne\n\n## Le Produit\n[Description du produit]...',
      content: `# Analyse : Pourquoi ce Produit Cartonne

## Le Produit
[Nom et description du produit]

## Données de Vente
- Volume de ventes : [X unités/mois]
- Tendance : [En hausse/stable/baisse]
- Saisonnalité : [Analyse]

## Analyse du Marché
### Taille du Marché
[Données et statistiques]

### Concurrence
[Analyse concurrentielle]

### Positionnement Prix
[Stratégie pricing]

## Facteurs de Succès
### 1. Problème Résolu
[Quel problème ce produit résout-il ?]

### 2. Marketing Efficace
[Stratégies publicitaires utilisées]

### 3. Timing Parfait
[Pourquoi maintenant ?]

## Leçons Apprises
[Ce qu'on peut retenir pour d'autres produits]

## Conclusion
[Récapitulatif des points clés]`,
      tags: ['analyse', 'produit', 'marketing'],
      estimatedTime: '10-15 min',
      difficulty: 'Moyen'
    },
    {
      id: '3',
      name: 'Stratégie Marketing Avancée',
      description: 'Template pour partager des stratégies marketing avancées',
      category: 'Marketing',
      isPremium: true,
      isPopular: true,
      rating: 4.7,
      usageCount: 134,
      preview: '# Stratégie Marketing Qui Double Vos Ventes\n\n## La Stratégie\n[Introduction de la stratégie]...',
      content: `# Stratégie Marketing Qui Double Vos Ventes

## La Stratégie
[Nom et description de la stratégie]

## Contexte
Pourquoi cette stratégie fonctionne particulièrement bien en 2024...

## Prérequis
- Budget minimum : [X€]
- Outils nécessaires : [Liste]
- Niveau requis : [Débutant/Intermédiaire/Avancé]

## Étape 1 : Préparation
[Instructions détaillées]

## Étape 2 : Mise en Place
[Instructions détaillées]

## Étape 3 : Optimisation
[Instructions détaillées]

## Résultats Attendus
- Augmentation des ventes : [X%]
- ROI estimé : [X]
- Délai pour voir les résultats : [X semaines]

## Cas d'Étude
[Exemple concret avec chiffres]

## Erreurs à Éviter
[Liste des pièges communs]

## Conclusion
[Récapitulatif et next steps]`,
      tags: ['marketing', 'stratégie', 'ventes'],
      estimatedTime: '12-18 min',
      difficulty: 'Avancé'
    },
    {
      id: '4',
      name: 'Tendances E-commerce',
      description: 'Template pour présenter les tendances actuelles du e-commerce',
      category: 'Tendances',
      isPremium: false,
      isPopular: false,
      rating: 4.5,
      usageCount: 67,
      preview: '# Tendances E-commerce 2024\n\n## Les 5 Tendances Majeures\n1. Intelligence Artificielle...',
      content: `# Tendances E-commerce 2024 : Ce Qui Va Changer la Donne

## Introduction
L'e-commerce évolue à vitesse grand V. Voici les tendances qui vont façonner 2024...

## Les 5 Tendances Majeures

### 1. Intelligence Artificielle
[Impact sur le e-commerce]

### 2. Commerce Vocal
[L'avenir des achats par voix]

### 3. Réalité Augmentée
[Révolution de l'expérience client]

### 4. Commerce Social
[Shopping directement sur les réseaux]

### 5. Durabilité
[L'éco-responsabilité comme avantage concurrentiel]

## Impact sur Votre Business
Comment adapter votre stratégie à ces tendances...

## Actions Concrètes
[Steps à implémenter dès maintenant]

## Ressources Utiles
[Outils et plateformes recommandés]

## Conclusion
[Vision pour l'avenir du e-commerce]`,
      tags: ['tendances', 'innovation', 'futur'],
      estimatedTime: '8-12 min',
      difficulty: 'Facile'
    }
  ]

  const categories = ['all', 'Dropshipping', 'Marketing', 'Analyse', 'Tendances', 'Outils', 'Stratégie']

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesCategory = categoryFilter === 'all' || template.category === categoryFilter
    
    return matchesSearch && matchesCategory
  })

  const handleUseTemplate = (template: BlogTemplate) => {
    onSelectTemplate?.(template)
  }

  const handleCreateTemplate = () => {
    if (newTemplate.name && newTemplate.content) {
      onCreateTemplate?.(newTemplate)
      setNewTemplate({ name: '', description: '', category: '', content: '', tags: [] })
      setIsCreating(false)
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Templates d'Articles</h1>
          <p className="text-muted-foreground">
            Créez des articles professionnels en quelques minutes
          </p>
        </div>
        <Dialog open={isCreating} onOpenChange={setIsCreating}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Créer un Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Créer un Nouveau Template</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Nom du Template</Label>
                  <Input
                    id="name"
                    value={newTemplate.name}
                    onChange={(e) => setNewTemplate({...newTemplate, name: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="category">Catégorie</Label>
                  <Input
                    id="category"
                    value={newTemplate.category}
                    onChange={(e) => setNewTemplate({...newTemplate, category: e.target.value})}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={newTemplate.description}
                  onChange={(e) => setNewTemplate({...newTemplate, description: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="content">Contenu du Template</Label>
                <Textarea
                  id="content"
                  value={newTemplate.content}
                  onChange={(e) => setNewTemplate({...newTemplate, content: e.target.value})}
                  className="min-h-[300px]"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsCreating(false)}>
                  Annuler
                </Button>
                <Button onClick={handleCreateTemplate}>
                  Créer Template
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="templates" className="space-y-6">
        <TabsList>
          <TabsTrigger value="templates">Tous les Templates</TabsTrigger>
          <TabsTrigger value="popular">Populaires</TabsTrigger>
          <TabsTrigger value="premium">Premium</TabsTrigger>
          <TabsTrigger value="favorites">Favoris</TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="space-y-6">
          {/* Filtres */}
          <Card>
            <CardContent className="p-6">
              <div className="flex gap-4 items-center">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Rechercher des templates..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  {categories.map(category => (
                    <Button
                      key={category}
                      variant={categoryFilter === category ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCategoryFilter(category)}
                    >
                      {category === 'all' ? 'Tous' : category}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Grille de templates */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemplates.map((template) => (
              <Card key={template.id} className="relative hover-scale">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-lg flex items-center gap-2">
                        {template.name}
                        {template.isPremium && <Crown className="h-4 w-4 text-yellow-500" />}
                        {template.isPopular && <Star className="h-4 w-4 text-orange-500" />}
                      </CardTitle>
                    </div>
                    <Button variant="ghost" size="sm">
                      <Heart className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {template.description}
                  </p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Star className="h-4 w-4 fill-current text-yellow-500" />
                    {template.rating}
                    <span>•</span>
                    <span>{template.usageCount} utilisations</span>
                    <span>•</span>
                    <span>{template.estimatedTime}</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex flex-wrap gap-1">
                      <Badge variant="outline">{template.category}</Badge>
                      <Badge variant="secondary">{template.difficulty}</Badge>
                      {template.tags.map(tag => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    
                    <div className="bg-muted p-3 rounded-md">
                      <p className="text-sm font-mono truncate">
                        {template.preview}
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" className="flex-1">
                            <Eye className="h-4 w-4 mr-2" />
                            Aperçu
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>{template.name}</DialogTitle>
                          </DialogHeader>
                          <div className="py-4">
                            <pre className="whitespace-pre-wrap text-sm">
                              {template.content}
                            </pre>
                          </div>
                          <div className="flex justify-end gap-2">
                            <Button onClick={() => handleUseTemplate(template)}>
                              <Download className="h-4 w-4 mr-2" />
                              Utiliser ce Template
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                      <Button onClick={() => handleUseTemplate(template)}>
                        Utiliser
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="popular">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.filter(t => t.isPopular).map((template) => (
              <Card key={template.id} className="hover-scale">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {template.name}
                    <Star className="h-4 w-4 text-orange-500" />
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {template.description}
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1">
                      <Eye className="h-4 w-4 mr-2" />
                      Aperçu
                    </Button>
                    <Button onClick={() => handleUseTemplate(template)}>
                      Utiliser
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="premium">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.filter(t => t.isPremium).map((template) => (
              <Card key={template.id} className="hover-scale border-yellow-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {template.name}
                    <Crown className="h-4 w-4 text-yellow-500" />
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {template.description}
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1">
                      <Eye className="h-4 w-4 mr-2" />
                      Aperçu
                    </Button>
                    <Button onClick={() => handleUseTemplate(template)}>
                      Utiliser
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="favorites">
          <div className="text-center py-12">
            <Heart className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">Aucun template favoris</h3>
            <p className="text-muted-foreground">
              Ajoutez des templates à vos favoris pour les retrouver rapidement
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}