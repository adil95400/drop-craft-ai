/**
 * Composants d'aide contextuelle et tooltips informatifs
 * Pour améliorer l'expérience utilisateur
 */

import { useState } from 'react'
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  HelpCircle, Lightbulb, Info, ArrowRight, ExternalLink, 
  Video, BookOpen, MessageCircle, X
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface HelpTooltipProps {
  content: string
  title?: string
  side?: 'top' | 'right' | 'bottom' | 'left'
  children?: React.ReactNode
  className?: string
}

export function HelpTooltip({ 
  content, 
  title, 
  side = 'top', 
  children,
  className 
}: HelpTooltipProps) {
  return (
    <TooltipProvider>
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          {children || (
            <button className={cn("text-muted-foreground hover:text-foreground transition-colors", className)}>
              <HelpCircle className="h-4 w-4" />
            </button>
          )}
        </TooltipTrigger>
        <TooltipContent side={side} className="max-w-xs">
          {title && <p className="font-medium mb-1">{title}</p>}
          <p className="text-sm">{content}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

interface FeatureHintProps {
  title: string
  description: string
  action?: {
    label: string
    onClick: () => void
  }
  icon?: React.ComponentType<{ className?: string }>
  variant?: 'info' | 'tip' | 'warning'
  dismissible?: boolean
  onDismiss?: () => void
}

export function FeatureHint({
  title,
  description,
  action,
  icon: Icon = Lightbulb,
  variant = 'tip',
  dismissible = true,
  onDismiss
}: FeatureHintProps) {
  const [isDismissed, setIsDismissed] = useState(false)

  if (isDismissed) return null

  const handleDismiss = () => {
    setIsDismissed(true)
    onDismiss?.()
  }

  const variantStyles = {
    info: 'bg-info/10 border-info/20 text-info',
    tip: 'bg-primary/10 border-primary/20 text-primary',
    warning: 'bg-warning/10 border-warning/20 text-warning'
  }

  return (
    <div className={cn(
      "relative p-4 rounded-lg border",
      variantStyles[variant]
    )}>
      {dismissible && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 h-6 w-6 text-muted-foreground hover:text-foreground"
          onClick={handleDismiss}
        >
          <X className="h-3 w-3" />
        </Button>
      )}
      
      <div className="flex gap-3">
        <div className="flex-shrink-0 mt-0.5">
          <Icon className="h-5 w-5" />
        </div>
        <div className="space-y-2">
          <h4 className="font-medium text-foreground">{title}</h4>
          <p className="text-sm text-muted-foreground">{description}</p>
          {action && (
            <Button 
              variant="link" 
              className="h-auto p-0 text-primary"
              onClick={action.onClick}
            >
              {action.label}
              <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

interface QuickHelpCardProps {
  title: string
  description: string
  links: Array<{
    label: string
    href?: string
    onClick?: () => void
    icon?: React.ComponentType<{ className?: string }>
    badge?: string
  }>
}

export function QuickHelpCard({ title, description, links }: QuickHelpCardProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <HelpCircle className="h-5 w-5 text-primary" />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {links.map((link, index) => {
          const LinkIcon = link.icon || ExternalLink
          
          return (
            <button
              key={index}
              onClick={link.onClick}
              className={cn(
                "flex items-center justify-between w-full p-3 rounded-lg text-sm",
                "bg-muted/50 hover:bg-muted transition-colors text-left"
              )}
            >
              <div className="flex items-center gap-3">
                <LinkIcon className="h-4 w-4 text-muted-foreground" />
                <span>{link.label}</span>
              </div>
              <div className="flex items-center gap-2">
                {link.badge && (
                  <Badge variant="secondary" className="text-xs">
                    {link.badge}
                  </Badge>
                )}
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </button>
          )
        })}
      </CardContent>
    </Card>
  )
}

// Default help resources
export function DefaultHelpResources() {
  const resources = [
    {
      label: 'Guide de démarrage rapide',
      icon: BookOpen,
      badge: 'Recommandé',
      onClick: () => window.open('/academy', '_self')
    },
    {
      label: 'Tutoriels vidéo',
      icon: Video,
      onClick: () => window.open('/academy/videos', '_self')
    },
    {
      label: 'Contacter le support',
      icon: MessageCircle,
      onClick: () => window.open('/support', '_self')
    }
  ]

  return (
    <QuickHelpCard
      title="Besoin d'aide ?"
      description="Ressources pour vous aider à démarrer"
      links={resources}
    />
  )
}
