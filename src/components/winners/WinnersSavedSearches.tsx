import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Save, Search, Trash2, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { WinnersSearchParams } from "@/domains/winners/types";

interface SavedSearch {
  id: string;
  name: string;
  params: WinnersSearchParams;
  savedAt: string;
}

interface WinnersSavedSearchesProps {
  onLoadSearch: (params: WinnersSearchParams) => void;
  currentParams: WinnersSearchParams;
}

export const WinnersSavedSearches = ({ onLoadSearch, currentParams }: WinnersSavedSearchesProps) => {
  const { toast } = useToast();
  const [searches, setSearches] = useState<SavedSearch[]>([]);
  const [searchName, setSearchName] = useState("");
  const [showDialog, setShowDialog] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('winners-saved-searches');
    if (saved) {
      setSearches(JSON.parse(saved));
    }
  }, []);

  const saveSearch = () => {
    if (!searchName.trim()) {
      toast({ title: "Nom requis", variant: "destructive" });
      return;
    }

    const newSearch: SavedSearch = {
      id: Date.now().toString(),
      name: searchName,
      params: currentParams,
      savedAt: new Date().toISOString()
    };

    const updated = [...searches, newSearch];
    setSearches(updated);
    localStorage.setItem('winners-saved-searches', JSON.stringify(updated));
    
    toast({ title: "✅ Recherche sauvegardée", description: searchName });
    setSearchName("");
    setShowDialog(false);
  };

  const deleteSearch = (id: string) => {
    const updated = searches.filter(s => s.id !== id);
    setSearches(updated);
    localStorage.setItem('winners-saved-searches', JSON.stringify(updated));
    toast({ title: "Recherche supprimée" });
  };

  const loadSearch = (search: SavedSearch) => {
    onLoadSearch(search.params);
    toast({ title: "🔍 Recherche chargée", description: search.name });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Recherches Sauvegardées
          </span>
          <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm">
                <Save className="h-4 w-4 mr-1" />
                Sauvegarder
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Sauvegarder la recherche</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  placeholder="Nom de la recherche..."
                  value={searchName}
                  onChange={(e) => setSearchName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && saveSearch()}
                />
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Paramètres actuels:</p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">Query: {currentParams.query}</Badge>
                    {currentParams.category && (
                      <Badge variant="secondary">Catégorie: {currentParams.category}</Badge>
                    )}
                    {currentParams.minScore && (
                      <Badge variant="secondary">Score min: {currentParams.minScore}</Badge>
                    )}
                  </div>
                </div>
                <Button onClick={saveSearch} className="w-full">
                  <Save className="h-4 w-4 mr-2" />
                  Sauvegarder
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {searches.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Aucune recherche sauvegardée
          </p>
        ) : (
          <div className="space-y-2">
            {searches.map(search => (
              <div 
                key={search.id}
                className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{search.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(search.savedAt).toLocaleDateString('fr-FR')}
                  </p>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => loadSearch(search)}
                  >
                    <Search className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteSearch(search.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
