import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  TrendingUp, 
  TrendingDown,
  Target,
  Plus,
  RefreshCw,
  Calendar,
  BarChart3,
  ArrowUp,
  ArrowDown,
  Minus
} from "lucide-react";
import { Helmet } from "react-helmet-async";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const RankTracker = () => {
  const [keyword, setKeyword] = useState("");
  const [url, setUrl] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [trackedKeywords, setTrackedKeywords] = useState<any[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { toast } = useToast();

  // Données simulées de suivi de positions
  const generateTrackingData = () => {
    const keywords = [
      "coque iphone 15",
      "protection écran iphone", 
      "chargeur sans fil",
      "airpods pro case",
      "accessoires apple"
    ];

    return keywords.map((kw, index) => {
      const currentPosition = Math.floor(Math.random() * 50) + 1;
      const previousPosition = currentPosition + (Math.random() > 0.5 ? 1 : -1) * Math.floor(Math.random() * 5);
      
      return {
        keyword: kw,
        url: `/produits/${kw.replace(/\s+/g, '-')}`,
        currentPosition,
        previousPosition,
        change: previousPosition - currentPosition,
        volume: Math.floor(Math.random() * 50000) + 1000,
        lastUpdate: new Date().toLocaleDateString(),
        history: Array.from({ length: 30 }, (_, i) => ({
          date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' }),
          position: currentPosition + Math.floor(Math.random() * 10) - 5
        }))
      };
    });
  };

  useEffect(() => {
    // Charger les données au démarrage
    setTrackedKeywords(generateTrackingData());
  }, []);

  const addKeyword = async () => {
    if (!keyword.trim() || !url.trim()) {
      toast({
        title: "Informations manquantes",
        description: "Veuillez saisir un mot-clé et une URL",
        variant: "destructive"
      });
      return;
    }

    setIsAdding(true);
    
    try {
      // Simulation d'ajout
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const newKeyword = {
        keyword: keyword,
        url: url,
        currentPosition: Math.floor(Math.random() * 100) + 1,
        previousPosition: null,
        change: null,
        volume: Math.floor(Math.random() * 20000) + 1000,
        lastUpdate: new Date().toLocaleDateString(),
        history: []
      };
      
      setTrackedKeywords([...trackedKeywords, newKeyword]);
      setKeyword("");
      setUrl("");
      
      toast({
        title: "Mot-clé ajouté !",
        description: `"${keyword}" est maintenant suivi`,
      });
      
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter le mot-clé",
        variant: "destructive"
      });
    } finally {
      setIsAdding(false);
    }
  };

  const refreshPositions = async () => {
    setIsRefreshing(true);
    
    try {
      // Simulation de refresh
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Mise à jour des positions
      const updatedKeywords = trackedKeywords.map(kw => {
        const newPosition = Math.max(1, kw.currentPosition + (Math.random() > 0.5 ? 1 : -1) * Math.floor(Math.random() * 3));
        return {
          ...kw,
          previousPosition: kw.currentPosition,
          currentPosition: newPosition,
          change: kw.currentPosition - newPosition,
          lastUpdate: new Date().toLocaleDateString()
        };
      });
      
      setTrackedKeywords(updatedKeywords);
      
      toast({
        title: "Positions mises à jour !",
        description: `${trackedKeywords.length} mots-clés vérifiés`,
      });
      
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour les positions",
        variant: "destructive"
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const removeKeyword = (keywordToRemove: string) => {
    setTrackedKeywords(trackedKeywords.filter(kw => kw.keyword !== keywordToRemove));
    toast({
      title: "Mot-clé supprimé",
      description: `"${keywordToRemove}" n'est plus suivi`,
    });
  };

  const getChangeIcon = (change: number | null) => {
    if (change === null) return <Minus className="w-4 h-4 text-gray-400" />;
    if (change > 0) return <ArrowUp className="w-4 h-4 text-green-500" />;
    if (change < 0) return <ArrowDown className="w-4 h-4 text-red-500" />;
    return <Minus className="w-4 h-4 text-gray-400" />;
  };

  const getPositionColor = (position: number) => {
    if (position <= 3) return "bg-green-100 text-green-800";
    if (position <= 10) return "bg-blue-100 text-blue-800";
    if (position <= 20) return "bg-orange-100 text-orange-800";
    return "bg-red-100 text-red-800";
  };

  // Calculs des statistiques
  const avgPosition = trackedKeywords.length > 0 
    ? Math.round(trackedKeywords.reduce((sum, kw) => sum + kw.currentPosition, 0) / trackedKeywords.length)
    : 0;
  
  const topRankings = trackedKeywords.filter(kw => kw.currentPosition <= 10).length;
  const positiveChanges = trackedKeywords.filter(kw => kw.change && kw.change > 0).length;

  return (
    <>
      <Helmet>
        <title>Suivi de Positions - SEO Tools</title>
        <meta name="description" content="Suivez vos positions dans Google. Monitoring de mots-clés en temps réel avec historique." />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20 p-6">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
                Suivi Positions
              </h1>
              <p className="text-lg text-muted-foreground mt-2">
                Suivez vos positions dans les moteurs de recherche
              </p>
            </div>
            <Button 
              onClick={refreshPositions} 
              disabled={isRefreshing}
              variant="outline"
            >
              {isRefreshing ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Actualisation...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Actualiser
                </>
              )}
            </Button>
          </div>

          {/* Statistiques */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Target className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{trackedKeywords.length}</div>
                    <div className="text-sm text-muted-foreground">Mots-clés suivis</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                    <BarChart3 className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{avgPosition}</div>
                    <div className="text-sm text-muted-foreground">Position moyenne</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{topRankings}</div>
                    <div className="text-sm text-muted-foreground">Top 10</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                    <ArrowUp className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{positiveChanges}</div>
                    <div className="text-sm text-muted-foreground">En progression</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Ajouter un mot-clé */}
          <Card className="border-2 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-primary" />
                Ajouter un Mot-clé
              </CardTitle>
              <CardDescription>
                Suivez un nouveau mot-clé pour une URL spécifique
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="keyword">Mot-clé</Label>
                  <Input
                    id="keyword"
                    placeholder="ex: coque iphone 15"
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="url">URL cible</Label>
                  <Input
                    id="url"
                    placeholder="/produits/coque-iphone-15"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                  />
                </div>
              </div>
              <Button 
                onClick={addKeyword} 
                disabled={isAdding}
                className="bg-gradient-to-r from-primary to-primary/80"
              >
                {isAdding ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Ajout...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Ajouter au Suivi
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Liste des mots-clés suivis */}
          {trackedKeywords.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  Positions Suivies ({trackedKeywords.length})
                </CardTitle>
                <CardDescription>
                  Dernière mise à jour: {trackedKeywords[0]?.lastUpdate}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Mot-clé</TableHead>
                        <TableHead>URL</TableHead>
                        <TableHead>Position</TableHead>
                        <TableHead>Évolution</TableHead>
                        <TableHead>Volume</TableHead>
                        <TableHead>Graphique</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {trackedKeywords.map((kw, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{kw.keyword}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{kw.url}</TableCell>
                          <TableCell>
                            <Badge className={getPositionColor(kw.currentPosition)}>
                              #{kw.currentPosition}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getChangeIcon(kw.change)}
                              {kw.change !== null && (
                                <span className={`text-sm ${kw.change > 0 ? 'text-green-600' : kw.change < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                                  {kw.change > 0 ? '+' : ''}{kw.change}
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">{kw.volume.toLocaleString()}</TableCell>
                          <TableCell>
                            <div className="w-24 h-12">
                              {kw.history.length > 0 && (
                                <ResponsiveContainer width="100%" height="100%">
                                  <LineChart data={kw.history}>
                                    <Line 
                                      type="monotone" 
                                      dataKey="position" 
                                      stroke="#3b82f6" 
                                      strokeWidth={2} 
                                      dot={false} 
                                    />
                                  </LineChart>
                                </ResponsiveContainer>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => removeKeyword(kw.keyword)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Minus className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <Target className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Aucun mot-clé suivi</h3>
                <p className="text-muted-foreground mb-4">
                  Ajoutez votre premier mot-clé pour commencer le suivi
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </>
  );
};

export default RankTracker;