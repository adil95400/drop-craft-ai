import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Search, TrendingUp, Target, Globe, CheckCircle, AlertTriangle, Plus, Download, RefreshCw, Play, FileText, Wand2, Wrench, ChevronLeft, ChevronRight } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { useSEOAudits, useSEOAuditDetail, useSEOAuditPages, useSEOIssues, useSEOAIGenerate, useSEOFixApply, useSEOExport } from '@/hooks/useSEOAudits';
import { useRealSEO } from '@/hooks/useRealSEO';
import { AddKeywordModal } from '@/components/seo/AddKeywordModal';
import { SEOContentGenerator } from '@/components/seo/SEOContentGenerator';
import { SEORecommendationsCard } from '@/components/seo/SEORecommendationsCard';
import { useToast } from '@/hooks/use-toast';

export default function SEOManagerPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddKeywordModal, setShowAddKeywordModal] = useState(false);
  const [showNewAuditModal, setShowNewAuditModal] = useState(false);
  const [selectedAuditId, setSelectedAuditId] = useState<string | null>(null);
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null);
  const [showIssuesModal, setShowIssuesModal] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [pagesPage, setPagesPage] = useState(1);
  const [pageTypeFilter, setPageTypeFilter] = useState<string>('');
  const [sortOrder, setSortOrder] = useState('score_desc');

  // New audit form
  const [auditMode, setAuditMode] = useState('single_url');
  const [auditUrl, setAuditUrl] = useState('');
  const [auditSitemapUrl, setAuditSitemapUrl] = useState('');
  const [auditMaxUrls, setAuditMaxUrls] = useState(200);

  // AI generate form
  const [aiType, setAiType] = useState('meta_description');
  const [aiLanguage, setAiLanguage] = useState('fr');
  const [aiTone, setAiTone] = useState('professional');
  const [aiKeywords, setAiKeywords] = useState('');

  // Hooks
  const { audits, isLoading: isLoadingAudits, createAudit, isCreating } = useSEOAudits();
  const { audit: selectedAudit } = useSEOAuditDetail(selectedAuditId);
  const { pages, total: totalPages, isLoading: isLoadingPages } = useSEOAuditPages(selectedAuditId, {
    page: pagesPage,
    limit: 50,
    pageType: pageTypeFilter || undefined,
    sort: sortOrder,
  });
  const { issues, isLoading: isLoadingIssues } = useSEOIssues(selectedPageId);
  const { generate: generateAI, isGenerating } = useSEOAIGenerate();
  const { applyFix, isApplying } = useSEOFixApply();
  const { exportAudit, isExporting } = useSEOExport();
  const { keywords, stats, isLoading: isLoadingKeywords, addKeyword, updateKeyword } = useRealSEO();

  const { toast } = useToast();

  const handleCreateAudit = () => {
    if (!auditUrl.trim()) {
      toast({ title: 'URL requise', description: 'Veuillez saisir une URL', variant: 'destructive' });
      return;
    }
    createAudit({
      mode: auditMode,
      base_url: auditUrl,
      sitemap_url: auditSitemapUrl || undefined,
      max_urls: auditMaxUrls,
      page_type_filters: ['product', 'category', 'blog', 'home'],
    });
    setShowNewAuditModal(false);
    setAuditUrl('');
  };

  const handleExport = (auditId: string) => {
    exportAudit({ auditId, format: 'csv' });
  };

  const handleAIGenerate = () => {
    generateAI({
      type: aiType,
      page_id: selectedPageId || undefined,
      language: aiLanguage,
      tone: aiTone,
      keywords: aiKeywords.split(',').map(k => k.trim()).filter(Boolean),
      variants: 3,
    });
    setShowAIModal(false);
  };

  const filteredKeywords = keywords.filter(keyword =>
    keyword.keyword.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPagesCount = Math.ceil(totalPages / 50);

  return (
    <>
      <Helmet>
        <title>SEO Manager Pro - Audit & Optimisation | Drop Craft AI</title>
        <meta name="description" content="Suite SEO professionnelle : audits complets, suivi de mots-clés, génération IA, corrections automatiques." />
      </Helmet>

      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">SEO Manager</h1>
            <p className="text-muted-foreground">
              Audits, mots-clés, génération IA et corrections automatiques
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowAddKeywordModal(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Mot-clé
            </Button>
            <Button onClick={() => setShowNewAuditModal(true)}>
              <Play className="mr-2 h-4 w-4" />
              Nouvel Audit
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Audits</CardTitle>
            </CardHeader>
            <CardContent>
              <span className="text-2xl font-bold">{audits.length}</span>
              <p className="text-xs text-muted-foreground">audits réalisés</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Score Moyen</CardTitle>
            </CardHeader>
            <CardContent>
              <span className="text-2xl font-bold">{Math.round(stats.averageScore)}</span>
              <span className="text-sm text-muted-foreground">/100</span>
              <Progress value={stats.averageScore} className="h-2 mt-2" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Mots-clés</CardTitle>
            </CardHeader>
            <CardContent>
              <span className="text-2xl font-bold">{stats.totalKeywords}</span>
              <p className="text-xs text-muted-foreground">{stats.trackingKeywords} actifs</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Pages Analysées</CardTitle>
            </CardHeader>
            <CardContent>
              <span className="text-2xl font-bold">{stats.totalPages}</span>
              <p className="text-xs text-muted-foreground">pages indexées</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Tabs */}
        <Tabs defaultValue="audits" className="space-y-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="audits">Audits</TabsTrigger>
            <TabsTrigger value="pages">Pages</TabsTrigger>
            <TabsTrigger value="keywords">Mots-clés</TabsTrigger>
            <TabsTrigger value="generator">Générateur IA</TabsTrigger>
            <TabsTrigger value="recommendations">Recommandations</TabsTrigger>
          </TabsList>

          {/* ── Audits Tab ── */}
          <TabsContent value="audits" className="space-y-4">
            {isLoadingAudits ? (
              <Card><CardContent className="py-8 text-center"><RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" /><p>Chargement...</p></CardContent></Card>
            ) : audits.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <Search className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Aucun audit SEO</h3>
                  <p className="text-muted-foreground mb-4">Lancez votre premier audit pour analyser vos pages</p>
                  <Button onClick={() => setShowNewAuditModal(true)}>
                    <Play className="mr-2 h-4 w-4" />Lancer un audit
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {audits.map((audit) => (
                  <Card key={audit.id} className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => setSelectedAuditId(audit.id)}>
                    <CardContent className="flex items-center justify-between p-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Globe className="h-4 w-4 text-muted-foreground" />
                          <span className="font-semibold">{audit.base_url}</span>
                          <Badge variant={
                            audit.status === 'succeeded' ? 'default' :
                            audit.status === 'running' ? 'secondary' :
                            audit.status === 'failed' ? 'destructive' : 'outline'
                          }>
                            {audit.status === 'queued' ? 'En attente' :
                             audit.status === 'running' ? 'En cours' :
                             audit.status === 'succeeded' ? 'Terminé' :
                             audit.status === 'failed' ? 'Échoué' : audit.status}
                          </Badge>
                          <Badge variant="outline">{audit.mode}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {new Date(audit.created_at).toLocaleDateString('fr-FR')} • Max {audit.max_urls} URLs
                          {audit.summary?.avg_score != null && ` • Score: ${audit.summary.avg_score}/100`}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); handleExport(audit.id); }} disabled={isExporting}>
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); setSelectedAuditId(audit.id); }}>
                          <FileText className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* ── Pages Tab ── */}
          <TabsContent value="pages" className="space-y-4">
            {!selectedAuditId ? (
              <Card>
                <CardContent className="text-center py-8">
                  <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Sélectionnez un audit</h3>
                  <p className="text-muted-foreground">Cliquez sur un audit dans l'onglet "Audits" pour voir ses pages</p>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Pages analysées</CardTitle>
                      <CardDescription>{totalPages} pages • Audit: {selectedAudit?.base_url}</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Select value={pageTypeFilter} onValueChange={setPageTypeFilter}>
                        <SelectTrigger className="w-40"><SelectValue placeholder="Type" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Tous</SelectItem>
                          <SelectItem value="product">Produit</SelectItem>
                          <SelectItem value="category">Catégorie</SelectItem>
                          <SelectItem value="blog">Blog</SelectItem>
                          <SelectItem value="home">Accueil</SelectItem>
                          <SelectItem value="cms">CMS</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select value={sortOrder} onValueChange={setSortOrder}>
                        <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="score_desc">Score ↓</SelectItem>
                          <SelectItem value="score_asc">Score ↑</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {isLoadingPages ? (
                    <div className="text-center py-8"><RefreshCw className="h-6 w-6 animate-spin mx-auto" /></div>
                  ) : (
                    <div className="space-y-2">
                      {pages.map((page) => (
                        <div key={page.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{page.url}</p>
                            <div className="flex gap-2 mt-1">
                              {page.page_type && <Badge variant="outline" className="text-xs">{page.page_type}</Badge>}
                              {page.http_status && <Badge variant={page.http_status === 200 ? 'default' : 'destructive'} className="text-xs">{page.http_status}</Badge>}
                              {page.issues_summary?.critical > 0 && <Badge variant="destructive" className="text-xs">{page.issues_summary.critical} critique(s)</Badge>}
                              {page.issues_summary?.major > 0 && <Badge variant="secondary" className="text-xs">{page.issues_summary.major} majeur(s)</Badge>}
                            </div>
                          </div>
                          <div className="flex items-center gap-3 ml-4">
                            <div className="text-right">
                              <div className="text-lg font-bold">{page.score}/100</div>
                            </div>
                            <Button variant="outline" size="sm" onClick={() => { setSelectedPageId(page.id); setShowIssuesModal(true); }}>
                              Issues
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => { setSelectedPageId(page.id); setShowAIModal(true); }}>
                              <Wand2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}

                      {/* Pagination */}
                      {totalPagesCount > 1 && (
                        <div className="flex items-center justify-between pt-4">
                          <Button variant="outline" size="sm" disabled={pagesPage <= 1} onClick={() => setPagesPage(p => p - 1)}>
                            <ChevronLeft className="h-4 w-4 mr-1" />Précédent
                          </Button>
                          <span className="text-sm text-muted-foreground">Page {pagesPage} / {totalPagesCount}</span>
                          <Button variant="outline" size="sm" disabled={pagesPage >= totalPagesCount} onClick={() => setPagesPage(p => p + 1)}>
                            Suivant<ChevronRight className="h-4 w-4 ml-1" />
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* ── Keywords Tab ── */}
          <TabsContent value="keywords" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Suivi des Mots-clés</CardTitle>
                    <CardDescription>{filteredKeywords.length} mots-clés suivis</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Input placeholder="Rechercher..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="max-w-sm" />
                    <Button onClick={() => setShowAddKeywordModal(true)}><Plus className="mr-2 h-4 w-4" />Ajouter</Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {isLoadingKeywords ? (
                  <div className="text-center py-8"><RefreshCw className="h-8 w-8 animate-spin mx-auto" /></div>
                ) : filteredKeywords.length > 0 ? (
                  <div className="space-y-3">
                    {filteredKeywords.map((kw) => (
                      <div key={kw.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <h4 className="font-semibold">{kw.keyword}</h4>
                          <p className="text-sm text-muted-foreground">
                            Volume: {kw.search_volume?.toLocaleString() || 'N/A'}
                            {kw.difficulty_score && ` • Difficulté: ${kw.difficulty_score}/100`}
                          </p>
                          {kw.target_url && <p className="text-xs text-blue-600">{kw.target_url}</p>}
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="text-center">
                            <div className="text-2xl font-bold">#{kw.current_position || '--'}</div>
                            <Badge variant={kw.tracking_active ? 'default' : 'secondary'}>
                              {kw.tracking_active ? 'Actif' : 'Inactif'}
                            </Badge>
                          </div>
                          <Button variant="outline" size="sm" onClick={() => updateKeyword({ id: kw.id, updates: { tracking_active: !kw.tracking_active } })}>
                            {kw.tracking_active ? 'Désactiver' : 'Activer'}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Target className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Aucun mot-clé</h3>
                    <Button onClick={() => setShowAddKeywordModal(true)}><Plus className="mr-2 h-4 w-4" />Ajouter un mot-clé</Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Generator Tab ── */}
          <TabsContent value="generator" className="space-y-4">
            <SEOContentGenerator />
          </TabsContent>

          {/* ── Recommendations Tab ── */}
          <TabsContent value="recommendations" className="space-y-4">
            <SEORecommendationsCard loading={isLoadingAudits} />
          </TabsContent>
        </Tabs>

        {/* ── New Audit Modal ── */}
        <Dialog open={showNewAuditModal} onOpenChange={setShowNewAuditModal}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Nouvel Audit SEO</DialogTitle>
              <DialogDescription>Configurez les paramètres de votre audit</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Mode d'audit</label>
                <Select value={auditMode} onValueChange={setAuditMode}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single_url">URL unique</SelectItem>
                    <SelectItem value="sitemap">Sitemap</SelectItem>
                    <SelectItem value="crawl">Crawl complet</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">URL de base</label>
                <Input placeholder="https://example.com" value={auditUrl} onChange={(e) => setAuditUrl(e.target.value)} />
              </div>
              {auditMode === 'sitemap' && (
                <div>
                  <label className="text-sm font-medium">URL du sitemap</label>
                  <Input placeholder="https://example.com/sitemap.xml" value={auditSitemapUrl} onChange={(e) => setAuditSitemapUrl(e.target.value)} />
                </div>
              )}
              <div>
                <label className="text-sm font-medium">Nombre max d'URLs</label>
                <Input type="number" value={auditMaxUrls} onChange={(e) => setAuditMaxUrls(Number(e.target.value))} min={1} max={10000} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowNewAuditModal(false)}>Annuler</Button>
              <Button onClick={handleCreateAudit} disabled={isCreating}>
                {isCreating ? <><RefreshCw className="mr-2 h-4 w-4 animate-spin" />Lancement...</> : <><Play className="mr-2 h-4 w-4" />Lancer l'audit</>}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ── Issues Modal ── */}
        <Dialog open={showIssuesModal} onOpenChange={setShowIssuesModal}>
          <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Issues SEO</DialogTitle>
              <DialogDescription>Problèmes détectés sur cette page</DialogDescription>
            </DialogHeader>
            {isLoadingIssues ? (
              <div className="text-center py-8"><RefreshCw className="h-6 w-6 animate-spin mx-auto" /></div>
            ) : issues.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-2" />
                <p>Aucune issue détectée</p>
              </div>
            ) : (
              <div className="space-y-3">
                {issues.map((issue) => (
                  <div key={issue.id} className="p-3 border rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={
                        issue.severity === 'critical' ? 'destructive' :
                        issue.severity === 'major' ? 'secondary' : 'outline'
                      }>
                        {issue.severity}
                      </Badge>
                      <span className="font-mono text-xs text-muted-foreground">{issue.code}</span>
                    </div>
                    <p className="font-medium">{issue.message}</p>
                    {issue.recommendation && <p className="text-sm text-muted-foreground mt-1">{issue.recommendation}</p>}
                    {issue.is_fixable && (
                      <div className="mt-2">
                        {issue.fix_actions.map((action: string) => (
                          <Button key={action} variant="outline" size="sm" className="mr-2" disabled={isApplying}
                            onClick={() => applyFix({ action, page_id: selectedPageId || undefined })}>
                            <Wrench className="mr-1 h-3 w-3" />{action.replace('_', ' ')}
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* ── AI Generate Modal ── */}
        <Dialog open={showAIModal} onOpenChange={setShowAIModal}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Générer du contenu SEO (IA)</DialogTitle>
              <DialogDescription>Génération automatique via intelligence artificielle</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Type de contenu</label>
                <Select value={aiType} onValueChange={setAiType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="meta_description">Meta Description</SelectItem>
                    <SelectItem value="title">Title</SelectItem>
                    <SelectItem value="h1">H1</SelectItem>
                    <SelectItem value="alt_text">Alt Text</SelectItem>
                    <SelectItem value="faq">FAQ</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Langue</label>
                <Select value={aiLanguage} onValueChange={setAiLanguage}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fr">Français</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Español</SelectItem>
                    <SelectItem value="de">Deutsch</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Ton</label>
                <Select value={aiTone} onValueChange={setAiTone}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="professional">Professionnel</SelectItem>
                    <SelectItem value="casual">Décontracté</SelectItem>
                    <SelectItem value="persuasive">Persuasif</SelectItem>
                    <SelectItem value="informative">Informatif</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Mots-clés (séparés par des virgules)</label>
                <Input placeholder="chaussure, cuir, artisanal" value={aiKeywords} onChange={(e) => setAiKeywords(e.target.value)} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAIModal(false)}>Annuler</Button>
              <Button onClick={handleAIGenerate} disabled={isGenerating}>
                {isGenerating ? <><RefreshCw className="mr-2 h-4 w-4 animate-spin" />Génération...</> : <><Wand2 className="mr-2 h-4 w-4" />Générer</>}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Keywords Modal */}
        <AddKeywordModal open={showAddKeywordModal} onOpenChange={setShowAddKeywordModal} />
      </div>
    </>
  );
}
