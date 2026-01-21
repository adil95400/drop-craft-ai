'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useIsMobile } from '@/hooks/use-media-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { X, ChevronLeft, Loader2 } from 'lucide-react';

interface OptimizedModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  className?: string;
  showCloseButton?: boolean;
}

const sizeClasses = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  full: 'max-w-[95vw]',
};

const modalVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 10 },
  visible: { 
    opacity: 1, 
    scale: 1, 
    y: 0,
    transition: { type: 'spring' as const, damping: 25, stiffness: 300 }
  },
  exit: { opacity: 0, scale: 0.95, y: 10, transition: { duration: 0.15 } }
};

export function OptimizedModal({
  open,
  onOpenChange,
  title,
  description,
  icon,
  children,
  footer,
  size = 'md',
  className,
  showCloseButton = true,
}: OptimizedModalProps) {
  const isMobile = useIsMobile();

  // Mobile: use Drawer
  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[90vh]">
          <DrawerHeader className="text-left border-b pb-4">
            <div className="flex items-center gap-3">
              {icon && (
                <div className="p-2 rounded-xl bg-primary/10 text-primary">
                  {icon}
                </div>
              )}
              <div className="flex-1">
                <DrawerTitle className="text-lg font-semibold">{title}</DrawerTitle>
                {description && (
                  <DrawerDescription className="text-sm text-muted-foreground mt-0.5">
                    {description}
                  </DrawerDescription>
                )}
              </div>
              {showCloseButton && (
                <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)} className="h-8 w-8">
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </DrawerHeader>
          <div className="overflow-y-auto p-4 flex-1">
            {children}
          </div>
          {footer && (
            <DrawerFooter className="border-t pt-4">
              {footer}
            </DrawerFooter>
          )}
        </DrawerContent>
      </Drawer>
    );
  }

  // Desktop: use Dialog with animations
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn(sizeClasses[size], 'p-0 gap-0 overflow-hidden', className)}>
        <AnimatePresence mode="wait">
          <motion.div
            key="modal-content"
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <DialogHeader className="p-6 pb-4 border-b bg-gradient-to-b from-muted/30 to-transparent">
              <div className="flex items-center gap-3">
                {icon && (
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.1, type: 'spring' }}
                    className="p-2.5 rounded-xl bg-primary/10 text-primary"
                  >
                    {icon}
                  </motion.div>
                )}
                <div className="flex-1">
                  <DialogTitle className="text-xl font-semibold">{title}</DialogTitle>
                  {description && (
                    <DialogDescription className="text-sm text-muted-foreground mt-1">
                      {description}
                    </DialogDescription>
                  )}
                </div>
              </div>
            </DialogHeader>
            <div className="p-6 max-h-[60vh] overflow-y-auto">
              {children}
            </div>
            {footer && (
              <DialogFooter className="p-6 pt-4 border-t bg-muted/20">
                {footer}
              </DialogFooter>
            )}
          </motion.div>
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}

// Multi-step modal component
interface StepConfig {
  id: string;
  title: string;
  description?: string;
  icon?: React.ReactNode;
  content: React.ReactNode;
  isValid?: boolean;
}

interface MultiStepModalProps extends Omit<OptimizedModalProps, 'children' | 'footer'> {
  steps: StepConfig[];
  currentStep: number;
  onStepChange: (step: number) => void;
  onComplete: () => void;
  isSubmitting?: boolean;
  submitLabel?: string;
}

export function MultiStepModal({
  open,
  onOpenChange,
  title,
  steps,
  currentStep,
  onStepChange,
  onComplete,
  isSubmitting = false,
  submitLabel = 'Terminer',
  ...props
}: MultiStepModalProps) {
  const currentStepConfig = steps[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === steps.length - 1;
  const progress = ((currentStep + 1) / steps.length) * 100;

  const handleNext = () => {
    if (isLastStep) {
      onComplete();
    } else {
      onStepChange(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (!isFirstStep) {
      onStepChange(currentStep - 1);
    }
  };

  return (
    <OptimizedModal
      open={open}
      onOpenChange={onOpenChange}
      title={currentStepConfig?.title || title}
      description={currentStepConfig?.description}
      icon={currentStepConfig?.icon}
      {...props}
      footer={
        <div className="w-full space-y-4">
          {/* Progress indicator */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Étape {currentStep + 1} sur {steps.length}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-1.5" />
          </div>

          {/* Step indicators */}
          <div className="flex justify-center gap-2">
            {steps.map((step, index) => (
              <motion.button
                key={step.id}
                onClick={() => index <= currentStep && onStepChange(index)}
                disabled={index > currentStep}
                className={cn(
                  'w-2.5 h-2.5 rounded-full transition-all',
                  index === currentStep 
                    ? 'bg-primary scale-125' 
                    : index < currentStep 
                      ? 'bg-primary/50 cursor-pointer hover:bg-primary/70' 
                      : 'bg-muted'
                )}
                whileHover={index <= currentStep ? { scale: 1.3 } : {}}
                whileTap={index <= currentStep ? { scale: 0.9 } : {}}
              />
            ))}
          </div>

          {/* Navigation buttons */}
          <div className="flex gap-3 justify-end">
            {!isFirstStep && (
              <Button variant="outline" onClick={handleBack} disabled={isSubmitting}>
                <ChevronLeft className="h-4 w-4 mr-1" />
                Retour
              </Button>
            )}
            <Button 
              onClick={handleNext} 
              disabled={isSubmitting || (currentStepConfig?.isValid === false)}
            >
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isLastStep ? submitLabel : 'Suivant'}
            </Button>
          </div>
        </div>
      }
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          {currentStepConfig?.content}
        </motion.div>
      </AnimatePresence>
    </OptimizedModal>
  );
}

// Quick action modal (for confirmations, simple forms)
interface QuickActionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  icon?: React.ReactNode;
  variant?: 'default' | 'destructive' | 'success';
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void | Promise<void>;
  isLoading?: boolean;
  children?: React.ReactNode;
}

export function QuickActionModal({
  open,
  onOpenChange,
  title,
  description,
  icon,
  variant = 'default',
  confirmLabel = 'Confirmer',
  cancelLabel = 'Annuler',
  onConfirm,
  isLoading = false,
  children,
}: QuickActionModalProps) {
  const handleConfirm = async () => {
    await onConfirm();
    if (!isLoading) {
      onOpenChange(false);
    }
  };

  const iconBgClass = {
    default: 'bg-primary/10 text-primary',
    destructive: 'bg-destructive/10 text-destructive',
    success: 'bg-emerald-500/10 text-emerald-500',
  };

  const confirmButtonVariant = variant === 'destructive' ? 'destructive' : 'default';

  return (
    <OptimizedModal
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      icon={icon && <div className={cn('p-0.5', iconBgClass[variant])}>{icon}</div>}
      size="sm"
      footer={
        <div className="flex gap-3 justify-end w-full">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            {cancelLabel}
          </Button>
          <Button variant={confirmButtonVariant} onClick={handleConfirm} disabled={isLoading}>
            {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {confirmLabel}
          </Button>
        </div>
      }
    >
      {children}
    </OptimizedModal>
  );
}
