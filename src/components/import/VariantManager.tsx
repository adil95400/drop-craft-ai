import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Trash2, 
  Copy,
  Grid,
  Image as ImageIcon,
  DollarSign,
  Package
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Variant {
  id: string;
  name: string;
  sku: string;
  price: number;
  stock: number;
  image?: string;
  attributes: Record<string, string>;
}

export const VariantManager: React.FC = () => {
  const { toast } = useToast();
  const [variants, setVariants] = useState<Variant[]>([
    {
      id: '1',
      name: 'Produit - Noir / S',
      sku: 'PROD-BK-S',
      price: 29.99,
      stock: 100,
      attributes: { color: 'Noir', size: 'S' }
    }
  ]);

  const [attributes, setAttributes] = useState({
    colors: ['Noir', 'Blanc', 'Rouge', 'Bleu'],
    sizes: ['S', 'M', 'L', 'XL']
  });

  const addVariant = () => {
    const newVariant: Variant = {
      id: Date.now().toString(),
      name: 'Nouvelle variante',
      sku: `PROD-${Date.now()}`,
      price: 0,
      stock: 0,
      attributes: {}
    };
    setVariants([...variants, newVariant]);
  };

  const deleteVariant = (id: string) => {
    setVariants(variants.filter(v => v.id !== id));
    toast({
      title: "Variante supprimée",
      description: "La variante a été supprimée avec succès"
    });
  };

  const duplicateVariant = (variant: Variant) => {
    const newVariant = {
      ...variant,
      id: Date.now().toString(),
      name: `${variant.name} (Copie)`,
      sku: `${variant.sku}-COPY`
    };
    setVariants([...variants, newVariant]);
    toast({
      title: "Variante dupliquée",
      description: "La variante a été dupliquée avec succès"
    });
  };

  const generateAllVariants = () => {
    const newVariants: Variant[] = [];
    let index = 0;

    attributes.colors.forEach(color => {
      attributes.sizes.forEach(size => {
        index++;
        newVariants.push({
          id: `${Date.now()}-${index}`,
          name: `Produit - ${color} / ${size}`,
          sku: `PROD-${color.substring(0, 2).toUpperCase()}-${size}`,
          price: 29.99,
          stock: 50,
          attributes: { color, size }
        });
      });
    });

    setVariants(newVariants);
    toast({
      title: "Variantes générées",
      description: `${newVariants.length} variantes ont été créées automatiquement`
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Grid className="w-5 h-5" />
          Gestion des Variantes
        </CardTitle>
        <CardDescription>
          Créez et gérez les variantes de votre produit (couleurs, tailles, etc.)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Attributs */}
        <div className="grid gap-4">
          <div>
            <Label>Couleurs disponibles</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {attributes.colors.map(color => (
                <Badge key={color} variant="outline">
                  {color}
                </Badge>
              ))}
              <Button size="sm" variant="ghost">
                <Plus className="w-3 h-3 mr-1" />
                Ajouter
              </Button>
            </div>
          </div>

          <div>
            <Label>Tailles disponibles</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {attributes.sizes.map(size => (
                <Badge key={size} variant="outline">
                  {size}
                </Badge>
              ))}
              <Button size="sm" variant="ghost">
                <Plus className="w-3 h-3 mr-1" />
                Ajouter
              </Button>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-2">
          <Button onClick={addVariant} variant="outline">
            <Plus className="w-4 h-4 mr-2" />
            Ajouter variante
          </Button>
          <Button onClick={generateAllVariants}>
            <Grid className="w-4 h-4 mr-2" />
            Générer toutes les variantes
          </Button>
        </div>

        {/* Liste des variantes */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Variantes créées ({variants.length})</Label>
          </div>

          <div className="space-y-2">
            {variants.map(variant => (
              <Card key={variant.id} className="bg-muted">
                <CardContent className="p-4">
                  <div className="grid gap-4 md:grid-cols-[1fr,auto,auto,auto,auto]">
                    <div>
                      <p className="font-medium">{variant.name}</p>
                      <p className="text-sm text-muted-foreground">{variant.sku}</p>
                      <div className="flex gap-2 mt-1">
                        {Object.entries(variant.attributes).map(([key, value]) => (
                          <Badge key={key} variant="secondary" className="text-xs">
                            {value}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <ImageIcon className="w-4 h-4 text-muted-foreground" />
                      <Input
                        type="file"
                        className="hidden"
                        id={`image-${variant.id}`}
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => document.getElementById(`image-${variant.id}`)?.click()}
                      >
                        Image
                      </Button>
                    </div>

                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-muted-foreground" />
                      <Input
                        type="number"
                        value={variant.price}
                        onChange={(e) => {
                          const newVariants = variants.map(v =>
                            v.id === variant.id
                              ? { ...v, price: parseFloat(e.target.value) }
                              : v
                          );
                          setVariants(newVariants);
                        }}
                        className="w-24"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-muted-foreground" />
                      <Input
                        type="number"
                        value={variant.stock}
                        onChange={(e) => {
                          const newVariants = variants.map(v =>
                            v.id === variant.id
                              ? { ...v, stock: parseInt(e.target.value) }
                              : v
                          );
                          setVariants(newVariants);
                        }}
                        className="w-20"
                      />
                    </div>

                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => duplicateVariant(variant)}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteVariant(variant.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {variants.length === 0 && (
            <Card className="bg-muted">
              <CardContent className="p-8 text-center">
                <Grid className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Aucune variante créée. Cliquez sur "Générer toutes les variantes" pour commencer.
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Résumé */}
        <Card className="bg-muted">
          <CardContent className="p-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold">{variants.length}</p>
                <p className="text-xs text-muted-foreground">Variantes</p>
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {variants.reduce((sum, v) => sum + v.stock, 0)}
                </p>
                <p className="text-xs text-muted-foreground">Stock total</p>
              </div>
              <div>
                <p className="text-2xl font-bold">
                  ${(variants.reduce((sum, v) => sum + v.price, 0) / variants.length || 0).toFixed(2)}
                </p>
                <p className="text-xs text-muted-foreground">Prix moyen</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  );
};
