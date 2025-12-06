/**
 * MobileDrawerNav - Navigation Mobile Complète Style Spocket/AutoDS
 * Drawer complet avec accès à toutes les sections
 */

import React, { useState } from 'react'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { useLocation, useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { ThemeToggle } from '@/components/theme/ThemeToggle'
import { useUnifiedPlan } from '@/lib/unified-plan-system'
import {
  Home, Package, ShoppingCart, Users, BarChart3, Settings,
  Sparkles, Menu, X, Truck, Brain, Zap, Store, CreditCard,
  LifeBuoy, ChevronDown, ChevronRight, Lock, Crown, Rss, Star,
  Upload, Globe, Bot, Megaphone, GraduationCap, Plug, Shield,
  TrendingUp, Tag, Boxes, Search, Bell, LogOut
} from 'lucide-react'

// Configuration des groupes de navigation
const navGroups = [
  {
    id: 'main',
    label: 'Principal',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: Home, path: '/dashboard', badge: null },
      { id: 'stores', label: 'Boutiques & Canaux', icon: Store, path: '/stores-channels', badge: 'Nouveau' },
    ]
  },
  {
    id: 'commerce',
    label: 'Commerce',
    items: [
      { id: 'products', label: 'Produits', icon: Package, path: '/products', badge: null },
      { id: 'orders', label: 'Commandes', icon: ShoppingCart, path: '/dashboard/orders', badge: null },
      { id: 'customers', label: 'Clients', icon: Users, path: '/dashboard/customers', badge: null },
    ]
  },
  {
    id: 'sourcing',
    label: 'Sourcing',
    items: [
      { id: 'suppliers', label: 'Hub Fournisseurs', icon: Truck, path: '/suppliers', badge: 'Nouveau' },
      { id: 'marketplace', label: 'Marketplace', icon: Globe, path: '/suppliers/marketplace', badge: null },
      { id: 'import', label: 'Import', icon: Upload, path: '/import', badge: null },
      { id: 'import-url', label: 'Import Rapide', icon: Zap, path: '/import/url', badge: 'AutoDS' },
    ]
  },
  {
    id: 'channels',
    label: 'Canaux & Intégrations',
    items: [
      { id: 'stores-channels', label: 'Boutiques & Canaux', icon: Store, path: '/stores-channels', badge: 'Nouveau' },
      { id: 'feeds', label: 'Feeds', icon: Rss, path: '/feeds', badge: 'Channable' },
      { id: 'integrations', label: 'Intégrations', icon: Plug, path: '/integrations', badge: null },
    ]
  },
  {
    id: 'marketing',
    label: 'Marketing',
    items: [
      { id: 'marketing', label: 'Marketing', icon: Megaphone, path: '/marketing', badge: null },
      { id: 'coupons', label: 'Coupons', icon: Tag, path: '/coupons', badge: null },
    ]
  },
  {
    id: 'intelligence',
    label: 'Intelligence',
    items: [
      { id: 'analytics', label: 'Analytics', icon: BarChart3, path: '/analytics', badge: null },
      { id: 'ai-assistant', label: 'Assistant IA', icon: Bot, path: '/ai-assistant', badge: null },
      { id: 'ai-studio', label: 'Studio IA', icon: Brain, path: '/ai-studio', badge: 'Pro', minPlan: 'pro' },
    ]
  },
  {
    id: 'automation',
    label: 'Automation',
    items: [
      { id: 'automation', label: 'Workflows', icon: Zap, path: '/automation', badge: null },
      { id: 'stock', label: 'Stock', icon: Boxes, path: '/stock', badge: null },
      { id: 'fulfillment', label: 'Fulfillment', icon: Truck, path: '/fulfillment', badge: 'Pro', minPlan: 'pro' },
    ]
  },
  {
    id: 'settings',
    label: 'Paramètres',
    items: [
      { id: 'settings', label: 'Paramètres', icon: Settings, path: '/dashboard/settings', badge: null },
      { id: 'billing', label: 'Facturation', icon: CreditCard, path: '/billing', badge: null },
      { id: 'security', label: 'Sécurité', icon: Shield, path: '/security', badge: null },
    ]
  },
  {
    id: 'help',
    label: 'Aide',
    items: [
      { id: 'academy', label: 'Academy', icon: GraduationCap, path: '/academy', badge: null },
      { id: 'support', label: 'Support', icon: LifeBuoy, path: '/support', badge: null },
    ]
  }
]

interface MobileDrawerNavProps {
  isOpen: boolean
  onClose: () => void
}

