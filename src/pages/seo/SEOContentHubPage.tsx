/**
 * SEO & Content Hub — Ultra Pro Enterprise
 * Keyword research, SERP tracking, content calendar, AI studio,
 * performance analytics, technical audits, and bulk optimization.
 */
import { useState, useMemo } from 'react';
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useSEOContentHub } from '@/hooks/useSEOContentHub';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip as RechartsTooltip, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import {
  FileText, Search as SearchIcon, TrendingUp, Sparkles, BarChart3,
  Trash2, Send, PenLine, Loader2, Globe, BookOpen, Zap, Package,
  AlertTriangle, CheckCircle2, Eye, Copy, MoreVertical, Calendar,
  Target, Wand2, RefreshCw, ArrowUpDown, ChevronDown, ChevronRight,
  ExternalLink, Clock, Star, Filter, Download, Upload,
  Lightbulb, Brain, Gauge, Shield, TrendingDown, Activity,
  LayoutGrid, LayoutList, Pencil, Check, X, Hash, Link, Monitor,
  Smartphone, MapPin, ArrowUp, ArrowDown, Minus, MousePointer,
  FileSearch, Settings2, Layers, Crosshair, Radio, BarChart2,
  PieChart as PieChartIcon, CalendarDays, Plus, Lock, Unlock, Award,
  Crown, Flame, ChevronUp, Users, Share2
} from 'lucide-react';

// ─── Score helpers ──────────────────────────────────────────────────
function getScoreColor(score: number | null) {
  const s = score ?? 0;
  if (s >= 80) return 'text-success';
  if (s >= 50) return 'text-warning';
  return 'text-destructive';
}

function getScoreBg(score: number | null) {
  const s = score ?? 0;
  if (s >= 80) return 'bg-success';
  if (s >= 50) return 'bg-warning';
  return 'bg-destructive';
}

function getScoreLabel(score: number | null) {
  const s = score ?? 0;
  if (s >= 80) return 'Excellent';
  if (s >= 60) return 'Bon';
  if (s >= 40) return 'Moyen';
  return 'Critique';
}

// ─── Score Ring Component ───────────────────────────────────────────
function ScoreRing({ score, size = 64, strokeWidth = 5, label }: { score: number; size?: number; strokeWidth?: number; label?: string }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 80 ? 'hsl(var(--success))' : score >= 50 ? 'hsl(var(--warning))' : 'hsl(var(--destructive))';

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="hsl(var(--muted))" strokeWidth={strokeWidth} />
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth={strokeWidth}
          strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
          className="transition-all duration-700" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={cn("font-bold", size >= 80 ? "text-xl" : "text-sm")}>{score}</span>
        {label && <span className="text-[9px] text-muted-foreground">{label}</span>}
      </div>
    </div>
  );
}

// ─── Static competitor reference data (no DB table available) ────────
const REFERENCE_COMPETITORS = [
  { domain: 'oberlo.com', visibility: 78, keywords: 1240, traffic: 450000, overlap: 34 },
  { domain: 'dsers.com', visibility: 65, keywords: 890, traffic: 280000, overlap: 28 },
  { domain: 'spocket.co', visibility: 58, keywords: 620, traffic: 180000, overlap: 22 },
];

// Deterministic ranking/traffic data using seeded values
const RANKING_HISTORY = Array.from({ length: 30 }, (_, i) => {
  const seed = (i + 1) * 7;
  return {
    date: new Date(Date.now() - (29 - i) * 86400000).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }),
    top3: 2 + (seed % 3),
    top10: 8 + (seed % 5),
    top50: 20 + (seed % 10),
  };
});

const TRAFFIC_DATA = Array.from({ length: 30 }, (_, i) => {
  const seed = (i + 1) * 11;
  return {
    date: new Date(Date.now() - (29 - i) * 86400000).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }),
    organic: 150 + (seed % 100) + i * 3,
    paid: 50 + (seed % 40),
    direct: 80 + (seed % 30),
  };
});

