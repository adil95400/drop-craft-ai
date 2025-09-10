import React from 'react'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Puzzle,
  Store,
  Code,
  Terminal,
  Palette,
  Shield,
  Globe,
  Printer,
  Download,
  ChevronDown
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useUnifiedPlan } from '@/components/unified'

export const ExtensionMenu: React.FC = () => {
  const navigate = useNavigate()
  const { isPro, isUltraPro } = useUnifiedPlan()

  interface MenuItem {
    icon: React.ReactElement
    label: string
    description: string
    route: string
    planRequired: 'pro' | 'ultra_pro' | null
    badge?: string
  }

  const menuItems: MenuItem[] = [
    {
      icon: <Store className="w-4 h-4" />,
      label: 'Marketplace',
      description: 'Découvrir des extensions',
      route: '/extensions/marketplace',
      planRequired: null
    },
    {
      icon: <Code className="w-4 h-4" />,
      label: 'Developer Dashboard',
      description: 'Créer des extensions',
      route: '/extensions/developer',
      planRequired: null
    },
    {
      icon: <Globe className="w-4 h-4" />,
      label: 'Extension Navigateur',
      description: 'Scraping web',
      route: '/extension-download',
      planRequired: null,
      badge: 'Beta'
    },
    {
      icon: <Printer className="w-4 h-4" />,
      label: 'Gestionnaire d\'Impression',
      description: 'Templates & Jobs',
      route: '/print',
      planRequired: 'pro',
      badge: 'Pro'
    }
  ]

  const advancedItems: MenuItem[] = [
    {
      icon: <Terminal className="w-4 h-4" />,
      label: 'CLI Tools',
      description: 'Outils développeur',
      route: '/extensions/cli',
      planRequired: 'pro',
      badge: 'Pro'
    },
    {
      icon: <Palette className="w-4 h-4" />,
      label: 'White Label',
      description: 'Marketplace personnalisé',
      route: '/extensions/white-label',
      planRequired: 'ultra_pro',
      badge: 'Ultra Pro'
    },
    {
      icon: <Shield className="w-4 h-4" />,
      label: 'Enterprise SSO',
      description: 'Sécurité entreprise',
      route: '/extensions/sso',
      planRequired: 'ultra_pro',
      badge: 'Ultra Pro'
    }
  ]

  const canAccess = (planRequired: 'pro' | 'ultra_pro' | null) => {
    if (!planRequired) return true
    if (planRequired === 'pro') return isPro || isUltraPro
    if (planRequired === 'ultra_pro') return isUltraPro
    return false
  }

  const handleItemClick = (route: string, planRequired: 'pro' | 'ultra_pro' | null) => {
    if (canAccess(planRequired)) {
      navigate(route)
    } else {
      navigate('/subscription')
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="flex items-center gap-2">
          <Puzzle className="w-4 h-4" />
          Extensions
          <ChevronDown className="w-3 h-3" />
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent className="w-72" align="end">
        <DropdownMenuLabel className="flex items-center gap-2">
          <Puzzle className="w-4 h-4" />
          Système d'Extensions
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {/* Main Items */}
        {menuItems.map((item) => (
          <DropdownMenuItem
            key={item.label}
            className="flex items-center justify-between p-3 cursor-pointer"
            onClick={() => handleItemClick(item.route, item.planRequired)}
          >
            <div className="flex items-center gap-3">
              {item.icon}
              <div>
                <div className="font-medium">{item.label}</div>
                <div className="text-xs text-muted-foreground">{item.description}</div>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1">
              {item.badge && (
                <Badge variant="outline" className="text-xs">
                  {item.badge}
                </Badge>
              )}
              {!canAccess(item.planRequired) && (
                <Badge className="text-xs bg-yellow-100 text-yellow-800">
                  Upgrade
                </Badge>
              )}
            </div>
          </DropdownMenuItem>
        ))}
        
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          Fonctionnalités Avancées
        </DropdownMenuLabel>
        
        {/* Advanced Items */}
        {advancedItems.map((item) => (
          <DropdownMenuItem
            key={item.label}
            className={`flex items-center justify-between p-3 cursor-pointer ${
              !canAccess(item.planRequired) ? 'opacity-60' : ''
            }`}
            onClick={() => handleItemClick(item.route, item.planRequired)}
          >
            <div className="flex items-center gap-3">
              {item.icon}
              <div>
                <div className="font-medium">{item.label}</div>
                <div className="text-xs text-muted-foreground">{item.description}</div>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1">
              <Badge variant="outline" className="text-xs">
                {item.badge}
              </Badge>
              {!canAccess(item.planRequired) && (
                <Badge className="text-xs bg-red-100 text-red-800">
                  Requis
                </Badge>
              )}
            </div>
          </DropdownMenuItem>
        ))}
        
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          className="p-3 cursor-pointer bg-primary/5"
          onClick={() => navigate('/extensions')}
        >
          <div className="flex items-center gap-3 w-full">
            <Download className="w-4 h-4" />
            <div className="flex-1">
              <div className="font-medium">Centre d'Extensions</div>
              <div className="text-xs text-muted-foreground">Voir toutes les extensions</div>
            </div>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default ExtensionMenu