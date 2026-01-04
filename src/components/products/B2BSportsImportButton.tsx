import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Download, Loader2, Package } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

export function B2BSportsImportButton() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{ imported: number; errors: number } | null>(null);
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleImport = async () => {
    setIsLoading(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('b2b-sports-import', {
        body: { action: 'import', limit: 100 },
      });

      if (error) throw error;

      if (data?.success) {
        setResult({ imported: data.imported, errors: data.errors });
        toast({
          title: 'Import réussi',
          description: `${data.imported} produits importés depuis B2B Sports Wholesale`,
        });
        queryClient.invalidateQueries({ queryKey: ['unified-products'] });
        queryClient.invalidateQueries({ queryKey: ['products'] });
      } else {
        throw new Error(data?.error || 'Erreur lors de l\'import');
      }
    } catch (error) {
      console.error('Import error:', error);
      toast({
        title: 'Erreur d\'import',
        description: error instanceof Error ? error.message : 'Impossible d\'importer les produits',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestConnection = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('b2b-sports-import', {
        body: { action: 'test' },
      });

      if (error) throw error;

      if (data?.success) {
        toast({
          title: 'Connexion réussie',
          description: 'L\'API B2B Sports Wholesale est accessible',
        });
      } else {
        throw new Error(data?.error || 'Connexion échouée');
      }
    } catch (error) {
      toast({
        title: 'Erreur de connexion',
        description: error instanceof Error ? error.message : 'Impossible de se connecter à l\'API',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Package className="h-4 w-4" />
          <span className="hidden sm:inline">Importer</span> B2B Sports
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            B2B Sports Wholesale
          </DialogTitle>
          <DialogDescription>
            Importez les produits depuis votre compte B2B Sports Wholesale dans votre catalogue.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex flex-col gap-3">
            <Button
              onClick={handleTestConnection}
              variant="outline"
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Tester la connexion
            </Button>

            <Button
              onClick={handleImport}
              disabled={isLoading}
              className="w-full gap-2"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              Importer les produits
            </Button>
          </div>

          {result && (
            <div className="mt-4 p-4 rounded-lg bg-muted/50 text-center">
              <p className="text-lg font-semibold text-green-600">
                {result.imported} produits importés
              </p>
              {result.errors > 0 && (
                <p className="text-sm text-orange-600">
                  {result.errors} erreurs
                </p>
              )}
            </div>
          )}

          <p className="text-xs text-muted-foreground text-center">
            Les produits seront ajoutés en statut "brouillon" pour que vous puissiez les réviser avant publication.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
