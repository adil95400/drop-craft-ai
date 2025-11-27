import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sparkles, Image as ImageIcon, Palette, Download, RefreshCw } from 'lucide-react';

interface MockupGeneratorProps {
  designUrl: string;
  productType: string;
  onGenerate?: (mockupUrl: string) => void;
}

export function MockupGenerator({ designUrl, productType, onGenerate }: MockupGeneratorProps) {
  const [selectedColor, setSelectedColor] = useState('white');
  const [selectedSize, setSelectedSize] = useState('M');
  const [isGenerating, setIsGenerating] = useState(false);
  const [mockupUrl, setMockupUrl] = useState<string | null>(null);

  const colors = [
    { name: 'Blanc', value: 'white', hex: '#FFFFFF' },
    { name: 'Noir', value: 'black', hex: '#000000' },
    { name: 'Bleu Marine', value: 'navy', hex: '#000080' },
    { name: 'Rouge', value: 'red', hex: '#DC2626' },
    { name: 'Vert', value: 'green', hex: '#16A34A' }
  ];

  const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

  const generateMockup = async () => {
    setIsGenerating(true);
    
    // Simuler la génération de mockup avec canvas
    setTimeout(() => {
      const canvas = document.createElement('canvas');
      canvas.width = 800;
      canvas.height = 1000;
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        // Background selon la couleur
        const colorHex = colors.find(c => c.value === selectedColor)?.hex || '#FFFFFF';
        ctx.fillStyle = colorHex;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Dessiner la forme du t-shirt
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 3;
        ctx.beginPath();
        // Col
        ctx.moveTo(300, 100);
        ctx.quadraticCurveTo(400, 80, 500, 100);
        // Épaules et manches
        ctx.lineTo(550, 150);
        ctx.lineTo(600, 250);
        ctx.lineTo(550, 300);
        // Côté droit
        ctx.lineTo(520, 800);
        ctx.lineTo(480, 900);
        // Bas
        ctx.lineTo(320, 900);
        ctx.lineTo(280, 800);
        // Côté gauche
        ctx.lineTo(250, 300);
        ctx.lineTo(200, 250);
        ctx.lineTo(250, 150);
        ctx.closePath();
        ctx.stroke();
        
        // Zone de design
        ctx.fillStyle = 'rgba(139, 92, 246, 0.1)';
        ctx.fillRect(280, 300, 240, 240);
        ctx.strokeStyle = 'rgba(139, 92, 246, 0.5)';
        ctx.strokeRect(280, 300, 240, 240);
        
        // Texte indicatif
        ctx.fillStyle = '#8B5CF6';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Design Zone', 400, 420);
        ctx.font = '16px Arial';
        ctx.fillText(selectedSize, 400, 460);
        
        const mockupDataUrl = canvas.toDataURL('image/png');
        setMockupUrl(mockupDataUrl);
        onGenerate?.(mockupDataUrl);
      }
      
      setIsGenerating(false);
    }, 1500);
  };

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="h-5 w-5 text-primary" />
        <h3 className="font-semibold">Générateur de Mockups</h3>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Options */}
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Couleur</label>
            <div className="flex flex-wrap gap-2">
              {colors.map(color => (
                <button
                  key={color.value}
                  onClick={() => setSelectedColor(color.value)}
                  className={`relative w-12 h-12 rounded-full border-2 transition-all ${
                    selectedColor === color.value ? 'border-primary scale-110' : 'border-border'
                  }`}
                  style={{ backgroundColor: color.hex }}
                  title={color.name}
                >
                  {selectedColor === color.value && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-3 h-3 rounded-full bg-primary" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Taille</label>
            <div className="flex flex-wrap gap-2">
              {sizes.map(size => (
                <Button
                  key={size}
                  variant={selectedSize === size ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedSize(size)}
                >
                  {size}
                </Button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Type de produit</label>
            <Badge variant="outline">{productType}</Badge>
          </div>

          <Button
            onClick={generateMockup}
            disabled={isGenerating}
            className="w-full bg-gradient-primary"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Génération...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Générer le mockup
              </>
            )}
          </Button>
        </div>

        {/* Preview */}
        <div className="space-y-4">
          <label className="text-sm font-medium block">Aperçu</label>
          <div className="aspect-[4/5] bg-muted rounded-lg flex items-center justify-center overflow-hidden">
            {mockupUrl ? (
              <img
                src={mockupUrl}
                alt="Mockup preview"
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="text-center text-muted-foreground">
                <ImageIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Générez un mockup pour prévisualiser</p>
              </div>
            )}
          </div>
          
          {mockupUrl && (
            <Button variant="outline" className="w-full" asChild>
              <a href={mockupUrl} download={`mockup-${selectedColor}-${selectedSize}.png`}>
                <Download className="h-4 w-4 mr-2" />
                Télécharger le mockup
              </a>
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="t-shirt" className="mt-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="t-shirt">T-Shirt</TabsTrigger>
          <TabsTrigger value="hoodie">Hoodie</TabsTrigger>
          <TabsTrigger value="mug">Mug</TabsTrigger>
          <TabsTrigger value="poster">Poster</TabsTrigger>
        </TabsList>
        
        <TabsContent value="t-shirt" className="mt-4">
          <div className="grid grid-cols-3 gap-3">
            {['Face avant', 'Face arrière', 'Détail col'].map((view, i) => (
              <Card key={i} className="p-3 text-center cursor-pointer hover:border-primary transition-colors">
                <div className="aspect-square bg-muted rounded mb-2 flex items-center justify-center">
                  <ImageIcon className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-xs font-medium">{view}</p>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </Card>
  );
}
