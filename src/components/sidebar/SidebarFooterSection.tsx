/**
 * SidebarFooterSection - Footer compact et professionnel
 */
import { memo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { SidebarFooter } from '@/components/ui/sidebar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { HelpCircle, Settings, LogOut, Crown, Map } from 'lucide-react'
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext'
import { useUnifiedPlan } from '@/lib/unified-plan-system'
import { cn } from '@/lib/utils'

interface SidebarFooterSectionProps {
  collapsed: boolean
}

export const SidebarFooterSection = memo<SidebarFooterSectionProps>(({ collapsed }) => {
  const navigate = useNavigate()
  const { profile, signOut } = useUnifiedAuth()
  const { effectivePlan } = useUnifiedPlan()

  const handleNavigate = useCallback((path: string) => navigate(path), [navigate])
  const handleSignOut = useCallback(() => signOut(), [signOut])

  const planConfig: Record<string, { label: string; className: string }> = {
    free: { label: 'Free', className: 'bg-muted text-muted-foreground' },
    standard: { label: 'Standard', className: 'bg-blue-500/20 text-blue-600 dark:text-blue-400' },
    pro: { label: 'Pro', className: 'bg-primary/20 text-primary' },
    ultra_pro: { label: 'Ultra', className: 'bg-warning/20 text-warning' }
  }

  const plan = planConfig[effectivePlan || 'standard'] || planConfig.standard
  const userInitial = ((profile as any)?.email?.charAt(0) || 'U').toUpperCase()
  const userName = (profile as any)?.first_name || (profile as any)?.email?.split('@')[0] || 'User'

  return (
    <SidebarFooter className="border-t border-sidebar-border/50 bg-sidebar">
      <div className={cn("p-2 space-y-2", collapsed && "p-1.5")}>
        {/* Quick Actions - only when expanded */}
        {!collapsed && (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="flex-1 h-7 text-xs text-muted-foreground hover:text-foreground"
              onClick={() => handleNavigate('/settings')}
              title="Paramètres"
            >
              <Settings className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="flex-1 h-7 text-xs text-muted-foreground hover:text-foreground"
              onClick={() => handleNavigate('/sitemap')}
              title="Plan du site"
            >
              <Map className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="flex-1 h-7 text-xs text-muted-foreground hover:text-foreground"
              onClick={() => handleNavigate('/support')}
              title="Aide"
            >
              <HelpCircle className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
        
        {/* User Info Compact */}
        <div 
          className={cn(
            "flex items-center gap-2 p-1.5 rounded-md bg-sidebar-accent/30 hover:bg-sidebar-accent/50 transition-colors cursor-pointer",
            collapsed && "justify-center p-1"
          )} 
          onClick={() => handleNavigate('/profile')}
        >
          <div className="relative flex-shrink-0">
            <div className={cn(
              "bg-primary rounded-full flex items-center justify-center text-primary-foreground font-medium",
              collapsed ? "w-7 h-7 text-xs" : "w-8 h-8 text-sm"
            )}>
              {userInitial}
            </div>
            {effectivePlan === 'ultra_pro' && (
              <Crown className="absolute -top-0.5 -right-0.5 h-3 w-3 text-warning fill-warning" />
            )}
          </div>
          
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate">{userName}</p>
              <Badge className={cn("text-[9px] px-1 py-0 h-3.5", plan.className)}>
                {plan.label}
              </Badge>
            </div>
          )}
        </div>

        {/* Sign Out */}
        <Button
          variant="ghost"
          size={collapsed ? "icon" : "sm"}
          className={cn(
            "text-muted-foreground hover:text-destructive hover:bg-destructive/10",
            collapsed ? "w-full h-7" : "w-full h-7 text-xs justify-start gap-2"
          )}
          onClick={handleSignOut}
        >
          <LogOut className="h-3.5 w-3.5" />
          {!collapsed && <span>Déconnexion</span>}
        </Button>
      </div>
    </SidebarFooter>
  )
})

SidebarFooterSection.displayName = 'SidebarFooterSection'
