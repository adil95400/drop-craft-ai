import React, { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Calendar } from 'lucide-react';

interface CohortData {
  cohort: string;
  size: number;
  retention: number[];
}

interface CohortAnalysisChartProps {
  data?: CohortData[];
}

const DEMO_COHORTS: CohortData[] = [
  { cohort: 'Jan 2026', size: 120, retention: [100, 45, 32, 25, 20, 18] },
  { cohort: 'Déc 2025', size: 98, retention: [100, 50, 38, 28, 22, 19] },
  { cohort: 'Nov 2025', size: 145, retention: [100, 42, 30, 22, 18, 15] },
  { cohort: 'Oct 2025', size: 110, retention: [100, 48, 35, 26, 21, 17] },
  { cohort: 'Sep 2025', size: 88, retention: [100, 55, 40, 30, 24, 20] },
  { cohort: 'Aoû 2025', size: 75, retention: [100, 52, 36, 27, 22, 0] },
];

function getRetentionColor(value: number): string {
  if (value >= 80) return 'bg-emerald-500/90 text-white';
  if (value >= 50) return 'bg-emerald-400/70 text-white';
  if (value >= 35) return 'bg-emerald-300/60 text-emerald-900';
  if (value >= 20) return 'bg-amber-300/60 text-amber-900';
  if (value >= 10) return 'bg-orange-300/50 text-orange-900';
  if (value > 0) return 'bg-red-200/50 text-red-900';
  return 'bg-muted/30 text-muted-foreground';
}

export function CohortAnalysisChart({ data }: CohortAnalysisChartProps) {
  const cohorts = data || DEMO_COHORTS;
  const months = ['M0', 'M1', 'M2', 'M3', 'M4', 'M5'];

  const avgRetention = useMemo(() => {
    return months.map((_, i) => {
      const values = cohorts.map(c => c.retention[i]).filter(v => v > 0);
      return values.length ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : 0;
    });
  }, [cohorts]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Analyse de cohortes
            </CardTitle>
            <CardDescription>Taux de rétention par cohorte mensuelle</CardDescription>
          </div>
          <Badge variant="outline">
            Rétention moy. M1: {avgRetention[1]}%
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="text-left p-2 font-medium text-muted-foreground">Cohorte</th>
                <th className="text-center p-2 font-medium text-muted-foreground">Taille</th>
                {months.map(m => (
                  <th key={m} className="text-center p-2 font-medium text-muted-foreground">{m}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cohorts.map((cohort) => (
                <tr key={cohort.cohort} className="border-t border-border/50">
                  <td className="p-2 font-medium">{cohort.cohort}</td>
                  <td className="p-2 text-center text-muted-foreground">{cohort.size}</td>
                  {cohort.retention.map((value, i) => (
                    <td key={i} className="p-1">
                      <div className={cn(
                        "rounded-md p-2 text-center text-xs font-medium transition-colors",
                        getRetentionColor(value)
                      )}>
                        {value > 0 ? `${value}%` : '—'}
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
              {/* Average row */}
              <tr className="border-t-2 border-border font-semibold">
                <td className="p-2">Moyenne</td>
                <td className="p-2 text-center">
                  {Math.round(cohorts.reduce((a, c) => a + c.size, 0) / cohorts.length)}
                </td>
                {avgRetention.map((val, i) => (
                  <td key={i} className="p-1">
                    <div className={cn(
                      "rounded-md p-2 text-center text-xs font-bold ring-2 ring-primary/20",
                      getRetentionColor(val)
                    )}>
                      {val}%
                    </div>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
