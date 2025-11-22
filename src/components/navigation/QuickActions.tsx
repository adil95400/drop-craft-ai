import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Upload, Activity, ShoppingCart, BarChart3, ArrowRight, Zap, Link as LinkIcon } from 'lucide-react'
import { Link } from 'react-router-dom'

const quickActions = [
  {
    title: "Import par URL",
    description: "Importer depuis n'importe quel site",
    href: "/products/import/url",
    icon: LinkIcon,
    badge: "Nouveau",
    color: "text-blue-600"
  },
  {
    title: "Import Produits",
    description: "CSV, API, scraping intelligent",
    href: "/products/import/advanced",
    icon: Upload,
    badge: "Pro",
    color: "text-blue-600"
  },
  {
    title: "Sync Manager", 
    description: "Synchronisation bidirectionnelle",
    href: "/dashboard/sync-manager",
    icon: Activity,
    badge: "Nouveau",
    color: "text-green-600"
  },
  {
    title: "Centre Commandes",
    description: "Gestion multi-plateformes",
    href: "/dashboard/orders-center", 
    icon: ShoppingCart,
    badge: "Nouveau",
    color: "text-purple-600"
  },
  {
    title: "Analytics Pro",
    description: "Rapports temps réel",
    href: "/analytics",
    icon: BarChart3,
    badge: "Pro",
    color: "text-orange-600"
  }
]

export function QuickActions() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-primary" />
          <CardTitle>Actions Rapides</CardTitle>
        </div>
        <CardDescription>
          Accédez rapidement aux fonctionnalités avancées
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {quickActions.map((action) => {
            const IconComponent = action.icon
            return (
              <Button
                key={action.href}
                variant="outline"
                asChild
                className="h-auto p-4 justify-start hover:bg-muted/50 transition-colors"
              >
                <Link to={action.href} className="flex items-center gap-3 w-full">
                  <div className={`p-2 rounded-lg bg-muted ${action.color}`}>
                    <IconComponent className="w-4 h-4" />
                  </div>
                  <div className="flex-1 text-left space-y-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-sm">{action.title}</h3>
                      {action.badge && (
                        <Badge variant="secondary" className="text-xs">
                          {action.badge}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {action.description}
                    </p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground" />
                </Link>
              </Button>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}