import React from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Download,
  Globe,
  Printer,
  Code,
  Store
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'

export const QuickExtensionActions: React.FC = () => {
  const navigate = useNavigate()

  const quickActions = [
    {
      label: 'Extension Navigateur',
      description: 'Télécharger l\'extension Chrome/Firefox',
      icon: <Globe className="w-5 h-5" />,
      route: '/extension-download',
      color: 'bg-blue-50 hover:bg-blue-100 text-blue-700',
      badge: 'Beta'
    },
    {
      label: 'Marketplace',
      description: 'Parcourir les extensions disponibles',
      icon: <Store className="w-5 h-5" />,
      route: '/extensions/marketplace',
      color: 'bg-green-50 hover:bg-green-100 text-green-700'
    },
    {
      label: 'Developer Hub',
      description: 'Créer et publier des extensions',
      icon: <Code className="w-5 h-5" />,
      route: '/extensions/developer',
      color: 'bg-purple-50 hover:bg-purple-100 text-purple-700'
    },
    {
      label: 'Gestionnaire d\'Impression',
      description: 'Templates et jobs d\'impression',
      icon: <Printer className="w-5 h-5" />,
      route: '/print',
      color: 'bg-orange-50 hover:bg-orange-100 text-orange-700'
    }
  ]

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h2 className="text-lg font-semibold mb-2">Actions Rapides</h2>
        <p className="text-sm text-muted-foreground">
          Accédez rapidement aux fonctionnalités d'extensions les plus utilisées
        </p>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        {quickActions.map((action) => (
          <Card 
            key={action.label} 
            className={`cursor-pointer transition-all duration-200 ${action.color} border-none`}
            onClick={() => navigate(action.route)}
          >
            <CardContent className="p-4 text-center">
              <div className="flex justify-center mb-2">
                {action.icon}
              </div>
              <h3 className="font-medium text-sm mb-1">{action.label}</h3>
              <p className="text-xs opacity-75">{action.description}</p>
              {action.badge && (
                <Badge variant="secondary" className="mt-2 text-xs">
                  {action.badge}
                </Badge>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
      
      <div className="pt-2 border-t">
        <Button 
          variant="outline" 
          className="w-full" 
          onClick={() => navigate('/extensions')}
        >
          Voir toutes les extensions
        </Button>
      </div>
    </div>
  )
}

export default QuickExtensionActions