import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useContentGeneration } from '@/hooks/useContentGeneration';
import { Video, Loader2 } from 'lucide-react';

export function VideoGenerator() {
  const { generateVideo, isGeneratingVideo, videoData } = useContentGeneration();
  const [formData, setFormData] = useState({
    productName: '',
    productDescription: '',
    productPrice: '',
    duration: '15',
    videoStyle: 'tiktok'
  });

  const handleGenerate = () => {
    generateVideo({
      productData: {
        name: formData.productName,
        description: formData.productDescription,
        price: formData.productPrice
      },
      videoStyle: formData.videoStyle,
      duration: parseInt(formData.duration)
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Video className="h-6 w-6 text-primary" />
          Générateur de Vidéos TikTok
        </h2>
        <p className="text-muted-foreground mt-1">
          Créez des vidéos produits virales en quelques secondes
        </p>
      </div>

      <div className="grid gap-4">
        <div>
          <Label htmlFor="productName">Nom du Produit</Label>
          <Input
            id="productName"
            value={formData.productName}
            onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
            placeholder="Casque Sans Fil Premium"
          />
        </div>

        <div>
          <Label htmlFor="productDescription">Description</Label>
          <Textarea
            id="productDescription"
            value={formData.productDescription}
            onChange={(e) => setFormData({ ...formData, productDescription: e.target.value })}
            placeholder="Réduction de bruit active, 30h d'autonomie..."
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label htmlFor="productPrice">Prix</Label>
            <Input
              id="productPrice"
              value={formData.productPrice}
              onChange={(e) => setFormData({ ...formData, productPrice: e.target.value })}
              placeholder="199.99 €"
            />
          </div>

          <div>
            <Label htmlFor="duration">Durée (sec)</Label>
            <Select value={formData.duration} onValueChange={(value) => setFormData({ ...formData, duration: value })}>
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

          <div>
            <Label htmlFor="videoStyle">Style</Label>
            <Select value={formData.videoStyle} onValueChange={(value) => setFormData({ ...formData, videoStyle: value })}>
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
        </div>

        <Button onClick={handleGenerate} disabled={isGeneratingVideo} size="lg">
          {isGeneratingVideo ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Génération en cours...
            </>
          ) : (
            <>
              <Video className="mr-2 h-4 w-4" />
              Générer Vidéo avec IA
            </>
          )}
        </Button>
      </div>

      {videoData && (
        <div className="border rounded-lg p-6 bg-accent/50 space-y-4">
          <h3 className="font-semibold text-lg">Script Vidéo Généré</h3>
          
          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Hook (0-3s)</p>
              <p className="text-sm">{videoData.videoScript.hook}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Problème (3-5s)</p>
              <p className="text-sm">{videoData.videoScript.problem}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Solution (5-10s)</p>
              <p className="text-sm">{videoData.videoScript.solution}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">CTA (10-15s)</p>
              <p className="text-sm">{videoData.videoScript.cta}</p>
            </div>
          </div>

          {videoData.keyFrames && videoData.keyFrames.length > 0 && (
            <div>
              <h4 className="font-semibold mb-3">Images Clés Générées ({videoData.keyFrames.length})</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {videoData.keyFrames.map((frame: any, index: number) => (
                  <div key={index} className="space-y-2">
                    <img 
                      src={frame.imageUrl} 
                      alt={`Frame ${index + 1}`}
                      className="w-full rounded-lg border"
                    />
                    <p className="text-xs text-muted-foreground">{frame.caption}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
