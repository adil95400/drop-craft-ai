import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Trophy, TrendingUp } from 'lucide-react';

interface ABTestingPanelProps {
  campaignId: string;
}

export function ABTestingPanel({ campaignId }: ABTestingPanelProps) {
  const { data: variants = [] } = useQuery({
    queryKey: ['ab-test-variants', campaignId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ab_test_variants')
        .select('*')
        .eq('test_name', campaignId);

      if (error) throw error;
      return data || [];
    },
  });

  if (variants.length === 0) return null;

  const winner = variants.find(v => v.is_winner);

  return (
    <Card>
      <CardHeader>
        <CardTitle>A/B Testing Results</CardTitle>
        <CardDescription>
          Performance comparison of ad variants
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-3">
          {variants.map((variant) => {
            const performance = (variant.performance_data as any) || {};
            const ctr = performance.ctr || 0;
            const conversions = performance.conversions || 0;

            return (
              <Card key={variant.id} className={variant.is_winner ? 'border-primary' : ''}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Variant {variant.variant_name}</CardTitle>
                    {variant.is_winner && (
                      <Badge className="bg-primary">
                        <Trophy className="mr-1 h-3 w-3" />
                        Winner
                      </Badge>
                    )}
                  </div>
                  <CardDescription>
                    {variant.traffic_allocation}% traffic
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-muted-foreground">Click-Through Rate</span>
                      <span className="font-semibold">{ctr.toFixed(2)}%</span>
                    </div>
                    <Progress value={ctr} className="h-2" />
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-muted-foreground">Conversions</span>
                      <span className="font-semibold">{conversions}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t">
                    <p className="text-sm font-medium mb-2">Ad Copy</p>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {(variant.ad_creative as any)?.headline || 'No headline'}
                    </p>
                  </div>

                  {variant.is_winner && (
                    <div className="flex items-center gap-2 text-sm text-primary">
                      <TrendingUp className="h-4 w-4" />
                      Best performing variant
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
