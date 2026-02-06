import { memo } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { BarChart3, Target, FileText, Search, Info } from 'lucide-react';

interface SEOStatsCardsProps {
  auditsCount: number;
  averageScore: number;
  totalKeywords: number;
  trackingKeywords: number;
  totalPages: number;
}

const STATS_CONFIG = [
  {
    key: 'audits',
    label: 'Audits',
    tooltip: 'Nombre total d\'audits réalisés',
    icon: Search,
    color: 'text-primary',
    bgColor: 'bg-primary/10',
  },
  {
    key: 'score',
    label: 'Score Moyen',
    tooltip: 'Score SEO moyen sur tous les audits',
    icon: BarChart3,
    color: 'text-success',
    bgColor: 'bg-success/10',
  },
  {
    key: 'keywords',
    label: 'Mots-clés',
    tooltip: 'Mots-clés suivis et actifs',
    icon: Target,
    color: 'text-warning',
    bgColor: 'bg-warning/10',
  },
  {
    key: 'pages',
    label: 'Pages Analysées',
    tooltip: 'Nombre total de pages analysées',
    icon: FileText,
    color: 'text-info',
    bgColor: 'bg-info/10',
  },
];

function SEOStatsCardsComponent({ auditsCount, averageScore, totalKeywords, trackingKeywords, totalPages }: SEOStatsCardsProps) {
  const values: Record<string, { main: number; sub: string; hasProgress?: boolean }> = {
    audits: { main: auditsCount, sub: 'audits réalisés' },
    score: { main: Math.round(averageScore), sub: '/100', hasProgress: true },
    keywords: { main: totalKeywords, sub: `${trackingKeywords} actifs` },
    pages: { main: totalPages, sub: 'pages indexées' },
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {STATS_CONFIG.map(stat => {
        const Icon = stat.icon;
        const val = values[stat.key as keyof typeof values];
        return (
          <Card key={stat.key} className="relative overflow-hidden">
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className={`inline-flex items-center justify-center w-10 h-10 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`h-5 w-5 ${stat.color}`} />
                </div>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-3.5 w-3.5 text-muted-foreground/50" />
                    </TooltipTrigger>
                    <TooltipContent side="left">{stat.tooltip}</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold tracking-tight tabular-nums">{val.main}</span>
                <span className="text-sm text-muted-foreground">{val.sub}</span>
              </div>
              {val.hasProgress && (
                <Progress value={val.main} className="h-1.5 mt-3" />
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

export const SEOStatsCards = memo(SEOStatsCardsComponent);
