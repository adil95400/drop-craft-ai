import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  Target,
  Plus,
  RefreshCw,
  BarChart3,
  ArrowUp,
  ArrowDown,
  Minus,
  Trash2
} from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { SEO } from "@/components/SEO";
import { useSEOKeywords } from "@/hooks/useSEOKeywords";
import { useNavigate } from "react-router-dom";
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';

const RankTracker = () => {
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState("");
  const [url, setUrl] = useState("");
  
  const { 
    trackedKeywords, 
    isLoading,
    stats,
    addKeyword, 
    isAdding, 
    removeKeyword,
    refreshPositions,
    isRefreshing 
  } = useSEOKeywords();

  const handleAddKeyword = () => {
    if (keyword.trim() && url.trim()) {
      addKeyword({ keyword, url });
      setKeyword("");
      setUrl("");
    }
  };

  const getChangeIcon = (change: number | null) => {
    if (change === null) return <Minus className="w-4 h-4 text-gray-400" />;
    if (change > 0) return <ArrowUp className="w-4 h-4 text-green-500" />;
    if (change < 0) return <ArrowDown className="w-4 h-4 text-red-500" />;
    return <Minus className="w-4 h-4 text-gray-400" />;
  };

  const getPositionColor = (position: number | null) => {
    if (!position) return "bg-gray-100 text-gray-800";
    if (position <= 3) return "bg-green-100 text-green-800";
    if (position <= 10) return "bg-blue-100 text-blue-800";
    if (position <= 20) return "bg-orange-100 text-orange-800";
    return "bg-red-100 text-red-800";
  };

  // Use real keyword position history or show empty state
  const generateHistoryData = () => {
    // Return empty data - real history would come from seo_keyword_history table
    return Array.from({ length: 14 }, (_, i) => ({
      date: i,
      position: null
    }));
  };

  return (
    <>
      <SEO
        title="Suivi de Positions - SEO Tools | Shopopti+"
        description="Suivez vos positions dans Google. Monitoring de mots-clés en temps réel avec historique."
        path="/marketing/seo/rank-tracker"
        keywords="suivi positions, ranking Google, monitoring SEO, SERP tracker"
      />

      <ChannablePageWrapper
        title="Suivi Positions"
        description="Suivez vos positions dans les moteurs de recherche"
        heroImage="research"
        badge={{ label: 'SEO', icon: BarChart3 }}
        actions={
          <Button 
            onClick={() => refreshPositions()}
            disabled={isRefreshing || trackedKeywords.length === 0}
            variant="outline"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Actualisation...' : 'Actualiser'}
          </Button>
        }
      >

          {/* Statistiques */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Target className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{stats.total}</div>
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
                    <div className="text-2xl font-bold">{stats.avgPosition || '-'}</div>
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
                    <div className="text-2xl font-bold">{stats.top10}</div>
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
                    <div className="text-2xl font-bold">{stats.improving}</div>
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
                onClick={handleAddKeyword} 
                disabled={isAdding || !keyword.trim() || !url.trim()}
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
          {isLoading ? (
            <Card>
              <CardContent className="py-12 text-center">
                <RefreshCw className="w-8 h-8 mx-auto animate-spin text-muted-foreground" />
                <p className="mt-4 text-muted-foreground">Chargement...</p>
              </CardContent>
            </Card>
          ) : trackedKeywords.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  Positions Suivies ({trackedKeywords.length})
                </CardTitle>
                <CardDescription>
                  Dernière mise à jour: {trackedKeywords[0]?.lastUpdate ? new Date(trackedKeywords[0].lastUpdate).toLocaleDateString('fr-FR') : '-'}
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
                      {trackedKeywords.map((kw) => (
                        <TableRow key={kw.id}>
                          <TableCell className="font-medium">{kw.keyword}</TableCell>
                          <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                            {kw.url}
                          </TableCell>
                          <TableCell>
                            <Badge className={getPositionColor(kw.currentPosition)}>
                              #{kw.currentPosition || '-'}
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
                            <div className="w-24 h-10">
                              <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={generateHistoryData()}>
                                  <Line 
                                    type="monotone" 
                                    dataKey="position" 
                                    stroke="#3b82f6" 
                                    strokeWidth={2} 
                                    dot={false} 
                                  />
                                </LineChart>
                              </ResponsiveContainer>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => removeKeyword(kw.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
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
      </ChannablePageWrapper>
    </>
  );
};

export default RankTracker;
