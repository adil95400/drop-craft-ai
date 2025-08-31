import React, { useMemo } from 'react'
import { useLocation, Link } from 'react-router-dom'
import { ChevronRight, Home, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

interface RouteInfo {
  path: string
  label: string
  category?: string
  planRequired?: string
  parent?: string
}

// Mapping des routes avec leurs informations
const ROUTE_INFO: { [key: string]: RouteInfo } = {
  '/': { path: '/', label: 'Accueil' },
  '/dashboard': { path: '/dashboard', label: 'Tableau de bord', category: 'Principal' },
  '/marketing': { path: '/marketing', label: 'Marketing', category: 'Marketing' },
  '/marketing/create': { path: '/marketing/create', label: 'Créer une campagne', parent: '/marketing' },
  '/marketing/create-advanced': { 
    path: '/marketing/create-advanced', 
    label: 'Campagne avancée', 
    parent: '/marketing',
    planRequired: 'Pro'
  },
  '/marketing/analytics': { path: '/marketing/analytics', label: 'Analytics', parent: '/marketing' },
  '/marketing/automation': { path: '/marketing/automation', label: 'Automation', parent: '/marketing' },
  '/marketing/calendar': { path: '/marketing/calendar', label: 'Calendrier', parent: '/marketing' },
  '/marketing/ab-testing': { path: '/marketing/ab-testing', label: 'A/B Testing', parent: '/marketing' },
  
  '/automation': { path: '/automation', label: 'Automatisation', category: 'Automation' },
  '/automation-optimization': { 
    path: '/automation-optimization', 
    label: 'Optimisation IA', 
    category: 'Automation',
    planRequired: 'Ultra Pro'
  },
  
  '/import': { path: '/import', label: 'Import', category: 'Produits' },
  '/import-ultra-pro': { path: '/import-ultra-pro', label: 'Import Pro', category: 'Produits', planRequired: 'Ultra Pro' },
  '/catalogue': { path: '/catalogue', label: 'Catalogue', category: 'Produits' },
  '/catalogue-ultra-pro': { path: '/catalogue-ultra-pro', label: 'Catalogue Pro', category: 'Produits', planRequired: 'Ultra Pro' },
  
  '/orders': { path: '/orders', label: 'Commandes', category: 'Commerce' },
  '/orders-ultra-pro': { path: '/orders-ultra-pro', label: 'Commandes Pro', category: 'Commerce', planRequired: 'Ultra Pro' },
  
  '/crm': { path: '/crm', label: 'CRM', category: 'Client' },
  '/crm/leads': { path: '/crm/leads', label: 'Prospects', parent: '/crm' },
  '/crm/activity': { path: '/crm/activity', label: 'Activité', parent: '/crm' },
  '/crm/calendar': { path: '/crm/calendar', label: 'Calendrier', parent: '/crm' },
  
  '/tracking': { path: '/tracking', label: 'Suivi', category: 'Commerce' },
  '/tracking/in-transit': { path: '/tracking/in-transit', label: 'En transit', parent: '/tracking' },
  '/tracking/today': { path: '/tracking/today', label: 'Aujourd\'hui', parent: '/tracking' },
  
  '/analytics': { path: '/analytics', label: 'Analytics', category: 'Analyse' },
  '/analytics-enterprise': { 
    path: '/analytics-enterprise', 
    label: 'Analytics Entreprise', 
    category: 'Analyse',
    planRequired: 'Ultra Pro'
  },
  
  '/integrations': { path: '/integrations', label: 'Intégrations', category: 'Configuration' },
  '/integrations-ultra-pro': { 
    path: '/integrations-ultra-pro', 
    label: 'Intégrations Pro', 
    category: 'Configuration',
    planRequired: 'Ultra Pro'
  },
  
  '/settings': { path: '/settings', label: 'Paramètres', category: 'Configuration' },
  '/support': { path: '/support', label: 'Support', category: 'Aide' },
}

export const SmartBreadcrumbs = () => {
  const location = useLocation()
  
  const breadcrumbs = useMemo(() => {
    const pathSegments = location.pathname.split('/').filter(Boolean)
    const crumbs: Array<{ path: string; label: string; info: RouteInfo }> = []
    
    // Toujours ajouter l'accueil
    if (location.pathname !== '/') {
      crumbs.push({
        path: '/dashboard',
        label: 'Tableau de bord',
        info: ROUTE_INFO['/dashboard']
      })
    }
    
    // Construire le chemin progressivement
    let currentPath = ''
    for (const segment of pathSegments) {
      currentPath += `/${segment}`
      const routeInfo = ROUTE_INFO[currentPath]
      
      if (routeInfo) {
        // Vérifier si on a un parent à ajouter
        if (routeInfo.parent && !crumbs.some(c => c.path === routeInfo.parent)) {
          const parentInfo = ROUTE_INFO[routeInfo.parent]
          if (parentInfo) {
            crumbs.push({
              path: routeInfo.parent,
              label: parentInfo.label,
              info: parentInfo
            })
          }
        }
        
        crumbs.push({
          path: currentPath,
          label: routeInfo.label,
          info: routeInfo
        })
      }
    }
    
    return crumbs
  }, [location.pathname])

  // Fonction pour retourner à la page précédente
  const goBack = () => {
    if (breadcrumbs.length > 1) {
      const previousCrumb = breadcrumbs[breadcrumbs.length - 2]
      if (previousCrumb) {
        window.location.href = previousCrumb.path
      }
    } else {
      window.history.back()
    }
  }

  if (breadcrumbs.length === 0) return null

  return (
    <div className="flex items-center gap-4 mb-6 p-4 bg-muted/30 rounded-lg border">
      {/* Bouton retour */}
      <Button
        variant="ghost"
        size="sm"
        onClick={goBack}
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        <span className="hidden sm:inline">Retour</span>
      </Button>

      {/* Breadcrumbs */}
      <Breadcrumb className="flex-1">
        <BreadcrumbList>
          {breadcrumbs.map((crumb, index) => {
            const isLast = index === breadcrumbs.length - 1
            
            return (
              <React.Fragment key={crumb.path}>
                <BreadcrumbItem>
                  {isLast ? (
                    <BreadcrumbPage className="flex items-center gap-2">
                      <span className="font-medium">{crumb.label}</span>
                      {crumb.info.planRequired && (
                        <Badge variant="secondary" className="text-xs">
                          {crumb.info.planRequired}
                        </Badge>
                      )}
                      {crumb.info.category && (
                        <Badge variant="outline" className="text-xs">
                          {crumb.info.category}
                        </Badge>
                      )}
                    </BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink asChild>
                      <Link 
                        to={crumb.path}
                        className="flex items-center gap-2 hover:text-foreground transition-colors"
                      >
                        {index === 0 && <Home className="h-3 w-3" />}
                        <span>{crumb.label}</span>
                        {crumb.info.planRequired && (
                          <Badge variant="secondary" className="text-xs">
                            {crumb.info.planRequired}
                          </Badge>
                        )}
                      </Link>
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
                {!isLast && (
                  <BreadcrumbSeparator>
                    <ChevronRight className="h-4 w-4" />
                  </BreadcrumbSeparator>
                )}
              </React.Fragment>
            )
          })}
        </BreadcrumbList>
      </Breadcrumb>

      {/* Informations contextuelles */}
      {breadcrumbs.length > 0 && (
        <div className="text-xs text-muted-foreground hidden lg:block">
          Page {breadcrumbs.length} / Navigation
        </div>
      )}
    </div>
  )
}

export default SmartBreadcrumbs