import { memo, useMemo, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Target, Plus, RefreshCw, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { SEOKeyword } from '@/hooks/useRealSEO';

interface KeywordsTabProps {
  keywords: SEOKeyword[];
  isLoading: boolean;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  onAddKeyword: () => void;
  onToggleKeyword: (id: string, active: boolean) => void;
}

function KeywordsTabComponent({ keywords, isLoading, searchTerm, onSearchChange, onAddKeyword, onToggleKeyword }: KeywordsTabProps) {
  const filteredKeywords = useMemo(
    () => keywords.filter(kw => kw.keyword.toLowerCase().includes(searchTerm.toLowerCase())),
    [keywords, searchTerm]
  );

  const handleToggle = useCallback((id: string, currentActive: boolean) => {
    onToggleKeyword(id, !currentActive);
  }, [onToggleKeyword]);

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <CardTitle className="text-lg">Suivi des Mots-clés</CardTitle>
            <CardDescription>{filteredKeywords.length} mot{filteredKeywords.length > 1 ? 's' : ''}-clé{filteredKeywords.length > 1 ? 's' : ''} suivi{filteredKeywords.length > 1 ? 's' : ''}</CardDescription>
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="Rechercher…"
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="max-w-xs h-9 text-sm"
            />
            <Button onClick={onAddKeyword} size="sm">
              <Plus className="mr-1.5 h-4 w-4" />
              Ajouter
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {isLoading ? (
          <div className="text-center py-12">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2 text-muted-foreground" />
          </div>
        ) : filteredKeywords.length > 0 ? (
          <div className="space-y-2">
            {filteredKeywords.map((kw) => (
              <div key={kw.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/30 transition-colors">
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-sm">{kw.keyword}</h4>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-muted-foreground">
                    {kw.search_volume != null && (
                      <span className="flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" />
                        Vol: {kw.search_volume.toLocaleString()}/mois
                      </span>
                    )}
                    {kw.difficulty_score != null && (
                      <span>Difficulté: {kw.difficulty_score}/100</span>
                    )}
                    {kw.target_url && (
                      <span className="text-primary truncate max-w-xs">{kw.target_url}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4 ml-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold tabular-nums">
                      {kw.current_position ? `#${kw.current_position}` : '--'}
                    </div>
                    <Badge variant={kw.tracking_active ? 'default' : 'secondary'} className="text-xs mt-1">
                      {kw.tracking_active ? 'Actif' : 'Inactif'}
                    </Badge>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => handleToggle(kw.id, kw.tracking_active)}
                  >
                    {kw.tracking_active ? 'Désactiver' : 'Activer'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
              <Target className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Aucun mot-clé</h3>
            <p className="text-muted-foreground mb-4">Commencez à suivre vos positions Google</p>
            <Button onClick={onAddKeyword}>
              <Plus className="mr-2 h-4 w-4" />
              Ajouter un mot-clé
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export const KeywordsTab = memo(KeywordsTabComponent);
