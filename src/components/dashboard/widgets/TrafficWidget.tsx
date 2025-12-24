import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Globe, TrendingUp, Users, Eye } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface TrafficWidgetProps {
  timeRange: string;
  settings?: {
    showChart?: boolean;
    showSources?: boolean;
  };
}

const trafficData = [
  { date: 'Lun', visitors: 1200, pageViews: 3400 },
  { date: 'Mar', visitors: 1400, pageViews: 4200 },
  { date: 'Mer', visitors: 1100, pageViews: 3100 },
  { date: 'Jeu', visitors: 1600, pageViews: 4800 },
  { date: 'Ven', visitors: 1800, pageViews: 5200 },
  { date: 'Sam', visitors: 2100, pageViews: 6100 },
  { date: 'Dim', visitors: 1900, pageViews: 5500 },
];

const sourceData = [
  { name: 'Organique', value: 45, color: 'hsl(var(--primary))' },
  { name: 'Direct', value: 25, color: 'hsl(var(--secondary))' },
  { name: 'Social', value: 20, color: 'hsl(142 76% 36%)' },
  { name: 'Referral', value: 10, color: 'hsl(38 92% 50%)' },
];

export function TrafficWidget({ settings }: TrafficWidgetProps) {
  const showChart = settings?.showChart ?? true;
  const showSources = settings?.showSources ?? true;

  const totalVisitors = trafficData.reduce((sum, d) => sum + d.visitors, 0);
  const totalPageViews = trafficData.reduce((sum, d) => sum + d.pageViews, 0);

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Globe className="h-4 w-4 text-primary" />
          Trafic du site
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-muted-foreground text-xs">
              <Users className="h-3 w-3" />
              Visiteurs
            </div>
            <p className="text-2xl font-bold">{totalVisitors.toLocaleString()}</p>
            <p className="text-xs text-green-500 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" /> +12.5%
            </p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-muted-foreground text-xs">
              <Eye className="h-3 w-3" />
              Pages vues
            </div>
            <p className="text-2xl font-bold">{totalPageViews.toLocaleString()}</p>
            <p className="text-xs text-green-500 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" /> +8.3%
            </p>
          </div>
        </div>

        {showChart && (
          <div className="h-32">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trafficData}>
                <defs>
                  <linearGradient id="trafficGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--background))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }} 
                />
                <Area
                  type="monotone"
                  dataKey="visitors"
                  stroke="hsl(var(--primary))"
                  fill="url(#trafficGradient)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {showSources && (
          <div className="flex items-center gap-4">
            <div className="h-20 w-20">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={sourceData}
                    innerRadius={25}
                    outerRadius={35}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {sourceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 space-y-1">
              {sourceData.map((source) => (
                <div key={source.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full" style={{ backgroundColor: source.color }} />
                    <span>{source.name}</span>
                  </div>
                  <span className="font-medium">{source.value}%</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
