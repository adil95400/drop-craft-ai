/**
 * Enhanced Tooltip System
 * Tooltips informatifs avec support multi-ligne et icônes
 */
import * as React from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { Info, HelpCircle, AlertTriangle, Sparkles, Lock, LucideIcon } from 'lucide-react';

export type TooltipVariant = 'info' | 'help' | 'warning' | 'pro' | 'locked';

interface EnhancedTooltipProps {
  children: React.ReactNode;
  content: React.ReactNode;
  title?: string;
  variant?: TooltipVariant;
  side?: 'top' | 'right' | 'bottom' | 'left';
  align?: 'start' | 'center' | 'end';
  className?: string;
  delayDuration?: number;
  asChild?: boolean;
}

const VARIANT_CONFIG: Record<TooltipVariant, { 
  icon: LucideIcon; 
  iconColor: string;
  bgColor: string;
}> = {
  info: { 
    icon: Info, 
    iconColor: 'text-blue-500',
    bgColor: 'bg-blue-500/10'
  },
  help: { 
    icon: HelpCircle, 
    iconColor: 'text-muted-foreground',
    bgColor: 'bg-muted'
  },
  warning: { 
    icon: AlertTriangle, 
    iconColor: 'text-amber-500',
    bgColor: 'bg-amber-500/10'
  },
  pro: { 
    icon: Sparkles, 
    iconColor: 'text-violet-500',
    bgColor: 'bg-violet-500/10'
  },
  locked: { 
    icon: Lock, 
    iconColor: 'text-orange-500',
    bgColor: 'bg-orange-500/10'
  },
};

export function EnhancedTooltip({
  children,
  content,
  title,
  variant = 'info',
  side = 'top',
  align = 'center',
  className,
  delayDuration = 300,
  asChild = false,
}: EnhancedTooltipProps) {
  const config = VARIANT_CONFIG[variant];
  const Icon = config.icon;

  return (
    <TooltipProvider delayDuration={delayDuration}>
      <Tooltip>
        <TooltipTrigger asChild={asChild}>
          {children}
        </TooltipTrigger>
        <TooltipContent
          side={side}
          align={align}
          className={cn(
            'max-w-xs p-3 shadow-lg border-border/50 backdrop-blur-sm',
            className
          )}
        >
          <div className="flex gap-3">
            <div className={cn(
              'flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center',
              config.bgColor
            )}>
              <Icon className={cn('h-4 w-4', config.iconColor)} />
            </div>
            <div className="flex-1 min-w-0">
              {title && (
                <p className="font-medium text-sm mb-1">{title}</p>
              )}
              <div className="text-xs text-muted-foreground leading-relaxed">
                {content}
              </div>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Quick info button with tooltip
interface InfoButtonProps {
  content: React.ReactNode;
  title?: string;
  variant?: TooltipVariant;
  className?: string;
  size?: 'sm' | 'md';
}

export function InfoButton({
  content,
  title,
  variant = 'help',
  className,
  size = 'sm',
}: InfoButtonProps) {
  const sizeClasses = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5';

  return (
    <EnhancedTooltip content={content} title={title} variant={variant}>
      <button
        type="button"
        className={cn(
          'inline-flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors rounded-full',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
          className
        )}
      >
        <HelpCircle className={sizeClasses} />
      </button>
    </EnhancedTooltip>
  );
}

// Badge with tooltip for pro features
interface ProBadgeProps {
  feature: string;
  className?: string;
}

export function ProFeatureBadge({ feature, className }: ProBadgeProps) {
  return (
    <EnhancedTooltip
      content={`Cette fonctionnalité "${feature}" est disponible avec le plan Pro ou supérieur.`}
      title="Fonctionnalité Pro"
      variant="pro"
    >
      <span className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full',
        'bg-gradient-to-r from-violet-500/20 to-purple-500/20 text-violet-600 dark:text-violet-400',
        'border border-violet-500/30 cursor-help',
        className
      )}>
        <Sparkles className="h-3 w-3" />
        PRO
      </span>
    </EnhancedTooltip>
  );
}

// Locked feature indicator
interface LockedFeatureProps {
  reason: string;
  upgradeAction?: () => void;
  className?: string;
}

export function LockedFeatureIndicator({ 
  reason, 
  upgradeAction,
  className 
}: LockedFeatureProps) {
  return (
    <EnhancedTooltip
      content={
        <div className="space-y-2">
          <p>{reason}</p>
          {upgradeAction && (
            <button
              onClick={upgradeAction}
              className="text-primary hover:underline text-xs font-medium"
            >
              Voir les plans →
            </button>
          )}
        </div>
      }
      title="Fonctionnalité verrouillée"
      variant="locked"
    >
      <span className={cn(
        'inline-flex items-center gap-1 text-muted-foreground cursor-help',
        className
      )}>
        <Lock className="h-3.5 w-3.5" />
      </span>
    </EnhancedTooltip>
  );
}

export default EnhancedTooltip;
