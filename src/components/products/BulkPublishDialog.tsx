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
import { usePublishProducts } from '@/hooks/usePublishProducts';
import { Upload, AlertCircle, CheckCircle2 } from 'lucide-react';

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

  const handlePublish = async () => {
    await bulkPublish(productIds);
    onSuccess?.();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Publication en masse
          </DialogTitle>
          <DialogDescription>
            Vous êtes sur le point de publier {productIds.length} produit(s) vers votre
            catalogue principal.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Cette action va :
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Créer ou mettre à jour les produits dans votre catalogue</li>
                <li>Synchroniser les prix, stocks et descriptions</li>
                <li>Établir un lien bidirectionnel pour les mises à jour futures</li>
              </ul>
            </AlertDescription>
          </Alert>

          <Alert variant="default" className="border-green-200 bg-green-50">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-900">
              Les produits déjà publiés seront automatiquement mis à jour avec les
              nouvelles informations.
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isBulkPublishing}
          >
            Annuler
          </Button>
          <Button onClick={handlePublish} disabled={isBulkPublishing}>
            {isBulkPublishing ? (
              <>
                <Upload className="h-4 w-4 mr-2 animate-spin" />
                Publication en cours...
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
