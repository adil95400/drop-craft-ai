import React from 'react'
import { NavLink } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import {
  Package,
  Zap,
  Grid3X3,
  Truck,
  Crown,
  BookmarkCheck
} from 'lucide-react'

interface CatalogNavigationProps {
  className?: string
}

export function CatalogNavigation({ className }: CatalogNavigationProps) {
  const navigationItems = [
    {
      title: 'Produits',
      href: '/catalog/products',
      icon: Package,
      description: 'Gestion des produits du catalogue',
      active: true
    },
    {
      title: 'Produits Ultra Pro',
      href: '/catalog/products-ultra',
      icon: Zap,
      description: 'Produits avec IA avancée et optimisation',
      badge: { text: 'Ultra', variant: 'premium' as const }
    },
    {
      title: 'Catalogue',
      href: '/catalog/browse',
      icon: Grid3X3,
      description: 'Parcourir et rechercher dans le catalogue'
    },
    {
      title: 'Fournisseurs',
      href: '/catalog/suppliers',
      icon: Truck,
      description: 'Gestion des fournisseurs et sources'
    },
    {
      title: 'Fournisseurs Pro',
      href: '/catalog/suppliers-pro',
      icon: Crown,
      description: 'Fournisseurs premium avec fonctionnalités avancées',
      badge: { text: 'Pro', variant: 'pro' as const }
    },
    {
      title: 'Vues Produits',
      href: '/products/views',
      icon: BookmarkCheck,
      description: 'Filtres prédéfinis et vues enregistrées'
    }
  ]

  return (
    <div className={cn("space-y-2", className)}>
      <div className="px-3 py-2">
        <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight text-muted-foreground">
          CATALOGUE
        </h2>
      </div>
      <div className="space-y-1">
        {navigationItems.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.href}
              to={item.href}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent",
                  isActive 
                    ? "bg-primary text-primary-foreground shadow-sm" 
                    : "text-muted-foreground hover:text-foreground",
                  item.active && "bg-primary text-primary-foreground"
                )
              }
            >
              <Icon className="h-4 w-4" />
              <span className="flex-1">{item.title}</span>
              {item.badge && (
                <Badge 
                  variant={item.badge.variant === 'premium' ? 'default' : 'secondary'}
                  className={cn(
                    "text-xs",
                    item.badge.variant === 'premium' && "bg-gradient-to-r from-purple-500 to-pink-500 text-white",
                    item.badge.variant === 'pro' && "bg-gradient-to-r from-amber-500 to-orange-500 text-white"
                  )}
                >
                  {item.badge.text}
                </Badge>
              )}
            </NavLink>
          )
        })}
      </div>
    </div>
  )
}