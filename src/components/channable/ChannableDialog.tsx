/**
 * ChannableDialog - Wrapper pro pour les modales structurées
 * Design Channable : header avec icône, description, séparateurs, footer standardisé
 */
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChannableDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  /** Footer config — omit to hide footer */
  footer?: {
    cancelLabel?: string;
    confirmLabel?: string;
    confirmIcon?: React.ReactNode;
    onConfirm?: () => void;
    isLoading?: boolean;
    disabled?: boolean;
    variant?: 'default' | 'destructive';
    /** Extra content on the left side of footer */
    leftContent?: React.ReactNode;
  };
  /** Max width class, default max-w-lg */
  maxWidth?: string;
  className?: string;
}

export function ChannableDialog({
  open,
  onOpenChange,
  title,
  description,
  icon,
  children,
  footer,
  maxWidth = 'max-w-lg',
  className,
}: ChannableDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn(maxWidth, className)}>
        <DialogHeader>
          <div className="flex items-center gap-3">
            {icon && (
              <div className="flex-shrink-0 p-2.5 rounded-xl bg-primary/10">
                {icon}
              </div>
            )}
            <div className="min-w-0">
              <DialogTitle className="text-lg font-semibold">{title}</DialogTitle>
              {description && (
                <DialogDescription className="text-sm text-muted-foreground mt-0.5">
                  {description}
                </DialogDescription>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="py-4">{children}</div>

        {footer && (
          <DialogFooter className="flex items-center justify-between sm:justify-between">
            {footer.leftContent && (
              <div className="flex-1 min-w-0">{footer.leftContent}</div>
            )}
            <div className={cn("flex gap-2", !footer.leftContent && "ml-auto")}>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                {footer.cancelLabel || 'Annuler'}
              </Button>
              <Button
                variant={footer.variant || 'default'}
                onClick={footer.onConfirm}
                disabled={footer.isLoading || footer.disabled}
              >
                {footer.isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {footer.confirmIcon && !footer.isLoading && (
                  <span className="mr-2 flex-shrink-0">{footer.confirmIcon}</span>
                )}
                {footer.confirmLabel || 'Confirmer'}
              </Button>
            </div>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
