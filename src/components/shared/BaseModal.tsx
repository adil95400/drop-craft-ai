/**
 * BaseModal — Composant socle pour toutes les modales
 * Design Channable : compact, header + body + footer standardisé
 */
import { ReactNode } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BaseModalProps {
  /** Ouvert / fermé */
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Titre */
  title: string;
  /** Description courte */
  description?: string;
  /** Contenu du body */
  children: ReactNode;
  /** Bouton primaire */
  primaryLabel?: string;
  primaryIcon?: ReactNode;
  onPrimary?: () => void;
  primaryDisabled?: boolean;
  primaryLoading?: boolean;
  /** Bouton secondaire (annuler par défaut) */
  secondaryLabel?: string;
  onSecondary?: () => void;
  /** Cacher le footer */
  hideFooter?: boolean;
  /** Taille max */
  size?: 'sm' | 'md' | 'lg';
  /** Classes */
  className?: string;
}

const SIZE_MAP = {
  sm: 'sm:max-w-sm',
  md: 'sm:max-w-lg',
  lg: 'sm:max-w-2xl',
};

export function BaseModal({
  open,
  onOpenChange,
  title,
  description,
  children,
  primaryLabel,
  primaryIcon,
  onPrimary,
  primaryDisabled,
  primaryLoading,
  secondaryLabel = 'Annuler',
  onSecondary,
  hideFooter,
  size = 'md',
  className,
}: BaseModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn(SIZE_MAP[size], className)}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        <div className="space-y-4">{children}</div>

        {!hideFooter && (
          <DialogFooter className="mt-2">
            <Button variant="outline" onClick={onSecondary || (() => onOpenChange(false))}>
              {secondaryLabel}
            </Button>
            {primaryLabel && (
              <Button onClick={onPrimary} disabled={primaryDisabled || primaryLoading}>
                {primaryLoading ? (
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                ) : primaryIcon ? (
                  <span className="mr-2">{primaryIcon}</span>
                ) : null}
                {primaryLabel}
              </Button>
            )}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
