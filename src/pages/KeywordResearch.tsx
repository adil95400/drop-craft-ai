import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
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
  Minus
} from "lucide-react";
import { Helmet } from "react-helmet-async";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SEO } from "@/components/SEO";

const KeywordResearch = () => {
  const [keyword, setKeyword] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [keywords, setKeywords] = useState<any[]>([]);
  const [trackedKeywords, setTrackedKeywords] = useState<string[]>([]);
  const { toast } = useToast();

  // Données simulées de recherche de mots-clés
  const generateKeywordData = (baseKeyword: string) => {
    const variations = [
      `${baseKeyword}`,
      `${baseKeyword} pas cher`,
      `${baseKeyword} qualité`,
      `${baseKeyword} original`,
      `${baseKeyword} protection`,
      `acheter ${baseKeyword}`,
      `${baseKeyword} livraison rapide`,
      `${baseKeyword} transparent`,
      `${baseKeyword} résistant`,
      `${baseKeyword} design`,
      `${baseKeyword} antichoc`,
      `${baseKeyword} magsafe`
    ];

    return variations.map((kw, index) => ({
      keyword: kw,
      volume: Math.floor(Math.random() * 50000) + 1000,
      difficulty: Math.floor(Math.random() * 100),
      cpc: (Math.random() * 5).toFixed(2),
      competition: ['Low', 'Medium', 'High'][Math.floor(Math.random() * 3)],
      trend: Math.random() > 0.5 ? 'up' : 'down',
      position: index === 0 ? Math.floor(Math.random() * 20) + 1 : null
    }));
  };

  const searchKeywords = async () => {
    if (!keyword.trim()) {
      toast({
        title: "Mot-clé requis",
        description: "Veuillez saisir un mot-clé à analyser",
        variant: "destructive"
      });
      return;
    }

    setIsSearching(true);
    
    try {
      // Simulation de recherche
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const keywordData = generateKeywordData(keyword);
      setKeywords(keywordData);
      
      toast({
        title: "Recherche terminée",
        description: `${keywordData.length} mots-clés trouvés pour "${keyword}"`,
      });
      
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de rechercher les mots-clés",
        variant: "destructive"
      });
    } finally {
      setIsSearching(false);
    }
  };

  const trackKeyword = (kw: string) => {
    if (!trackedKeywords.includes(kw)) {
      setTrackedKeywords([...trackedKeywords, kw]);
      toast({
        title: "Mot-clé ajouté au suivi",
        description: `"${kw}" est maintenant suivi`,
      });
    }
  };

  const untrackKeyword = (kw: string) => {
    setTrackedKeywords(trackedKeywords.filter(k => k !== kw));
    toast({
      title: "Mot-clé retiré du suivi",
      description: `"${kw}" n'est plus suivi`,
    });
  };

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

  return (
    <>
      <SEO
        title="Recherche de Mots-clés - SEO Tools | Shopopti+"
        description="Trouvez les meilleurs mots-clés pour votre stratégie SEO. Analyse de volume de recherche, difficulté et opportunités de positionnement."
        path="/seo/keyword-research"
        keywords="recherche mots-clés, volume recherche, difficulté SEO, positionnement Google, analyse concurrentielle"
      />

      <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20 p-6">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div>
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
                    onKeyPress={(e) => e.key === 'Enter' && searchKeywords()}
                  />
                </div>
                <div className="flex items-end">
                  <Button 
                    onClick={searchKeywords} 
                    disabled={isSearching}
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
          {keywords.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-primary" />
                      Résultats de recherche
                    </CardTitle>
                    <CardDescription>
                      {keywords.length} mots-clés trouvés pour "{keyword}"
                    </CardDescription>
                  </div>
                  <Button variant="outline" size="sm">
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
                        <TableHead>Position</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {keywords.map((kw, index) => (
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
                            ) : (
                              <ArrowDown className="w-4 h-4 text-red-500" />
                            )}
                          </TableCell>
                          <TableCell>
                            {kw.position ? (
                              <Badge variant="outline" className="bg-blue-50 text-blue-700">
                                #{kw.position}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {trackedKeywords.includes(kw.keyword) ? (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => untrackKeyword(kw.keyword)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Minus className="w-4 h-4" />
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => trackKeyword(kw.keyword)}
                                className="text-green-600 hover:text-green-700"
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
                  {trackedKeywords.map((kw, index) => (
                    <Badge 
                      key={index} 
                      variant="secondary" 
                      className="flex items-center gap-2 px-3 py-1"
                    >
                      {kw}
                      <button
                        onClick={() => untrackKeyword(kw)}
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
          {keywords.length === 0 && !isSearching && (
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