/**
 * SidebarFooterSection - Footer du sidebar avec quick actions et infos utilisateur
 */
import { memo } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  SidebarFooter, SidebarMenu, SidebarMenuItem, SidebarMenuButton 
} from '@/components/ui/sidebar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  HelpCircle, Settings, CreditCard, LogOut, Sparkles, 
  MessageSquare, Zap, Crown, Bell
} from 'lucide-react'
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

  const quickLinks = [
    { icon: Settings, label: 'Paramètres', path: '/dashboard/settings' },
    { icon: CreditCard, label: 'Abonnement', path: '/dashboard/billing' },
    { icon: HelpCircle, label: 'Support', path: '/support' },
  ]

  const planColors = {
    free: 'bg-muted text-muted-foreground',
    standard: 'bg-blue-500/20 text-blue-700 dark:text-blue-300',
    pro: 'bg-primary/20 text-primary',
    ultra_pro: 'bg-gradient-to-r from-warning to-destructive text-white'
  }

  const getPlanLabel = (plan: string) => {
    const labels: Record<string, string> = {
      free: 'Gratuit',
      standard: 'Standard',
      pro: 'Pro',
      ultra_pro: 'Ultra Pro'
    }
    return labels[plan] || 'Standard'
  }

  return (
    <SidebarFooter className="border-t border-border/40 bg-gradient-to-t from-muted/30 to-transparent">
      <div className={cn("p-3 space-y-3", collapsed && "p-2")}>
        {/* Quick Actions */}
        {!collapsed && (
          <>
            <div className="flex items-center gap-2">
              {quickLinks.map((link) => (
                <Button
                  key={link.path}
                  variant="ghost"
                  size="sm"
                  className="flex-1 h-8 text-xs text-muted-foreground hover:text-foreground hover:bg-accent/50"
                  onClick={() => navigate(link.path)}
                >
                  <link.icon className="h-3.5 w-3.5" />
                </Button>
              ))}
            </div>
            
            <Separator className="bg-border/40" />
          </>
        )}
        
        {/* User Info */}
        <div className={cn(
          "flex items-center gap-3 p-2 rounded-lg bg-accent/30 hover:bg-accent/50 transition-colors cursor-pointer group",
          collapsed && "justify-center p-1.5"
        )} onClick={() => navigate('/dashboard/profile')}>
        {/* Avatar */}
          <div className="relative flex-shrink-0">
            <div className={cn(
              "bg-gradient-to-br from-primary to-purple-600 rounded-full flex items-center justify-center text-white font-medium shadow-md",
              collapsed ? "w-8 h-8 text-xs" : "w-9 h-9 text-sm"
            )}>
              {(profile as any)?.email?.charAt(0).toUpperCase() || (profile as any)?.first_name?.charAt(0).toUpperCase() || 'U'}
            </div>
            {effectivePlan === 'ultra_pro' && (
              <Crown className="absolute -top-1 -right-1 h-3.5 w-3.5 text-warning fill-warning" />
            )}
          </div>
          
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate group-hover:text-foreground transition-colors">
                {(profile as any)?.first_name || (profile as any)?.email?.split('@')[0] || 'Utilisateur'}
              </p>
              <div className="flex items-center gap-2">
                <Badge className={cn("text-[10px] px-1.5 py-0 h-4", planColors[effectivePlan || 'standard'])}>
                  {getPlanLabel(effectivePlan || 'standard')}
                </Badge>
              </div>
            </div>
          )}
        </div>

        {/* Sign Out */}
        {!collapsed && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full h-8 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 justify-start gap-2"
            onClick={() => signOut()}
          >
            <LogOut className="h-3.5 w-3.5" />
            Déconnexion
          </Button>
        )}
        
        {collapsed && (
          <Button
            variant="ghost"
            size="icon"
            className="w-full h-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            onClick={() => signOut()}
          >
            <LogOut className="h-4 w-4" />
          </Button>
        )}
      </div>
    </SidebarFooter>
  )
})

SidebarFooterSection.displayName = 'SidebarFooterSection'
