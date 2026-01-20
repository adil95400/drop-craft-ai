import { Card, CardContent } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface ImageStats {
  total: number;
  noImages: number;
  oneImage: number;
  twoImages: number;
  threeOrMore: number;
}

interface ImageAuditStatsProps {
  stats: ImageStats;
  activeFilter: 'all' | '0' | '1' | '2' | '3+';
  onFilterChange: (filter: 'all' | '0' | '1' | '2' | '3+') => void;
}

const statItems = [
  { key: 'all' as const, label: 'Total', color: 'text-foreground', border: 'border-border' },
  { key: '0' as const, label: '0 image', color: 'text-destructive', border: 'border-destructive/50' },
  { key: '1' as const, label: '1 image', color: 'text-orange-500', border: 'border-orange-500/50' },
  { key: '2' as const, label: '2 images', color: 'text-yellow-500', border: 'border-yellow-500/50' },
  { key: '3+' as const, label: '3+ images', color: 'text-green-500', border: 'border-green-500/50' },
];

export function ImageAuditStats({ stats, activeFilter, onFilterChange }: ImageAuditStatsProps) {
  const getStatValue = (key: typeof statItems[number]['key']) => {
    switch (key) {
      case 'all': return stats.total;
      case '0': return stats.noImages;
      case '1': return stats.oneImage;
      case '2': return stats.twoImages;
      case '3+': return stats.threeOrMore;
    }
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
      {statItems.map((item, index) => (
        <motion.div
          key={item.key}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
        >
          <Card
            className={cn(
              "cursor-pointer transition-all hover:scale-105 hover:shadow-md",
              item.border,
              activeFilter === item.key && "ring-2 ring-primary bg-primary/5"
            )}
            onClick={() => onFilterChange(item.key)}
          >
            <CardContent className="p-4 text-center">
              <div className={cn("text-2xl md:text-3xl font-bold", item.color)}>
                {getStatValue(item.key).toLocaleString()}
              </div>
              <div className="text-xs md:text-sm text-muted-foreground">{item.label}</div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
