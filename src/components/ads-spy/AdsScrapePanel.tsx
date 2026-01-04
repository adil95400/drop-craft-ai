import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useScrapeCompetitor } from '@/hooks/useAdsSpy';
import { AdCard } from './AdCard';
import { Globe, Loader2, Link, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export function AdsScrapePanel() {
  const [url, setUrl] = useState('');
  const [platform, setPlatform] = useState('facebook');
  const [lastScraped, setLastScraped] = useState<any>(null);

  const scrapeCompetitor = useScrapeCompetitor();

  const handleScrape = async () => {
    if (!url.trim()) return;
    
    const result = await scrapeCompetitor.mutateAsync({ url, platform });
    if (result.ad) {
      setLastScraped(result.ad);
    }
  };

  const isValidUrl = (str: string) => {
    try {
      new URL(str);
      return true;
    } catch {
      return false;
    }
  };

  const platforms = [
    { value: 'facebook', label: 'Facebook Ads' },
    { value: 'tiktok', label: 'TikTok Ads' },
    { value: 'instagram', label: 'Instagram Ads' },
    { value: 'google', label: 'Google Ads' },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5" />
            Scraper de Publicités
          </CardTitle>
          <CardDescription>
            Analysez une page de publicité ou de landing page concurrente
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Comment utiliser</AlertTitle>
            <AlertDescription>
              Collez l'URL d'une page produit, landing page ou lien de publicité pour l'analyser.
              L'outil extraira les informations clés et les ajoutera à votre base de données.
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="url">URL de la publicité ou landing page</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Link className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://..."
                    className="pl-10"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="platform">Plateforme source</Label>
              <Select value={platform} onValueChange={setPlatform}>
                <SelectTrigger id="platform">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {platforms.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button 
              className="w-full" 
              onClick={handleScrape}
              disabled={!isValidUrl(url) || scrapeCompetitor.isPending}
            >
              {scrapeCompetitor.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analyse en cours...
                </>
              ) : (
                <>
                  <Globe className="w-4 h-4 mr-2" />
                  Analyser cette URL
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {lastScraped && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Dernière analyse</h3>
          <div className="max-w-md">
            <AdCard ad={lastScraped} showAnalysis={!!lastScraped.ai_analysis} />
          </div>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Exemples d'URLs à analyser</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• Pages produit Shopify: <code className="bg-muted px-1 rounded">https://store.com/products/name</code></li>
            <li>• Landing pages: <code className="bg-muted px-1 rounded">https://landing-page.com/offer</code></li>
            <li>• Liens Facebook Ads Library: <code className="bg-muted px-1 rounded">https://facebook.com/ads/library/...</code></li>
            <li>• Pages TikTok produit: <code className="bg-muted px-1 rounded">https://tiktok.com/@brand/video/...</code></li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
