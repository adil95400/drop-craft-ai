/**
 * Navigation moderne pour accéder aux nouvelles interfaces
 */
import React from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Package,
  Users,
  ShoppingCart,
  Mail,
  Building2,
  Upload,
  CreditCard,
  Sparkles,
  ArrowRight,
  Activity,
  TrendingUp
} from 'lucide-react'
import { Link } from 'react-router-dom'

interface NavItem {
  title: string
  description: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  badge?: string
  badgeVariant?: 'default' | 'secondary' | 'destructive' | 'outline'
}

const modernPages: NavItem[] = [
  {
    title: 'Catalogue Produits',
    description: 'Éditeur avancé avec IA, SEO et gestion des prix',
    href: '/catalog',
    icon: Package,
    badge: 'Premium',
    badgeVariant: 'default'
  },
  {
    title: 'CRM & Marketing',
    description: 'Gestion complète des contacts et campagnes automatisées',
    href: '/crm',
    icon: Users,
    badge: 'Pro',
    badgeVariant: 'default'
  },
  {
    title: 'Monitoring Système',
    description: 'Surveillance temps réel et analytics avancés',
    href: '/monitoring',
    icon: Sparkles,
    badge: 'Ultra Pro',
    badgeVariant: 'destructive'
  },
  {
    title: 'Produits',
    description: 'Interface moderne pour gérer votre catalogue de produits',
    href: '/modern/products',
    icon: Package,
    badge: 'Nouveau',
    badgeVariant: 'secondary'
  },
  {
    title: 'Clients',
    description: 'Gestion avancée de votre base clients avec segmentation',
    href: '/modern/customers',
    icon: Users,
    badge: 'Nouveau',
    badgeVariant: 'secondary'
  },
  {
    title: 'Commandes',
    description: 'Suivi complet des commandes avec statuts et tracking',
    href: '/modern/orders',
    icon: ShoppingCart,
    badge: 'Nouveau',
    badgeVariant: 'secondary'
  },
  {
    title: 'Marketing',
    description: 'Campagnes email/SMS avec analytics et automation',
    href: '/modern/marketing',
    icon: Mail,
    badge: 'Nouveau',
    badgeVariant: 'secondary'
  },
  {
    title: 'Fournisseurs',
    description: 'Hub fournisseurs avec marketplace et connecteurs',
    href: '/modern/suppliers',
    icon: Building2,
    badge: 'Nouveau',
    badgeVariant: 'secondary'
  },
  {
    title: 'Import',
    description: 'Import multi-formats avec mappage intelligent',
    href: '/modern/import',
    icon: Upload,
    badge: 'Nouveau',
    badgeVariant: 'secondary'
  },
  {
    title: 'Facturation',
    description: 'Gestion des abonnements et facturation Stripe',
    href: '/modern/billing',
    icon: CreditCard,
    badge: 'Nouveau',
    badgeVariant: 'secondary'
  }
]

export function ModernNavigation() {
  return (
    <div className="space-y-6 p-6">
        <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-2">
          <Sparkles className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Drop Craft AI - Commercialisé</h1>
        </div>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          <strong>🎯 100% PRÊT POUR LA COMMERCIALISATION</strong> - Plateforme e-commerce complète avec fonctionnalités premium, 
          monitoring avancé, CRM professionnel et intégrations enterprise.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {modernPages.map((page) => {
          const IconComponent = page.icon
          return (
            <Card key={page.href} className="group hover:shadow-lg transition-all duration-200 hover:-translate-y-1">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-lg bg-primary/10 w-fit">
                    <IconComponent className="h-6 w-6 text-primary" />
                  </div>
                  {page.badge && (
                    <Badge variant={page.badgeVariant} className="text-xs">
                      {page.badge}
                    </Badge>
                  )}
                </div>
                <CardTitle className="text-xl">{page.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {page.description}
                </p>
                <Button asChild className="w-full group-hover:bg-primary/90 transition-colors">
                  <Link to={page.href} className="flex items-center gap-2">
                    Découvrir
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl p-6 text-center">
        <h2 className="text-xl font-semibold mb-2">🚀 Plateforme E-commerce Commercialisée</h2>
        <div className="grid gap-4 md:grid-cols-3 mt-4">
          <div className="space-y-2">
            <div className="p-2 rounded-lg bg-primary/20 w-fit mx-auto">
              <Activity className="h-5 w-5 text-primary" />
            </div>
            <h3 className="font-medium">Monitoring Pro</h3>
            <p className="text-sm text-muted-foreground">
              Surveillance temps réel avec alertes automatiques
            </p>
          </div>
          <div className="space-y-2">
            <div className="p-2 rounded-lg bg-primary/20 w-fit mx-auto">
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
            <h3 className="font-medium">CRM & Analytics</h3>
            <p className="text-sm text-muted-foreground">
              Gestion complète des clients et campagnes
            </p>
          </div>
          <div className="space-y-2">
            <div className="p-2 rounded-lg bg-primary/20 w-fit mx-auto">
              <Package className="h-5 w-5 text-primary" />
            </div>
            <h3 className="font-medium">Catalogue IA</h3>
            <p className="text-sm text-muted-foreground">
              Éditeur avancé avec génération automatique
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}