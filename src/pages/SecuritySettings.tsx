import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useEnhancedAuth } from '@/hooks/useEnhancedAuth'
import { SessionManager } from '@/components/auth/SessionManager'
import { RoleManager } from '@/components/admin/RoleManager'
import { UserForceDisconnect } from '@/components/admin/UserForceDisconnect'
import { 
  Shield, 
  Users, 
  Settings, 
  Activity,
  Eye,
  Bell,
  UserX
} from 'lucide-react'

export const SecuritySettings = () => {
  const { isAdmin, isManager, role } = useEnhancedAuth()

  const tabs = [
    {
      value: 'sessions',
      label: 'Sessions',
      icon: Activity,
      component: <SessionManager />,
      description: 'Gérez vos connexions actives'
    }
  ]

  // Add admin-only tabs
  if (isAdmin) {
    tabs.push(
      {
        value: 'roles',
        label: 'Rôles & Permissions',
        icon: Users,
        component: <RoleManager />,
        description: 'Gérez les rôles utilisateurs'
      },
      {
        value: 'disconnect',
        label: 'Déconnexion Forcée',
        icon: UserX,
        component: (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Utilisez cette fonctionnalité pour déconnecter immédiatement un utilisateur 
              de toutes ses sessions actives. Cette action est irréversible.
            </p>
            <UserForceDisconnect />
          </div>
        ),
        description: 'Forcer la déconnexion d\'un utilisateur'
      }
    )
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="flex items-center justify-center w-12 h-12 bg-primary/10 rounded-lg">
          <Shield className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">Sécurité & Authentification</h1>
          <p className="text-muted-foreground">
            Gérez vos paramètres de sécurité et authentification
          </p>
        </div>
      </div>

      {/* Role Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Votre Rôle Actuel
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium capitalize">{role}</h3>
              <p className="text-sm text-muted-foreground">
                {role === 'admin' && 'Accès complet à toutes les fonctionnalités'}
                {role === 'manager' && 'Gestion des clients, produits et analytics'}
                {role === 'user' && 'Accès standard aux fonctionnalités utilisateur'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {role === 'admin' && (
                <>
                  <Shield className="h-4 w-4 text-red-500" />
                  <span className="text-sm font-medium text-red-500">Administrateur</span>
                </>
              )}
              {role === 'manager' && (
                <>
                  <Settings className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-medium text-blue-500">Manager</span>
                </>
              )}
              {role === 'user' && (
                <>
                  <Users className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-500">Utilisateur</span>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security Tabs */}
      <Tabs defaultValue="sessions" className="w-full">
        <TabsList className={`grid w-full ${isAdmin ? 'grid-cols-3' : 'grid-cols-1'}`}>
          {tabs.map((tab) => {
            const IconComponent = tab.icon
            return (
              <TabsTrigger 
                key={tab.value} 
                value={tab.value}
                className="flex items-center gap-2"
              >
                <IconComponent className="h-4 w-4" />
                {tab.label}
              </TabsTrigger>
            )
          })}
        </TabsList>

        {tabs.map((tab) => (
          <TabsContent key={tab.value} value={tab.value} className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <tab.icon className="h-5 w-5" />
                  {tab.label}
                </CardTitle>
                <CardDescription>
                  {tab.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {tab.component}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {/* Security Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Recommandations de Sécurité
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <h4 className="font-medium text-green-600">✓ Activé</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Authentification multi-session</li>
                <li>• Gestion des rôles</li>
                <li>• Tracking des connexions</li>
                <li>• OAuth Google disponible</li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium text-orange-600">⚠ Recommandé</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Activer la 2FA (bientôt disponible)</li>
                <li>• Revoir régulièrement les sessions</li>
                <li>• Utiliser des mots de passe forts</li>
                <li>• Se déconnecter des appareils publics</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default SecuritySettings