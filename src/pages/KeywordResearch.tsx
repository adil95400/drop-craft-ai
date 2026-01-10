import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  TrendingUp, 
  Target, 
  Eye,
  RefreshCw,
  Download,
  Plus,
  ArrowUp,
  ArrowDown,
  Minus,
  ArrowLeft
} from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SEO } from "@/components/SEO";
import { useKeywordResearch, useSEOKeywords } from "@/hooks/useSEOKeywords";
import { useNavigate } from "react-router-dom";

const KeywordResearch = () => {
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState("");
  const { results, isSearching, searchKeywords } = useKeywordResearch();
  const { trackedKeywords, addKeyword, isAdding, removeKeyword } = useSEOKeywords();

  const handleSearch = () => {
    searchKeywords(keyword);
  };

  const handleTrackKeyword = (kw: string) => {
    const isTracked = trackedKeywords.some(tk => tk.keyword === kw);
    if (!isTracked) {
      addKeyword({ keyword: kw, url: `/produits/${kw.replace(/\s+/g, '-')}` });
    }
  };

  const handleUntrackKeyword = (kw: string) => {
    const tracked = trackedKeywords.find(tk => tk.keyword === kw);
    if (tracked) {
      removeKeyword(tracked.id);
    }
  };

  const isKeywordTracked = (kw: string) => trackedKeywords.some(tk => tk.keyword === kw);

  const getDifficultyColor = (difficulty: number) => {
    if (difficulty < 30) return "bg-green-100 text-green-800";
    if (difficulty < 70) return "bg-orange-100 text-orange-800";
    return "bg-red-100 text-red-800";
  };

  const getCompetitionColor = (competition: string) => {
    switch (competition) {
      case 'Low': return "bg-green-100 text-green-800";
      case 'Medium': return "bg-orange-100 text-orange-800";
      case 'High': return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const exportToCSV = () => {
    if (results.length === 0) return;
    
    const headers = ['Mot-clé', 'Volume', 'Difficulté', 'CPC', 'Concurrence', 'Tendance'];
    const rows = results.map(r => [
      r.keyword,
      r.volume.toString(),
      `${r.difficulty}%`,
      `$${r.cpc}`,
      r.competition,
      r.trend
    ]);
    
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `keywords-${keyword.replace(/\s+/g, '-')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <SEO
        title="Recherche de Mots-clés - SEO Tools | Shopopti+"
        description="Trouvez les meilleurs mots-clés pour votre stratégie SEO. Analyse de volume de recherche, difficulté et opportunités de positionnement."
        path="/marketing/seo/keywords"
        keywords="recherche mots-clés, volume recherche, difficulté SEO, positionnement Google"
      />

      <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20 p-6">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <Button variant="ghost" onClick={() => navigate('/marketing/seo')} className="mb-2">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour au SEO Manager
              </Button>
              <h1 className="text-4xl font-bold flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
                  <Search className="w-6 h-6 text-white" />
                </div>
                Recherche de Mots-clés
              </h1>
              <p className="text-lg text-muted-foreground mt-2">
                Découvrez les mots-clés les plus performants pour votre secteur
              </p>
            </div>
          </div>

          {/* Recherche */}
          <Card className="border-2 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                Analyser un Mot-clé
              </CardTitle>
              <CardDescription>
                Entrez un mot-clé pour découvrir ses variations et opportunités
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <Label htmlFor="keyword-search">Mot-clé principal</Label>
                  <Input
                    id="keyword-search"
                    placeholder="ex: coque iphone 15"
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  />
                </div>
                <div className="flex items-end">
                  <Button 
                    onClick={handleSearch} 
                    disabled={isSearching || !keyword.trim()}
                    className="bg-gradient-to-r from-primary to-primary/80"
                  >
                    {isSearching ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Recherche...
                      </>
                    ) : (
                      <>
                        <Search className="w-4 h-4 mr-2" />
                        Rechercher
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Résultats */}
          {results.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-primary" />
                      Résultats de recherche
                    </CardTitle>
                    <CardDescription>
                      {results.length} mots-clés trouvés pour "{keyword}"
                    </CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={exportToCSV}>
                    <Download className="w-4 h-4 mr-2" />
                    Exporter CSV
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Mot-clé</TableHead>
                        <TableHead>Volume</TableHead>
                        <TableHead>Difficulté</TableHead>
                        <TableHead>CPC</TableHead>
                        <TableHead>Concurrence</TableHead>
                        <TableHead>Tendance</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {results.map((kw, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{kw.keyword}</TableCell>
                          <TableCell>{kw.volume.toLocaleString()}</TableCell>
                          <TableCell>
                            <Badge className={getDifficultyColor(kw.difficulty)}>
                              {kw.difficulty}%
                            </Badge>
                          </TableCell>
                          <TableCell>${kw.cpc}</TableCell>
                          <TableCell>
                            <Badge className={getCompetitionColor(kw.competition)}>
                              {kw.competition}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {kw.trend === 'up' ? (
                              <ArrowUp className="w-4 h-4 text-green-500" />
                            ) : kw.trend === 'down' ? (
                              <ArrowDown className="w-4 h-4 text-red-500" />
                            ) : (
                              <Minus className="w-4 h-4 text-gray-400" />
                            )}
                          </TableCell>
                          <TableCell>
                            {isKeywordTracked(kw.keyword) ? (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleUntrackKeyword(kw.keyword)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Minus className="w-4 h-4" />
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleTrackKeyword(kw.keyword)}
                                className="text-green-600 hover:text-green-700"
                                disabled={isAdding}
                              >
                                <Plus className="w-4 h-4" />
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Mots-clés suivis */}
          {trackedKeywords.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="w-5 h-5 text-primary" />
                  Mots-clés en Suivi ({trackedKeywords.length})
                </CardTitle>
                <CardDescription>
                  Mots-clés que vous suivez actuellement
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {trackedKeywords.map((kw) => (
                    <Badge 
                      key={kw.id} 
                      variant="secondary" 
                      className="flex items-center gap-2 px-3 py-1"
                    >
                      {kw.keyword}
                      {kw.currentPosition && (
                        <span className="text-xs text-muted-foreground">
                          #{kw.currentPosition}
                        </span>
                      )}
                      <button
                        onClick={() => removeKeyword(kw.id)}
                        className="ml-2 text-muted-foreground hover:text-foreground"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* État vide */}
          {results.length === 0 && !isSearching && (
            <Card>
              <CardContent className="text-center py-12">
                <Search className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Commencez votre recherche</h3>
                <p className="text-muted-foreground mb-4">
                  Entrez un mot-clé ci-dessus pour découvrir les meilleures opportunités SEO
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </>
  );
};

export default KeywordResearch;
