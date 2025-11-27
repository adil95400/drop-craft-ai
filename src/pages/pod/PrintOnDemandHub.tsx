import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Sparkles, Package, Image as ImageIcon, Palette, Plus, TrendingUp } from 'lucide-react';
import { usePOD } from '@/hooks/usePOD';

export default function PrintOnDemandHub() {
  const [productName, setProductName] = useState('');
  const [designPrompt, setDesignPrompt] = useState('');
  const { createProduct, generateDesign, getCatalog, getProducts } = usePOD();

  const catalog = getCatalog.data || [];
  const products = getProducts.data || [];

  const handleGenerateDesign = () => {
    generateDesign.mutate({
      prompt: designPrompt,
      productType: 't-shirt',
      style: 'modern'
    });
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Palette className="h-8 w-8 text-primary" />
            Print On Demand
          </h1>
          <p className="text-muted-foreground mt-2">
            Créez des produits personnalisés avec génération IA
          </p>
        </div>

        <div className="flex gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Sparkles className="h-4 w-4 mr-2" />
                Générer un design IA
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Générer un design avec IA</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  placeholder="Décrivez votre design..."
                  value={designPrompt}
                  onChange={(e) => setDesignPrompt(e.target.value)}
                />
                <Button
                  onClick={handleGenerateDesign}
                  disabled={!designPrompt || generateDesign.isPending}
                  className="w-full"
                >
                  {generateDesign.isPending ? 'Génération...' : 'Générer le design'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Button className="bg-gradient-primary">
            <Plus className="h-4 w-4 mr-2" />
            Nouveau produit POD
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Package className="h-5 w-5 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Produits POD</p>
              <p className="text-2xl font-bold">{products.length}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <ImageIcon className="h-5 w-5 text-purple-500" />
            <div>
              <p className="text-sm text-muted-foreground">Designs créés</p>
              <p className="text-2xl font-bold">
                {products.filter((p: any) => p.ai_generated).length}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <TrendingUp className="h-5 w-5 text-green-500" />
            <div>
              <p className="text-sm text-muted-foreground">Actifs</p>
              <p className="text-2xl font-bold">
                {products.filter((p: any) => p.status === 'active').length}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Package className="h-5 w-5 text-blue-500" />
            <div>
              <p className="text-sm text-muted-foreground">Fournisseurs</p>
              <p className="text-2xl font-bold">3</p>
            </div>
          </div>
        </Card>
      </div>

      <Tabs defaultValue="catalog">
        <TabsList>
          <TabsTrigger value="catalog">Catalogue POD</TabsTrigger>
          <TabsTrigger value="products">Mes produits</TabsTrigger>
          <TabsTrigger value="designs">Designs IA</TabsTrigger>
          <TabsTrigger value="mockups">Mockups</TabsTrigger>
        </TabsList>

        <TabsContent value="catalog" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {catalog.map((item: any) => (
              <Card key={item.id} className="p-6">
                <div className="aspect-square bg-gradient-to-br from-primary/20 to-secondary/20 rounded-lg mb-4" />
                <h3 className="font-bold mb-2">{item.name}</h3>
                <p className="text-sm text-muted-foreground mb-2">Base: {item.base_cost}€</p>
                <div className="flex flex-wrap gap-1 mb-4">
                  {item.colors.map((color: string) => (
                    <Badge key={color} variant="outline" className="text-xs">
                      {color}
                    </Badge>
                  ))}
                </div>
                <Button className="w-full" size="sm">
                  Utiliser ce produit
                </Button>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="products" className="space-y-4">
          {products.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {products.map((product: any) => (
                <Card key={product.id} className="p-6">
                  <div className="aspect-square bg-gradient-to-br from-primary/20 to-secondary/20 rounded-lg mb-4" />
                  <h3 className="font-bold mb-2">{product.product_name}</h3>
                  <div className="flex items-center justify-between mb-4">
                    <Badge variant={product.status === 'active' ? 'default' : 'secondary'}>
                      {product.status}
                    </Badge>
                    <p className="font-semibold">{product.selling_price}€</p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {(product.variants as any[])?.length || 0} variantes
                  </p>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-12 text-center">
              <Palette className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">Aucun produit POD</h3>
              <p className="text-muted-foreground">
                Créez votre premier produit Print On Demand
              </p>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="designs">
          <Card className="p-12 text-center">
            <Sparkles className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">Designs générés par IA</h3>
            <p className="text-muted-foreground">
              Vos designs créés avec l'intelligence artificielle apparaîtront ici
            </p>
          </Card>
        </TabsContent>

        <TabsContent value="mockups">
          <Card className="p-12 text-center">
            <ImageIcon className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">Mockups générés</h3>
            <p className="text-muted-foreground">
              Les mockups de vos produits POD seront affichés ici
            </p>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}