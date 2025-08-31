import React, { useState, useMemo, useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { 
  Search, 
  Command, 
  ArrowRight, 
  Star, 
  Clock, 
  TrendingUp,
  Zap,
  Target,
  BarChart3,
  Settings,
  User,
  HelpCircle
} from 'lucide-react'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/AuthContext'
import { usePlan } from '@/contexts/PlanContext'
import { useAppFlow } from '../app-flow/AppFlowManager'

interface NavigationItem {
  id: string
  title: string
  description?: string
  route: string
  icon: React.ReactNode
  category: string
  keywords: string[]
  planRequired?: 'standard' | 'pro' | 'ultra_pro'
  featured?: boolean
  frequency?: number
  lastAccessed?: Date
}

// Base de données de navigation enrichie
const NAVIGATION_ITEMS: NavigationItem[] = [
  // Dashboard
  {
    id: 'dashboard',
    title: 'Tableau de bord',
    description: 'Vue d\'ensemble de votre activité',
    route: '/dashboard',
    icon: <BarChart3 className="h-4 w-4" />,
    category: 'Principal',
    keywords: ['accueil', 'home', 'dashboard', 'overview', 'vue d\'ensemble'],
    featured: true
  },
  
  // Marketing
  {
    id: 'marketing',
    title: 'Marketing',
    description: 'Gérez vos campagnes marketing',
    route: '/marketing',
    icon: <Target className="h-4 w-4" />,
    category: 'Marketing',
    keywords: ['marketing', 'campagne', 'promotion', 'pub', 'communication']
  },
  {
    id: 'marketing-create',
    title: 'Créer une campagne',
    description: 'Nouvelle campagne marketing',
    route: '/marketing/create',
    icon: <Zap className="h-4 w-4" />,
    category: 'Marketing',
    keywords: ['créer', 'nouvelle', 'campagne', 'marketing', 'promotion']
  },
  {
    id: 'marketing-advanced',
    title: 'Campagne avancée',
    description: 'Créateur de campagne avec IA et Canva',
    route: '/marketing/create-advanced',
    icon: <Star className="h-4 w-4" />,
    category: 'Marketing',
    keywords: ['avancé', 'ia', 'canva', 'intelligent', 'pro'],
    planRequired: 'pro',
    featured: true
  },
  {
    id: 'marketing-analytics',
    title: 'Analytics Marketing',
    description: 'Analysez vos performances marketing',
    route: '/marketing/analytics',
    icon: <TrendingUp className="h-4 w-4" />,
    category: 'Marketing',
    keywords: ['analytics', 'statistiques', 'performance', 'roi', 'analyse']
  },
  
  // Automation
  {
    id: 'automation',
    title: 'Automatisation',
    description: 'Automatisez vos processus',
    route: '/automation',
    icon: <Zap className="h-4 w-4" />,
    category: 'Automation',
    keywords: ['automation', 'automatisation', 'workflow', 'processus']
  },
  {
    id: 'automation-optimization',
    title: 'Optimisation IA',
    description: 'Automation et optimisation par IA',
    route: '/automation-optimization',
    icon: <Star className="h-4 w-4" />,
    category: 'Automation',
    keywords: ['ia', 'intelligence', 'optimisation', 'automation', 'advanced'],
    planRequired: 'ultra_pro',
    featured: true
  },
  
  // Import & Catalogue
  {
    id: 'import',
    title: 'Import de produits',
    description: 'Importez vos produits',
    route: '/import',
    icon: <ArrowRight className="h-4 w-4" />,
    category: 'Produits',
    keywords: ['import', 'importer', 'produits', 'catalogue', 'upload']
  },
  {
    id: 'catalogue',
    title: 'Catalogue',
    description: 'Gérez votre catalogue produits',
    route: '/catalogue',
    icon: <BarChart3 className="h-4 w-4" />,
    category: 'Produits',
    keywords: ['catalogue', 'produits', 'inventory', 'stock', 'gestion']
  },
  
  // Intégrations
  {
    id: 'integrations',
    title: 'Intégrations',
    description: 'Connectez vos plateformes',
    route: '/integrations',
    icon: <Settings className="h-4 w-4" />,
    category: 'Configuration',
    keywords: ['intégration', 'connecter', 'api', 'plateforme', 'sync']
  },
  
  // Autres
  {
    id: 'settings',
    title: 'Paramètres',
    description: 'Configuration du compte',
    route: '/settings',
    icon: <Settings className="h-4 w-4" />,
    category: 'Configuration',
    keywords: ['paramètres', 'config', 'settings', 'compte', 'profil']
  }
]

export const UnifiedNavigation = () => {
  const [open, setOpen] = useState(false)
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const location = useLocation()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { plan } = usePlan()
  const { getRecommendedNextSteps } = useAppFlow()

  // Gestion des raccourcis clavier
  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }
    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  // Filtrer les éléments selon le plan
  const availableItems = useMemo(() => {
    return NAVIGATION_ITEMS.filter(item => {
      if (!item.planRequired) return true
      
      const planLevels = { standard: 0, pro: 1, ultra_pro: 2 }
      const userLevel = planLevels[plan as keyof typeof planLevels] || 0
      const requiredLevel = planLevels[item.planRequired]
      
      return userLevel >= requiredLevel
    })
  }, [plan])

  // Éléments recommandés basés sur le flux
  const recommendedItems = useMemo(() => {
    const recommendedSteps = getRecommendedNextSteps()
    return availableItems.filter(item => 
      recommendedSteps.some(step => step.route === item.route)
    )
  }, [availableItems, getRecommendedNextSteps])

  // Éléments populaires/favoris
  const popularItems = useMemo(() => {
    return availableItems
      .filter(item => item.featured)
      .sort((a, b) => (b.frequency || 0) - (a.frequency || 0))
      .slice(0, 5)
  }, [availableItems])

  const handleNavigation = useCallback((item: NavigationItem, searchQuery?: string) => {
    navigate(item.route)
    setOpen(false)
    
    // Enregistrer la recherche
    if (searchQuery && !recentSearches.includes(searchQuery)) {
      setRecentSearches(prev => [searchQuery, ...prev.slice(0, 4)])
    }
    
    // Analytics de navigation
    if (user) {
      // Ici on pourrait logger l'utilisation
      console.log('Navigation:', { userId: user.id, route: item.route, query: searchQuery })
    }
    
    toast.success(`Navigation vers ${item.title}`)
  }, [navigate, recentSearches, user])

  const renderNavigationItem = (item: NavigationItem) => (
    <CommandItem
      key={item.id}
      value={`${item.title} ${item.keywords.join(' ')}`}
      onSelect={() => handleNavigation(item)}
      className="flex items-center gap-3 px-3 py-2 cursor-pointer"
    >
      <div className="flex items-center justify-center w-8 h-8 rounded-md bg-muted">
        {item.icon}
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="font-medium">{item.title}</span>
          {item.planRequired && (
            <Badge variant="secondary" className="text-xs">
              {item.planRequired}
            </Badge>
          )}
          {item.featured && (
            <Star className="h-3 w-3 text-yellow-500 fill-current" />
          )}
        </div>
        {item.description && (
          <p className="text-sm text-muted-foreground">{item.description}</p>
        )}
      </div>
      <ArrowRight className="h-4 w-4 text-muted-foreground" />
    </CommandItem>
  )

  return (
    <>
      {/* Déclencheur de navigation */}
      <Button
        variant="outline"
        className="relative h-9 w-full justify-start text-sm font-normal text-muted-foreground shadow-none sm:pr-12 md:w-40 lg:w-64"
        onClick={() => setOpen(true)}
      >
        <Search className="mr-2 h-4 w-4 shrink-0" />
        <span className="inline-flex">Rechercher...</span>
        <kbd className="pointer-events-none absolute right-1.5 top-2 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>

      {/* Dialog de commande */}
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Tapez une commande ou recherchez..." />
        <CommandList>
          <CommandEmpty>Aucun résultat trouvé.</CommandEmpty>
          
          {/* Éléments recommandés */}
          {recommendedItems.length > 0 && (
            <CommandGroup heading="Recommandé pour vous">
              {recommendedItems.map(renderNavigationItem)}
            </CommandGroup>
          )}
          
          {/* Éléments populaires */}
          {popularItems.length > 0 && (
            <CommandGroup heading="Populaire">
              {popularItems.map(renderNavigationItem)}
            </CommandGroup>
          )}
          
          <CommandSeparator />
          
          {/* Navigation par catégorie */}
          {Object.entries(
            availableItems.reduce((acc, item) => {
              if (!acc[item.category]) acc[item.category] = []
              acc[item.category].push(item)
              return acc
            }, {} as Record<string, NavigationItem[]>)
          ).map(([category, items]) => (
            <CommandGroup key={category} heading={category}>
              {items.map(renderNavigationItem)}
            </CommandGroup>
          ))}
          
          <CommandSeparator />
          
          {/* Actions rapides */}
          <CommandGroup heading="Actions rapides">
            <CommandItem onSelect={() => { setOpen(false); navigate('/settings') }}>
              <User className="mr-2 h-4 w-4" />
              <span>Profil utilisateur</span>
            </CommandItem>
            <CommandItem onSelect={() => { setOpen(false); navigate('/support') }}>
              <HelpCircle className="mr-2 h-4 w-4" />
              <span>Centre d'aide</span>
            </CommandItem>
          </CommandGroup>
          
          {/* Recherches récentes */}
          {recentSearches.length > 0 && (
            <CommandGroup heading="Recherches récentes">
              {recentSearches.map((search, index) => (
                <CommandItem key={index} value={search}>
                  <Clock className="mr-2 h-4 w-4" />
                  <span>{search}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
    </>
  )
}

export default UnifiedNavigation