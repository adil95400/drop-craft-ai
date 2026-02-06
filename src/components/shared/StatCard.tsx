/**
 * StatCard — Composant socle KPI compact et cliquable
 * Design Channable : icône + valeur + label, clic = filtre
 */
import { memo, ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  /** Label court du KPI */
  label: string;
  /** Valeur principale (nombre ou string formaté) */
  value: string | number;
  /** Texte secondaire (ex: "actifs", "/100") */
  sub?: string;
  /** Icône Lucide */
  icon: LucideIcon;
  /** Couleur sémantique du token (ex: 'primary', 'success', 'warning', 'info', 'destructive') */
  color?: 'primary' | 'success' | 'warning' | 'info' | 'destructive';
  /** Clic → applique un filtre */
  onClick?: () => void;
  /** Contenu additionnel sous la valeur (ex: Progress bar) */
  footer?: ReactNode;
  /** Actif / sélectionné */
  active?: boolean;
}

const COLOR_MAP = {
  primary: { icon: 'text-primary', bg: 'bg-primary/10' },
  success: { icon: 'text-success', bg: 'bg-success/10' },
  warning: { icon: 'text-warning', bg: 'bg-warning/10' },
  info: { icon: 'text-info', bg: 'bg-info/10' },
  destructive: { icon: 'text-destructive', bg: 'bg-destructive/10' },
} as const;

function StatCardComponent({ label, value, sub, icon: Icon, color = 'primary', onClick, footer, active }: StatCardProps) {
  const colors = COLOR_MAP[color];

  return (
    <Card
      className={cn(
        'transition-all duration-150',
        onClick && 'cursor-pointer hover:border-primary/40 hover:shadow-sm',
        active && 'border-primary ring-1 ring-primary/20'
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={cn('inline-flex items-center justify-center w-9 h-9 rounded-lg shrink-0', colors.bg)}>
            <Icon className={cn('h-4.5 w-4.5', colors.icon)} />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-muted-foreground truncate">{label}</p>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold tracking-tight tabular-nums">{value}</span>
              {sub && <span className="text-xs text-muted-foreground">{sub}</span>}
            </div>
          </div>
        </div>
        {footer && <div className="mt-2.5">{footer}</div>}
      </CardContent>
    </Card>
  );
}

export const StatCard = memo(StatCardComponent);
