/**
 * ChannableModal - Premium Modal Component with Channable Design
 * Glassmorphism, fluid animations, and consistent styling
 */
import { ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { LucideIcon, Loader2, X } from 'lucide-react';

interface ChannableModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  icon?: LucideIcon;
  iconColor?: string;
  children: ReactNode;
  footer?: ReactNode;
  // Action buttons
  onSubmit?: () => void;
  onCancel?: () => void;
  submitLabel?: string;
  cancelLabel?: string;
  isSubmitting?: boolean;
  submitDisabled?: boolean;
  // Sizing
  size?: 'sm' | 'md' | 'lg' | 'xl';
  // Styling
  variant?: 'default' | 'premium' | 'danger';
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
};

const variantStyles = {
  default: {
    header: 'from-primary/10 via-primary/5 to-transparent',
    icon: 'bg-primary/10 text-primary',
    button: 'bg-primary hover:bg-primary/90',
  },
  premium: {
    header: 'from-gradient-start/20 via-gradient-mid/10 to-transparent',
    icon: 'bg-gradient-to-br from-primary to-primary-glow text-white',
    button: 'bg-gradient-to-r from-primary to-primary-glow hover:opacity-90',
  },
  danger: {
    header: 'from-destructive/10 via-destructive/5 to-transparent',
    icon: 'bg-destructive/10 text-destructive',
    button: 'bg-destructive hover:bg-destructive/90',
  },
};

export function ChannableModal({
  open,
  onOpenChange,
  title,
  description,
  icon: Icon,
  iconColor,
  children,
  footer,
  onSubmit,
  onCancel,
  submitLabel = 'Confirmer',
  cancelLabel = 'Annuler',
  isSubmitting = false,
  submitDisabled = false,
  size = 'md',
  variant = 'default',
}: ChannableModalProps) {
  const styles = variantStyles[variant];

  const handleCancel = () => {
    onCancel?.();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          sizeClasses[size],
          'p-0 overflow-hidden border-border/50',
          'bg-background/95 backdrop-blur-xl',
          'shadow-2xl shadow-primary/5'
        )}
      >
        {/* Premium Header with Gradient */}
        <div className={cn('relative', 'bg-gradient-to-b', styles.header)}>
          <DialogHeader className="p-6 pb-4">
            <div className="flex items-start gap-4">
              {Icon && (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  className={cn(
                    'p-3 rounded-xl',
                    'shadow-lg',
                    iconColor || styles.icon
                  )}
                >
                  <Icon className="h-5 w-5" />
                </motion.div>
              )}
              <div className="flex-1 min-w-0">
                <DialogTitle className="text-lg font-semibold leading-tight">
                  {title}
                </DialogTitle>
                {description && (
                  <DialogDescription className="mt-1.5 text-sm text-muted-foreground">
                    {description}
                  </DialogDescription>
                )}
              </div>
            </div>
          </DialogHeader>

          {/* Decorative line */}
          <div className="absolute bottom-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
        </div>

        {/* Content Area */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="px-6 py-4"
        >
          {children}
        </motion.div>

        {/* Footer with Actions */}
        {(footer || onSubmit) && (
          <div className="border-t border-border/50 bg-muted/30 px-6 py-4">
            {footer || (
              <DialogFooter className="gap-2 sm:gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  className="min-w-[100px]"
                >
                  {cancelLabel}
                </Button>
                <Button
                  type="submit"
                  onClick={onSubmit}
                  disabled={submitDisabled || isSubmitting}
                  className={cn('min-w-[120px]', styles.button)}
                >
                  {isSubmitting && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {submitLabel}
                </Button>
              </DialogFooter>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

/**
 * Form field wrapper with consistent styling
 */
interface ChannableFormFieldProps {
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: ReactNode;
  className?: string;
}

export function ChannableFormField({
  label,
  required,
  hint,
  error,
  children,
  className,
}: ChannableFormFieldProps) {
  return (
    <div className={cn('space-y-2', className)}>
      <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </label>
      {children}
      {hint && !error && (
        <p className="text-xs text-muted-foreground">{hint}</p>
      )}
      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}
    </div>
  );
}

/**
 * Modal section separator
 */
export function ChannableModalSection({
  title,
  children,
  className,
}: {
  title?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('space-y-4', className)}>
      {title && (
        <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          {title}
        </h4>
      )}
      {children}
    </div>
  );
}

export default ChannableModal;
