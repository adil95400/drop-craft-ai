import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCompetitiveAnalysis } from '@/hooks/useCompetitiveAnalysis';
import { DollarSign, Plus, X, Loader2 } from 'lucide-react';

interface Competitor {
  name: string;
  price: number;
  shippingCost?: number;
}

export function PriceTracker() {
  const [productId, setProductId] = useState('');
  const [myPrice, setMyPrice] = useState('');
  const [competitors, setCompetitors] = useState<Competitor[]>([{ name: '', price: 0 }]);
  const { trackCompetitorPrices, isTracking } = useCompetitiveAnalysis();

  const addCompetitor = () => {
    setCompetitors([...competitors, { name: '', price: 0 }]);
  };

  const removeCompetitor = (index: number) => {
    setCompetitors(competitors.filter((_, i) => i !== index));
  };

  const updateCompetitor = (index: number, field: keyof Competitor, value: string | number) => {
    const updated = [...competitors];
    updated[index] = { ...updated[index], [field]: value };
    setCompetitors(updated);
  };

  const handleTrack = () => {
    if (!productId || !myPrice) return;
    
    const validCompetitors = competitors.filter(c => c.name && c.price > 0);
    if (validCompetitors.length === 0) return;

    trackCompetitorPrices.mutate({
      productId,
      myPrice: parseFloat(myPrice),
      competitors: validCompetitors,
    });

    setProductId('');
    setMyPrice('');
    setCompetitors([{ name: '', price: 0 }]);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="w-5 h-5" />
          Suivi des prix
        </CardTitle>
        <CardDescription>
          Comparez vos prix avec ceux de vos concurrents
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="product-id">ID Produit</Label>
            <Input
              id="product-id"
              placeholder="SKU ou ID"
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="my-price">Mon prix (€)</Label>
            <Input
              id="my-price"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={myPrice}
              onChange={(e) => setMyPrice(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Concurrents</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addCompetitor}
            >
              <Plus className="w-4 h-4 mr-1" />
              Ajouter
            </Button>
          </div>

          {competitors.map((competitor, index) => (
            <div key={index} className="flex gap-2">
              <Input
                placeholder="Nom du concurrent"
                value={competitor.name}
                onChange={(e) => updateCompetitor(index, 'name', e.target.value)}
              />
              <Input
                type="number"
                step="0.01"
                placeholder="Prix"
                value={competitor.price || ''}
                onChange={(e) => updateCompetitor(index, 'price', parseFloat(e.target.value) || 0)}
                className="w-32"
              />
              <Input
                type="number"
                step="0.01"
                placeholder="Livraison"
                value={competitor.shippingCost || ''}
                onChange={(e) => updateCompetitor(index, 'shippingCost', parseFloat(e.target.value) || 0)}
                className="w-32"
              />
              {competitors.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeCompetitor(index)}
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          ))}
        </div>

        <Button 
          onClick={handleTrack} 
          disabled={!productId || !myPrice || isTracking}
          className="w-full"
        >
          {isTracking ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Suivi en cours...
            </>
          ) : (
            <>
              <DollarSign className="w-4 h-4 mr-2" />
              Démarrer le suivi
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
