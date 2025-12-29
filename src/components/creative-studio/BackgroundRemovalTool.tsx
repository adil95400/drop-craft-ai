import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Loader2, Upload, Download, Eraser, ImageIcon, Check } from 'lucide-react';
import { useBackgroundRemoval } from '@/hooks/useBackgroundRemoval';
import { useToast } from '@/hooks/use-toast';

interface BackgroundRemovalToolProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialImage?: string;
}

export function BackgroundRemovalTool({ open, onOpenChange, initialImage }: BackgroundRemovalToolProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { processImage, isProcessing, progress, error } = useBackgroundRemoval();
  
  const [sourceImage, setSourceImage] = useState<string | null>(initialImage || null);
  const [resultImage, setResultImage] = useState<string | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setSourceImage(url);
      setResultImage(null);
    }
  };

  const handleProcess = async () => {
    if (!sourceImage) return;
    
    const result = await processImage(sourceImage);
    if (result) {
      setResultImage(result);
      toast({
        title: "Fond supprimé",
        description: "L'image a été traitée avec succès"
      });
    } else if (error) {
      toast({
        title: "Erreur",
        description: error,
        variant: "destructive"
      });
    }
  };

  const handleDownload = () => {
    if (!resultImage) return;
    
    const a = document.createElement('a');
    a.href = resultImage;
    a.download = `sans-fond-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    toast({ title: "Téléchargement démarré" });
  };

  const handleReset = () => {
    setSourceImage(null);
    setResultImage(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eraser className="h-5 w-5" />
            Suppression de fond IA
          </DialogTitle>
          <DialogDescription>
            Supprimez automatiquement l'arrière-plan de vos images en quelques secondes
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Source Image */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Image originale</h4>
            <div 
              className="aspect-square bg-muted rounded-lg flex items-center justify-center overflow-hidden cursor-pointer border-2 border-dashed border-muted-foreground/30 hover:border-primary/50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              {sourceImage ? (
                <img src={sourceImage} alt="Source" className="w-full h-full object-contain" />
              ) : (
                <div className="text-center p-4">
                  <Upload className="h-10 w-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm text-muted-foreground">Cliquez pour importer une image</p>
                  <p className="text-xs text-muted-foreground mt-1">PNG, JPG jusqu'à 10 Mo</p>
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileSelect}
            />
          </div>

          {/* Result Image */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Résultat</h4>
            <div className="aspect-square bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCI+PHJlY3Qgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiBmaWxsPSIjZmZmIi8+PHJlY3QgeD0iMTAiIHk9IjEwIiB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIGZpbGw9IiNmZmYiLz48cmVjdCB4PSIxMCIgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiBmaWxsPSIjZTVlNWU1Ii8+PHJlY3QgeT0iMTAiIHdpZHRoPSIxMCIgaGVpZ2h0PSIxMCIgZmlsbD0iI2U1ZTVlNSIvPjwvc3ZnPg==')] rounded-lg flex items-center justify-center overflow-hidden border">
              {isProcessing ? (
                <div className="text-center p-4 bg-background/80 rounded-lg">
                  <Loader2 className="h-10 w-10 mx-auto mb-2 animate-spin" />
                  <p className="text-sm">Traitement en cours...</p>
                  <Progress value={progress} className="w-32 mt-2" />
                </div>
              ) : resultImage ? (
                <img src={resultImage} alt="Result" className="w-full h-full object-contain" />
              ) : (
                <div className="text-center p-4">
                  <ImageIcon className="h-10 w-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm text-muted-foreground">Le résultat apparaîtra ici</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {isProcessing && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Traitement de l'image...</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} />
          </div>
        )}

        <DialogFooter className="gap-2">
          {resultImage && (
            <Button variant="outline" onClick={handleReset}>
              Nouvelle image
            </Button>
          )}
          {sourceImage && !resultImage && (
            <Button 
              onClick={handleProcess} 
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Traitement...
                </>
              ) : (
                <>
                  <Eraser className="h-4 w-4 mr-2" />
                  Supprimer le fond
                </>
              )}
            </Button>
          )}
          {resultImage && (
            <Button onClick={handleDownload}>
              <Download className="h-4 w-4 mr-2" />
              Télécharger PNG
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