export function MobileDrawerNav({ isOpen, onClose }: MobileDrawerNavProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const { effectivePlan, hasPlan } = useUnifiedPlan()
  const [expandedGroups, setExpandedGroups] = useState<string[]>(['main', 'commerce', 'sourcing'])

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/')

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev =>
      prev.includes(groupId) ? prev.filter(g => g !== groupId) : [...prev, groupId]
    )
  }

  const canAccess = (minPlan?: string) => {
    if (!minPlan) return true
    if (minPlan === 'pro') return hasPlan('pro') || hasPlan('ultra_pro')
    if (minPlan === 'ultra_pro') return hasPlan('ultra_pro')
    return true
  }

  const handleNavigate = (path: string, minPlan?: string) => {
    if (canAccess(minPlan)) {
      navigate(path)
      onClose()
    }
  }

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="left" className="w-[300px] p-0 bg-background">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-4 border-b bg-gradient-to-br from-primary/5 to-background">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-primary to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="font-bold text-lg">ShopOpti</h1>
                  <Badge variant="outline" className="text-[10px] capitalize">
                    <Crown className="h-3 w-3 mr-1" />
                    {effectivePlan || 'Standard'}
                  </Badge>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Search */}
          <div className="p-3 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Rechercher..."
                className="w-full pl-9 pr-3 py-2 text-sm bg-muted/50 rounded-lg border-0 focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          {/* Navigation */}
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {navGroups.map(group => {
                const isExpanded = expandedGroups.includes(group.id)
                const hasActiveItem = group.items.some(item => isActive(item.path))

                return (
                  <Collapsible
                    key={group.id}
                    open={isExpanded || hasActiveItem}
                    onOpenChange={() => toggleGroup(group.id)}
                  >
                    <CollapsibleTrigger className="w-full">
                      <div className={cn(
                        "flex items-center justify-between w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                        "hover:bg-accent",
                        (isExpanded || hasActiveItem) && "bg-accent/50"
                      )}>
                        <span className="text-muted-foreground">{group.label}</span>
                        <ChevronDown className={cn(
                          "h-4 w-4 text-muted-foreground transition-transform",
                          (isExpanded || hasActiveItem) && "rotate-180"
                        )} />
                      </div>
                    </CollapsibleTrigger>

                    <CollapsibleContent>
                      <div className="py-1 space-y-0.5">
                        {group.items.map(item => {
                          const active = isActive(item.path)
                          const hasAccess = canAccess(item.minPlan)
                          const Icon = item.icon

                          return (
                            <button
                              key={item.id}
                              onClick={() => handleNavigate(item.path, item.minPlan)}
                              disabled={!hasAccess}
                              className={cn(
                                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all text-left",
                                active
                                  ? "bg-primary text-primary-foreground shadow-md"
                                  : hasAccess
                                    ? "hover:bg-accent"
                                    : "opacity-50 cursor-not-allowed"
                              )}
                            >
                              <Icon className={cn(
                                "h-4 w-4 flex-shrink-0",
                                active ? "text-primary-foreground" : "text-muted-foreground"
                              )} />
                              <span className="flex-1">{item.label}</span>
                              {item.badge && (
                                <Badge 
                                  variant={active ? "secondary" : "outline"} 
                                  className={cn(
                                    "text-[10px] px-1.5",
                                    item.badge === 'Nouveau' && !active && "bg-green-100 text-green-800 border-green-200",
                                    item.badge === 'Pro' && !active && "bg-purple-100 text-purple-800 border-purple-200",
                                    item.badge === 'AutoDS' && !active && "bg-blue-100 text-blue-800 border-blue-200",
                                    item.badge === 'Channable' && !active && "bg-orange-100 text-orange-800 border-orange-200"
                                  )}
                                >
                                  {item.badge}
                                </Badge>
                              )}
                              {!hasAccess && <Lock className="h-3 w-3 text-muted-foreground" />}
                            </button>
                          )
                        })}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                )
              })}
            </div>
          </ScrollArea>

          {/* Footer */}
          <div className="p-3 border-t bg-muted/30 space-y-2">
            <div className="flex items-center justify-between">
              <ThemeToggle collapsed={false} variant="ghost" />
              <Button variant="ghost" size="sm" className="text-muted-foreground gap-2">
                <LogOut className="h-4 w-4" />
                Déconnexion
              </Button>
            </div>
            <p className="text-xs text-center text-muted-foreground">
              © 2024 ShopOpti - v2.0
            </p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

export default MobileDrawerNav
