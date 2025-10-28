import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useBulkContentGeneration } from '@/hooks/useBulkContentGeneration';
import { Video, Loader2, Upload, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function BulkVideoGenerator() {
  const { createBulkJob, isCreatingJob } = useBulkContentGeneration();
  const { toast } = useToast();
  const [productList, setProductList] = useState('');
  const [videoStyle, setVideoStyle] = useState('tiktok');
  const [duration, setDuration] = useState('15');

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
        price: parts[2] || '0'
      };
    });

    createBulkJob({
      jobType: 'videos',
      inputData: {
        products,
        videoStyle,
        duration: parseInt(duration)
      }
    });
  };

  const exampleText = `Casque Sans Fil Premium | Réduction de bruit active, 30h autonomie | 199.99€
Montre Connectée Sport | GPS intégré, étanche 50m | 299€
Chargeur Rapide USB-C | 65W, compatible tous appareils | 29.99€`;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Video className="h-6 w-6 text-primary" />
          Génération de Vidéos en Masse
        </h2>
        <p className="text-muted-foreground mt-1">
          Générez des dizaines de vidéos TikTok automatiquement
        </p>
      </div>

      <div className="bg-accent/50 border rounded-lg p-4 space-y-2">
        <div className="flex items-start gap-2">
          <FileText className="h-5 w-5 text-primary mt-0.5" />
          <div>
            <p className="font-semibold">Format d'entrée</p>
            <p className="text-sm text-muted-foreground">
              Une ligne par produit: <code className="bg-background px-1 rounded">Nom | Description | Prix</code>
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
            <Label htmlFor="videoStyle">Style Vidéo</Label>
            <Select value={videoStyle} onValueChange={setVideoStyle}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tiktok">TikTok</SelectItem>
                <SelectItem value="instagram">Instagram Reels</SelectItem>
                <SelectItem value="youtube">YouTube Shorts</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="duration">Durée (secondes)</Label>
            <Select value={duration} onValueChange={setDuration}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="15">15 secondes</SelectItem>
                <SelectItem value="30">30 secondes</SelectItem>
                <SelectItem value="60">60 secondes</SelectItem>
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
              <Video className="mr-2 h-4 w-4" />
              Générer {productList.trim().split('\n').filter(l => l.trim()).length} Vidéos
            </>
          )}
        </Button>
      </div>

      <div className="border-t pt-4">
        <p className="text-sm text-muted-foreground">
          💡 <strong>Astuce:</strong> Les vidéos seront générées en arrière-plan. 
          Suivez la progression dans l'onglet "Jobs en Cours".
        </p>
      </div>
    </div>
  );
}
