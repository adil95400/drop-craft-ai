import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Users, TrendingUp } from 'lucide-react';

interface CompetitorSelectorProps {
  analyses: any[];
  onCompare: (selectedIds: string[]) => void;
  isComparing: boolean;
}

export function CompetitorSelector({ analyses, onCompare, isComparing }: CompetitorSelectorProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) 
        ? prev.filter(i => i !== id)
        : [...prev, id]
    );
  };

  const handleCompare = () => {
    if (selectedIds.length >= 2) {
      onCompare(selectedIds);
    }
  };

  if (!analyses || analyses.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          Sélectionner les Concurrents à Comparer
        </CardTitle>
        <CardDescription>
          Choisissez au moins 2 concurrents pour générer un rapport comparatif détaillé
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3">
          {analyses.map(analysis => (
            <div
              key={analysis.id}
              className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
              onClick={() => toggleSelection(analysis.id)}
            >
              <Checkbox
                checked={selectedIds.includes(analysis.id)}
                onCheckedChange={() => toggleSelection(analysis.id)}
              />
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium">{analysis.competitor_name}</p>
                  <Badge variant={
                    analysis.threat_level === 'high' ? 'destructive' : 
                    analysis.threat_level === 'medium' ? 'secondary' : 
                    'outline'
                  } className="text-xs">
                    {analysis.threat_level}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Position: {analysis.competitive_data?.market_position || 'N/A'}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between pt-4 border-t">
          <p className="text-sm text-muted-foreground">
            {selectedIds.length} concurrent(s) sélectionné(s)
          </p>
          <Button
            onClick={handleCompare}
            disabled={selectedIds.length < 2 || isComparing}
            className="gap-2"
          >
            <TrendingUp className="w-4 h-4" />
            {isComparing ? 'Comparaison en cours...' : 'Comparer la sélection'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
