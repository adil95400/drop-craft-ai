/**
 * Workflow Templates - Bibliothèque de templates prédéfinis
 * Permet de démarrer rapidement avec des workflows optimisés
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Search,
  Copy,
  Star,
  Zap,
  ShoppingCart,
  Package,
  Bell,
  TrendingUp,
  Users,
  Clock,
  DollarSign,
  RefreshCw,
  Mail,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Filter,
  LayoutTemplate
} from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: 'stock' | 'orders' | 'pricing' | 'notifications' | 'sync' | 'analytics';
  icon: React.ElementType;
  complexity: 'simple' | 'medium' | 'advanced';
  steps: number;
  estimatedTime: string;
  popular: boolean;
  new: boolean;
  triggers: string[];
  actions: string[];
}

const TEMPLATES: WorkflowTemplate[] = [
  {
    id: 'low-stock-alert',
    name: 'Alerte Stock Critique',
    description: 'Notification automatique quand le stock passe sous le seuil défini',
    category: 'stock',
    icon: AlertTriangle,
    complexity: 'simple',
    steps: 3,
    estimatedTime: '2 min',
    popular: true,
    new: false,
    triggers: ['Stock < seuil'],
    actions: ['Email', 'Notification push', 'Slack']
  },
  {
    id: 'auto-reorder',
    name: 'Réapprovisionnement Auto',
    description: 'Commande automatique auprès du fournisseur quand stock bas',
    category: 'stock',
    icon: RefreshCw,
    complexity: 'advanced',
    steps: 6,
    estimatedTime: '10 min',
    popular: true,
    new: false,
    triggers: ['Stock < minimum'],
    actions: ['Calcul quantité', 'API fournisseur', 'Création commande', 'Notification']
  },
  {
    id: 'order-confirmation',
    name: 'Confirmation de Commande',
    description: 'Email de confirmation automatique après chaque nouvelle commande',
    category: 'orders',
    icon: ShoppingCart,
    complexity: 'simple',
    steps: 2,
    estimatedTime: '3 min',
    popular: true,
    new: false,
    triggers: ['Nouvelle commande'],
    actions: ['Envoi email', 'Log activité']
  },
  {
    id: 'abandoned-cart',
    name: 'Panier Abandonné',
    description: 'Relance automatique des paniers abandonnés après 24h',
    category: 'orders',
    icon: Clock,
    complexity: 'medium',
    steps: 4,
    estimatedTime: '5 min',
    popular: true,
    new: false,
    triggers: ['Panier > 24h sans achat'],
    actions: ['Vérification stock', 'Email de relance', 'Coupon optionnel']
  },
  {
    id: 'dynamic-pricing',
    name: 'Repricing Dynamique',
    description: 'Ajustement automatique des prix selon la concurrence',
    category: 'pricing',
    icon: TrendingUp,
    complexity: 'advanced',
    steps: 7,
    estimatedTime: '15 min',
    popular: false,
    new: true,
    triggers: ['Prix concurrent changé', 'Planifié'],
    actions: ['Scraping prix', 'Analyse marge', 'Mise à jour prix', 'Log']
  },
  {
    id: 'margin-protection',
    name: 'Protection de Marge',
    description: 'Alerte quand la marge descend sous le seuil minimum',
    category: 'pricing',
    icon: DollarSign,
    complexity: 'medium',
    steps: 4,
    estimatedTime: '5 min',
    popular: false,
    new: false,
    triggers: ['Changement prix fournisseur'],
    actions: ['Calcul nouvelle marge', 'Comparaison seuil', 'Alerte si besoin']
  },
  {
    id: 'new-product-notify',
    name: 'Nouveau Produit - Notification',
    description: 'Alertez vos clients des nouveaux produits en catalogue',
    category: 'notifications',
    icon: Bell,
    complexity: 'simple',
    steps: 3,
    estimatedTime: '3 min',
    popular: false,
    new: true,
    triggers: ['Nouveau produit ajouté'],
    actions: ['Sélection audience', 'Envoi notification', 'Track analytics']
  },
  {
    id: 'supplier-sync',
    name: 'Sync Fournisseur',
    description: 'Synchronisation planifiée avec les catalogues fournisseurs',
    category: 'sync',
    icon: Package,
    complexity: 'medium',
    steps: 5,
    estimatedTime: '8 min',
    popular: true,
    new: false,
    triggers: ['Planifié (quotidien)', 'Manuel'],
    actions: ['Fetch API', 'Comparaison', 'Mise à jour produits', 'Rapport']
  },
  {
    id: 'weekly-report',
    name: 'Rapport Hebdomadaire',
    description: 'Génération et envoi automatique du rapport de performance',
    category: 'analytics',
    icon: TrendingUp,
    complexity: 'medium',
    steps: 4,
    estimatedTime: '5 min',
    popular: false,
    new: false,
    triggers: ['Chaque lundi 9h'],
    actions: ['Collecte métriques', 'Génération PDF', 'Envoi email']
  },
  {
    id: 'customer-segment',
    name: 'Segmentation Clients',
    description: 'Classification automatique des clients selon leur comportement',
    category: 'analytics',
    icon: Users,
    complexity: 'advanced',
    steps: 6,
    estimatedTime: '12 min',
    popular: false,
    new: true,
    triggers: ['Nouvelle commande', 'Mensuel'],
    actions: ['Analyse RFM', 'Attribution segment', 'Tag CRM', 'Actions ciblées']
  }
];

const CATEGORIES = [
  { id: 'all', label: 'Tous', icon: LayoutTemplate },
  { id: 'stock', label: 'Stock', icon: Package },
  { id: 'orders', label: 'Commandes', icon: ShoppingCart },
  { id: 'pricing', label: 'Prix', icon: DollarSign },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'sync', label: 'Sync', icon: RefreshCw },
  { id: 'analytics', label: 'Analytics', icon: TrendingUp }
];

export function WorkflowTemplates() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [selectedTemplate, setSelectedTemplate] = useState<WorkflowTemplate | null>(null);

  const filteredTemplates = TEMPLATES.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = activeCategory === 'all' || template.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const handleUseTemplate = (template: WorkflowTemplate) => {
    setSelectedTemplate(null);
    toast.success(`Template "${template.name}" ajouté à vos workflows!`, {
      description: 'Vous pouvez maintenant le personnaliser'
    });
  };

  const getComplexityColor = (complexity: WorkflowTemplate['complexity']) => {
    switch (complexity) {
      case 'simple': return 'text-green-600 bg-green-50 border-green-200';
      case 'medium': return 'text-amber-600 bg-amber-50 border-amber-200';
      case 'advanced': return 'text-red-600 bg-red-50 border-red-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-purple-500/10">
            <Sparkles className="h-6 w-6 text-purple-500" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Templates de Workflows</h2>
            <p className="text-sm text-muted-foreground">
              {TEMPLATES.length} templates prêts à l'emploi
            </p>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un template..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {CATEGORIES.map(cat => {
            const Icon = cat.icon;
            return (
              <Button
                key={cat.id}
                variant={activeCategory === cat.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveCategory(cat.id)}
                className="whitespace-nowrap"
              >
                <Icon className="h-4 w-4 mr-1" />
                {cat.label}
              </Button>
            );
          })}
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredTemplates.map((template, index) => {
          const Icon = template.icon;
          return (
            <motion.div
              key={template.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card 
                className="cursor-pointer hover:shadow-lg transition-all hover:border-primary/50 h-full"
                onClick={() => setSelectedTemplate(template)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex gap-1">
                      {template.popular && (
                        <Badge variant="secondary" className="text-xs gap-1">
                          <Star className="h-3 w-3" />
                          Populaire
                        </Badge>
                      )}
                      {template.new && (
                        <Badge className="text-xs bg-green-500">
                          Nouveau
                        </Badge>
                      )}
                    </div>
                  </div>
                  <CardTitle className="text-base mt-3">{template.name}</CardTitle>
                  <CardDescription className="text-sm line-clamp-2">
                    {template.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <Zap className="h-3 w-3" />
                        {template.steps} étapes
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {template.estimatedTime}
                      </span>
                    </div>
                    <Badge variant="outline" className={cn("text-xs", getComplexityColor(template.complexity))}>
                      {template.complexity === 'simple' && 'Simple'}
                      {template.complexity === 'medium' && 'Moyen'}
                      {template.complexity === 'advanced' && 'Avancé'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {filteredTemplates.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <LayoutTemplate className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Aucun template trouvé</p>
          <Button variant="link" onClick={() => { setSearchTerm(''); setActiveCategory('all'); }}>
            Réinitialiser les filtres
          </Button>
        </div>
      )}

      {/* Template Detail Dialog */}
      <Dialog open={!!selectedTemplate} onOpenChange={() => setSelectedTemplate(null)}>
        {selectedTemplate && (
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <selectedTemplate.icon className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <DialogTitle>{selectedTemplate.name}</DialogTitle>
                  <DialogDescription>{selectedTemplate.description}</DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-3 rounded-lg bg-muted">
                  <p className="text-2xl font-bold">{selectedTemplate.steps}</p>
                  <p className="text-xs text-muted-foreground">Étapes</p>
                </div>
                <div className="p-3 rounded-lg bg-muted">
                  <p className="text-2xl font-bold">{selectedTemplate.estimatedTime}</p>
                  <p className="text-xs text-muted-foreground">Config</p>
                </div>
                <div className="p-3 rounded-lg bg-muted">
                  <Badge variant="outline" className={getComplexityColor(selectedTemplate.complexity)}>
                    {selectedTemplate.complexity}
                  </Badge>
                  <p className="text-xs text-muted-foreground mt-1">Complexité</p>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <h4 className="text-sm font-medium mb-2">Déclencheurs</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedTemplate.triggers.map((trigger, i) => (
                      <Badge key={i} variant="outline" className="text-xs">
                        <Zap className="h-3 w-3 mr-1" />
                        {trigger}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium mb-2">Actions</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedTemplate.actions.map((action, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        <ArrowRight className="h-3 w-3 mr-1" />
                        {action}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setSelectedTemplate(null)}>
                Annuler
              </Button>
              <Button onClick={() => handleUseTemplate(selectedTemplate)}>
                <Copy className="h-4 w-4 mr-2" />
                Utiliser ce template
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
