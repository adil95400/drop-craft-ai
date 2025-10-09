import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useContentGeneration } from '@/hooks/useContentGeneration';
import { Sparkles, Loader2, Upload } from 'lucide-react';

export function ImageEnhancer() {
  const { enhanceImage, isEnhancingImage, enhancedImageData } = useContentGeneration();
  const [imageUrl, setImageUrl] = useState('');
  const [productContext, setProductContext] = useState('');
  const [enhancementType, setEnhancementType] = useState<'quality' | 'background' | 'lighting' | 'style' | 'upscale'>('quality');
  const [previewUrl, setPreviewUrl] = useState('');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setImageUrl(url);
    }
  };

  const handleEnhance = () => {
    enhanceImage({
      imageUrl,
      enhancementType,
      productContext
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-primary" />
          Amélioration Photos IA
        </h2>
        <p className="text-muted-foreground mt-1">
          Transformez vos photos produits en images professionnelles
        </p>
      </div>

      <div className="grid gap-4">
        <div>
          <Label htmlFor="imageFile">Image Produit</Label>
          <div className="flex gap-2">
            <Input
              id="imageFile"
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="flex-1"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="productContext">Contexte Produit (optionnel)</Label>
          <Input
            id="productContext"
            value={productContext}
            onChange={(e) => setProductContext(e.target.value)}
            placeholder="ex: Casque audio haut de gamme"
          />
        </div>

        <div>
          <Label htmlFor="enhancementType">Type d'Amélioration</Label>
          <Select value={enhancementType} onValueChange={(value: any) => setEnhancementType(value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="quality">Qualité Générale</SelectItem>
              <SelectItem value="background">Fond Professionnel</SelectItem>
              <SelectItem value="lighting">Optimiser Éclairage</SelectItem>
              <SelectItem value="style">Style E-commerce</SelectItem>
              <SelectItem value="upscale">Haute Résolution</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button onClick={handleEnhance} disabled={isEnhancingImage || !imageUrl} size="lg">
          {isEnhancingImage ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Amélioration en cours...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Améliorer avec IA
            </>
          )}
        </Button>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {previewUrl && (
          <div>
            <Label className="mb-2 block">Image Originale</Label>
            <img src={previewUrl} alt="Original" className="w-full rounded-lg border" />
          </div>
        )}

        {enhancedImageData?.enhancedImage && (
          <div>
            <Label className="mb-2 block">Image Améliorée</Label>
            <img src={enhancedImageData.enhancedImage} alt="Enhanced" className="w-full rounded-lg border" />
            
            {enhancedImageData.qualityAnalysis && (
              <div className="mt-4 p-4 bg-accent/50 rounded-lg space-y-2">
                <p className="font-semibold">
                  Score Qualité: {enhancedImageData.qualityAnalysis.qualityScore}/100
                </p>
                <div className="text-sm space-y-1">
                  <p className="font-medium">Améliorations:</p>
                  <ul className="list-disc list-inside">
                    {enhancedImageData.qualityAnalysis.improvements?.map((imp: string, i: number) => (
                      <li key={i}>{imp}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