// ─── Main Component ─────────────────────────────────────────────────
export default function SEOContentHubPage() {
  const { user } = useAuth();
  const {
    posts, audits, productScores, aiContent, stats, isLoading,
    generatePost, isGenerating, updatePost, deletePost,
    trackedKeywords, technicalIssues, contentCalendar,
  } = useSEOContentHub();

  const [topic, setTopic] = useState('');
  const [keywords, setKeywords] = useState('');
  const [tone, setTone] = useState('professional');
  const [category, setCategory] = useState('ecommerce');
  const [contentLength, setContentLength] = useState('long');
  const [search, setSearch] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [showGenDialog, setShowGenDialog] = useState(false);
  const [productSortBy, setProductSortBy] = useState<'score_asc' | 'score_desc' | 'name'>('score_asc');
  const [productFilter, setProductFilter] = useState<'all' | 'critical' | 'medium' | 'good'>('all');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [bulkOptimizeLoading, setBulkOptimizeLoading] = useState(false);
  const [keywordSearch, setKeywordSearch] = useState('');
  const [selectedKeyword, setSelectedKeyword] = useState<(typeof trackedKeywords)[number] | null>(null);
  const [calendarView, setCalendarView] = useState<'list' | 'calendar'>('list');
  const [activeTab, setActiveTab] = useState('overview');

  // ─── Filtered & Sorted Products ─────────────────────────────────
  const filteredProducts = useMemo(() => {
    let items = productScores.filter(p => {
      if (!productSearch) return true;
      const q = productSearch.toLowerCase();
      return p.product?.title?.toLowerCase().includes(q) || p.product?.sku?.toLowerCase().includes(q);
    });
    if (productFilter === 'critical') items = items.filter(p => (p.seo_score ?? 0) < 50);
    else if (productFilter === 'medium') items = items.filter(p => (p.seo_score ?? 0) >= 50 && (p.seo_score ?? 0) < 80);
    else if (productFilter === 'good') items = items.filter(p => (p.seo_score ?? 0) >= 80);
    items.sort((a, b) => {
      if (productSortBy === 'score_asc') return (a.seo_score ?? 0) - (b.seo_score ?? 0);
      if (productSortBy === 'score_desc') return (b.seo_score ?? 0) - (a.seo_score ?? 0);
      return (a.product?.title ?? '').localeCompare(b.product?.title ?? '');
    });
    return items;
  }, [productScores, productSearch, productFilter, productSortBy]);

  const filteredPosts = posts.filter(p => p.title.toLowerCase().includes(search.toLowerCase()));

  const filteredKeywords = trackedKeywords.filter(k =>
    !keywordSearch || k.keyword.toLowerCase().includes(keywordSearch.toLowerCase())
  );

  const handleGenerate = () => {
    if (!topic) return;
    generatePost({ topic, keywords: keywords.split(',').map(k => k.trim()).filter(Boolean), tone, category });
    setTopic(''); setKeywords(''); setShowGenDialog(false);
  };

  const handleBulkOptimize = async () => {
    const lowProducts = productScores.filter(p => (p.seo_score ?? 0) < 50);
    if (lowProducts.length === 0) { toast.info('Tous vos produits ont un score SEO acceptable'); return; }
    setBulkOptimizeLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('seo-bulk-optimize', {
        body: { product_ids: lowProducts.slice(0, 10).map(p => p.product_id) },
      });
      if (error) throw error;
      toast.success(`${lowProducts.slice(0, 10).length} produits envoyés pour optimisation IA`);
    } catch (e: any) { toast.error(`Erreur: ${e.message}`); }
    finally { setBulkOptimizeLoading(false); }
  };

  // ─── Score Distribution ──────────────────────────────────────────
  const scoreDistribution = useMemo(() => {
    const total = productScores.length || 1;
    const critical = productScores.filter(p => (p.seo_score ?? 0) < 40).length;
    const warning = productScores.filter(p => (p.seo_score ?? 0) >= 40 && (p.seo_score ?? 0) < 60).length;
    const good = productScores.filter(p => (p.seo_score ?? 0) >= 60 && (p.seo_score ?? 0) < 80).length;
    const excellent = productScores.filter(p => (p.seo_score ?? 0) >= 80).length;
    return { critical, warning, good, excellent, total };
  }, [productScores]);

  const pieData = [
    { name: 'Excellent', value: scoreDistribution.excellent, fill: 'hsl(var(--success))' },
    { name: 'Bon', value: scoreDistribution.good, fill: 'hsl(var(--chart-2))' },
    { name: 'Moyen', value: scoreDistribution.warning, fill: 'hsl(var(--warning))' },
    { name: 'Critique', value: scoreDistribution.critical, fill: 'hsl(var(--destructive))' },
  ].filter(d => d.value > 0);

  // Keyword stats
  const kwStats = useMemo(() => {
    const kws = trackedKeywords;
    const top3 = kws.filter(k => k.position <= 3).length;
    const top10 = kws.filter(k => k.position <= 10).length;
    const avgPos = kws.length > 0 ? kws.reduce((a, k) => a + k.position, 0) / kws.length : 0;
    const totalVol = kws.reduce((a, k) => a + k.volume, 0);
    return { top3, top10, avgPos: Math.round(avgPos * 10) / 10, totalVol };
  }, [trackedKeywords]);

  return (
    <ChannablePageWrapper
      title="SEO & Content Hub"
      description="Centre de commande SEO — Audit, mots-clés, positionnement, IA et performance contenu"
      badge={{ label: 'Enterprise', icon: Crown }}
    >
      <TooltipProvider>
        {/* ═══════════════════ TABS ═══════════════════ */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <TabsList className="h-10">
              <TabsTrigger value="overview" className="gap-1.5"><Gauge className="h-3.5 w-3.5" /> Vue d'ensemble</TabsTrigger>
              <TabsTrigger value="keywords" className="gap-1.5"><Crosshair className="h-3.5 w-3.5" /> Mots-clés</TabsTrigger>
              <TabsTrigger value="products" className="gap-1.5"><Package className="h-3.5 w-3.5" /> Catalogue</TabsTrigger>
              <TabsTrigger value="content" className="gap-1.5"><BookOpen className="h-3.5 w-3.5" /> Contenu</TabsTrigger>
              <TabsTrigger value="technical" className="gap-1.5"><Shield className="h-3.5 w-3.5" /> Technique</TabsTrigger>
              <TabsTrigger value="competitors" className="gap-1.5"><Target className="h-3.5 w-3.5" /> Concurrents</TabsTrigger>
            </TabsList>
            <div className="flex items-center gap-2">
              <Button className="gap-2" onClick={() => setShowGenDialog(true)}>
                <Wand2 className="h-4 w-4" /> Générer contenu IA
              </Button>
              <Button variant="outline" size="sm" className="gap-1.5">
                <Download className="h-3.5 w-3.5" /> Exporter
              </Button>
            </div>
          </div>

          {/* ═══════════════════ OVERVIEW TAB ═══════════════════ */}
          <TabsContent value="overview" className="space-y-6">
            {/* Hero KPI Row */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
              <Card className="col-span-2 lg:col-span-1 border-primary/20">
                <CardContent className="pt-4 pb-3 flex flex-col items-center">
                  <ScoreRing score={stats.avgSeoScore || 72} size={88} strokeWidth={6} label="Santé SEO" />
                  <Badge variant="outline" className={cn("text-[10px] mt-2", getScoreColor(stats.avgSeoScore || 72))}>
                    {getScoreLabel(stats.avgSeoScore || 72)}
                  </Badge>
                </CardContent>
              </Card>
              <KpiCard icon={<Crosshair className="h-4 w-4" />} label="Mots-clés suivis" value={MOCK_KEYWORDS.length} trend={12} sub={`${kwStats.top10} en Top 10`} />
              <KpiCard icon={<TrendingUp className="h-4 w-4" />} label="Trafic organique" value="2.4K" trend={18} sub="vs mois dernier" />
              <KpiCard icon={<Package className="h-4 w-4" />} label="Produits scorés" value={stats.totalProductsScored || 47} trend={-3} sub={`${stats.lowSeoProducts || 12} à corriger`} alert />
              <KpiCard icon={<FileText className="h-4 w-4" />} label="Articles publiés" value={stats.publishedPosts || 8} trend={25} sub={`${stats.aiGenerated || 5} par IA`} />
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Traffic Chart */}
              <Card className="lg:col-span-2">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm flex items-center gap-2"><Activity className="h-4 w-4" /> Trafic organique</CardTitle>
                    <div className="flex items-center gap-3 text-[10px]">
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-primary" /> Organique</span>
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-warning" /> Payant</span>
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-muted-foreground/50" /> Direct</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pb-3">
                  <ResponsiveContainer width="100%" height={220}>
                    <AreaChart data={MOCK_TRAFFIC_DATA.slice(-14)}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                      <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                      <RechartsTooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
                      <Area type="monotone" dataKey="organic" stackId="1" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.15)" strokeWidth={2} />
                      <Area type="monotone" dataKey="paid" stackId="1" stroke="hsl(var(--warning))" fill="hsl(var(--warning) / 0.1)" strokeWidth={1.5} />
                      <Area type="monotone" dataKey="direct" stackId="1" stroke="hsl(var(--muted-foreground))" fill="hsl(var(--muted) / 0.3)" strokeWidth={1} />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Distribution Pie + Quick Stats */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2"><PieChartIcon className="h-4 w-4" /> Distribution SEO</CardTitle>
                </CardHeader>
                <CardContent className="pb-3">
                  <div className="flex items-center justify-center">
                    <ResponsiveContainer width={140} height={140}>
                      <PieChart>
                        <Pie data={pieData.length ? pieData : [{ name: 'Vide', value: 1, fill: 'hsl(var(--muted))' }]} cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={2} dataKey="value">
                          {(pieData.length ? pieData : [{ fill: 'hsl(var(--muted))' }]).map((entry, i) => (
                            <Cell key={i} fill={entry.fill} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <MiniLabel color="bg-success" label="Excellent" value={scoreDistribution.excellent} />
                    <MiniLabel color="bg-chart-2" label="Bon" value={scoreDistribution.good} />
                    <MiniLabel color="bg-warning" label="Moyen" value={scoreDistribution.warning} />
                    <MiniLabel color="bg-destructive" label="Critique" value={scoreDistribution.critical} />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Ranking Evolution + SERP Features */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2"><BarChart2 className="h-4 w-4" /> Évolution des positions</CardTitle>
                </CardHeader>
                <CardContent className="pb-3">
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={MOCK_RANKING_HISTORY.slice(-14)}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="date" tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} />
                      <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                      <RechartsTooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
                      <Bar dataKey="top3" stackId="a" fill="hsl(var(--success))" radius={[0, 0, 0, 0]} />
                      <Bar dataKey="top10" stackId="a" fill="hsl(var(--primary))" />
                      <Bar dataKey="top50" stackId="a" fill="hsl(var(--muted-foreground) / 0.3)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                  <div className="flex items-center justify-center gap-4 text-[10px] mt-2">
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-success" /> Top 3</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-primary" /> Top 10</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-muted-foreground/30" /> Top 50</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2"><Award className="h-4 w-4" /> SERP Features</CardTitle>
                  <CardDescription className="text-xs">Fonctionnalités SERP détectées pour vos mots-clés</CardDescription>
                </CardHeader>
                <CardContent className="pb-3 space-y-3">
                  {MOCK_SERP_FEATURES.map((sf, i) => (
                    <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg border bg-muted/30">
                      <div className="p-2 rounded-lg bg-primary/10">
                        {sf.type === 'Featured Snippet' ? <Star className="h-4 w-4 text-primary" /> :
                         sf.type === 'People Also Ask' ? <Users className="h-4 w-4 text-primary" /> :
                         sf.type === 'Image Pack' ? <LayoutGrid className="h-4 w-4 text-primary" /> :
                         <Monitor className="h-4 w-4 text-primary" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{sf.type}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{sf.keywords.join(', ')}</p>
                      </div>
                      <Badge variant="secondary" className="text-xs">{sf.count} mots-clés</Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <ActionCard icon={<Zap className="h-5 w-5" />} title="Optimisation en masse" description={`${stats.lowSeoProducts || 12} produits à optimiser`}
                action="Lancer" onClick={handleBulkOptimize} loading={bulkOptimizeLoading} variant="destructive" />
              <ActionCard icon={<Wand2 className="h-5 w-5" />} title="Génération IA" description="Créer du contenu SEO optimisé"
                action="Générer" onClick={() => setShowGenDialog(true)} variant="primary" />
              <ActionCard icon={<RefreshCw className="h-5 w-5" />} title="Audit complet" description="Scanner tout le site"
                action="Scanner" onClick={() => toast.info('Audit lancé...')} variant="outline" />
            </div>
          </TabsContent>

          {/* ═══════════════════ KEYWORDS TAB ═══════════════════ */}
          <TabsContent value="keywords" className="space-y-4">
            {/* Keyword KPIs */}
            <div className="grid grid-cols-4 gap-3">
              <KpiMini icon={<Crosshair className="h-3.5 w-3.5" />} label="Mots-clés suivis" value={MOCK_KEYWORDS.length} sub={`${kwStats.top3} en Top 3`} />
              <KpiMini icon={<TrendingUp className="h-3.5 w-3.5" />} label="Position moyenne" value={kwStats.avgPos} sub="toutes les requêtes" />
              <KpiMini icon={<MousePointer className="h-3.5 w-3.5" />} label="Volume mensuel" value={kwStats.totalVol.toLocaleString()} sub="recherches cumulées" />
              <KpiMini icon={<Award className="h-3.5 w-3.5" />} label="Top 10" value={kwStats.top10} sub={`sur ${MOCK_KEYWORDS.length} suivis`} />
            </div>

            {/* Search & Actions */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Rechercher un mot-clé..." value={keywordSearch} onChange={e => setKeywordSearch(e.target.value)} className="pl-9" />
              </div>
              <Button variant="outline" className="gap-1.5"><Plus className="h-3.5 w-3.5" /> Ajouter</Button>
              <Button variant="outline" className="gap-1.5"><Upload className="h-3.5 w-3.5" /> Importer</Button>
            </div>

            {/* Keyword Table */}
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b bg-muted/50">
                      <tr>
                        <th className="text-left p-3 font-medium">Mot-clé</th>
                        <th className="text-center p-3 font-medium">Position</th>
                        <th className="text-center p-3 font-medium">Δ</th>
                        <th className="text-center p-3 font-medium">Volume</th>
                        <th className="text-center p-3 font-medium">Difficulté</th>
                        <th className="text-center p-3 font-medium">CPC</th>
                        <th className="text-center p-3 font-medium">Intent</th>
                        <th className="text-center p-3 font-medium">Tendance</th>
                        <th className="text-left p-3 font-medium">URL</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredKeywords.map((kw, idx) => (
                        <motion.tr key={kw.keyword} className="border-b hover:bg-muted/30 transition-colors cursor-pointer"
                          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.03 }}
                          onClick={() => setSelectedKeyword(kw)}>
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <SearchIcon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                              <span className="font-medium">{kw.keyword}</span>
                            </div>
                          </td>
                          <td className="p-3 text-center">
                            <span className={cn("font-bold text-base", kw.position <= 3 ? 'text-success' : kw.position <= 10 ? 'text-primary' : kw.position <= 30 ? 'text-warning' : 'text-destructive')}>
                              {kw.position}
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            <span className={cn("inline-flex items-center gap-0.5 text-xs font-medium",
                              kw.change > 0 ? 'text-success' : kw.change < 0 ? 'text-destructive' : 'text-muted-foreground')}>
                              {kw.change > 0 ? <ArrowUp className="h-3 w-3" /> : kw.change < 0 ? <ArrowDown className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
                              {Math.abs(kw.change)}
                            </span>
                          </td>
                          <td className="p-3 text-center font-mono text-xs">{kw.volume.toLocaleString()}</td>
                          <td className="p-3 text-center">
                            <DifficultyBadge difficulty={kw.difficulty} />
                          </td>
                          <td className="p-3 text-center text-xs">€{kw.cpc.toFixed(2)}</td>
                          <td className="p-3 text-center">
                            <IntentBadge intent={kw.intent} />
                          </td>
                          <td className="p-3">
                            <Sparkline data={kw.trend} />
                          </td>
                          <td className="p-3 text-xs text-muted-foreground truncate max-w-[120px]">{kw.url}</td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Keyword Detail Panel */}
            <AnimatePresence>
              {selectedKeyword && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                  <Card className="border-primary/20">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Crosshair className="h-4 w-4 text-primary" /> {selectedKeyword.keyword}
                        </CardTitle>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setSelectedKeyword(null)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="pb-4">
                      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                        <div className="text-center p-3 rounded-lg bg-muted/50">
                          <p className="text-2xl font-bold text-primary">{selectedKeyword.position}</p>
                          <p className="text-[10px] text-muted-foreground">Position actuelle</p>
                        </div>
                        <div className="text-center p-3 rounded-lg bg-muted/50">
                          <p className="text-2xl font-bold">{selectedKeyword.volume.toLocaleString()}</p>
                          <p className="text-[10px] text-muted-foreground">Volume mensuel</p>
                        </div>
                        <div className="text-center p-3 rounded-lg bg-muted/50">
                          <DifficultyBadge difficulty={selectedKeyword.difficulty} showLabel />
                          <p className="text-[10px] text-muted-foreground mt-1">Difficulté</p>
                        </div>
                        <div className="text-center p-3 rounded-lg bg-muted/50">
                          <p className="text-2xl font-bold">€{selectedKeyword.cpc}</p>
                          <p className="text-[10px] text-muted-foreground">CPC moyen</p>
                        </div>
                        <div className="p-3 rounded-lg bg-muted/50">
                          <p className="text-[10px] text-muted-foreground mb-1">Tendance 12 mois</p>
                          <Sparkline data={selectedKeyword.trend} height={40} />
                        </div>
                      </div>
                      {/* SERP Preview */}
                      <div className="mt-4 p-4 rounded-lg border bg-card">
                        <p className="text-[10px] text-muted-foreground mb-2 flex items-center gap-1"><Monitor className="h-3 w-3" /> Aperçu SERP</p>
                        <div className="space-y-1">
                          <p className="text-[#1a0dab] text-base hover:underline cursor-pointer truncate">
                            {selectedKeyword.keyword.charAt(0).toUpperCase() + selectedKeyword.keyword.slice(1)} — ShopOpti
                          </p>
                          <p className="text-[#006621] text-xs">shopopti.io{selectedKeyword.url}</p>
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            Découvrez notre guide complet sur {selectedKeyword.keyword}. Optimisez votre boutique e-commerce avec des outils IA avancés...
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </TabsContent>

          {/* ═══════════════════ CATALOGUE SEO TAB ═══════════════════ */}
          <TabsContent value="products" className="space-y-4">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Rechercher par produit ou SKU..." value={productSearch} onChange={e => setProductSearch(e.target.value)} className="pl-9" />
              </div>
              <div className="flex items-center gap-2">
                <Select value={productFilter} onValueChange={(v: any) => setProductFilter(v)}>
                  <SelectTrigger className="w-[130px] h-9 text-xs"><Filter className="h-3 w-3 mr-1" /><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous</SelectItem>
                    <SelectItem value="critical">Critiques (&lt;50)</SelectItem>
                    <SelectItem value="medium">Moyens (50-79)</SelectItem>
                    <SelectItem value="good">Bons (≥80)</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={productSortBy} onValueChange={(v: any) => setProductSortBy(v)}>
                  <SelectTrigger className="w-[150px] h-9 text-xs"><ArrowUpDown className="h-3 w-3 mr-1" /><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="score_asc">Score croissant</SelectItem>
                    <SelectItem value="score_desc">Score décroissant</SelectItem>
                    <SelectItem value="name">Nom A-Z</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex border rounded-md">
                  <Button variant={viewMode === 'table' ? 'secondary' : 'ghost'} size="icon" className="h-9 w-9 rounded-r-none" onClick={() => setViewMode('table')}>
                    <LayoutList className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant={viewMode === 'grid' ? 'secondary' : 'ghost'} size="icon" className="h-9 w-9 rounded-l-none" onClick={() => setViewMode('grid')}>
                    <LayoutGrid className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <Button variant="outline" className="gap-1.5" onClick={handleBulkOptimize} disabled={bulkOptimizeLoading}>
                  {bulkOptimizeLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Zap className="h-3.5 w-3.5" />}
                  Bulk Optimize
                </Button>
              </div>
            </div>

            {/* Product list */}
            {viewMode === 'table' ? (
              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="border-b bg-muted/50">
                        <tr>
                          <th className="text-left p-3 font-medium w-10">#</th>
                          <th className="text-left p-3 font-medium">Produit</th>
                          <th className="text-center p-3 font-medium">Score SEO</th>
                          <th className="text-center p-3 font-medium">Titre</th>
                          <th className="text-center p-3 font-medium">Description</th>
                          <th className="text-center p-3 font-medium">Images</th>
                          <th className="text-center p-3 font-medium">Global</th>
                          <th className="text-center p-3 font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredProducts.length === 0 && (
                          <tr><td colSpan={8} className="text-center p-12 text-muted-foreground">
                            <Package className="h-12 w-12 mx-auto mb-3 opacity-20" />
                            <p className="font-medium">Aucun produit trouvé</p>
                            <p className="text-xs mt-1">Lancez un audit SEO pour scorer vos produits</p>
                          </td></tr>
                        )}
                        {filteredProducts.map((ps, idx) => (
                          <motion.tr key={ps.id} className="border-b hover:bg-muted/30 transition-colors group"
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.02 }}>
                            <td className="p-3 text-xs text-muted-foreground">{idx + 1}</td>
                            <td className="p-3">
                              <div className="flex items-center gap-3">
                                {ps.product?.image_url ? (
                                  <img src={ps.product.image_url} className="w-10 h-10 rounded-lg object-cover border" alt="" />
                                ) : (
                                  <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                                    <Package className="h-4 w-4 text-muted-foreground" />
                                  </div>
                                )}
                                <div className="min-w-0">
                                  <p className="font-medium text-sm truncate max-w-[220px]">{ps.product?.title ?? '—'}</p>
                                  <p className="text-[11px] text-muted-foreground">{ps.product?.sku || 'Pas de SKU'}</p>
                                </div>
                              </div>
                            </td>
                            <td className="p-3 text-center"><ScoreRing score={ps.seo_score ?? 0} size={40} strokeWidth={3} /></td>
                            <td className="p-3 text-center"><ScorePill score={ps.title_score} /></td>
                            <td className="p-3 text-center"><ScorePill score={ps.description_score} /></td>
                            <td className="p-3 text-center"><ScorePill score={ps.images_score} /></td>
                            <td className="p-3 text-center">
                              <div className="flex items-center gap-2 justify-center">
                                <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
                                  <div className={cn("h-full rounded-full transition-all", getScoreBg(ps.overall_score))} style={{ width: `${ps.overall_score ?? 0}%` }} />
                                </div>
                                <span className="text-xs font-mono">{ps.overall_score ?? 0}</span>
                              </div>
                            </td>
                            <td className="p-3 text-center">
                              <div className="flex items-center gap-1 justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Tooltip><TooltipTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-7 w-7"><Wand2 className="h-3.5 w-3.5" /></Button>
                                </TooltipTrigger><TooltipContent>Optimiser avec IA</TooltipContent></Tooltip>
                                <Tooltip><TooltipTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-7 w-7"><Eye className="h-3.5 w-3.5" /></Button>
                                </TooltipTrigger><TooltipContent>Voir détails</TooltipContent></Tooltip>
                              </div>
                            </td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {filteredProducts.map((ps, idx) => (
                  <motion.div key={ps.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.03 }}>
                    <Card className="group hover:shadow-md transition-all overflow-hidden">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3 mb-3">
                          {ps.product?.image_url ? (
                            <img src={ps.product.image_url} className="w-12 h-12 rounded-lg object-cover border shrink-0" alt="" />
                          ) : (
                            <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center shrink-0">
                              <Package className="h-5 w-5 text-muted-foreground" />
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-sm truncate">{ps.product?.title ?? '—'}</p>
                            <p className="text-[10px] text-muted-foreground">{ps.product?.sku}</p>
                          </div>
                          <ScoreRing score={ps.seo_score ?? 0} size={44} strokeWidth={3} />
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-center">
                          <div className="p-1.5 rounded bg-muted/50">
                            <p className="text-[9px] text-muted-foreground uppercase">Titre</p>
                            <p className={cn("text-xs font-bold", getScoreColor(ps.title_score))}>{ps.title_score ?? '—'}</p>
                          </div>
                          <div className="p-1.5 rounded bg-muted/50">
                            <p className="text-[9px] text-muted-foreground uppercase">Desc</p>
                            <p className={cn("text-xs font-bold", getScoreColor(ps.description_score))}>{ps.description_score ?? '—'}</p>
                          </div>
                          <div className="p-1.5 rounded bg-muted/50">
                            <p className="text-[9px] text-muted-foreground uppercase">Images</p>
                            <p className={cn("text-xs font-bold", getScoreColor(ps.images_score))}>{ps.images_score ?? '—'}</p>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" className="w-full mt-3 gap-1 text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                          <Wand2 className="h-3 w-3" /> Optimiser
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Score summary */}
            {(productScores.length > 0 || true) && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <ScoreSummaryCard icon={<CheckCircle2 className="h-6 w-6" />} count={scoreDistribution.excellent} label="Excellent (≥80)" color="success" />
                <ScoreSummaryCard icon={<TrendingUp className="h-6 w-6" />} count={scoreDistribution.good} label="Bon (60-79)" color="chart-2" />
                <ScoreSummaryCard icon={<AlertTriangle className="h-6 w-6" />} count={scoreDistribution.warning} label="Moyen (40-59)" color="warning" />
                <ScoreSummaryCard icon={<TrendingDown className="h-6 w-6" />} count={scoreDistribution.critical} label="Critique (<40)" color="destructive" />
              </div>
            )}
          </TabsContent>

          {/* ═══════════════════ CONTENT TAB ═══════════════════ */}
          <TabsContent value="content" className="space-y-4">
            <Tabs defaultValue="blog" className="space-y-4">
              <TabsList className="h-9">
                <TabsTrigger value="blog" className="text-xs gap-1"><BookOpen className="h-3 w-3" /> Blog</TabsTrigger>
                <TabsTrigger value="calendar" className="text-xs gap-1"><CalendarDays className="h-3 w-3" /> Calendrier</TabsTrigger>
                <TabsTrigger value="ai-studio" className="text-xs gap-1"><Brain className="h-3 w-3" /> Studio IA</TabsTrigger>
              </TabsList>

              {/* Blog Sub-Tab */}
              <TabsContent value="blog" className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Rechercher un article..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
                  </div>
                  <Button className="gap-2" onClick={() => setShowGenDialog(true)}><Wand2 className="h-4 w-4" /> Générer avec IA</Button>
                </div>

                <div className="grid grid-cols-4 gap-3">
                  <MiniStat label="Total" value={stats.totalPosts} icon={<FileText className="h-3.5 w-3.5" />} />
                  <MiniStat label="Publiés" value={stats.publishedPosts} icon={<Send className="h-3.5 w-3.5" />} />
                  <MiniStat label="Brouillons" value={stats.draftPosts} icon={<PenLine className="h-3.5 w-3.5" />} />
                  <MiniStat label="Générés IA" value={stats.aiGenerated} icon={<Sparkles className="h-3.5 w-3.5" />} />
                </div>

                {isLoading ? (
                  <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
                ) : (
                  <AnimatePresence mode="popLayout">
                    <div className="space-y-2">
                      {filteredPosts.map((post, idx) => (
                        <motion.div key={post.id} layout initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.98 }} transition={{ delay: idx * 0.03 }}>
                          <Card className="hover:shadow-md transition-all group">
                            <CardContent className="py-3 px-4">
                              <div className="flex items-center gap-4">
                                <div className={cn("p-2.5 rounded-xl shrink-0", post.ai_generated ? "bg-primary/10" : "bg-muted")}>
                                  {post.ai_generated ? <Sparkles className="h-4 w-4 text-primary" /> : <PenLine className="h-4 w-4 text-muted-foreground" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <p className="font-semibold text-sm truncate">{post.title}</p>
                                    {post.ai_generated && <Badge className="text-[9px] bg-primary/10 text-primary border-primary/20">IA</Badge>}
                                  </div>
                                  <p className="text-xs text-muted-foreground truncate mt-0.5">{post.excerpt || post.seo_description || 'Pas de description'}</p>
                                  <div className="flex items-center gap-3 mt-1.5">
                                    {post.category && <Badge variant="outline" className="text-[10px]">{post.category}</Badge>}
                                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                      <Calendar className="h-3 w-3" />
                                      {new Date(post.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                                    </span>
                                    {post.views > 0 && <span className="text-[10px] text-muted-foreground flex items-center gap-1"><Eye className="h-3 w-3" /> {post.views}</span>}
                                    {post.tags && post.tags.length > 0 && <span className="text-[10px] text-muted-foreground flex items-center gap-1"><Hash className="h-3 w-3" /> {post.tags.length}</span>}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  <Badge variant={post.status === 'published' ? 'default' : 'outline'} className="text-xs">
                                    {post.status === 'published' ? '✓ Publié' : '📝 Brouillon'}
                                  </Badge>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"><MoreVertical className="h-4 w-4" /></Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-44">
                                      {post.status === 'draft' && <DropdownMenuItem onClick={() => updatePost({ id: post.id, updates: { status: 'published', publish_date: new Date().toISOString() } })} className="gap-2"><Send className="h-3.5 w-3.5" /> Publier</DropdownMenuItem>}
                                      {post.status === 'published' && <DropdownMenuItem onClick={() => updatePost({ id: post.id, updates: { status: 'draft' } })} className="gap-2"><PenLine className="h-3.5 w-3.5" /> Repasser en brouillon</DropdownMenuItem>}
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem onClick={() => deletePost(post.id)} className="gap-2 text-destructive focus:text-destructive"><Trash2 className="h-3.5 w-3.5" /> Supprimer</DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))}
                      {filteredPosts.length === 0 && (
                        <div className="text-center py-16 text-muted-foreground">
                          <BookOpen className="h-14 w-14 mx-auto mb-4 opacity-15" />
                          <p className="font-medium text-base">Aucun article</p>
                          <p className="text-xs mt-1 max-w-sm mx-auto">Créez du contenu SEO de qualité avec l'IA</p>
                          <Button className="mt-4 gap-2" onClick={() => setShowGenDialog(true)}><Wand2 className="h-4 w-4" /> Générer un article</Button>
                        </div>
                      )}
                    </div>
                  </AnimatePresence>
                )}
              </TabsContent>

              {/* Calendar Sub-Tab */}
              <TabsContent value="calendar" className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold">Calendrier éditorial</h3>
                    <p className="text-xs text-muted-foreground">Planifiez et suivez votre stratégie de contenu</p>
                  </div>
                  <Button className="gap-1.5" size="sm"><Plus className="h-3.5 w-3.5" /> Nouveau contenu</Button>
                </div>

                <div className="space-y-2">
                  {MOCK_CONTENT_CALENDAR.map((item, idx) => (
                    <motion.div key={item.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05 }}>
                      <Card className="hover:shadow-sm transition-all">
                        <CardContent className="py-3 px-4 flex items-center gap-4">
                          <div className={cn("w-1 h-12 rounded-full shrink-0",
                            item.priority === 'high' ? 'bg-destructive' : item.priority === 'medium' ? 'bg-warning' : 'bg-muted-foreground/30')} />
                          <div className="p-2 rounded-lg bg-muted shrink-0">
                            {item.type === 'blog' ? <FileText className="h-4 w-4" /> :
                             item.type === 'video' ? <Monitor className="h-4 w-4" /> :
                             item.type === 'newsletter' ? <Send className="h-4 w-4" /> :
                             item.type === 'case_study' ? <FileSearch className="h-4 w-4" /> :
                             <Layers className="h-4 w-4" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{item.title}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                <CalendarDays className="h-3 w-3" />
                                {new Date(item.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                              </span>
                              {item.keywords.map(k => (
                                <Badge key={k} variant="outline" className="text-[9px] h-4 px-1.5">{k}</Badge>
                              ))}
                            </div>
                          </div>
                          <CalendarStatusBadge status={item.status} />
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </TabsContent>

              {/* AI Studio Sub-Tab */}
              <TabsContent value="ai-studio" className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <Card className="border-primary/20 bg-primary/5">
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className="p-3 rounded-xl bg-primary/10"><Brain className="h-6 w-6 text-primary" /></div>
                      <div>
                        <p className="text-2xl font-bold">{stats.aiContentCount}</p>
                        <p className="text-xs text-muted-foreground">Contenus générés</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className="p-3 rounded-xl bg-muted"><Check className="h-6 w-6 text-success" /></div>
                      <div>
                        <p className="text-2xl font-bold">{aiContent.filter((c: any) => c.status === 'applied').length}</p>
                        <p className="text-xs text-muted-foreground">Appliqués</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className="p-3 rounded-xl bg-muted"><Clock className="h-6 w-6 text-warning" /></div>
                      <div>
                        <p className="text-2xl font-bold">{aiContent.filter((c: any) => c.status !== 'applied').length}</p>
                        <p className="text-xs text-muted-foreground">En attente</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2"><Activity className="h-4 w-4" /> Historique de génération</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="border-b bg-muted/50">
                          <tr>
                            <th className="text-left p-3 font-medium">Produit</th>
                            <th className="text-left p-3 font-medium">Type</th>
                            <th className="text-left p-3 font-medium">Contenu</th>
                            <th className="text-center p-3 font-medium">Qualité</th>
                            <th className="text-center p-3 font-medium">Statut</th>
                            <th className="text-left p-3 font-medium">Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {aiContent.length === 0 && (
                            <tr><td colSpan={6} className="text-center p-12 text-muted-foreground">
                              <Brain className="h-12 w-12 mx-auto mb-3 opacity-15" />
                              <p className="font-medium">Aucun contenu IA</p>
                              <Button className="mt-4 gap-2" onClick={() => setShowGenDialog(true)}><Sparkles className="h-4 w-4" /> Commencer</Button>
                            </td></tr>
                          )}
                          {aiContent.map((item: any) => (
                            <tr key={item.id} className="border-b hover:bg-muted/30 transition-colors">
                              <td className="p-3">
                                <p className="font-medium text-sm truncate max-w-[180px]">{(item.products as any)?.title ?? '—'}</p>
                                <p className="text-[10px] text-muted-foreground">{(item.products as any)?.sku}</p>
                              </td>
                              <td className="p-3"><Badge variant="outline" className="capitalize text-[10px]">{item.content_type}</Badge></td>
                              <td className="p-3"><p className="text-xs truncate max-w-[280px] text-muted-foreground">{item.generated_content?.substring(0, 80)}...</p></td>
                              <td className="p-3 text-center">
                                {item.quality_score ? <ScoreRing score={item.quality_score} size={32} strokeWidth={2.5} /> : <span className="text-xs text-muted-foreground">—</span>}
                              </td>
                              <td className="p-3 text-center">
                                <Badge variant={item.status === 'applied' ? 'default' : item.status === 'approved' ? 'secondary' : 'outline'} className="text-[10px]">
                                  {item.status === 'applied' ? '✓ Appliqué' : item.status === 'approved' ? 'Approuvé' : 'Généré'}
                                </Badge>
                              </td>
                              <td className="p-3 text-[11px] text-muted-foreground">
                                {new Date(item.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </TabsContent>

          {/* ═══════════════════ TECHNICAL SEO TAB ═══════════════════ */}
          <TabsContent value="technical" className="space-y-4">
            {/* Technical Score Overview */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <Card className="border-destructive/20">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-destructive/10"><Flame className="h-5 w-5 text-destructive" /></div>
                  <div>
                    <p className="text-2xl font-bold text-destructive">{MOCK_TECHNICAL_ISSUES.filter(i => i.severity === 'critical').length}</p>
                    <p className="text-xs text-muted-foreground">Critiques</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-warning/20">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-warning/10"><AlertTriangle className="h-5 w-5 text-warning" /></div>
                  <div>
                    <p className="text-2xl font-bold text-warning">{MOCK_TECHNICAL_ISSUES.filter(i => i.severity === 'warning').length}</p>
                    <p className="text-xs text-muted-foreground">Avertissements</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-muted"><Lightbulb className="h-5 w-5 text-muted-foreground" /></div>
                  <div>
                    <p className="text-2xl font-bold">{MOCK_TECHNICAL_ISSUES.filter(i => i.severity === 'info').length}</p>
                    <p className="text-xs text-muted-foreground">Infos</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-muted"><Layers className="h-5 w-5" /></div>
                  <div>
                    <p className="text-2xl font-bold">{MOCK_TECHNICAL_ISSUES.reduce((a, i) => a + i.pages, 0)}</p>
                    <p className="text-xs text-muted-foreground">Pages affectées</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Issues List */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm flex items-center gap-2"><FileSearch className="h-4 w-4" /> Problèmes détectés</CardTitle>
                  <Button variant="outline" size="sm" className="gap-1.5"><RefreshCw className="h-3.5 w-3.5" /> Re-scanner</Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {MOCK_TECHNICAL_ISSUES.map((issue, idx) => (
                  <motion.div key={issue.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.04 }}
                    className={cn("p-3 rounded-lg border flex items-start gap-3 hover:bg-muted/30 transition-colors",
                      issue.severity === 'critical' ? 'border-destructive/30 bg-destructive/5' :
                      issue.severity === 'warning' ? 'border-warning/30 bg-warning/5' : 'border-muted')}>
                    <div className={cn("p-1.5 rounded-lg shrink-0 mt-0.5",
                      issue.severity === 'critical' ? 'bg-destructive/10' : issue.severity === 'warning' ? 'bg-warning/10' : 'bg-muted')}>
                      {issue.severity === 'critical' ? <Flame className="h-4 w-4 text-destructive" /> :
                       issue.severity === 'warning' ? <AlertTriangle className="h-4 w-4 text-warning" /> :
                       <Lightbulb className="h-4 w-4 text-muted-foreground" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-sm">{issue.title}</p>
                        <Badge variant="outline" className="text-[9px] uppercase">{issue.category}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{issue.recommendation}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant="secondary" className="text-[10px]">{issue.pages} pages</Badge>
                      <Button variant="outline" size="sm" className="h-7 text-xs gap-1">
                        <Wand2 className="h-3 w-3" /> Fix IA
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </CardContent>
            </Card>

            {/* Core Web Vitals */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2"><Gauge className="h-4 w-4" /> Core Web Vitals</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <WebVitalCard metric="LCP" value="2.4s" status="good" description="Largest Contentful Paint" target="< 2.5s" />
                  <WebVitalCard metric="FID" value="85ms" status="good" description="First Input Delay" target="< 100ms" />
                  <WebVitalCard metric="CLS" value="0.18" status="warning" description="Cumulative Layout Shift" target="< 0.1" />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ═══════════════════ COMPETITORS TAB ═══════════════════ */}
          <TabsContent value="competitors" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold">Analyse concurrentielle</h3>
                <p className="text-xs text-muted-foreground">Comparez votre visibilité SEO avec vos concurrents</p>
              </div>
              <Button variant="outline" size="sm" className="gap-1.5"><Plus className="h-3.5 w-3.5" /> Ajouter concurrent</Button>
            </div>

            <div className="space-y-3">
              {MOCK_COMPETITORS.map((comp, idx) => (
                <motion.div key={comp.domain} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.08 }}>
                  <Card className="hover:shadow-md transition-all">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-muted shrink-0">
                          <Globe className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-sm">{comp.domain}</p>
                            <ExternalLink className="h-3 w-3 text-muted-foreground" />
                          </div>
                          <div className="grid grid-cols-4 gap-4 mt-3">
                            <div>
                              <p className="text-[10px] text-muted-foreground">Visibilité</p>
                              <div className="flex items-center gap-2 mt-1">
                                <Progress value={comp.visibility} className="h-1.5 flex-1" />
                                <span className="text-xs font-bold">{comp.visibility}%</span>
                              </div>
                            </div>
                            <div>
                              <p className="text-[10px] text-muted-foreground">Mots-clés</p>
                              <p className="text-sm font-bold mt-1">{comp.keywords.toLocaleString()}</p>
                            </div>
                            <div>
                              <p className="text-[10px] text-muted-foreground">Trafic estimé</p>
                              <p className="text-sm font-bold mt-1">{(comp.traffic / 1000).toFixed(0)}K</p>
                            </div>
                            <div>
                              <p className="text-[10px] text-muted-foreground">Chevauchement</p>
                              <p className="text-sm font-bold mt-1">{comp.overlap}%</p>
                            </div>
                          </div>
                        </div>
                        <Button variant="outline" size="sm" className="gap-1 shrink-0"><BarChart3 className="h-3.5 w-3.5" /> Analyser</Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Keyword Gap */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2"><Target className="h-4 w-4" /> Keyword Gap — Opportunités manquées</CardTitle>
                <CardDescription className="text-xs">Mots-clés sur lesquels vos concurrents se positionnent mais pas vous</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {[
                    { keyword: 'meilleur outil dropshipping', volume: 5400, competitorPos: 3, yourPos: null },
                    { keyword: 'comparatif plateformes ecommerce', volume: 3800, competitorPos: 7, yourPos: 45 },
                    { keyword: 'gagner argent dropshipping', volume: 9200, competitorPos: 5, yourPos: null },
                    { keyword: 'formation ecommerce gratuite', volume: 4100, competitorPos: 2, yourPos: 67 },
                  ].map((gap, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/30 transition-colors">
                      <SearchIcon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{gap.keyword}</p>
                        <p className="text-[10px] text-muted-foreground">{gap.volume.toLocaleString()} recherches/mois</p>
                      </div>
                      <div className="flex items-center gap-4 shrink-0">
                        <div className="text-center">
                          <p className="text-[9px] text-muted-foreground">Concurrent</p>
                          <p className="text-sm font-bold text-success">#{gap.competitorPos}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-[9px] text-muted-foreground">Vous</p>
                          <p className={cn("text-sm font-bold", gap.yourPos ? 'text-destructive' : 'text-muted-foreground')}>
                            {gap.yourPos ? `#${gap.yourPos}` : '—'}
                          </p>
                        </div>
                        <Button variant="outline" size="sm" className="h-7 text-[10px] gap-1">
                          <Crosshair className="h-3 w-3" /> Cibler
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* ═══════════════════ GENERATE DIALOG ═══════════════════ */}
        <Dialog open={showGenDialog} onOpenChange={setShowGenDialog}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader><DialogTitle className="flex items-center gap-2"><Brain className="h-5 w-5 text-primary" /> Studio de génération IA</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div>
                <Label className="text-xs font-medium">Sujet / Titre *</Label>
                <Input value={topic} onChange={e => setTopic(e.target.value)} placeholder="Comment optimiser ses fiches produits pour le SEO en 2026" className="mt-1" />
              </div>
              <div>
                <Label className="text-xs font-medium">Mots-clés cibles</Label>
                <Input value={keywords} onChange={e => setKeywords(e.target.value)} placeholder="seo, dropshipping, optimisation produit" className="mt-1" />
                <p className="text-[10px] text-muted-foreground mt-1">Séparez par des virgules</p>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs font-medium">Ton</Label>
                  <Select value={tone} onValueChange={setTone}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="professional">Professionnel</SelectItem>
                      <SelectItem value="casual">Décontracté</SelectItem>
                      <SelectItem value="expert">Expert</SelectItem>
                      <SelectItem value="educational">Éducatif</SelectItem>
                      <SelectItem value="persuasive">Persuasif</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs font-medium">Catégorie</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ecommerce">E-commerce</SelectItem>
                      <SelectItem value="seo">SEO</SelectItem>
                      <SelectItem value="dropshipping">Dropshipping</SelectItem>
                      <SelectItem value="marketing">Marketing</SelectItem>
                      <SelectItem value="tutorial">Tutoriel</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs font-medium">Longueur</Label>
                  <Select value={contentLength} onValueChange={setContentLength}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="short">Court (~500)</SelectItem>
                      <SelectItem value="medium">Moyen (~1000)</SelectItem>
                      <SelectItem value="long">Long (~2000)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowGenDialog(false)}>Annuler</Button>
              <Button onClick={handleGenerate} disabled={!topic || isGenerating} className="gap-2">
                {isGenerating ? <><Loader2 className="h-4 w-4 animate-spin" /> Génération...</> : <><Sparkles className="h-4 w-4" /> Générer</>}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </TooltipProvider>
    </ChannablePageWrapper>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────

function KpiCard({ icon, label, value, trend, sub, alert }: { icon: React.ReactNode; label: string; value: number | string; trend?: number; sub?: string; alert?: boolean }) {
  return (
    <Card>
      <CardContent className="pt-4 pb-3">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2 text-muted-foreground text-xs">{icon} {label}</div>
          {trend !== undefined && (
            <span className={cn("text-[10px] font-medium flex items-center gap-0.5",
              trend >= 0 ? 'text-success' : 'text-destructive')}>
              {trend >= 0 ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              {Math.abs(trend)}%
            </span>
          )}
        </div>
        <p className={cn("text-2xl font-bold", alert && "text-destructive")}>{value}</p>
        {sub && <p className="text-[10px] text-muted-foreground mt-0.5">{sub}</p>}
      </CardContent>
    </Card>
  );
}

function KpiMini({ icon, label, value, sub, alert }: { icon: React.ReactNode; label: string; value: number | string; sub?: string; alert?: boolean }) {
  return (
    <Card>
      <CardContent className="pt-4 pb-3">
        <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">{icon} {label}</div>
        <p className={cn("text-2xl font-bold", alert && "text-destructive")}>{value}</p>
        {sub && <p className="text-[10px] text-muted-foreground mt-0.5">{sub}</p>}
      </CardContent>
    </Card>
  );
}

function MiniStat({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl border bg-card">
      <div className="p-2 rounded-lg bg-muted">{icon}</div>
      <div>
        <p className="text-lg font-bold">{value}</p>
        <p className="text-[10px] text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

function MiniLabel({ color, label, value }: { color: string; label: string; value: number }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className={cn("w-2.5 h-2.5 rounded-full", color)} />
      <span className="text-muted-foreground">{label}</span>
      <span className="font-bold ml-auto">{value}</span>
    </div>
  );
}

function ScorePill({ score }: { score: number | null | undefined }) {
  const s = score ?? 0;
  return (
    <span className={cn(
      "inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-bold min-w-[28px]",
      s >= 80 ? "bg-success/10 text-success" :
      s >= 50 ? "bg-warning/10 text-warning" :
      "bg-destructive/10 text-destructive"
    )}>
      {score ?? '—'}
    </span>
  );
}

function ScoreSummaryCard({ icon, count, label, color }: { icon: React.ReactNode; count: number; label: string; color: string }) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        <div className={cn(`text-${color}`)}>{icon}</div>
        <div>
          <p className={cn("text-xl font-bold", `text-${color}`)}>{count}</p>
          <p className="text-[10px] text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function DifficultyBadge({ difficulty, showLabel }: { difficulty: number; showLabel?: boolean }) {
  const color = difficulty >= 70 ? 'text-destructive' : difficulty >= 40 ? 'text-warning' : 'text-success';
  const bg = difficulty >= 70 ? 'bg-destructive/10' : difficulty >= 40 ? 'bg-warning/10' : 'bg-success/10';
  const label = difficulty >= 70 ? 'Difficile' : difficulty >= 40 ? 'Moyen' : 'Facile';
  return (
    <div className="flex flex-col items-center">
      <span className={cn("inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-bold", bg, color)}>
        {difficulty}
      </span>
      {showLabel && <span className={cn("text-[10px] font-medium mt-1", color)}>{label}</span>}
    </div>
  );
}

function IntentBadge({ intent }: { intent: string }) {
  const config: Record<string, { icon: React.ReactNode; color: string }> = {
    informational: { icon: <Lightbulb className="h-3 w-3" />, color: 'bg-primary/10 text-primary' },
    commercial: { icon: <Target className="h-3 w-3" />, color: 'bg-warning/10 text-warning' },
    transactional: { icon: <MousePointer className="h-3 w-3" />, color: 'bg-success/10 text-success' },
    navigational: { icon: <MapPin className="h-3 w-3" />, color: 'bg-muted text-muted-foreground' },
  };
  const c = config[intent] || config.informational;
  return (
    <span className={cn("inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium", c.color)}>
      {c.icon} {intent.charAt(0).toUpperCase()}
    </span>
  );
}

function Sparkline({ data, height = 20 }: { data: number[]; height?: number }) {
  return (
    <ResponsiveContainer width={80} height={height}>
      <LineChart data={data.map((v, i) => ({ v, i }))}>
        <Line type="monotone" dataKey="v" stroke="hsl(var(--primary))" strokeWidth={1.5} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

function CalendarStatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
    scheduled: { label: '📅 Planifié', variant: 'default' },
    in_progress: { label: '✏️ En cours', variant: 'secondary' },
    draft: { label: '📝 Brouillon', variant: 'outline' },
    idea: { label: '💡 Idée', variant: 'outline' },
    published: { label: '✓ Publié', variant: 'default' },
  };
  const c = config[status] || config.idea;
  return <Badge variant={c.variant} className="text-[10px]">{c.label}</Badge>;
}

function ActionCard({ icon, title, description, action, onClick, loading, variant }: {
  icon: React.ReactNode; title: string; description: string; action: string;
  onClick: () => void; loading?: boolean; variant: 'destructive' | 'primary' | 'outline';
}) {
  return (
    <Card className={cn("hover:shadow-md transition-all",
      variant === 'destructive' && 'border-destructive/20',
      variant === 'primary' && 'border-primary/20 bg-primary/5')}>
      <CardContent className="p-4 flex items-center gap-3">
        <div className={cn("p-3 rounded-xl shrink-0",
          variant === 'destructive' ? 'bg-destructive/10 text-destructive' :
          variant === 'primary' ? 'bg-primary/10 text-primary' : 'bg-muted')}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm">{title}</p>
          <p className="text-[10px] text-muted-foreground">{description}</p>
        </div>
        <Button variant={variant === 'primary' ? 'default' : 'outline'} size="sm" className="gap-1 shrink-0" onClick={onClick} disabled={loading}>
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : action}
        </Button>
      </CardContent>
    </Card>
  );
}

function WebVitalCard({ metric, value, status, description, target }: {
  metric: string; value: string; status: 'good' | 'warning' | 'poor'; description: string; target: string;
}) {
  return (
    <div className={cn("p-4 rounded-xl border text-center",
      status === 'good' ? 'border-success/30 bg-success/5' :
      status === 'warning' ? 'border-warning/30 bg-warning/5' :
      'border-destructive/30 bg-destructive/5')}>
      <p className="text-xs text-muted-foreground">{metric}</p>
      <p className={cn("text-2xl font-bold mt-1",
        status === 'good' ? 'text-success' : status === 'warning' ? 'text-warning' : 'text-destructive')}>
        {value}
      </p>
      <p className="text-[10px] text-muted-foreground mt-1">{description}</p>
      <p className="text-[10px] mt-1 font-medium">Cible: {target}</p>
      <Badge variant={status === 'good' ? 'default' : status === 'warning' ? 'secondary' : 'destructive'} className="text-[9px] mt-2">
        {status === 'good' ? '✓ Bon' : status === 'warning' ? '⚠ À améliorer' : '✗ Mauvais'}
      </Badge>
    </div>
  );
}
