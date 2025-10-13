import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAIServices } from '@/hooks/useAIServices';
import { Loader2, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export const AIProductDescriptionGenerator = () => {
  const [productName, setProductName] = useState('');
  const [category, setCategory] = useState('');
  const [features, setFeatures] = useState('');
  const [tone, setTone] = useState('professional');
  const [length, setLength] = useState('medium');
  const [generatedDescription, setGeneratedDescription] = useState('');

  const { generateProductDescription } = useAIServices();

  const handleGenerate = async () => {
    const featuresArray = features.split(',').map(f => f.trim()).filter(Boolean);
    
    const result = await generateProductDescription.mutateAsync({
      productName,
      category,
      features: featuresArray,
      tone,
      length
    });

    setGeneratedDescription(result.description);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Générateur de Descriptions Produits IA
        </CardTitle>
        <CardDescription>
          Créez des descriptions de produits optimisées pour le SEO en quelques secondes
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="productName">Nom du Produit</Label>
          <Input
            id="productName"
            placeholder="Ex: iPhone 15 Pro Max"
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="category">Catégorie</Label>
          <Input
            id="category"
            placeholder="Ex: Smartphones"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="features">Caractéristiques (séparées par des virgules)</Label>
          <Textarea
            id="features"
            placeholder="Ex: Écran 6.7 pouces, Processeur A17 Pro, Caméra 48MP"
            value={features}
            onChange={(e) => setFeatures(e.target.value)}
            rows={3}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="tone">Ton</Label>
            <Select value={tone} onValueChange={setTone}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="professional">Professionnel</SelectItem>
                <SelectItem value="casual">Décontracté</SelectItem>
                <SelectItem value="luxury">Luxe</SelectItem>
                <SelectItem value="technical">Technique</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="length">Longueur</Label>
            <Select value={length} onValueChange={setLength}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="short">Court (50-100 mots)</SelectItem>
                <SelectItem value="medium">Moyen (100-200 mots)</SelectItem>
                <SelectItem value="long">Long (200-300 mots)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button 
          onClick={handleGenerate} 
          disabled={generateProductDescription.isPending || !productName || !category}
          className="w-full"
        >
          {generateProductDescription.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Génération en cours...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Générer la Description
            </>
          )}
        </Button>

        {generatedDescription && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Description Générée</Label>
              <Badge variant="secondary">IA</Badge>
            </div>
            <Textarea
              value={generatedDescription}
              onChange={(e) => setGeneratedDescription(e.target.value)}
              rows={8}
              className="font-mono text-sm"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigator.clipboard.writeText(generatedDescription)}
            >
              Copier dans le presse-papier
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
