import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, Package } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface ImportFromSupplierProps {
  onPreview: (data: any) => void;
}

export function ImportFromSupplier({ onPreview }: ImportFromSupplierProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleBrowseSuppliers = () => {
    // Redirect to supplier marketplace for browsing and selection
    window.location.href = '/suppliers/marketplace';
  };

  // This would be called after user selects products from supplier catalog
  const handleGeneratePreview = async (selectedProducts: any[], supplierId: string) => {
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('import-preview', {
        body: {
          source: 'supplier',
          data: selectedProducts,
          supplierId
        }
      });

      if (error) throw error;
      
      onPreview(data.preview);
    } catch (err) {
      console.error('Preview generation failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Alert>
        <Package className="h-4 w-4" />
        <AlertDescription>
          <p className="font-medium mb-2">Connectez vos fournisseurs</p>
          <p className="text-sm text-muted-foreground mb-3">
            Accédez aux catalogues de vos fournisseurs connectés et importez leurs produits
          </p>
          <Button size="sm" onClick={() => window.location.href = '/suppliers/marketplace'}>
            Parcourir les fournisseurs
          </Button>
        </AlertDescription>
      </Alert>

      <div className="flex justify-end">
        <Button onClick={handleBrowseSuppliers}>
          <Eye className="w-4 h-4 mr-2" />
          Parcourir les fournisseurs
        </Button>
      </div>

      <Alert>
        <AlertDescription className="text-xs">
          💡 <strong>Astuce :</strong> Une fois vos fournisseurs connectés, vous pourrez parcourir leurs catalogues et sélectionner plusieurs produits simultanément
        </AlertDescription>
      </Alert>
    </div>
  );
}
