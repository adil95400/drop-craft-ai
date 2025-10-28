import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useProductResearch } from '@/hooks/useProductResearch';
import { Loader2, TrendingUp, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

export function TrendScanner() {
  const [keyword, setKeyword] = useState('');
  const [category, setCategory] = useState('all');
  const { scanTrends, isScanning, trends } = useProductResearch();

  const handleScan = () => {
    if (keyword.trim()) {
      scanTrends({ keyword, category });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Scanner de Tendances AI
          </CardTitle>
          <CardDescription>
            Analysez les tendances Google, TikTok et Instagram en temps réel
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="keyword">Mot-clé ou Niche</Label>
              <Input
                id="keyword"
                placeholder="Ex: fitness tracker, LED lights"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleScan()}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Catégorie</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger id="category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes catégories</SelectItem>
                  <SelectItem value="fashion">Mode & Accessoires</SelectItem>
                  <SelectItem value="electronics">Électronique</SelectItem>
                  <SelectItem value="home">Maison & Jardin</SelectItem>
                  <SelectItem value="beauty">Beauté & Santé</SelectItem>
                  <SelectItem value="sports">Sport & Fitness</SelectItem>
                  <SelectItem value="toys">Jouets & Loisirs</SelectItem>
                  <SelectItem value="pets">Animaux</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button 
            onClick={handleScan} 
            disabled={!keyword.trim() || isScanning}
            className="w-full"
            size="lg"
          >
            {isScanning ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Analyse en cours...
              </>
            ) : (
              <>
                <TrendingUp className="w-4 h-4 mr-2" />
                Lancer le Scan AI
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {trends && trends.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {trends.map((trend, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="text-lg flex items-center justify-between">
                  <span>{trend.product_name}</span>
                  <Badge variant={trend.trend_score >= 80 ? 'default' : trend.trend_score >= 60 ? 'secondary' : 'outline'}>
                    {trend.trend_score}%
                  </Badge>
                </CardTitle>
                <CardDescription>{trend.category}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Score de Tendance</span>
                    <span className="font-medium">{trend.trend_score}%</span>
                  </div>
                  <Progress value={trend.trend_score} />
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="space-y-1">
                    <p className="text-muted-foreground">Recherches</p>
                    <p className="font-semibold">{trend.search_volume?.toLocaleString()}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-muted-foreground">Croissance</p>
                    <p className="font-semibold text-green-600">+{trend.growth_rate}%</p>
                  </div>
                </div>

                {trend.saturation_level && (
                  <div className="flex items-center gap-2 p-2 bg-muted rounded-lg">
                    <AlertCircle className="w-4 h-4" />
                    <span className="text-sm">
                      Saturation: <strong>{trend.saturation_level}</strong>
                    </span>
                  </div>
                )}

                <div className="flex gap-2 text-xs">
                  {trend.platforms?.map((platform) => (
                    <Badge key={platform} variant="outline">
                      {platform}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
