import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { useContentGeneration } from '@/hooks/useContentGeneration';
import { Scissors, Loader2, Download, Upload } from 'lucide-react';

export function BackgroundRemover() {
  const { removeImageBackground, isRemovingBackground, removedBackgroundBlob } = useContentGeneration();
  const [previewUrl, setPreviewUrl] = useState('');
  const [resultUrl, setResultUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setResultUrl('');
      setProgress(0);
    }
  };

  const handleRemoveBackground = () => {
    if (!selectedFile) return;

    removeImageBackground(
      { file: selectedFile, onProgress: setProgress },
      {
        onSuccess: (blob) => {
          const url = URL.createObjectURL(blob);
          setResultUrl(url);
        }
      }
    );
  };

  const handleDownload = () => {
    if (!resultUrl) return;
    const link = document.createElement('a');
    link.href = resultUrl;
    link.download = `${selectedFile?.name.replace(/\.[^.]+$/, '')}_no_bg.png` || 'image_no_bg.png';
    link.click();
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Scissors className="h-6 w-6 text-primary" />
          Suppression d'Arrière-Plan IA
        </h2>
        <p className="text-muted-foreground mt-1">
          Supprimez l'arrière-plan de vos photos produits instantanément
        </p>
      </div>

      <div className="grid gap-4">
        <div>
          <Label htmlFor="imageFile">Sélectionner Image</Label>
          <Input
            id="imageFile"
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
          />
          <p className="text-xs text-muted-foreground mt-1">
            Formats supportés: JPG, PNG, WEBP (max 1024px)
          </p>
        </div>

        {isRemovingBackground && (
          <div className="space-y-2">
            <Label>Traitement en cours...</Label>
            <Progress value={progress} className="w-full" />
            <p className="text-sm text-muted-foreground">{Math.round(progress)}%</p>
          </div>
        )}

        <div className="flex gap-2">
          <Button 
            onClick={handleRemoveBackground} 
            disabled={isRemovingBackground || !selectedFile} 
            size="lg"
            className="flex-1"
          >
            {isRemovingBackground ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Suppression en cours...
              </>
            ) : (
              <>
                <Scissors className="mr-2 h-4 w-4" />
                Supprimer Arrière-Plan
              </>
            )}
          </Button>

          {resultUrl && (
            <Button onClick={handleDownload} variant="outline" size="lg">
              <Download className="mr-2 h-4 w-4" />
              Télécharger
            </Button>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {previewUrl && (
          <div>
            <Label className="mb-2 block">Image Originale</Label>
            <div className="border rounded-lg p-4 bg-muted/30">
              <img src={previewUrl} alt="Original" className="w-full rounded-lg" />
            </div>
          </div>
        )}

        {resultUrl && (
          <div>
            <Label className="mb-2 block">Résultat (Fond Transparent)</Label>
            <div className="border rounded-lg p-4 bg-gradient-to-br from-muted/30 to-muted/10" style={{
              backgroundImage: 'repeating-linear-gradient(45deg, #f0f0f0 25%, transparent 25%, transparent 75%, #f0f0f0 75%, #f0f0f0), repeating-linear-gradient(45deg, #f0f0f0 25%, #ffffff 25%, #ffffff 75%, #f0f0f0 75%, #f0f0f0)',
              backgroundPosition: '0 0, 10px 10px',
              backgroundSize: '20px 20px'
            }}>
              <img src={resultUrl} alt="No background" className="w-full rounded-lg" />
            </div>
          </div>
        )}
      </div>

      {!previewUrl && (
        <div className="border-2 border-dashed rounded-lg p-12 text-center text-muted-foreground">
          <Upload className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Téléchargez une image pour commencer</p>
        </div>
      )}
    </div>
  );
}
