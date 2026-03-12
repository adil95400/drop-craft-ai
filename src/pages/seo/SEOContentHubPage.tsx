import { useState } from 'react';
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { useSEOContentHub } from '@/hooks/useSEOContentHub';
import {
  FileText, Search as SearchIcon, TrendingUp, Sparkles, BarChart3,
  Trash2, Send, PenLine, Loader2, Globe, BookOpen, Zap, Package, AlertTriangle, CheckCircle2
} from 'lucide-react';

export default function SEOContentHubPage() {
  const {
    posts, audits, productScores, aiContent, stats, isLoading,
    generatePost, isGenerating, updatePost, deletePost,
  } = useSEOContentHub();

  const [topic, setTopic] = useState('');
  const [keywords, setKeywords] = useState('');
  const [tone, setTone] = useState('professional');
  const [category, setCategory] = useState('ecommerce');
  const [search, setSearch] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [showGenDialog, setShowGenDialog] = useState(false);

  const filteredPosts = posts.filter(p =>
    p.title.toLowerCase().includes(search.toLowerCase())
  );

  const filteredProducts = productScores.filter(p => {
    if (!productSearch) return true;
    const q = productSearch.toLowerCase();
    return p.product?.title?.toLowerCase().includes(q) || p.product?.sku?.toLowerCase().includes(q);
  });

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

  const getScoreColor = (score: number | null) => {
    const s = score ?? 0;
    if (s >= 80) return 'text-success';
    if (s >= 50) return 'text-warning';
    return 'text-destructive';
  };

  const getScoreBadge = (score: number | null) => {
    const s = score ?? 0;
    if (s >= 80) return <Badge className="bg-success/10 text-success border-success/20">Bon</Badge>;
    if (s >= 50) return <Badge className="bg-warning/10 text-warning border-warning/20">Moyen</Badge>;
    return <Badge variant="destructive">Faible</Badge>;
  };

  return (
    <ChannablePageWrapper
      title="SEO & Content Hub"
      description="Audit SEO produits, génération de contenu IA et optimisation des fiches"
      badge={{ label: 'SEO', icon: SearchIcon }}
    >
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <BarChart3 className="h-3.5 w-3.5" /> Score SEO moyen
            </div>
            <p className="text-2xl font-bold">{stats.avgSeoScore}<span className="text-sm text-muted-foreground">/100</span></p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <Package className="h-3.5 w-3.5" /> Produits scorés
            </div>
            <p className="text-2xl font-bold">{stats.totalProductsScored}</p>
            <p className="text-xs text-muted-foreground">{stats.goodSeoProducts} bons · {stats.lowSeoProducts} faibles</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <FileText className="h-3.5 w-3.5" /> Articles
            </div>
            <p className="text-2xl font-bold">{stats.totalPosts}</p>
            <p className="text-xs text-muted-foreground">{stats.publishedPosts} publiés</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <Sparkles className="h-3.5 w-3.5" /> Contenu IA
            </div>
            <p className="text-2xl font-bold">{stats.aiContentCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <Globe className="h-3.5 w-3.5" /> Audits SEO
            </div>
            <p className="text-2xl font-bold">{stats.totalAudits}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="products" className="space-y-4">
        <TabsList>
          <TabsTrigger value="products"><Package className="h-4 w-4 mr-1" /> Produits SEO ({stats.totalProductsScored})</TabsTrigger>
          <TabsTrigger value="blog"><BookOpen className="h-4 w-4 mr-1" /> Blog ({posts.length})</TabsTrigger>
          <TabsTrigger value="ai-content"><Sparkles className="h-4 w-4 mr-1" /> Contenu IA ({stats.aiContentCount})</TabsTrigger>
          <TabsTrigger value="audits"><BarChart3 className="h-4 w-4 mr-1" /> Audits ({audits.length})</TabsTrigger>
        </TabsList>

        {/* === PRODUCT SEO TAB === */}
        <TabsContent value="products" className="space-y-4">
          <div className="relative max-w-md">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Rechercher par produit ou SKU..." value={productSearch} onChange={e => setProductSearch(e.target.value)} className="pl-9" />
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b bg-muted/50">
                    <tr>
                      <th className="text-left p-3 font-medium">Produit</th>
                      <th className="text-center p-3 font-medium">SEO</th>
                      <th className="text-center p-3 font-medium">Titre</th>
                      <th className="text-center p-3 font-medium">Description</th>
                      <th className="text-center p-3 font-medium">Images</th>
                      <th className="text-center p-3 font-medium">Global</th>
                      <th className="text-center p-3 font-medium">Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.length === 0 && (
                      <tr><td colSpan={7} className="text-center p-8 text-muted-foreground">
                        <Package className="h-10 w-10 mx-auto mb-3 opacity-30" />
                        <p>Aucun score SEO produit</p>
                        <p className="text-xs mt-1">Lancez un audit depuis le module Qualité pour scorer vos produits</p>
                      </td></tr>
                    )}
                    {filteredProducts.map(ps => (
                      <tr key={ps.id} className="border-b hover:bg-muted/30 transition-colors">
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            {ps.product?.image_url && (
                              <img src={ps.product.image_url} className="w-8 h-8 rounded object-cover" alt="" />
                            )}
                            <div>
                              <p className="font-medium truncate max-w-[200px]">{ps.product?.title ?? '—'}</p>
                              <p className="text-xs text-muted-foreground">{ps.product?.sku}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-3 text-center">
                          <span className={`font-mono font-bold ${getScoreColor(ps.seo_score)}`}>{ps.seo_score ?? '—'}</span>
                        </td>
                        <td className="p-3 text-center">
                          <span className={`font-mono ${getScoreColor(ps.title_score)}`}>{ps.title_score ?? '—'}</span>
                        </td>
                        <td className="p-3 text-center">
                          <span className={`font-mono ${getScoreColor(ps.description_score)}`}>{ps.description_score ?? '—'}</span>
                        </td>
                        <td className="p-3 text-center">
                          <span className={`font-mono ${getScoreColor(ps.images_score)}`}>{ps.images_score ?? '—'}</span>
                        </td>
                        <td className="p-3 text-center">
                          <div className="flex items-center gap-2 justify-center">
                            <Progress value={ps.overall_score ?? 0} className="h-2 w-16" />
                            <span className="font-mono text-xs">{ps.overall_score ?? 0}</span>
                          </div>
                        </td>
                        <td className="p-3 text-center">{getScoreBadge(ps.seo_score)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Score distribution */}
          {productScores.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4 flex items-center gap-3">
                  <CheckCircle2 className="h-8 w-8 text-success" />
                  <div>
                    <p className="text-2xl font-bold text-success">{stats.goodSeoProducts}</p>
                    <p className="text-xs text-muted-foreground">Score ≥ 80 — Bien optimisés</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 flex items-center gap-3">
                  <TrendingUp className="h-8 w-8 text-warning" />
                  <div>
                    <p className="text-2xl font-bold text-warning">{stats.totalProductsScored - stats.goodSeoProducts - stats.lowSeoProducts}</p>
                    <p className="text-xs text-muted-foreground">Score 50-79 — À améliorer</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 flex items-center gap-3">
                  <AlertTriangle className="h-8 w-8 text-destructive" />
                  <div>
                    <p className="text-2xl font-bold text-destructive">{stats.lowSeoProducts}</p>
                    <p className="text-xs text-muted-foreground">Score &lt; 50 — Action requise</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* === BLOG TAB === */}
        <TabsContent value="blog" className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Rechercher un article..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Dialog open={showGenDialog} onOpenChange={setShowGenDialog}>
              <DialogTrigger asChild>
                <Button><Sparkles className="h-4 w-4 mr-1" /> Générer avec IA</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Générer un article de blog avec l'IA</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div><Label>Sujet *</Label><Input value={topic} onChange={e => setTopic(e.target.value)} placeholder="Ex: Comment optimiser ses fiches produits pour le SEO" /></div>
                  <div><Label>Mots-clés (séparés par des virgules)</Label><Input value={keywords} onChange={e => setKeywords(e.target.value)} placeholder="seo, dropshipping, optimisation" /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Ton</Label>
                      <Select value={tone} onValueChange={setTone}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="professional">Professionnel</SelectItem>
                          <SelectItem value="casual">Décontracté</SelectItem>
                          <SelectItem value="expert">Expert</SelectItem>
                          <SelectItem value="educational">Éducatif</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Catégorie</Label>
                      <Select value={category} onValueChange={setCategory}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ecommerce">E-commerce</SelectItem>
                          <SelectItem value="seo">SEO</SelectItem>
                          <SelectItem value="dropshipping">Dropshipping</SelectItem>
                          <SelectItem value="marketing">Marketing</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Button onClick={handleGenerate} disabled={!topic || isGenerating} className="w-full">
                    {isGenerating ? <><Loader2 className="h-4 w-4 animate-spin mr-1" /> Génération en cours...</> : <><Zap className="h-4 w-4 mr-1" /> Générer l'article</>}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : (
            <div className="space-y-2">
              {filteredPosts.map(post => (
                <Card key={post.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="py-3 flex items-center gap-4">
                    <div className="p-2 rounded-lg bg-muted">
                      {post.ai_generated ? <Sparkles className="h-4 w-4 text-primary" /> : <PenLine className="h-4 w-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm truncate">{post.title}</p>
                        {post.ai_generated && <Badge variant="secondary" className="text-xs">IA</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{post.excerpt || post.seo_description || 'Pas de description'}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {post.category && <Badge variant="outline" className="text-xs">{post.category}</Badge>}
                        <span className="text-xs text-muted-foreground">{new Date(post.created_at).toLocaleDateString('fr-FR')}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Badge variant={post.status === 'published' ? 'default' : 'outline'}>
                        {post.status === 'published' ? 'Publié' : 'Brouillon'}
                      </Badge>
                      {post.status === 'draft' && (
                        <Button size="icon" variant="ghost" onClick={() => updatePost({ id: post.id, updates: { status: 'published', publish_date: new Date().toISOString() } })}>
                          <Send className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      <Button size="icon" variant="ghost" onClick={() => deletePost(post.id)}>
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {filteredPosts.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>Aucun article</p>
                  <p className="text-xs mt-1">Générez votre premier article avec l'IA</p>
                </div>
              )}
            </div>
          )}
        </TabsContent>

        {/* === AI CONTENT TAB === */}
        <TabsContent value="ai-content" className="space-y-4">
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b bg-muted/50">
                    <tr>
                      <th className="text-left p-3 font-medium">Produit</th>
                      <th className="text-left p-3 font-medium">Type</th>
                      <th className="text-left p-3 font-medium">Contenu généré</th>
                      <th className="text-center p-3 font-medium">Score</th>
                      <th className="text-center p-3 font-medium">Statut</th>
                      <th className="text-left p-3 font-medium">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {aiContent.length === 0 && (
                      <tr><td colSpan={6} className="text-center p-8 text-muted-foreground">
                        <Sparkles className="h-10 w-10 mx-auto mb-3 opacity-30" />
                        <p>Aucun contenu IA généré</p>
                        <p className="text-xs mt-1">Utilisez l'IA pour optimiser vos fiches produits</p>
                      </td></tr>
                    )}
                    {aiContent.map((item: any) => (
                      <tr key={item.id} className="border-b hover:bg-muted/30 transition-colors">
                        <td className="p-3">
                          <p className="font-medium truncate max-w-[180px]">{(item.products as any)?.title ?? '—'}</p>
                          <p className="text-xs text-muted-foreground">{(item.products as any)?.sku}</p>
                        </td>
                        <td className="p-3">
                          <Badge variant="outline" className="capitalize text-xs">{item.content_type}</Badge>
                        </td>
                        <td className="p-3">
                          <p className="text-xs truncate max-w-[300px]">{item.generated_content?.substring(0, 100)}...</p>
                        </td>
                        <td className="p-3 text-center">
                          {item.quality_score ? (
                            <span className={`font-mono font-medium ${getScoreColor(item.quality_score)}`}>{item.quality_score}</span>
                          ) : '—'}
                        </td>
                        <td className="p-3 text-center">
                          <Badge variant={item.status === 'applied' ? 'default' : item.status === 'approved' ? 'secondary' : 'outline'}>
                            {item.status === 'applied' ? 'Appliqué' : item.status === 'approved' ? 'Approuvé' : item.status ?? 'Généré'}
                          </Badge>
                        </td>
                        <td className="p-3 text-xs text-muted-foreground">
                          {new Date(item.created_at).toLocaleDateString('fr-FR')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* === AUDITS TAB === */}
        <TabsContent value="audits" className="space-y-4">
          {audits.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>Aucun audit SEO</p>
              <p className="text-xs mt-1">Lancez un audit depuis le module SEO pour analyser vos pages</p>
            </div>
          ) : (
            <div className="space-y-2">
              {audits.map((audit: any) => (
                <Card key={audit.id}>
                  <CardContent className="py-3 flex items-center gap-4">
                    <div className="p-2 rounded-lg bg-muted">
                      <TrendingUp className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{audit.base_url || `Audit #${audit.id.substring(0, 8)}`}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(audit.created_at).toLocaleDateString('fr-FR')} · Score: {audit.score ?? audit.overall_score ?? 'N/A'}/100
                      </p>
                    </div>
                    <div className="w-24">
                      <Progress value={audit.score ?? audit.overall_score ?? 0} className="h-2" />
                    </div>
                    <Badge variant={audit.status === 'completed' ? 'default' : 'secondary'}>
                      {audit.status === 'completed' ? 'Terminé' : audit.status || 'En cours'}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </ChannablePageWrapper>
  );
}
