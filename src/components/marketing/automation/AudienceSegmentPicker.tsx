/**
 * Audience Segment Picker for marketing automation
 * Fetches real segments from customer_segments table
 */
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Users, Target, ShoppingCart, Star, Clock } from 'lucide-react';

const SEGMENT_ICONS: Record<string, any> = {
  vip: Star,
  new: Users,
  inactive: Clock,
  high_value: ShoppingCart,
  default: Target,
};

interface Props {
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  compact?: boolean;
}

export function AudienceSegmentPicker({ selectedIds, onChange, compact }: Props) {
  const { data: segments = [], isLoading } = useQuery({
    queryKey: ['customer-segments-picker'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      const { data } = await supabase
        .from('customer_segments')
        .select('id, name, description, customer_count, segment_type, is_active, total_revenue')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('customer_count', { ascending: false });
      return data || [];
    },
  });

  const toggle = (id: string) => {
    onChange(
      selectedIds.includes(id)
        ? selectedIds.filter(s => s !== id)
        : [...selectedIds, id]
    );
  };

  const totalSelected = segments
    .filter((s: any) => selectedIds.includes(s.id))
    .reduce((sum: number, s: any) => sum + (s.customer_count || 0), 0);

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-14 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  if (segments.length === 0) {
    return (
      <Card className="p-6 text-center">
        <Users className="h-8 w-8 mx-auto mb-2 text-muted-foreground opacity-50" />
        <p className="text-sm font-medium mb-1">Aucun segment</p>
        <p className="text-xs text-muted-foreground">
          Créez des segments dans la section Clients pour cibler vos automatisations
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {selectedIds.length > 0 && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Target className="h-3.5 w-3.5" />
          <span>{selectedIds.length} segment(s) · ~{totalSelected.toLocaleString('fr-FR')} contacts</span>
        </div>
      )}

      <ScrollArea className={compact ? 'max-h-[200px]' : 'max-h-[350px]'}>
        <div className="space-y-2">
          {segments.map((seg: any) => {
            const Icon = SEGMENT_ICONS[seg.segment_type] || SEGMENT_ICONS.default;
            const isSelected = selectedIds.includes(seg.id);

            return (
              <Card
                key={seg.id}
                className={`p-3 cursor-pointer transition-all hover:shadow-sm ${
                  isSelected ? 'ring-1 ring-primary border-primary/30' : ''
                }`}
                onClick={() => toggle(seg.id)}
              >
                <div className="flex items-center gap-3">
                  <Checkbox checked={isSelected} className="pointer-events-none" />
                  <div className="p-1.5 rounded bg-accent">
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{seg.name}</p>
                    {seg.description && !compact && (
                      <p className="text-xs text-muted-foreground truncate">{seg.description}</p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <Badge variant="outline" className="text-xs">
                      {(seg.customer_count || 0).toLocaleString('fr-FR')} contacts
                    </Badge>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
