/**
 * MediaStatsBar - Compact stats overview for the media hub
 */
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Image, Video, FileText, HardDrive, TrendingUp, Star } from 'lucide-react';

interface MediaStatsBarProps {
  stats: {
    totalImages: number;
    totalVideos: number;
    totalDocs: number;
    totalSize: number;
    avgOptScore: number;
    favorites: number;
  };
  isLoading?: boolean;
}

const formatSize = (bytes: number) => {
  if (bytes === 0) return '0 B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + ' KB';
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
};

export function MediaStatsBar({ stats, isLoading }: MediaStatsBarProps) {
  const items = [
    { label: 'Images', value: stats.totalImages, icon: Image, color: 'text-blue-500 bg-blue-500/10' },
    { label: 'Vidéos', value: stats.totalVideos, icon: Video, color: 'text-violet-500 bg-violet-500/10' },
    { label: 'Documents', value: stats.totalDocs, icon: FileText, color: 'text-amber-500 bg-amber-500/10' },
    { label: 'Stockage', value: formatSize(stats.totalSize), icon: HardDrive, color: 'text-emerald-500 bg-emerald-500/10', isText: true },
    { label: 'Score opti.', value: `${stats.avgOptScore}%`, icon: TrendingUp, color: 'text-cyan-500 bg-cyan-500/10', isText: true },
    { label: 'Favoris', value: stats.favorites, icon: Star, color: 'text-warning bg-warning/10' },
  ];

  return (
    <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
      {items.map((item) => (
        <Card key={item.label} className="hover:shadow-md transition-shadow">
          <CardContent className="p-3 flex items-center gap-2.5">
            <div className={cn("p-1.5 rounded-lg shrink-0", item.color)}>
              <item.icon className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-lg font-bold tabular-nums leading-tight truncate">
                {isLoading ? '…' : item.isText ? item.value : item.value.toLocaleString()}
              </p>
              <p className="text-[10px] text-muted-foreground truncate">{item.label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
