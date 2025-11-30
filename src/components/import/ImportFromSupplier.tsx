import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, Package } from 'lucide-react';

interface ImportFromSupplierProps {
  onPreview: (data: any) => void;
}

export function ImportFromSupplier({ onPreview }: ImportFromSupplierProps) {
  const handleBrowse = () => {
    // Simuler des produits du fournisseur
    const previewData = {
      source: 'supplier',
      supplierId: 'demo',
      supplierName: 'Fournisseur Demo',
      products: [
        {
          id: '1',
          title: 'Produit Fournisseur 1',
          price: 24.99,
          supplier: 'Fournisseur Demo',
          image: '/placeholder.svg',
          stock: 'En stock',
          errors: []
        },
        {
          id: '2',
          title: 'Produit Fournisseur 2',
          price: 34.99,
          supplier: 'Fournisseur Demo',
          image: '/placeholder.svg',
          stock: 'En stock',
          errors: []
        }
      ],
      summary: {
        total: 2,
        valid: 2,
        errors: 0,
        warnings: 0
      }
    };

    onPreview(previewData);
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
        <Button onClick={handleBrowse}>
          <Eye className="w-4 h-4 mr-2" />
          Voir un exemple
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
