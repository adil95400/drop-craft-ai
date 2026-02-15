/**
 * Sprint 8: Grade Distribution Card
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3 } from 'lucide-react';

const GRADE_CONFIG: Record<string, { label: string; className: string }> = {
  A: { label: 'A (90-100)', className: 'bg-primary' },
  B: { label: 'B (75-89)', className: 'bg-primary/70' },
  C: { label: 'C (60-74)', className: 'bg-accent' },
  D: { label: 'D (40-59)', className: 'bg-destructive/60' },
  F: { label: 'F (0-39)', className: 'bg-destructive' },
};

interface Props {
  byGrade: Record<string, number>;
  total: number;
}

export default function SeoGradeDistribution({ byGrade, total }: Props) {
  const maxCount = Math.max(...Object.values(byGrade), 1);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <BarChart3 className="h-4 w-4" />
          Distribution des grades
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {Object.entries(GRADE_CONFIG).map(([grade, config]) => {
            const count = byGrade[grade] ?? 0;
            const percent = total > 0 ? Math.round((count / total) * 100) : 0;
            const barWidth = maxCount > 0 ? (count / maxCount) * 100 : 0;

            return (
              <div key={grade} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">{config.label}</span>
                  <span className="text-muted-foreground">{count} ({percent}%)</span>
                </div>
                <div className="h-3 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${config.className}`}
                    style={{ width: `${barWidth}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
