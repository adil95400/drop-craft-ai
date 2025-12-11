import { toast } from 'sonner';
import { CheckCircle, XCircle, AlertCircle, Info, Loader2 } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning' | 'info' | 'loading';

interface ActionToastOptions {
  title: string;
  description?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

const icons = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertCircle,
  info: Info,
  loading: Loader2,
};

export function actionToast(type: ToastType, options: ActionToastOptions) {
  const Icon = icons[type];
  
  const toastFn = {
    success: toast.success,
    error: toast.error,
    warning: toast.warning,
    info: toast.info,
    loading: toast.loading,
  }[type];

  return toastFn(options.title, {
    description: options.description,
    duration: options.duration ?? (type === 'error' ? 5000 : 3000),
    action: options.action ? {
      label: options.action.label,
      onClick: options.action.onClick,
    } : undefined,
  });
}

// Convenience methods
export const showSuccess = (title: string, description?: string) => 
  actionToast('success', { title, description });

export const showError = (title: string, description?: string) => 
  actionToast('error', { title, description, duration: 5000 });

export const showWarning = (title: string, description?: string) => 
  actionToast('warning', { title, description });

export const showInfo = (title: string, description?: string) => 
  actionToast('info', { title, description });

export const showLoading = (title: string, description?: string) => 
  actionToast('loading', { title, description, duration: Infinity });

// Promise-based toast for async actions
export function withToast<T>(
  promise: Promise<T>,
  messages: {
    loading: string;
    success: string;
    error: string;
  }
): Promise<T> {
  toast.promise(promise, {
    loading: messages.loading,
    success: messages.success,
    error: messages.error,
  });
  return promise;
}

// Common action toasts
export const toasts = {
  // Import actions
  importStarted: () => showLoading('Import en cours...', 'Veuillez patienter'),
  importSuccess: (count: number) => showSuccess('Import terminé', `${count} produits importés`),
  importError: (error: string) => showError('Erreur d\'import', error),
  
  // Sync actions
  syncStarted: () => showLoading('Synchronisation...'),
  syncSuccess: () => showSuccess('Synchronisé', 'Données mises à jour'),
  syncError: () => showError('Erreur de sync', 'Veuillez réessayer'),
  
  // CRUD actions
  created: (item: string) => showSuccess('Créé', `${item} créé avec succès`),
  updated: (item: string) => showSuccess('Mis à jour', `${item} modifié`),
  deleted: (item: string) => showSuccess('Supprimé', `${item} supprimé`),
  
  // Publish actions
  published: () => showSuccess('Publié', 'Produit publié sur la boutique'),
  unpublished: () => showInfo('Dépublié', 'Produit retiré de la boutique'),
  
  // Workflow actions
  workflowActivated: () => showSuccess('Workflow activé'),
  workflowDeactivated: () => showInfo('Workflow désactivé'),
  workflowSaved: () => showSuccess('Workflow sauvegardé'),
  
  // Connection actions  
  connected: (platform: string) => showSuccess('Connecté', `${platform} connecté avec succès`),
  disconnected: (platform: string) => showInfo('Déconnecté', `${platform} déconnecté`),
  connectionError: (platform: string) => showError('Erreur de connexion', `Impossible de connecter ${platform}`),
  
  // Generic
  saved: () => showSuccess('Sauvegardé'),
  copied: () => showSuccess('Copié dans le presse-papier'),
  exported: () => showSuccess('Export terminé'),
};
