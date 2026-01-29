/**
 * SupplierConfigModal - Modal for configuring/connecting suppliers
 * Extracted from ChannableStyleSuppliersPage
 */

import { useState, useCallback, memo } from 'react';
import { 
  DialogContent, DialogDescription, DialogHeader, DialogTitle 
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { 
  Crown, Shield, ExternalLink, MapPin, Star, Package, Truck, AlertCircle 
} from 'lucide-react';
import { SupplierLogo } from './SupplierLogo';
import { SupplierDefinition, COUNTRY_FLAGS } from '@/data/supplierDefinitions';
import type { Supplier } from '@/hooks/useRealSuppliers';

interface SupplierConfigModalProps {
  definition: SupplierDefinition;
  existingSupplier?: Supplier;
  onClose: () => void;
  onConnect: (data: any) => void;
  isConnecting: boolean;
}

export const SupplierConfigModal = memo(function SupplierConfigModal({ 
  definition, 
  existingSupplier,
  onClose,
  onConnect,
  isConnecting
}: SupplierConfigModalProps) {
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [isActive, setIsActive] = useState(true);
  const isEditing = !!existingSupplier;

  const handleSubmit = useCallback(() => {
    onConnect({
      name: definition.name,
      website: `https://${definition.id}.com`,
      country: definition.country,
      status: isActive ? 'active' : 'inactive',
      rating: definition.rating,
      credentials: formData
    });
  }, [definition, formData, isActive, onConnect]);

  return (
    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-3">
          <SupplierLogo 
            name={definition.name}
            logo={definition.logo}
            country={definition.country}
            size="md"
          />
          {isEditing ? `Configurer ${definition.name}` : `Connecter ${definition.name}`}
          {definition.premium && (
            <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white">
              <Crown className="w-3 h-3 mr-1" /> Premium
            </Badge>
          )}
        </DialogTitle>
        <DialogDescription>
          {definition.description}
        </DialogDescription>
      </DialogHeader>

      <Tabs defaultValue="connection" className="mt-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="connection">Connexion</TabsTrigger>
          <TabsTrigger value="info">Informations</TabsTrigger>
        </TabsList>

        <TabsContent value="connection" className="space-y-4 mt-4">
          {definition.setupFields && definition.setupFields.length > 0 ? (
            definition.setupFields.map(field => (
              <div key={field.name} className="space-y-2">
                <Label htmlFor={field.name}>
                  {field.label} {field.required && <span className="text-destructive">*</span>}
                </Label>
                <Input
                  id={field.name}
                  type={field.type === 'password' ? 'password' : 'text'}
                  placeholder={field.placeholder}
                  value={formData[field.name] || ''}
                  onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                />
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Shield className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="font-medium">Connexion manuelle requise</p>
              <p className="text-sm mt-2">Visitez le site du fournisseur pour créer un compte.</p>
              <Button variant="outline" className="mt-4" asChild>
                <a href={`https://${definition.id}.com`} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Visiter {definition.name}
                </a>
              </Button>
            </div>
          )}

          <div className="flex items-center justify-between py-3 border-t">
            <div>
              <p className="font-medium">Activer le fournisseur</p>
              <p className="text-sm text-muted-foreground">Synchroniser automatiquement les produits</p>
            </div>
            <Switch checked={isActive} onCheckedChange={setIsActive} />
          </div>
        </TabsContent>

        <TabsContent value="info" className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <MapPin className="w-4 h-4" />
                  Pays
                </div>
                <p className="font-medium">{COUNTRY_FLAGS[definition.country]} {definition.country}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <Star className="w-4 h-4" />
                  Note
                </div>
                <p className="font-medium">{definition.rating?.toFixed(1) || 'N/A'} / 5</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <Package className="w-4 h-4" />
                  Produits
                </div>
                <p className="font-medium">{definition.productsCount?.toLocaleString() || 'N/A'}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <Truck className="w-4 h-4" />
                  Livraison
                </div>
                <p className="font-medium">{definition.shippingTime || 'Variable'}</p>
              </CardContent>
            </Card>
          </div>

          {definition.features && definition.features.length > 0 && (
            <div className="bg-muted/50 rounded-lg p-4">
              <p className="font-medium mb-3">Fonctionnalités incluses :</p>
              <div className="flex flex-wrap gap-2">
                {definition.features.map(feature => (
                  <Badge key={feature} variant="secondary">{feature}</Badge>
                ))}
              </div>
            </div>
          )}

          {definition.minOrder !== undefined && definition.minOrder > 0 && (
            <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
              <AlertCircle className="w-4 h-4 text-amber-600" />
              <span className="text-sm text-amber-700 dark:text-amber-400">
                Quantité minimum de commande : {definition.minOrder} unités
              </span>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <div className="flex justify-end gap-3 mt-6">
        <Button variant="outline" onClick={onClose}>Annuler</Button>
        <Button onClick={handleSubmit} disabled={isConnecting}>
          {isConnecting ? 'Connexion...' : (isEditing ? 'Mettre à jour' : 'Connecter')}
        </Button>
      </div>
    </DialogContent>
  );
});
