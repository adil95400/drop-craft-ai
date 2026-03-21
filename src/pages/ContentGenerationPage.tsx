import { Helmet } from 'react-helmet-async';
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Video, Image, FileText, Sparkles, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { AdvancedFeatureGuide, ADVANCED_GUIDES } from '@/components/guide';
import { ContentGenerationHub } from '@/components/content/ContentGenerationHub';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))'];

const StatCard = ({ title, value, subtitle, icon: Icon, isLoading }: {
  title: string; value: string | number; subtitle: string; icon: any; isLoading?: boolean;
}) => (
  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} whileHover={{ scale: 1.02 }} transition={{ duration: 0.2 }}>
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className="p-2 rounded-lg bg-primary/10">
          <Icon className="h-4 w-4 text-primary" />
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <>
            <div className="text-2xl font-bold">{value}</div>
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          </>
        )}
      </CardContent>
    </Card>
  </motion.div>
);

export default function ContentGenerationPage() {
  const { user } = useAuth();

  const { data: contentStats, isLoading } = useQuery({
    queryKey: ['content-generation-stats', user?.id],
    queryFn: async () => {
      if (!user?.id) return { total: 0, applied: 0, pending: 0, byType: [] };
      const { data, error } = await supabase
        .from('ai_generated_content')
        .select('id, content_type, status, quality_score, tokens_used')
        .eq('user_id', user.id);
      if (error) return { total: 0, applied: 0, pending: 0, byType: [] };
      const items = data || [];
      const typeMap = items.reduce((acc: Record<string, number>, item: any) => {
        acc[item.content_type] = (acc[item.content_type] || 0) + 1;
        return acc;
      }, {});
      return {
        total: items.length,
        applied: items.filter((i: any) => i.status === 'applied').length,
        pending: items.filter((i: any) => i.status === 'pending' || i.status === 'generated').length,
        avgQuality: items.length > 0 ? Math.round(items.reduce((s: number, i: any) => s + (i.quality_score || 0), 0) / items.length) : 0,
        totalTokens: items.reduce((s: number, i: any) => s + (i.tokens_used || 0), 0),
        byType: Object.entries(typeMap).map(([name, value]) => ({ name, value })),
      };
    },
    enabled: !!user?.id,
  });

  const stats = contentStats || { total: 0, applied: 0, pending: 0, avgQuality: 0, totalTokens: 0, byType: [] };

  return (
    <>
      <Helmet>
        <title>Génération de Contenu IA — Drop-Craft AI</title>
        <meta name="description" content="Générez automatiquement des descriptions, titres et contenus marketing avec l'IA" />
      </Helmet>

      <ChannablePageWrapper
        title="Génération de Contenu IA"
        subtitle="Créez automatiquement des contenus marketing optimisés avec l'IA"
        heroImage="marketing"
      >
        <AdvancedFeatureGuide {...ADVANCED_GUIDES.contentGeneration} />

        {/* Stats with real data */}
        <div className="grid gap-4 md:grid-cols-4">
          <StatCard title="Contenus générés" value={stats.total} subtitle="Total cumulé" icon={FileText} isLoading={isLoading} />
          <StatCard title="Appliqués" value={stats.applied} subtitle="Contenus en production" icon={Sparkles} isLoading={isLoading} />
          <StatCard title="En attente" value={stats.pending} subtitle="À réviser" icon={Image} isLoading={isLoading} />
          <StatCard title="Score qualité" value={stats.avgQuality ? `${stats.avgQuality}/100` : '—'} subtitle="Moyenne IA" icon={Video} isLoading={isLoading} />
        </div>

        {/* Distribution chart */}
        {stats.byType.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Répartition par type de contenu</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-8">
                <ResponsiveContainer width="50%" height={200}>
                  <PieChart>
                    <Pie data={stats.byType} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }: any) => `${name} (${((percent as number) * 100).toFixed(0)}%)`}>
                      {stats.byType.map((_: any, i: number) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2">
                  {stats.byType.map((t: any, i: number) => (
                    <div key={t.name} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <span className="text-sm">{t.name}</span>
                      <span className="text-sm font-bold ml-auto">{t.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <ContentGenerationHub />
      </ChannablePageWrapper>
    </>
  );
}
