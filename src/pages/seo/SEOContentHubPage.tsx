/**
 * SEO & Content Hub — Ultra Pro
 * Enterprise-level content management: AI generation studio, bulk optimization,
 * content calendar, performance analytics, and SEO health dashboard.
 */
import { useState, useMemo } from 'react';
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import {
  FileText, Search as SearchIcon, TrendingUp, Sparkles, BarChart3,
  Trash2, Send, PenLine, Loader2, Globe, BookOpen, Zap, Package,
  AlertTriangle, CheckCircle2, Eye, Copy, MoreVertical, Calendar,
  Target, Wand2, RefreshCw, ArrowUpDown, ChevronDown, ChevronRight,
  ExternalLink, Clock, Star, Filter, Download, Upload,
  Lightbulb, Brain, Gauge, Shield, TrendingDown, Activity,
  LayoutGrid, LayoutList, Pencil, Check, X, Hash
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

// ─── Main Component ─────────────────────────────────────────────────
export default function SEOContentHubPage() {
  const { user } = useAuth();
  const {
    posts, audits, productScores, aiContent, stats, isLoading,
    generatePost, isGenerating, updatePost, deletePost,
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
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null);
  const [bulkOptimizeLoading, setBulkOptimizeLoading] = useState(false);

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

  const filteredPosts = posts.filter(p =>
    p.title.toLowerCase().includes(search.toLowerCase())
  );

  const handleGenerate = () => {
    if (!topic) return;
    generatePost({
      topic,
      keywords: keywords.split(',').map(k => k.trim()).filter(Boolean),
      tone,
      category,
    });
    setTopic('');
    setKeywords('');
    setShowGenDialog(false);
  };

  const handleBulkOptimize = async () => {
    const lowProducts = productScores.filter(p => (p.seo_score ?? 0) < 50);
    if (lowProducts.length === 0) {
      toast.info('Tous vos produits ont un score SEO acceptable');
      return;
    }
    setBulkOptimizeLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('seo-bulk-optimize', {
        body: { product_ids: lowProducts.slice(0, 10).map(p => p.product_id) },
      });
      if (error) throw error;
      toast.success(`${lowProducts.slice(0, 10).length} produits envoyés pour optimisation IA`);
    } catch (e: any) {
      toast.error(`Erreur: ${e.message}`);
    } finally {
      setBulkOptimizeLoading(false);
    }
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

  return (
    <ChannablePageWrapper
      title="SEO & Content Hub"
      description="Centre de commande SEO — Audit, génération IA, optimisation en masse et performance contenu"
      badge={{ label: 'Ultra Pro', icon: Brain }}
    >
      <TooltipProvider>
        {/* ═══════════════════ HERO KPI DASHBOARD ═══════════════════ */}
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 mb-6">
          {/* Score Ring */}
          <Card className="col-span-2 lg:col-span-1">
            <CardContent className="pt-4 pb-3 flex flex-col items-center">
              <ScoreRing score={stats.avgSeoScore} size={80} label="SEO" />
              <p className="text-xs text-muted-foreground mt-2">Score moyen</p>
              <Badge variant="outline" className={cn("text-[10px] mt-1", getScoreColor(stats.avgSeoScore))}>
                {getScoreLabel(stats.avgSeoScore)}
              </Badge>
            </CardContent>
          </Card>

          {/* Distribution Bar */}
          <Card className="col-span-2 lg:col-span-2">
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-2">
                <Gauge className="h-3.5 w-3.5" /> Distribution SEO
              </div>
              <div className="flex h-3 rounded-full overflow-hidden bg-muted mb-2">
                {scoreDistribution.excellent > 0 && (
                  <div className="bg-success transition-all" style={{ width: `${(scoreDistribution.excellent / scoreDistribution.total) * 100}%` }} />
                )}
                {scoreDistribution.good > 0 && (
                  <div className="bg-chart-2 transition-all" style={{ width: `${(scoreDistribution.good / scoreDistribution.total) * 100}%` }} />
                )}
                {scoreDistribution.warning > 0 && (
                  <div className="bg-warning transition-all" style={{ width: `${(scoreDistribution.warning / scoreDistribution.total) * 100}%` }} />
                )}
                {scoreDistribution.critical > 0 && (
                  <div className="bg-destructive transition-all" style={{ width: `${(scoreDistribution.critical / scoreDistribution.total) * 100}%` }} />
                )}
              </div>
              <div className="flex items-center gap-3 text-[10px]">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-success" /> {scoreDistribution.excellent} Excellent</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-chart-2" /> {scoreDistribution.good} Bon</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-warning" /> {scoreDistribution.warning} Moyen</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-destructive" /> {scoreDistribution.critical} Critique</span>
              </div>
            </CardContent>
          </Card>

          <KpiMini icon={<Package className="h-3.5 w-3.5" />} label="Produits scorés" value={stats.totalProductsScored} sub={`${stats.lowSeoProducts} à corriger`} alert={stats.lowSeoProducts > 5} />
          <KpiMini icon={<FileText className="h-3.5 w-3.5" />} label="Articles blog" value={stats.totalPosts} sub={`${stats.publishedPosts} publiés`} />
          <KpiMini icon={<Sparkles className="h-3.5 w-3.5" />} label="Contenu IA" value={stats.aiContentCount} sub={`${stats.totalAudits} audits`} />
        </div>

        {/* ═══════════════════ ACTION BAR ═══════════════════ */}
        <div className="flex flex-wrap items-center gap-2 mb-6">
          <Button className="gap-2" onClick={() => setShowGenDialog(true)}>
            <Wand2 className="h-4 w-4" /> Générer du contenu IA
          </Button>
          <Button variant="outline" className="gap-2" onClick={handleBulkOptimize} disabled={bulkOptimizeLoading}>
            {bulkOptimizeLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
            Optimiser en masse ({stats.lowSeoProducts})
          </Button>
          <Button variant="outline" className="gap-2" size="sm">
            <RefreshCw className="h-3.5 w-3.5" /> Relancer audit
          </Button>
        </div>

        {/* ═══════════════════ TABS ═══════════════════ */}
        <Tabs defaultValue="products" className="space-y-4">
          <TabsList className="h-10">
            <TabsTrigger value="products" className="gap-1.5"><Package className="h-3.5 w-3.5" /> Catalogue SEO</TabsTrigger>
            <TabsTrigger value="blog" className="gap-1.5"><BookOpen className="h-3.5 w-3.5" /> Blog & Articles</TabsTrigger>
            <TabsTrigger value="ai-studio" className="gap-1.5"><Brain className="h-3.5 w-3.5" /> Studio IA</TabsTrigger>
            <TabsTrigger value="audits" className="gap-1.5"><Shield className="h-3.5 w-3.5" /> Audits</TabsTrigger>
          </TabsList>

          {/* ═══════ PRODUCT SEO TAB ═══════ */}
          <TabsContent value="products" className="space-y-4">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Rechercher par produit ou SKU..." value={productSearch} onChange={e => setProductSearch(e.target.value)} className="pl-9" />
              </div>
              <div className="flex items-center gap-2">
                <Select value={productFilter} onValueChange={(v: any) => setProductFilter(v)}>
                  <SelectTrigger className="w-[130px] h-9 text-xs">
                    <Filter className="h-3 w-3 mr-1" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous</SelectItem>
                    <SelectItem value="critical">Critiques (&lt;50)</SelectItem>
                    <SelectItem value="medium">Moyens (50-79)</SelectItem>
                    <SelectItem value="good">Bons (≥80)</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={productSortBy} onValueChange={(v: any) => setProductSortBy(v)}>
                  <SelectTrigger className="w-[150px] h-9 text-xs">
                    <ArrowUpDown className="h-3 w-3 mr-1" />
                    <SelectValue />
                  </SelectTrigger>
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
                            <p className="text-xs mt-1">Lancez un audit SEO depuis le module Qualité pour scorer vos produits</p>
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
                            <td className="p-3 text-center">
                              <ScoreRing score={ps.seo_score ?? 0} size={40} strokeWidth={3} />
                            </td>
                            <td className="p-3 text-center">
                              <ScorePill score={ps.title_score} />
                            </td>
                            <td className="p-3 text-center">
                              <ScorePill score={ps.description_score} />
                            </td>
                            <td className="p-3 text-center">
                              <ScorePill score={ps.images_score} />
                            </td>
                            <td className="p-3 text-center">
                              <div className="flex items-center gap-2 justify-center">
                                <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
                                  <div className={cn("h-full rounded-full transition-all", getScoreBg(ps.overall_score))}
                                    style={{ width: `${ps.overall_score ?? 0}%` }} />
                                </div>
                                <span className="text-xs font-mono">{ps.overall_score ?? 0}</span>
                              </div>
                            </td>
                            <td className="p-3 text-center">
                              <div className="flex items-center gap-1 justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-7 w-7">
                                      <Wand2 className="h-3.5 w-3.5" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Optimiser avec IA</TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-7 w-7">
                                      <Eye className="h-3.5 w-3.5" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Voir détails</TooltipContent>
                                </Tooltip>
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
              /* Grid view */
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

            {/* Score summary cards */}
            {productScores.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <ScoreSummaryCard icon={<CheckCircle2 className="h-6 w-6" />} count={scoreDistribution.excellent} label="Excellent (≥80)" color="success" />
                <ScoreSummaryCard icon={<TrendingUp className="h-6 w-6" />} count={scoreDistribution.good} label="Bon (60-79)" color="chart-2" />
                <ScoreSummaryCard icon={<AlertTriangle className="h-6 w-6" />} count={scoreDistribution.warning} label="Moyen (40-59)" color="warning" />
                <ScoreSummaryCard icon={<TrendingDown className="h-6 w-6" />} count={scoreDistribution.critical} label="Critique (<40)" color="destructive" />
              </div>
            )}
          </TabsContent>

          {/* ═══════ BLOG TAB ═══════ */}
          <TabsContent value="blog" className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Rechercher un article..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
              </div>
              <div className="flex gap-2">
                <Dialog open={showGenDialog} onOpenChange={setShowGenDialog}>
                  <DialogTrigger asChild>
                    <Button className="gap-2"><Wand2 className="h-4 w-4" /> Générer avec IA</Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-lg">
                    <DialogHeader><DialogTitle className="flex items-center gap-2"><Brain className="h-5 w-5 text-primary" /> Studio de génération IA</DialogTitle></DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label className="text-xs font-medium">Sujet / Titre *</Label>
                        <Input value={topic} onChange={e => setTopic(e.target.value)} placeholder="Comment optimiser ses fiches produits pour le SEO en 2026" className="mt-1" />
                      </div>
                      <div>
                        <Label className="text-xs font-medium">Mots-clés cibles</Label>
                        <Input value={keywords} onChange={e => setKeywords(e.target.value)} placeholder="seo, dropshipping, optimisation produit, e-commerce" className="mt-1" />
                        <p className="text-[10px] text-muted-foreground mt-1">Séparez par des virgules — ces mots-clés seront intégrés naturellement dans le contenu</p>
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
                              <SelectItem value="news">Actualités</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-xs font-medium">Longueur</Label>
                          <Select value={contentLength} onValueChange={setContentLength}>
                            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="short">Court (~500 mots)</SelectItem>
                              <SelectItem value="medium">Moyen (~1000 mots)</SelectItem>
                              <SelectItem value="long">Long (~2000 mots)</SelectItem>
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
              </div>
            </div>

            {/* Blog stats */}
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
                              <p className="text-xs text-muted-foreground truncate mt-0.5">
                                {post.excerpt || post.seo_description || 'Pas de description'}
                              </p>
                              <div className="flex items-center gap-3 mt-1.5">
                                {post.category && <Badge variant="outline" className="text-[10px]">{post.category}</Badge>}
                                <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {new Date(post.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                                </span>
                                {post.views > 0 && (
                                  <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                    <Eye className="h-3 w-3" /> {post.views}
                                  </span>
                                )}
                                {post.tags && post.tags.length > 0 && (
                                  <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                    <Hash className="h-3 w-3" /> {post.tags.length} tags
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <Badge variant={post.status === 'published' ? 'default' : 'outline'} className="text-xs">
                                {post.status === 'published' ? '✓ Publié' : '📝 Brouillon'}
                              </Badge>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-44">
                                  {post.status === 'draft' && (
                                    <DropdownMenuItem onClick={() => updatePost({ id: post.id, updates: { status: 'published', publish_date: new Date().toISOString() } })} className="gap-2">
                                      <Send className="h-3.5 w-3.5" /> Publier
                                    </DropdownMenuItem>
                                  )}
                                  {post.status === 'published' && (
                                    <DropdownMenuItem onClick={() => updatePost({ id: post.id, updates: { status: 'draft' } })} className="gap-2">
                                      <PenLine className="h-3.5 w-3.5" /> Repasser en brouillon
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => deletePost(post.id)} className="gap-2 text-destructive focus:text-destructive">
                                    <Trash2 className="h-3.5 w-3.5" /> Supprimer
                                  </DropdownMenuItem>
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
                      <p className="font-medium text-base">Aucun article de blog</p>
                      <p className="text-xs mt-1 max-w-sm mx-auto">Créez du contenu SEO de qualité avec notre studio IA pour booster votre trafic organique</p>
                      <Button className="mt-4 gap-2" onClick={() => setShowGenDialog(true)}>
                        <Wand2 className="h-4 w-4" /> Générer mon premier article
                      </Button>
                    </div>
                  )}
                </div>
              </AnimatePresence>
            )}
          </TabsContent>

          {/* ═══════ AI STUDIO TAB ═══════ */}
          <TabsContent value="ai-studio" className="space-y-4">
            {/* AI Stats */}
            <div className="grid grid-cols-3 gap-3">
              <Card className="border-primary/20 bg-primary/5">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-primary/10">
                    <Brain className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.aiContentCount}</p>
                    <p className="text-xs text-muted-foreground">Contenus générés</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-muted">
                    <Check className="h-6 w-6 text-success" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{aiContent.filter((c: any) => c.status === 'applied').length}</p>
                    <p className="text-xs text-muted-foreground">Appliqués</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-muted">
                    <Clock className="h-6 w-6 text-warning" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{aiContent.filter((c: any) => c.status !== 'applied').length}</p>
                    <p className="text-xs text-muted-foreground">En attente</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* AI Content Table */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Activity className="h-4 w-4" /> Historique de génération
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b bg-muted/50">
                      <tr>
                        <th className="text-left p-3 font-medium">Produit</th>
                        <th className="text-left p-3 font-medium">Type</th>
                        <th className="text-left p-3 font-medium">Contenu généré</th>
                        <th className="text-center p-3 font-medium">Qualité</th>
                        <th className="text-center p-3 font-medium">Statut</th>
                        <th className="text-left p-3 font-medium">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {aiContent.length === 0 && (
                        <tr><td colSpan={6} className="text-center p-12 text-muted-foreground">
                          <Brain className="h-12 w-12 mx-auto mb-3 opacity-15" />
                          <p className="font-medium">Aucun contenu IA généré</p>
                          <p className="text-xs mt-1">Utilisez le studio IA pour optimiser vos fiches produits automatiquement</p>
                          <Button className="mt-4 gap-2" onClick={() => setShowGenDialog(true)}>
                            <Sparkles className="h-4 w-4" /> Commencer
                          </Button>
                        </td></tr>
                      )}
                      {aiContent.map((item: any) => (
                        <tr key={item.id} className="border-b hover:bg-muted/30 transition-colors">
                          <td className="p-3">
                            <p className="font-medium text-sm truncate max-w-[180px]">{(item.products as any)?.title ?? '—'}</p>
                            <p className="text-[10px] text-muted-foreground">{(item.products as any)?.sku}</p>
                          </td>
                          <td className="p-3">
                            <Badge variant="outline" className="capitalize text-[10px]">{item.content_type}</Badge>
                          </td>
                          <td className="p-3">
                            <p className="text-xs truncate max-w-[280px] text-muted-foreground">{item.generated_content?.substring(0, 80)}...</p>
                          </td>
                          <td className="p-3 text-center">
                            {item.quality_score ? (
                              <ScoreRing score={item.quality_score} size={32} strokeWidth={2.5} />
                            ) : <span className="text-xs text-muted-foreground">—</span>}
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

          {/* ═══════ AUDITS TAB ═══════ */}
          <TabsContent value="audits" className="space-y-4">
            {audits.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <Shield className="h-14 w-14 mx-auto mb-4 opacity-15" />
                <p className="font-medium text-base">Aucun audit SEO</p>
                <p className="text-xs mt-1 max-w-sm mx-auto">Lancez un audit complet pour analyser les forces et faiblesses SEO de votre site</p>
                <Button className="mt-4 gap-2" variant="outline">
                  <RefreshCw className="h-4 w-4" /> Lancer un audit
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {audits.map((audit: any, idx: number) => (
                  <motion.div key={audit.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}>
                    <Card className="hover:shadow-md transition-all group">
                      <CardContent className="py-3 px-4 flex items-center gap-4">
                        <ScoreRing score={audit.score ?? audit.overall_score ?? 0} size={48} strokeWidth={3} />
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm">{audit.base_url || `Audit #${audit.id.substring(0, 8)}`}</p>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(audit.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </span>
                            <Badge variant="outline" className={cn("text-[10px]", getScoreColor(audit.score ?? audit.overall_score))}>
                              {getScoreLabel(audit.score ?? audit.overall_score)}
                            </Badge>
                          </div>
                        </div>
                        <Badge variant={audit.status === 'completed' ? 'default' : 'secondary'} className="text-xs">
                          {audit.status === 'completed' ? '✓ Terminé' : audit.status || 'En cours'}
                        </Badge>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </TooltipProvider>
    </ChannablePageWrapper>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────

function KpiMini({ icon, label, value, sub, alert }: { icon: React.ReactNode; label: string; value: number; sub?: string; alert?: boolean }) {
  return (
    <Card>
      <CardContent className="pt-4 pb-3">
        <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
          {icon} {label}
        </div>
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
        <div className={cn("text-" + color)}>{icon}</div>
        <div>
          <p className={cn("text-xl font-bold", "text-" + color)}>{count}</p>
          <p className="text-[10px] text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}
