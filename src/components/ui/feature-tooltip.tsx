/**
 * Feature Tooltip Component
 * Rich tooltips for advanced features with descriptions and shortcuts
 */
import * as React from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { HelpCircle, Info, Sparkles, Zap, Crown, Lock, ExternalLink } from 'lucide-react';

type FeatureStatus = 'new' | 'beta' | 'pro' | 'enterprise' | 'coming-soon';

interface FeatureTooltipProps {
  children: React.ReactNode;
  title: string;
  description: string;
  status?: FeatureStatus;
  shortcut?: string;
  learnMoreUrl?: string;
  side?: 'top' | 'right' | 'bottom' | 'left';
  align?: 'start' | 'center' | 'end';
  className?: string;
  triggerClassName?: string;
  showIcon?: boolean;
  iconType?: 'help' | 'info' | 'sparkles';
}

const statusConfig: Record<
  FeatureStatus,
  {
    label: string;
    icon: typeof Sparkles;
    color: string;
    bgColor: string;
  }
> = {
  new: {
    label: 'Nouveau',
    icon: Sparkles,
    color: 'text-success',
    bgColor: 'bg-success/10 border-success/30',
  },
  beta: {
    label: 'Bêta',
    icon: Zap,
    color: 'text-warning',
    bgColor: 'bg-warning/10 border-warning/30',
  },
  pro: {
    label: 'Pro',
    icon: Crown,
    color: 'text-primary',
    bgColor: 'bg-primary/10 border-primary/30',
  },
  enterprise: {
    label: 'Enterprise',
    icon: Crown,
    color: 'text-info',
    bgColor: 'bg-info/10 border-info/30',
  },
  'coming-soon': {
    label: 'Bientôt',
    icon: Lock,
    color: 'text-muted-foreground',
    bgColor: 'bg-muted border-border',
  },
};

const iconComponents = {
  help: HelpCircle,
  info: Info,
  sparkles: Sparkles,
};

export function FeatureTooltip({
  children,
  title,
  description,
  status,
  shortcut,
  learnMoreUrl,
  side = 'top',
  align = 'center',
  className,
  triggerClassName,
  showIcon = false,
  iconType = 'help',
}: FeatureTooltipProps) {
  const IconComponent = iconComponents[iconType];
  const statusInfo = status ? statusConfig[status] : null;
  const StatusIcon = statusInfo?.icon;

  return (
    <TooltipProvider>
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          <span className={cn('inline-flex items-center gap-1.5 cursor-help', triggerClassName)}>
            {children}
            {showIcon && (
              <IconComponent className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground transition-colors" />
            )}
          </span>
        </TooltipTrigger>
        <TooltipContent
          side={side}
          align={align}
          className={cn('max-w-xs p-4 space-y-2', className)}
          sideOffset={8}
        >
          {/* Header with status badge */}
          <div className="flex items-start justify-between gap-3">
            <h4 className="font-semibold text-sm">{title}</h4>
            {statusInfo && (
              <Badge
                variant="outline"
                className={cn(
                  'text-[10px] px-1.5 py-0 shrink-0',
                  statusInfo.bgColor,
                  statusInfo.color
                )}
              >
                {StatusIcon && <StatusIcon className="h-2.5 w-2.5 mr-1" />}
                {statusInfo.label}
              </Badge>
            )}
          </div>

          {/* Description */}
          <p className="text-xs text-muted-foreground leading-relaxed">
            {description}
          </p>

          {/* Footer with shortcut and learn more */}
          {(shortcut || learnMoreUrl) && (
            <div className="flex items-center justify-between pt-2 border-t border-border">
              {shortcut && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span>Raccourci:</span>
                  <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">
                    {shortcut}
                  </kbd>
                </div>
              )}
              {learnMoreUrl && (
                <a
                  href={learnMoreUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                >
                  En savoir plus
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Quick info tooltip (simplified version)
interface QuickTooltipProps {
  children: React.ReactNode;
  content: string;
  side?: 'top' | 'right' | 'bottom' | 'left';
  className?: string;
}

export function QuickTooltip({
  children,
  content,
  side = 'top',
  className,
}: QuickTooltipProps) {
  return (
    <TooltipProvider>
      <Tooltip delayDuration={200}>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipContent side={side} className={cn('text-xs', className)}>
          {content}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Help icon with tooltip
interface HelpTooltipProps {
  content: string;
  title?: string;
  side?: 'top' | 'right' | 'bottom' | 'left';
  className?: string;
  iconClassName?: string;
}

export function HelpTooltip({
  content,
  title,
  side = 'top',
  className,
  iconClassName,
}: HelpTooltipProps) {
  return (
    <TooltipProvider>
      <Tooltip delayDuration={200}>
        <TooltipTrigger asChild>
          <HelpCircle
            className={cn(
              'h-4 w-4 text-muted-foreground hover:text-foreground transition-colors cursor-help',
              iconClassName
            )}
          />
        </TooltipTrigger>
        <TooltipContent
          side={side}
          className={cn('max-w-xs', title && 'space-y-1', className)}
        >
          {title && <p className="font-medium text-sm">{title}</p>}
          <p className="text-xs text-muted-foreground">{content}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Keyboard shortcut display
interface ShortcutBadgeProps {
  keys: string[];
  className?: string;
}

export function ShortcutBadge({ keys, className }: ShortcutBadgeProps) {
  return (
    <div className={cn('flex items-center gap-0.5', className)}>
      {keys.map((key, i) => (
        <React.Fragment key={i}>
          <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono border border-border">
            {key}
          </kbd>
          {i < keys.length - 1 && (
            <span className="text-muted-foreground text-[10px]">+</span>
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

// Feature flag indicator
interface FeatureFlagProps {
  status: FeatureStatus;
  className?: string;
}

export function FeatureFlagBadge({ status, className }: FeatureFlagProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <Badge
      variant="outline"
      className={cn(
        'text-[10px] px-1.5 py-0 font-medium',
        config.bgColor,
        config.color,
        className
      )}
    >
      <Icon className="h-2.5 w-2.5 mr-1" />
      {config.label}
    </Badge>
  );
}
