import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { usePublishProducts } from '@/hooks/usePublishProducts';
import { Upload, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { useState } from 'react';

interface BulkPublishDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productIds: string[];
  onSuccess?: () => void;
}

export function BulkPublishDialog({
  open,
  onOpenChange,
  productIds,
  onSuccess,
}: BulkPublishDialogProps) {
  const { bulkPublish, isBulkPublishing } = usePublishProducts();
  const [publishProgress, setPublishProgress] = useState(0);

  const handlePublish = async () => {
    setPublishProgress(0);
    const progressInterval = setInterval(() => {
      setPublishProgress(prev => Math.min(prev + 15, 90));
    }, 200);

    try {
      await bulkPublish(productIds);
      clearInterval(progressInterval);
      setPublishProgress(100);
      
      setTimeout(() => {
        onSuccess?.();
        onOpenChange(false);
        setPublishProgress(0);
      }, 500);
    } catch (error) {
      clearInterval(progressInterval);
      setPublishProgress(0);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-primary" />
            Publication en masse
          </DialogTitle>
          <DialogDescription>
            Vous êtes sur le point de publier <strong>{productIds.length}</strong> produit(s) vers votre
            catalogue principal.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-900">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-sm">
              Cette action va :
              <ul className="list-disc list-inside mt-2 space-y-1 text-foreground/90">
                <li>Créer ou mettre à jour les produits dans votre catalogue</li>
                <li>Synchroniser les prix, stocks et descriptions</li>
                <li>Établir un lien bidirectionnel pour les mises à jour futures</li>
              </ul>
            </AlertDescription>
          </Alert>

          <Alert className="border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-900">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-sm text-foreground/90">
              Les produits déjà publiés seront automatiquement mis à jour avec les
              nouvelles informations.
            </AlertDescription>
          </Alert>

          {isBulkPublishing && publishProgress > 0 && (
            <div className="space-y-3 p-4 rounded-lg border border-primary/20 bg-primary/5">
              <div className="flex justify-between text-sm font-medium">
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Publication en cours...
                </span>
                <span className="text-primary">{publishProgress}%</span>
              </div>
              <Progress value={publishProgress} className="h-2" />
              <p className="text-xs text-muted-foreground text-center">
                {publishProgress === 100 ? 'Publication terminée!' : `Publication de ${productIds.length} produit(s)...`}
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isBulkPublishing}
          >
            Annuler
          </Button>
          <Button onClick={handlePublish} disabled={isBulkPublishing || productIds.length === 0}>
            {isBulkPublishing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Publication...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Publier {productIds.length} produit(s)
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
