import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { type CompetitorAd } from '@/hooks/useAdsSpy';
import { 
  ExternalLink, 
  Sparkles, 
  DollarSign, 
  Users, 
  Calendar,
  Globe,
  Loader2,
  FolderPlus
} from 'lucide-react';

interface AdCardProps {
  ad: CompetitorAd;
  onAnalyze?: () => void;
  onSave?: () => void;
  isAnalyzing?: boolean;
  showAnalysis?: boolean;
}

const platformColors: Record<string, string> = {
  facebook: 'bg-blue-500',
  tiktok: 'bg-black',
  instagram: 'bg-gradient-to-r from-purple-500 to-pink-500',
  google: 'bg-red-500',
  pinterest: 'bg-red-600',
};

const formatNumber = (num?: number) => {
  if (!num) return '0';
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
};

const formatCurrency = (num?: number) => {
  if (!num) return '0€';
  return `${num.toLocaleString()}€`;
};

export function AdCard({ ad, onAnalyze, onSave, isAnalyzing, showAnalysis = false }: AdCardProps) {
  const performanceColor = {
    viral: 'text-green-500 bg-green-500/10',
    high: 'text-blue-500 bg-blue-500/10',
    medium: 'text-yellow-500 bg-yellow-500/10',
    low: 'text-red-500 bg-red-500/10',
  };

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      {ad.image_urls && ad.image_urls[0] && (
        <div className="aspect-video bg-muted relative">
          <img
            src={ad.image_urls[0]}
            alt={ad.ad_headline || 'Ad image'}
            className="w-full h-full object-cover"
          />
          <Badge className={`absolute top-2 left-2 ${platformColors[ad.platform]} text-white border-0`}>
            {ad.platform}
          </Badge>
          {ad.engagement_score && (
            <Badge className="absolute top-2 right-2" variant="secondary">
              Score: {ad.engagement_score}%
            </Badge>
          )}
        </div>
      )}

      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1 flex-1">
            <CardTitle className="text-base line-clamp-1">
              {ad.ad_headline || ad.advertiser_name || 'Publicité'}
            </CardTitle>
            {ad.advertiser_name && ad.ad_headline && (
              <p className="text-sm text-muted-foreground">{ad.advertiser_name}</p>
            )}
          </div>
          {ad.is_active && (
            <Badge variant="outline" className="shrink-0 text-green-600 border-green-300">
              Active
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-3 pb-2">
        {ad.ad_text && (
          <p className="text-sm text-muted-foreground line-clamp-2">{ad.ad_text}</p>
        )}

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-1.5">
            <DollarSign className="w-3.5 h-3.5 text-muted-foreground" />
            <span>
              {formatCurrency(ad.estimated_spend_min)} - {formatCurrency(ad.estimated_spend_max)}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-muted-foreground" />
            <span>{formatNumber(ad.estimated_reach)} reach</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
            <span>{ad.running_days || 0} jours</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-muted-foreground" />
            <span>{(ad.countries || []).slice(0, 3).join(', ') || 'N/A'}</span>
          </div>
        </div>

        {ad.engagement_score && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Engagement</span>
              <span className="font-medium">{ad.engagement_score}%</span>
            </div>
            <Progress value={ad.engagement_score} className="h-1.5" />
          </div>
        )}

        {ad.ad_cta && (
          <Badge variant="secondary" className="text-xs">
            CTA: {ad.ad_cta}
          </Badge>
        )}

        {showAnalysis && ad.ai_analysis && (
          <div className="mt-3 p-3 bg-muted rounded-lg space-y-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="font-medium text-sm">Analyse IA</span>
              <Badge className={performanceColor[ad.ai_analysis.estimated_performance]}>
                {ad.ai_analysis.estimated_performance}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">{ad.ai_analysis.hook_analysis}</p>
            {ad.ai_analysis.winning_elements.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {ad.ai_analysis.winning_elements.map((el, i) => (
                  <Badge key={i} variant="outline" className="text-xs">
                    {el}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>

      <CardFooter className="pt-2 gap-2">
        {onAnalyze && (
          <Button 
            variant="default" 
            size="sm" 
            className="flex-1"
            onClick={onAnalyze}
            disabled={isAnalyzing}
          >
            {isAnalyzing ? (
              <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5 mr-1.5" />
            )}
            Analyser
          </Button>
        )}
        {onSave && (
          <Button variant="outline" size="sm" onClick={onSave}>
            <FolderPlus className="w-3.5 h-3.5" />
          </Button>
        )}
        {ad.landing_page_url && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(ad.landing_page_url, '_blank')}
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
