import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, RefreshCw } from "lucide-react";

interface SEOAnalysisModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAnalyze: (url: string, options: AnalysisOptions) => void;
  isAnalyzing?: boolean;
}

interface AnalysisOptions {
  includeCompetitors: boolean;
  analysisDepth: 'basic' | 'detailed' | 'comprehensive';
  checkMobile: boolean;
  checkPerformance: boolean;
}

export const SEOAnalysisModal = ({ 
  open, 
  onOpenChange, 
  onAnalyze,
  isAnalyzing = false 
}: SEOAnalysisModalProps) => {
  const [url, setUrl] = useState('');
  const [options, setOptions] = useState<AnalysisOptions>({
    includeCompetitors: true,
    analysisDepth: 'detailed',
    checkMobile: true,
    checkPerformance: true
  });

  const handleAnalyze = () => {
    onAnalyze(url, options);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Analyser une URL
          </DialogTitle>
          <DialogDescription>
            Lancez une analyse SEO complète d'une page web
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="url">URL à analyser</Label>
            <Input
              id="url"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/page"
            />
          </div>

          <div className="space-y-2">
            <Label>Profondeur d'analyse</Label>
            <Select 
              value={options.analysisDepth} 
              onValueChange={(value: any) => setOptions({...options, analysisDepth: value})}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="basic">Basique (rapide)</SelectItem>
                <SelectItem value="detailed">Détaillée (recommandé)</SelectItem>
                <SelectItem value="comprehensive">Complète (approfondie)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="competitors"
                checked={options.includeCompetitors}
                onChange={(e) => setOptions({...options, includeCompetitors: e.target.checked})}
                className="rounded border-gray-300"
              />
              <Label htmlFor="competitors" className="text-sm">Inclure l'analyse concurrentielle</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="mobile"
                checked={options.checkMobile}
                onChange={(e) => setOptions({...options, checkMobile: e.target.checked})}
                className="rounded border-gray-300"
              />
              <Label htmlFor="mobile" className="text-sm">Vérifier la compatibilité mobile</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="performance"
                checked={options.checkPerformance}
                onChange={(e) => setOptions({...options, checkPerformance: e.target.checked})}
                className="rounded border-gray-300"
              />
              <Label htmlFor="performance" className="text-sm">Analyser les performances</Label>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleAnalyze} disabled={!url.trim() || isAnalyzing}>
            {isAnalyzing ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Analyse en cours...
              </>
            ) : (
              <>
                <Search className="mr-2 h-4 w-4" />
                Analyser
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};