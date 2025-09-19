import React from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Crown, 
  Upload,
  Package,
  Users,
  ArrowRight,
  Zap
} from 'lucide-react'
import { Link } from 'react-router-dom'

export function QuickAccessMenu() {
  const quickActions = [
    {
      title: 'Import Ultra Pro',
      description: 'Import depuis 150+ marketplaces',
      url: '/import/advanced',
      icon: Upload,
      badge: 'Ultra',
      color: 'from-blue-500 to-blue-600'
    },
    {
      title: 'Catalogue Ultra Pro',
      description: 'Gestion intelligente avec IA',
      url: '/products/advanced',
      icon: Package,
      badge: 'Ultra',
      color: 'from-green-500 to-green-600'
    },
    {
      title: 'Fournisseurs Pro',
      description: 'Monitoring temps réel',
      url: '/suppliers/advanced',
      icon: Users,
      badge: 'Ultra',
      color: 'from-purple-500 to-purple-600'
    }
  ]

  return (
    <Card className="mb-6 bg-gradient-to-r from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 border-primary/20">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-yellow-500" />
            <h3 className="font-semibold">Accès Rapide Ultra Pro</h3>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link to="/advanced">
              Voir tous les modules
              <ArrowRight className="h-3 w-3 ml-1" />
            </Link>
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {quickActions.map((action) => (
            <Button
              key={action.url}
              variant="ghost"
              className="h-auto p-3 justify-start bg-white/50 hover:bg-white/80 border"
              asChild
            >
              <Link to={action.url}>
                <div className={`p-2 rounded-md bg-gradient-to-r ${action.color} mr-3`}>
                  <action.icon className="h-4 w-4 text-white" />
                </div>
                <div className="text-left flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{action.title}</span>
                    <Badge variant="secondary" className="h-4 text-xs">
                      {action.badge}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{action.description}</p>
                </div>
                <Zap className="h-3 w-3 text-primary ml-auto" />
              </Link>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}