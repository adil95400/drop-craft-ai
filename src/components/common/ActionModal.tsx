import { ReactNode } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { productionLogger } from '@/utils/productionLogger';

interface ActionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  onConfirm?: () => void | Promise<void>;
  onCancel?: () => void;
  confirmText?: string;
  cancelText?: string;
  confirmVariant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  loading?: boolean;
  disabled?: boolean;
}

export function ActionModal({
  open,
  onOpenChange,
  title,
  description,
  children,
  onConfirm,
  onCancel,
  confirmText = "Confirmer",
  cancelText = "Annuler",
  confirmVariant = "default",
  loading = false,
  disabled = false
}: ActionModalProps) {
  const handleConfirm = async () => {
    if (loading || disabled || !onConfirm) return;
    
    try {
      await onConfirm();
    } catch (error) {
      productionLogger.error('Modal action failed', error as Error, 'ActionModal');
    }
  };

  const handleCancel = () => {
    if (loading) return;
    onCancel?.();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && (
            <DialogDescription>{description}</DialogDescription>
          )}
        </DialogHeader>
        
        <div className="py-4">
          {children}
        </div>

        {onConfirm && (
          <DialogFooter className="gap-2">
            <Button 
              variant="outline" 
              onClick={handleCancel}
              disabled={loading}
            >
              {cancelText}
            </Button>
            <Button 
              variant={confirmVariant}
              onClick={handleConfirm}
              disabled={loading || disabled}
            >
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {confirmText}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}