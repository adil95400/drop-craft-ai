/**
 * Security Badge Component
 * Visual trust indicators for encrypted data and secure features
 */
import { Shield, ShieldCheck, Lock, Eye, EyeOff, Key, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';

type SecurityLevel = 'basic' | 'standard' | 'high' | 'enterprise';
type BadgeVariant = 'default' | 'inline' | 'compact' | 'detailed';

interface SecurityBadgeProps {
  level?: SecurityLevel;
  variant?: BadgeVariant;
  showTooltip?: boolean;
  label?: string;
  className?: string;
  features?: string[];
}

const securityConfig: Record<
  SecurityLevel,
  {
    icon: typeof Shield;
    label: string;
    color: string;
    bgColor: string;
    description: string;
    features: string[];
  }
> = {
  basic: {
    icon: Shield,
    label: 'Données protégées',
    color: 'text-muted-foreground',
    bgColor: 'bg-muted/50',
    description: 'Protection de base',
    features: ['HTTPS', 'Authentification requise'],
  },
  standard: {
    icon: Lock,
    label: 'Données chiffrées',
    color: 'text-info',
    bgColor: 'bg-info/10',
    description: 'Chiffrement standard AES-256',
    features: ['Chiffrement AES-256', 'HTTPS TLS 1.3', 'Sessions sécurisées'],
  },
  high: {
    icon: ShieldCheck,
    label: 'Sécurité renforcée',
    color: 'text-success',
    bgColor: 'bg-success/10',
    description: 'Protection avancée des données',
    features: [
      'Chiffrement AES-256',
      'Authentification 2FA',
      'Logs d\'audit',
      'Isolation des données',
    ],
  },
  enterprise: {
    icon: Key,
    label: 'Sécurité Enterprise',
    color: 'text-primary',
    bgColor: 'bg-primary/10',
    description: 'Niveau de sécurité bancaire',
    features: [
      'Chiffrement de bout en bout',
      'SOC 2 Type II',
      'RGPD compliant',
      'Clés gérées par client',
      'Audit en temps réel',
    ],
  },
};

export function SecurityBadge({
  level = 'standard',
  variant = 'default',
  showTooltip = true,
  label,
  className,
  features,
}: SecurityBadgeProps) {
  const config = securityConfig[level];
  const Icon = config.icon;
  const displayLabel = label || config.label;
  const displayFeatures = features || config.features;

  const badgeContent = (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full transition-all',
        variant === 'compact' && 'p-1',
        variant === 'inline' && 'text-xs gap-1',
        variant === 'default' && 'px-2.5 py-1 text-xs font-medium',
        variant === 'detailed' && 'px-3 py-1.5 text-sm font-medium',
        config.bgColor,
        config.color,
        className
      )}
    >
      <Icon
        className={cn(
          variant === 'compact' && 'h-3.5 w-3.5',
          variant === 'inline' && 'h-3 w-3',
          variant === 'default' && 'h-3.5 w-3.5',
          variant === 'detailed' && 'h-4 w-4'
        )}
      />
      {variant !== 'compact' && <span>{displayLabel}</span>}
    </div>
  );

  if (!showTooltip) {
    return badgeContent;
  }

  return (
    <TooltipProvider>
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>{badgeContent}</TooltipTrigger>
        <TooltipContent
          side="top"
          className="max-w-xs p-4 space-y-3"
          sideOffset={8}
        >
          <div className="flex items-center gap-2">
            <Icon className={cn('h-5 w-5', config.color)} />
            <span className="font-semibold">{config.description}</span>
          </div>
          <ul className="space-y-1.5">
            {displayFeatures.map((feature, i) => (
              <li key={i} className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-3.5 w-3.5 text-success shrink-0" />
                <span className="text-muted-foreground">{feature}</span>
              </li>
            ))}
          </ul>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Inline data encryption indicator
interface EncryptedFieldProps {
  isEncrypted?: boolean;
  isVisible?: boolean;
  onToggleVisibility?: () => void;
  className?: string;
}

export function EncryptedFieldIndicator({
  isEncrypted = true,
  isVisible = false,
  onToggleVisibility,
  className,
}: EncryptedFieldProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={onToggleVisibility}
            className={cn(
              'inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors',
              className
            )}
          >
            {isEncrypted && <Lock className="h-3 w-3" />}
            {isVisible ? (
              <Eye className="h-3 w-3" />
            ) : (
              <EyeOff className="h-3 w-3" />
            )}
          </button>
        </TooltipTrigger>
        <TooltipContent side="top">
          <p className="text-xs">
            {isEncrypted ? 'Données chiffrées AES-256' : 'Données en clair'}
            {onToggleVisibility && ` • Cliquez pour ${isVisible ? 'masquer' : 'afficher'}`}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Trust indicators section
interface TrustIndicatorsProps {
  className?: string;
  variant?: 'horizontal' | 'vertical';
  showLabels?: boolean;
}

export function TrustIndicators({
  className,
  variant = 'horizontal',
  showLabels = true,
}: TrustIndicatorsProps) {
  const indicators = [
    { icon: ShieldCheck, label: 'SSL sécurisé', color: 'text-success' },
    { icon: Lock, label: 'AES-256', color: 'text-info' },
    { icon: Key, label: 'RGPD', color: 'text-primary' },
  ];

  return (
    <div
      className={cn(
        'flex items-center gap-4 text-xs text-muted-foreground',
        variant === 'vertical' && 'flex-col items-start gap-2',
        className
      )}
    >
      {indicators.map(({ icon: Icon, label, color }) => (
        <div key={label} className="flex items-center gap-1.5">
          <Icon className={cn('h-3.5 w-3.5', color)} />
          {showLabels && <span>{label}</span>}
        </div>
      ))}
    </div>
  );
}

// Footer security bar
export function SecurityFooterBar({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'flex flex-wrap items-center justify-center gap-4 py-3 px-4 bg-muted/30 border-t border-border text-xs text-muted-foreground',
        className
      )}
    >
      <div className="flex items-center gap-1.5">
        <Lock className="h-3.5 w-3.5 text-success" />
        <span>Connexion sécurisée SSL</span>
      </div>
      <div className="hidden sm:block w-px h-4 bg-border" />
      <div className="flex items-center gap-1.5">
        <ShieldCheck className="h-3.5 w-3.5 text-info" />
        <span>Données chiffrées AES-256</span>
      </div>
      <div className="hidden sm:block w-px h-4 bg-border" />
      <div className="flex items-center gap-1.5">
        <Key className="h-3.5 w-3.5 text-primary" />
        <span>Conforme RGPD</span>
      </div>
    </div>
  );
}
