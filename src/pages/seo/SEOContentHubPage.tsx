import { useState } from 'react';
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { useSEOContentHub } from '@/hooks/useSEOContentHub';
import {
  FileText, Search as SearchIcon, TrendingUp, Sparkles, BarChart3,
  Eye, Trash2, Send, PenLine, Loader2, Globe, BookOpen, Zap
} from 'lucide-react';

export default function SEOContentHubPage() {
  const {
    posts, audits, stats, isLoading,
    generatePost, isGenerating, updatePost, deletePost,
  } = useSEOContentHub();

  const [topic, setTopic] = useState('');
  const [keywords, setKeywords] = useState('');
  const [tone, setTone] = useState('professional');
  const [category, setCategory] = useState('ecommerce');
  const [search, setSearch] = useState('');
  const [showGenDialog, setShowGenDialog] = useState(false);

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

  return (
    <ChannablePageWrapper
      title="SEO & Content Marketing"
      description="Audit SEO automatisé, générateur de contenu IA et optimisation des fiches produits."
    >
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <FileText className="h-3.5 w-3.5" /> Articles
            </div>
            <p className="text-2xl font-bold">{stats.totalPosts}</p>
            <p className="text-xs text-muted-foreground">{stats.publishedPosts} publiés · {stats.draftPosts} brouillons</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <Sparkles className="h-3.5 w-3.5" /> Générés par IA
            </div>
            <p className="text-2xl font-bold">{stats.aiGenerated}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <BarChart3 className="h-3.5 w-3.5" /> Score SEO Moyen
            </div>
            <p className="text-2xl font-bold">{stats.avgSeoScore}<span className="text-sm text-muted-foreground">/100</span></p>
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

      <Tabs defaultValue="blog" className="space-y-4">
        <TabsList>
          <TabsTrigger value="blog"><BookOpen className="h-4 w-4 mr-1" /> Blog ({posts.length})</TabsTrigger>
          <TabsTrigger value="audits"><BarChart3 className="h-4 w-4 mr-1" /> Audits SEO ({audits.length})</TabsTrigger>
        </TabsList>

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
                      <p className="font-medium text-sm">Audit #{audit.id.substring(0, 8)}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(audit.created_at).toLocaleDateString('fr-FR')} · Score: {audit.overall_score || 'N/A'}
                      </p>
                    </div>
                    <div className="w-24">
                      <Progress value={audit.overall_score || 0} className="h-2" />
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
