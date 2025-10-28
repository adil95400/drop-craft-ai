import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useBulkContentGeneration } from '@/hooks/useBulkContentGeneration';
import { Images, Loader2, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function BulkImageGenerator() {
  const { createBulkJob, isCreatingJob } = useBulkContentGeneration();
  const { toast } = useToast();
  const [productList, setProductList] = useState('');
  const [imageStyle, setImageStyle] = useState('ecommerce');
  const [aspectRatio, setAspectRatio] = useState('square');

  const handleGenerate = () => {
    const lines = productList.trim().split('\n').filter(line => line.trim());
    
    if (lines.length === 0) {
      toast({
        title: 'Liste vide',
        description: 'Ajoutez au moins un produit',
        variant: 'destructive'
      });
      return;
    }

    const products = lines.map(line => {
      const parts = line.split('|').map(p => p.trim());
      return {
        name: parts[0] || '',
        description: parts[1] || parts[0],
        visualPrompt: parts[2] || `Professional product photo of ${parts[0]}`
      };
    });

    createBulkJob({
      jobType: 'images',
      inputData: {
        products,
        imageStyle,
        aspectRatio
      }
    });
  };

  const exampleText = `Casque Audio Premium | Casque sans fil noir élégant | Fond blanc studio professionnel
Montre Connectée | Montre sport moderne écran LED | Fond dégradé bleu
Chargeur USB-C | Chargeur blanc compact design minimaliste | Fond blanc avec ombre douce`;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Images className="h-6 w-6 text-primary" />
          Génération d'Images en Masse
        </h2>
        <p className="text-muted-foreground mt-1">
          Créez des images produits professionnelles en série
        </p>
      </div>

      <div className="bg-accent/50 border rounded-lg p-4 space-y-2">
        <div className="flex items-start gap-2">
          <FileText className="h-5 w-5 text-primary mt-0.5" />
          <div>
            <p className="font-semibold">Format d'entrée</p>
            <p className="text-sm text-muted-foreground">
              Une ligne par produit: <code className="bg-background px-1 rounded">Nom | Description | Prompt visuel</code>
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4">
        <div>
          <Label htmlFor="productList">Liste de Produits</Label>
          <Textarea
            id="productList"
            value={productList}
            onChange={(e) => setProductList(e.target.value)}
            placeholder={exampleText}
            rows={10}
            className="font-mono text-sm"
          />
          <p className="text-xs text-muted-foreground mt-1">
            {productList.trim().split('\n').filter(l => l.trim()).length} produits détectés
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="imageStyle">Style d'Image</Label>
            <Select value={imageStyle} onValueChange={setImageStyle}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ecommerce">E-commerce Pro</SelectItem>
                <SelectItem value="lifestyle">Lifestyle</SelectItem>
                <SelectItem value="minimalist">Minimaliste</SelectItem>
                <SelectItem value="luxury">Luxe</SelectItem>
                <SelectItem value="colorful">Coloré</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="aspectRatio">Format</Label>
            <Select value={aspectRatio} onValueChange={setAspectRatio}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="square">Carré (1:1)</SelectItem>
                <SelectItem value="portrait">Portrait (4:5)</SelectItem>
                <SelectItem value="landscape">Paysage (16:9)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button onClick={handleGenerate} disabled={isCreatingJob} size="lg">
          {isCreatingJob ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Lancement en cours...
            </>
          ) : (
            <>
              <Images className="mr-2 h-4 w-4" />
              Générer {productList.trim().split('\n').filter(l => l.trim()).length} Images
            </>
          )}
        </Button>
      </div>

      <div className="border-t pt-4">
        <p className="text-sm text-muted-foreground">
          💡 <strong>Astuce:</strong> Les images sont générées avec Gemini 2.5 Flash Image Preview. 
          Suivez la progression dans l'onglet "Jobs en Cours".
        </p>
      </div>
    </div>
  );
}
