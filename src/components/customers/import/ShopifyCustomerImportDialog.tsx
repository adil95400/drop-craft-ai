import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Store, 
  Users, 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  RefreshCw,
  ArrowRight,
  Sparkles,
  Mail,
  ShoppingBag,
  UserPlus
} from 'lucide-react';
import { useShopifyCustomerImport } from '@/hooks/useShopifyCustomerImport';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface ImportBreakdown {
  total: number;
  buyers: number;
  email_subscribers: number;
  newsletter_only: number;
}

interface ShopifyCustomerImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function ShopifyCustomerImportDialog({
  open,
  onOpenChange,
  onSuccess
}: ShopifyCustomerImportDialogProps) {
  const [selectedIntegrationId, setSelectedIntegrationId] = useState<string | null>(null);
  const [breakdown, setBreakdown] = useState<ImportBreakdown | null>(null);
  
  const {
    integrations,
    isLoadingIntegrations,
    importCustomers,
    isImporting,
    progress,
    resetProgress
  } = useShopifyCustomerImport();

  const handleImport = () => {
    if (!selectedIntegrationId) return;
    importCustomers(selectedIntegrationId, {
      onSuccess: (data: any) => {
        if (data?.breakdown) {
          setBreakdown(data.breakdown);
        }
      }
    });
  };

  const handleClose = () => {
    if (!isImporting) {
      resetProgress();
      setSelectedIntegrationId(null);
      setBreakdown(null);
      onOpenChange(false);
      if (progress.status === 'completed') {
        onSuccess?.();
      }
    }
  };

  const progressPercent = progress.total > 0 
    ? Math.round((progress.imported / progress.total) * 100) 
    : progress.status === 'fetching' ? 30 : 0;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <Users className="h-5 w-5 text-primary" />
            </div>
            Importer les clients Shopify
          </DialogTitle>
          <DialogDescription>
            Importez <strong>tous</strong> vos clients depuis Shopify : acheteurs, abonnés newsletter et contacts email.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <AnimatePresence mode="wait">
            {/* Step 1: Select Store */}
            {progress.status === 'idle' && (
              <motion.div
                key="idle"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <div className="space-y-3">
                  <p className="text-sm font-medium text-muted-foreground">
                    Sélectionnez une boutique Shopify :
                  </p>

                  {isLoadingIntegrations ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : !integrations?.length ? (
                    <Card className="border-dashed">
                      <CardContent className="py-8 text-center">
                        <Store className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                        <p className="font-medium mb-1">Aucune boutique connectée</p>
                        <p className="text-sm text-muted-foreground">
                          Connectez d'abord une boutique Shopify dans les intégrations.
                        </p>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-2">
                      {integrations.map((integration) => (
                        <Card
                          key={integration.id}
                          className={cn(
                            "cursor-pointer transition-all hover:shadow-md",
                            selectedIntegrationId === integration.id
                              ? "ring-2 ring-primary border-primary"
                              : "hover:border-primary/50"
                          )}
                          onClick={() => setSelectedIntegrationId(integration.id)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-green-500/10">
                                  <Store className="h-5 w-5 text-green-600" />
                                </div>
                                <div>
                                  <p className="font-medium">{integration.platform_name || 'Boutique Shopify'}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {integration.store_url || 'Boutique connectée'}
                                  </p>
                                </div>
                              </div>
                              <Badge variant="secondary" className="bg-green-500/10 text-green-600 border-0">
                                Connecté
                              </Badge>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}

                  {/* Info box about what will be imported */}
                  {integrations?.length > 0 && (
                    <Card className="bg-blue-500/5 border-blue-500/20">
                      <CardContent className="p-3">
                        <div className="flex items-start gap-2">
                          <Mail className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                          <p className="text-xs text-blue-700 dark:text-blue-400">
                            L'import inclut <strong>tous les contacts</strong> : clients ayant passé commande, 
                            abonnés newsletter, et contacts email marketing.
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </motion.div>
            )}

            {/* Progress State */}
            {(progress.status === 'fetching' || progress.status === 'importing') && (
              <motion.div
                key="progress"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                <div className="text-center py-6">
                  <div className="relative inline-flex">
                    <div className="p-4 rounded-full bg-primary/10">
                      <RefreshCw className="h-8 w-8 text-primary animate-spin" />
                    </div>
                    <Sparkles className="h-4 w-4 text-primary absolute -top-1 -right-1 animate-pulse" />
                  </div>
                  <p className="mt-4 font-medium">{progress.message}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Import de tous les clients et abonnés...
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Progression</span>
                    <span className="font-medium">{progressPercent}%</span>
                  </div>
                  <Progress value={progressPercent} className="h-2" />
                </div>
              </motion.div>
            )}

            {/* Success State */}
            {progress.status === 'completed' && (
              <motion.div
                key="completed"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="text-center py-4"
              >
                <div className="p-4 rounded-full bg-green-500/10 inline-flex mb-4">
                  <CheckCircle2 className="h-10 w-10 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold mb-1">Import réussi !</h3>
                <p className="text-muted-foreground text-sm">{progress.message}</p>
                
                {/* Main stat */}
                <div className="mt-4 p-4 rounded-lg bg-muted/50">
                  <div className="flex items-center justify-center gap-2 text-2xl font-bold text-primary">
                    <Users className="h-6 w-6" />
                    {progress.imported}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">clients importés</p>
                </div>

                {/* Breakdown stats */}
                {breakdown && (
                  <div className="mt-4 grid grid-cols-3 gap-2">
                    <div className="p-3 rounded-lg bg-muted/30">
                      <div className="flex items-center justify-center gap-1 text-lg font-semibold text-foreground">
                        <ShoppingBag className="h-4 w-4" />
                        {breakdown.buyers}
                      </div>
                      <p className="text-xs text-muted-foreground">Acheteurs</p>
                    </div>
                    <div className="p-3 rounded-lg bg-blue-500/10">
                      <div className="flex items-center justify-center gap-1 text-lg font-semibold text-blue-600">
                        <Mail className="h-4 w-4" />
                        {breakdown.email_subscribers}
                      </div>
                      <p className="text-xs text-muted-foreground">Abonnés email</p>
                    </div>
                    <div className="p-3 rounded-lg bg-purple-500/10">
                      <div className="flex items-center justify-center gap-1 text-lg font-semibold text-purple-600">
                        <UserPlus className="h-4 w-4" />
                        {breakdown.newsletter_only}
                      </div>
                      <p className="text-xs text-muted-foreground">Newsletter seule</p>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* Error State */}
            {progress.status === 'error' && (
              <motion.div
                key="error"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="text-center py-6"
              >
                <div className="p-4 rounded-full bg-destructive/10 inline-flex mb-4">
                  <XCircle className="h-10 w-10 text-destructive" />
                </div>
                <h3 className="text-lg font-semibold mb-1">Erreur d'import</h3>
                <p className="text-muted-foreground">{progress.message}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-2">
          {progress.status === 'idle' && (
            <>
              <Button variant="outline" onClick={handleClose}>
                Annuler
              </Button>
              <Button
                onClick={handleImport}
                disabled={!selectedIntegrationId || isImporting}
                className="gap-2"
              >
                {isImporting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ArrowRight className="h-4 w-4" />
                )}
                Importer tous les clients
              </Button>
            </>
          )}

          {(progress.status === 'completed' || progress.status === 'error') && (
            <Button onClick={handleClose}>
              {progress.status === 'completed' ? 'Terminé' : 'Fermer'}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
