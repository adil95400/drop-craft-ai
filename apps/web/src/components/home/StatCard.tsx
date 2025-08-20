import { Stat } from '@/data/homeData';

interface StatCardProps {
  stat: Stat;
}

export default function StatCard({ stat }: StatCardProps) {
  const Icon = stat.icon;

  return (
    <div className="text-center">
      <Icon className="h-8 w-8 text-primary mx-auto mb-2" aria-hidden="true" />
      <div className="text-3xl font-bold text-foreground mb-1">{stat.value}</div>
      <div className="text-sm text-muted-foreground">{stat.label}</div>
    </div>
  );
}