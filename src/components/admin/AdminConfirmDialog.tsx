import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { AlertTriangle, Shield } from 'lucide-react';

interface AdminConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  actionText: string;
  onConfirm: () => void;
  variant?: 'destructive' | 'warning' | 'default';
  requiresDoubleConfirm?: boolean;
}

export const AdminConfirmDialog: React.FC<AdminConfirmDialogProps> = ({
  open,
  onOpenChange,
  title,
  description,
  actionText,
  onConfirm,
  variant = 'default',
  requiresDoubleConfirm = false
}) => {
  const [doubleConfirm, setDoubleConfirm] = React.useState(false);

  const handleConfirm = () => {
    if (requiresDoubleConfirm && !doubleConfirm) {
      setDoubleConfirm(true);
      return;
    }
    onConfirm();
    onOpenChange(false);
    setDoubleConfirm(false);
  };

  const getIcon = () => {
    switch (variant) {
      case 'destructive':
        return <AlertTriangle className="h-6 w-6 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="h-6 w-6 text-yellow-600" />;
      default:
        return <Shield className="h-6 w-6 text-blue-600" />;
    }
  };

  const getButtonVariant = () => {
    switch (variant) {
      case 'destructive':
        return 'destructive';
      case 'warning':
        return 'outline';
      default:
        return 'default';
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={(open) => {
      onOpenChange(open);
      if (!open) setDoubleConfirm(false);
    }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            {getIcon()}
            {doubleConfirm ? 'Confirmation finale' : title}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {doubleConfirm 
              ? 'Êtes-vous absolument certain de vouloir effectuer cette action ? Cette opération ne peut pas être annulée.'
              : description
            }
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setDoubleConfirm(false)}>
            Annuler
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            className={variant === 'destructive' ? 'bg-red-600 hover:bg-red-700' : ''}
          >
            {doubleConfirm ? 'Confirmer définitivement' : actionText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};