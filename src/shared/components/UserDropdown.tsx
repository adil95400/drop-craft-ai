// COMPOSANT UNIFIÉ POUR DROPDOWN UTILISATEUR
// Remplace UserAccountDropdown, AdminUserDropdown, etc.

import { LogOut, Settings, User, Shield, BarChart3 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useAuthOptimized } from '@/shared/hooks/useAuthOptimized'
import { useNavigate } from 'react-router-dom'

interface UserDropdownProps {
  variant?: 'default' | 'admin' | 'minimal'
  showAdminLinks?: boolean
}

export const UserDropdown = ({ 
  variant = 'default',
  showAdminLinks = true 
}: UserDropdownProps) => {
  const { user, profile, isAdmin, signOut, canAccess } = useAuthOptimized()
  const navigate = useNavigate()

  if (!user) return null

  const handleSignOut = async () => {
    try {
      await signOut()
      navigate('/auth')
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error)
    }
  }

  const getUserDisplayName = () => {
    return profile?.full_name || user?.user_metadata?.full_name || user?.email || 'Utilisateur'
  }

  const getUserInitials = () => {
    const name = getUserDisplayName()
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
          <Avatar className="h-10 w-10">
            <AvatarImage src={profile?.avatar_url} alt={getUserDisplayName()} />
            <AvatarFallback className="bg-primary text-primary-foreground">
              {getUserInitials()}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">
              {getUserDisplayName()}
            </p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
            {profile?.role && (
              <p className="text-xs leading-none text-muted-foreground capitalize">
                {profile.role}
              </p>
            )}
          </div>
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator />
        
        {variant !== 'minimal' && (
          <>
            <DropdownMenuItem onClick={() => navigate('/dashboard/profile')}>
              <User className="mr-2 h-4 w-4" />
              <span>Profil</span>
            </DropdownMenuItem>
            
            <DropdownMenuItem onClick={() => navigate('/dashboard/settings')}>
              <Settings className="mr-2 h-4 w-4" />
              <span>Paramètres</span>
            </DropdownMenuItem>
            
            {showAdminLinks && isAdmin && (
              <>
                <DropdownMenuSeparator />
                
                <DropdownMenuItem onClick={() => navigate('/admin-panel')}>
                  <Shield className="mr-2 h-4 w-4" />
                  <span>Administration</span>
                </DropdownMenuItem>
                
                {canAccess('view_analytics_advanced') && (
                  <DropdownMenuItem onClick={() => navigate('/admin/analytics')}>
                    <BarChart3 className="mr-2 h-4 w-4" />
                    <span>Analytics Avancées</span>
                  </DropdownMenuItem>
                )}
              </>
            )}
            
            <DropdownMenuSeparator />
          </>
        )}
        
        <DropdownMenuItem onClick={handleSignOut}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Se déconnecter</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}