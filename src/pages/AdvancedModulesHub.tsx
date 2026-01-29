import React from 'react'
import { Link } from 'react-router-dom'
import { NAV_GROUPS, MODULE_REGISTRY } from '@/config/modules'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { icons, LucideIcon } from 'lucide-react'

// Helper to get icon component from string name
const getIcon = (iconName: string): LucideIcon => {
  return icons[iconName as keyof typeof icons] || icons.Circle
}

// Get modules grouped by groupId
const getModulesByGroup = (groupId: string) => {
  return Object.values(MODULE_REGISTRY)
    .filter(module => module.groupId === groupId)
    .sort((a, b) => a.order - b.order)
}

export default function AdvancedModulesHub() {
  return (
    <div className="container mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Modules Avancés</h1>
        <p className="text-muted-foreground mt-2">
          Découvrez tous les modules disponibles pour gérer votre activité
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {NAV_GROUPS.map((group) => {
          const GroupIcon = getIcon(group.icon)
          const modules = getModulesByGroup(group.id)

          return (
            <Card key={group.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GroupIcon className="h-5 w-5" />
                  {group.label}
                </CardTitle>
                <CardDescription>
                  {modules.length} modules disponibles
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {modules.slice(0, 5).map((module) => {
                    const ModuleIcon = getIcon(module.icon)
                    return (
                      <li key={module.route}>
                        <Link 
                          to={module.route}
                          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <ModuleIcon className="h-4 w-4" />
                          {module.name}
                        </Link>
                      </li>
                    )
                  })}
                  {modules.length > 5 && (
                    <li className="text-xs text-muted-foreground">
                      +{modules.length - 5} autres modules
                    </li>
                  )}
                </ul>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}