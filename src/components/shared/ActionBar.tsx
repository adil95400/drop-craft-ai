/**
 * ActionBar — Barre d'actions groupées (socle)
 * Design Channable : primaires visibles, secondaires dans "…"
 */
import { ReactNode, memo } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ActionItem {
  label: string;
  icon?: LucideIcon;
  onClick: () => void;
  variant?: 'default' | 'outline' | 'destructive' | 'ghost';
  disabled?: boolean;
  loading?: boolean;
}

interface ActionBarProps {
  /** Actions primaires (visibles, max 2) */
  primary?: ActionItem[];
  /** Actions secondaires (dans le menu "…") */
  secondary?: ActionItem[];
  /** Contenu additionnel à gauche */
  left?: ReactNode;
  /** Classes */
  className?: string;
}

function ActionBarComponent({ primary = [], secondary = [], left, className }: ActionBarProps) {
  if (!primary.length && !secondary.length && !left) return null;

  return (
    <div className={cn('flex items-center gap-2 flex-wrap', className)}>
      {left && <div className="flex-1 min-w-0">{left}</div>}

      {primary.map((action, i) => {
        const Icon = action.icon;
        return (
          <Button
            key={i}
            variant={action.variant || (i === 0 ? 'default' : 'outline')}
            size="sm"
            className="h-9"
            onClick={action.onClick}
            disabled={action.disabled || action.loading}
          >
            {Icon && <Icon className="mr-1.5 h-4 w-4" />}
            {action.label}
          </Button>
        );
      })}

      {secondary.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" className="h-9 w-9">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {secondary.map((action, i) => {
              const Icon = action.icon;
              return (
                <DropdownMenuItem
                  key={i}
                  onClick={action.onClick}
                  disabled={action.disabled}
                  className={cn(action.variant === 'destructive' && 'text-destructive')}
                >
                  {Icon && <Icon className="mr-2 h-4 w-4" />}
                  {action.label}
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}

export const ActionBar = memo(ActionBarComponent);
