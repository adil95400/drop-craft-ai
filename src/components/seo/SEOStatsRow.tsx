/**
 * SEOStatsRow — KPIs compacts utilisant StatCard (composant socle)
 */
import { memo } from 'react';
import { StatCard } from '@/components/shared';
import { Progress } from '@/components/ui/progress';
import { Search, BarChart3, Target, FileText } from 'lucide-react';

interface SEOStatsRowProps {
  auditsCount: number;
  averageScore: number;
  totalKeywords: number;
  trackingKeywords: number;
  totalPages: number;
}

function SEOStatsRowComponent({ auditsCount, averageScore, totalKeywords, trackingKeywords, totalPages }: SEOStatsRowProps) {
  const score = Math.round(averageScore);

  return (
    <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
      <StatCard
        label="Audits"
        value={auditsCount}
        sub="réalisés"
        icon={Search}
        color="primary"
      />
      <StatCard
        label="Score Moyen"
        value={score}
        sub="/100"
        icon={BarChart3}
        color={score >= 80 ? 'success' : score >= 50 ? 'warning' : 'destructive'}
        footer={<Progress value={score} className="h-1.5" />}
      />
      <StatCard
        label="Mots-clés"
        value={totalKeywords}
        sub={`${trackingKeywords} actifs`}
        icon={Target}
        color="warning"
      />
      <StatCard
        label="Pages"
        value={totalPages}
        sub="analysées"
        icon={FileText}
        color="info"
      />
    </div>
  );
}

export const SEOStatsRow = memo(SEOStatsRowComponent);
