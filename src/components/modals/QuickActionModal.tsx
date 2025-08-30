import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Search, 
  Package, 
  ShoppingCart, 
  Users, 
  BarChart3,
  Settings,
  Plus,
  Eye,
  Edit,
  Download,
  Upload,
  Zap,
  Command
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useToast } from '@/hooks/use-toast'

interface QuickAction {
  id: string
  title: string
  description: string
  icon: React.ElementType
  category: string
  action: () => void
  shortcut?: string
  badge?: string
}

interface QuickActionModalProps {
  isOpen: boolean
  onClose: () => void
}

export const QuickActionModal = ({ isOpen, onClose }: QuickActionModalProps) => {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = useState('')
  const [filteredActions, setFilteredActions] = useState<QuickAction[]>([])

  const quickActions: QuickAction[] = [
    // Navigation
    {
      id: 'go_products',
      title: 'Voir les produits',
      description: 'Accéder au catalogue de produits',
      icon: Package,
      category: 'Navigation',
      action: () => navigate('/catalogue'),
      shortcut: 'Ctrl+P'
    },
    {
      id: 'go_orders',
      title: 'Voir les commandes',
      description: 'Gérer les commandes clients',
      icon: ShoppingCart,
      category: 'Navigation',
      action: () => navigate('/orders'),
      shortcut: 'Ctrl+O'
    },
    {
      id: 'go_customers',
      title: 'Voir les clients',
      description: 'Gérer la base clients',
      icon: Users,
      category: 'Navigation',
      action: () => navigate('/customers'),
      shortcut: 'Ctrl+U'
    },
    {
      id: 'go_analytics',
      title: 'Analytics',
      description: 'Voir les statistiques',
      icon: BarChart3,
      category: 'Navigation',
      action: () => navigate('/analytics'),
      shortcut: 'Ctrl+A'
    },
    
    // Actions rapides
    {
      id: 'add_product',
      title: 'Ajouter un produit',
      description: 'Créer un nouveau produit',
      icon: Plus,
      category: 'Actions',
      action: () => {
        navigate('/catalogue')
        toast({ title: "Redirection", description: "Ouverture de l'ajout de produit" })
      }
    },
    {
      id: 'import_products',
      title: 'Importer des produits',
      description: 'Import en lot depuis fichier',
      icon: Upload,
      category: 'Actions',
      action: () => navigate('/import'),
      badge: 'Populaire'
    },
    {
      id: 'export_data',
      title: 'Exporter les données',
      description: 'Télécharger vos données',
      icon: Download,
      category: 'Actions',
      action: () => {
        toast({ 
          title: "Export en cours", 
          description: "Génération du fichier d'export..." 
        })
      }
    },
    
    // Paramètres
    {
      id: 'settings',
      title: 'Paramètres',
      description: 'Configuration générale',
      icon: Settings,
      category: 'Paramètres',
      action: () => navigate('/settings')
    },
    {
      id: 'integrations',
      title: 'Intégrations',
      description: 'Connecter des services',
      icon: Zap,
      category: 'Paramètres',
      action: () => navigate('/integrations')
    }
  ]

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredActions(quickActions)
    } else {
      const filtered = quickActions.filter(action => 
        action.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        action.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        action.category.toLowerCase().includes(searchQuery.toLowerCase())
      )
      setFilteredActions(filtered)
    }
  }, [searchQuery])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return
      
      // ESC to close
      if (e.key === 'Escape') {
        onClose()
        return
      }

      // Enter to execute first action
      if (e.key === 'Enter' && filteredActions.length > 0) {
        e.preventDefault()
        filteredActions[0].action()
        onClose()
        return
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, filteredActions, onClose])

  const handleActionClick = (action: QuickAction) => {
    action.action()
    onClose()
  }

  const categories = [...new Set(filteredActions.map(a => a.category))]

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] p-0">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle className="flex items-center gap-2">
            <Command className="h-5 w-5" />
            Actions Rapides
          </DialogTitle>
          <DialogDescription>
            Recherchez et exécutez rapidement des actions. Utilisez Cmd+K pour ouvrir.
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 pb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher une action..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              autoFocus
            />
          </div>
        </div>

        <ScrollArea className="max-h-96 px-6 pb-6">
          <div className="space-y-6">
            {categories.map(category => {
              const categoryActions = filteredActions.filter(a => a.category === category)
              
              return (
                <div key={category}>
                  <h4 className="text-sm font-medium text-muted-foreground mb-3">
                    {category}
                  </h4>
                  <div className="space-y-2">
                    {categoryActions.map((action) => {
                      const IconComponent = action.icon
                      
                      return (
                        <Button
                          key={action.id}
                          variant="ghost"
                          className="w-full h-auto p-3 justify-start hover:bg-accent"
                          onClick={() => handleActionClick(action)}
                        >
                          <div className="flex items-center gap-3 w-full">
                            <div className="p-2 rounded-md bg-primary/10">
                              <IconComponent className="h-4 w-4 text-primary" />
                            </div>
                            
                            <div className="flex-1 text-left">
                              <div className="flex items-center gap-2">
                                <div className="font-medium">{action.title}</div>
                                {action.badge && (
                                  <Badge variant="secondary" className="text-xs">
                                    {action.badge}
                                  </Badge>
                                )}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {action.description}
                              </div>
                            </div>
                            
                            {action.shortcut && (
                              <Badge variant="outline" className="text-xs font-mono">
                                {action.shortcut}
                              </Badge>
                            )}
                          </div>
                        </Button>
                      )
                    })}
                  </div>
                </div>
              )
            })}
            
            {filteredActions.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Search className="h-8 w-8 mx-auto mb-2" />
                <p>Aucune action trouvée pour "{searchQuery}"</p>
                <p className="text-xs mt-1">Essayez un autre terme de recherche</p>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="px-6 py-3 border-t bg-muted/50">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-background border rounded">↵</kbd>
                Exécuter
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-background border rounded">ESC</kbd>
                Fermer
              </span>
            </div>
            <span>{filteredActions.length} action(s)</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}