import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  Image, 
  Loader2, 
  Download, 
  RefreshCw,
  Wand2,
  ImagePlus
} from 'lucide-react';

interface GeneratedImage {
  url: string;
  prompt: string;
  style: string;
  generatedAt: string;
}

export function AIImageGenerator() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  
  const [formData, setFormData] = useState({
    productName: '',
    productDescription: '',
    imageStyle: 'product_photo',
    background: 'white',
    aspectRatio: '1:1'
  });

  const imageStyles = [
    { id: 'product_photo', label: 'Photo Produit Pro', description: 'Style e-commerce professionnel' },
    { id: 'lifestyle', label: 'Lifestyle', description: 'Produit en situation' },
    { id: 'minimal', label: 'Minimaliste', description: 'Design épuré et moderne' },
    { id: 'creative', label: 'Créatif', description: 'Style artistique et unique' },
    { id: 'social_media', label: 'Réseaux Sociaux', description: 'Optimisé pour Instagram/Facebook' }
  ];

  const backgrounds = [
    { id: 'white', label: 'Blanc' },
    { id: 'gradient', label: 'Dégradé' },
    { id: 'studio', label: 'Studio' },
    { id: 'natural', label: 'Naturel' },
    { id: 'abstract', label: 'Abstrait' }
  ];

  const aspectRatios = [
    { id: '1:1', label: 'Carré (1:1)' },
    { id: '4:5', label: 'Portrait (4:5)' },
    { id: '16:9', label: 'Paysage (16:9)' },
    { id: '9:16', label: 'Story (9:16)' }
  ];

  const buildPrompt = () => {
    const styleDescriptions: Record<string, string> = {
      product_photo: 'Professional e-commerce product photography, clean lighting, high resolution, studio quality',
      lifestyle: 'Lifestyle product photography showing the product in use, natural setting, warm tones',
      minimal: 'Minimalist product photo, clean design, simple composition, modern aesthetic',
      creative: 'Creative artistic product visualization, unique angles, dramatic lighting',
      social_media: 'Social media optimized product image, eye-catching, vibrant colors, Instagram style'
    };

    const backgroundDescriptions: Record<string, string> = {
      white: 'pure white background',
      gradient: 'soft gradient background',
      studio: 'professional studio backdrop with subtle shadows',
      natural: 'natural environment background',
      abstract: 'abstract colorful background'
    };

    return `${styleDescriptions[formData.imageStyle]}, ${formData.productName}, ${formData.productDescription}, ${backgroundDescriptions[formData.background]}, commercial quality, 8k resolution`;
  };

  const handleGenerate = async () => {
    if (!formData.productName.trim()) {
      toast.error('Veuillez entrer le nom du produit');
      return;
    }

    setIsGenerating(true);
    try {
      const prompt = buildPrompt();
      
      const { data, error } = await supabase.functions.invoke('ai-visual-generator', {
        body: {
          prompt,
          style: formData.imageStyle,
          aspectRatio: formData.aspectRatio,
          productName: formData.productName
        }
      });

      if (error) {
        if (error.message?.includes('429')) {
          toast.error('Limite de requêtes atteinte. Veuillez réessayer plus tard.');
        } else if (error.message?.includes('402')) {
          toast.error('Crédits insuffisants.');
        } else {
          toast.error('Erreur lors de la génération d\'image');
        }
        return;
      }

      if (data?.imageUrl) {
        const newImage: GeneratedImage = {
          url: data.imageUrl,
          prompt,
          style: formData.imageStyle,
          generatedAt: new Date().toISOString()
        };
        setGeneratedImages(prev => [newImage, ...prev]);
        toast.success('Image générée avec succès !');
      } else {
        toast.error('Aucune image générée');
      }
    } catch (error) {
      console.error('Error generating image:', error);
      toast.error('Erreur lors de la génération');
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadImage = async (imageUrl: string, index: number) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `product-image-${index + 1}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success('Image téléchargée !');
    } catch (error) {
      toast.error('Erreur lors du téléchargement');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Wand2 className="h-6 w-6 text-primary" />
          Générateur d'Images IA
        </h2>
        <p className="text-muted-foreground mt-1">
          Créez des visuels produits professionnels avec l'intelligence artificielle
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Formulaire */}
        <Card className="p-6 space-y-4">
          <div>
            <Label htmlFor="productName">Nom du Produit *</Label>
            <Input
              id="productName"
              value={formData.productName}
              onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
              placeholder="Casque Bluetooth Premium"
            />
          </div>

          <div>
            <Label htmlFor="productDescription">Description Visuelle</Label>
            <Textarea
              id="productDescription"
              value={formData.productDescription}
              onChange={(e) => setFormData({ ...formData, productDescription: e.target.value })}
              placeholder="Décrivez l'apparence du produit: couleurs, matériaux, forme..."
              rows={3}
            />
          </div>

          <div>
            <Label>Style d'Image</Label>
            <Select value={formData.imageStyle} onValueChange={(v) => setFormData({ ...formData, imageStyle: v })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {imageStyles.map(style => (
                  <SelectItem key={style.id} value={style.id}>
                    <div>
                      <div className="font-medium">{style.label}</div>
                      <div className="text-xs text-muted-foreground">{style.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Fond</Label>
              <Select value={formData.background} onValueChange={(v) => setFormData({ ...formData, background: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {backgrounds.map(bg => (
                    <SelectItem key={bg.id} value={bg.id}>{bg.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Format</Label>
              <Select value={formData.aspectRatio} onValueChange={(v) => setFormData({ ...formData, aspectRatio: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {aspectRatios.map(ar => (
                    <SelectItem key={ar.id} value={ar.id}>{ar.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button 
            onClick={handleGenerate} 
            disabled={isGenerating || !formData.productName.trim()} 
            className="w-full"
            size="lg"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Génération en cours...
              </>
            ) : (
              <>
                <ImagePlus className="mr-2 h-4 w-4" />
                Générer Image
              </>
            )}
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            La génération peut prendre quelques secondes
          </p>
        </Card>

        {/* Galerie */}
        <div className="lg:col-span-2">
          {generatedImages.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-4">
              {generatedImages.map((image, index) => (
                <Card key={index} className="overflow-hidden">
                  <div className="relative aspect-square bg-muted">
                    <img 
                      src={image.url} 
                      alt={`Generated product ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 right-2 flex gap-2">
                      <Button 
                        size="icon" 
                        variant="secondary"
                        onClick={() => downloadImage(image.url, index)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="p-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium capitalize">
                        {imageStyles.find(s => s.id === image.style)?.label || image.style}
                      </span>
                      <span className="text-muted-foreground text-xs">
                        {new Date(image.generatedAt).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-12 flex flex-col items-center justify-center text-center h-full min-h-[400px]">
              <Image className="h-16 w-16 text-muted-foreground/50 mb-4" />
              <h3 className="font-medium mb-2">Aucune image générée</h3>
              <p className="text-sm text-muted-foreground max-w-md">
                Décrivez votre produit et choisissez un style pour générer des visuels professionnels avec l'IA.
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
