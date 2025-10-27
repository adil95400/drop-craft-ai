import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCompetitiveAnalysis } from '@/hooks/useCompetitiveAnalysis';
import { Search, Loader2, Plus, X } from 'lucide-react';

export function CompetitorAnalyzer() {
  const [url, setUrl] = useState('');
  const [name, setName] = useState('');
  const { analyzeCompetitor, isAnalyzing } = useCompetitiveAnalysis();

  const handleAnalyze = () => {
    if (!url) return;
    analyzeCompetitor.mutate({ url, name });
    setUrl('');
    setName('');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="w-5 h-5" />
          Analyser un concurrent
        </CardTitle>
        <CardDescription>
          Entrez l'URL d'un site concurrent pour une analyse complète
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="competitor-url">URL du concurrent</Label>
          <Input
            id="competitor-url"
            type="url"
            placeholder="https://exemple-concurrent.com"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="competitor-name">Nom (optionnel)</Label>
          <Input
            id="competitor-name"
            placeholder="Nom du concurrent"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <Button 
          onClick={handleAnalyze} 
          disabled={!url || isAnalyzing}
          className="w-full"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Analyse en cours...
            </>
          ) : (
            <>
              <Search className="w-4 h-4 mr-2" />
              Analyser
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
