import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useGlobalBlogOptimization } from '@/hooks/useGlobalBlogOptimization';
import { 
  FileText, 
  Wand2, 
  Calendar, 
  AlertCircle, 
  CheckCircle2, 
  Clock,
  TrendingUp,
  Sparkles
} from 'lucide-react';

export const GlobalBlogOptimizer = () => {
  const {
    auditResults,
    isAuditing,
    isGenerating,
    auditBlogContent,
    generateBlogPost,
    schedulePosts
  } = useGlobalBlogOptimization();

  const [generationConfig, setGenerationConfig] = useState({
    topic: '',
    keywords: '',
    category: 'dropshipping',
    tone: 'professional',
    length: 'medium',
    targetLanguages: ['fr']
  });

  const [scheduleConfig, setScheduleConfig] = useState({
    frequency: 'weekly',
    startDate: new Date().toISOString().split('T')[0],
    timeSlot: '10:00'
  });

  const handleAudit = () => {
    auditBlogContent();
  };

  const handleGenerate = () => {
    generateBlogPost(generationConfig);
  };

  const handleSchedule = () => {
    schedulePosts(scheduleConfig);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'warning': return 'default';
      case 'info': return 'secondary';
      default: return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="h-6 w-6" />
            Optimisation Blog & Contenu
          </h2>
          <p className="text-muted-foreground">
            Auditez, générez et planifiez du contenu blog SEO-optimisé automatiquement
          </p>
        </div>
        <Button onClick={handleAudit} disabled={isAuditing}>
          {isAuditing ? (
            <>
              <Clock className="mr-2 h-4 w-4 animate-spin" />
              Audit en cours...
            </>
          ) : (
            <>
              <FileText className="mr-2 h-4 w-4" />
              Auditer le Blog
            </>
          )}
        </Button>
      </div>

      <Tabs defaultValue="audit" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="audit">Audit</TabsTrigger>
          <TabsTrigger value="generate">Génération IA</TabsTrigger>
          <TabsTrigger value="schedule">Planification</TabsTrigger>
        </TabsList>

        <TabsContent value="audit" className="space-y-4">
          {auditResults && (
            <>
              <div className="grid gap-4 md:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Articles Total</CardTitle>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{auditResults.totalPosts}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Score SEO Moyen</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{auditResults.averageSeoScore}%</div>
                    <Progress value={auditResults.averageSeoScore} className="mt-2" />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Problèmes Critiques</CardTitle>
                    <AlertCircle className="h-4 w-4 text-destructive" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-destructive">
                      {auditResults.issues.filter(i => i.severity === 'critical').length}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Articles Optimisés</CardTitle>
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-500">
                      {auditResults.optimizedPosts}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Articles Analysés</CardTitle>
                  <CardDescription>
                    {auditResults.posts.length} articles trouvés
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {auditResults.posts.map((post) => (
                      <div key={post.id} className="border rounded-lg p-4 space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1 flex-1">
                            <h4 className="font-semibold">{post.title}</h4>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Badge variant={post.status === 'published' ? 'default' : 'secondary'}>
                                {post.status}
                              </Badge>
                              <span>{post.category}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold">{post.seoScore}%</div>
                            <Progress value={post.seoScore} className="w-20 mt-1" />
                          </div>
                        </div>

                        {post.issues.length > 0 && (
                          <div className="space-y-2">
                            {post.issues.map((issue, idx) => (
                              <div key={idx} className="flex items-start gap-2 text-sm">
                                <Badge variant={getSeverityColor(issue.severity)}>
                                  {issue.severity}
                                </Badge>
                                <span>{issue.message}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {auditResults.issues.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Problèmes Globaux Détectés</CardTitle>
                    <CardDescription>
                      {auditResults.issues.length} problèmes nécessitent votre attention
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {auditResults.issues.map((issue, idx) => (
                        <div key={idx} className="flex items-start gap-3 p-3 border rounded-lg">
                          <AlertCircle className={`h-5 w-5 mt-0.5 ${
                            issue.severity === 'critical' ? 'text-destructive' : 'text-yellow-500'
                          }`} />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant={getSeverityColor(issue.severity)}>
                                {issue.severity}
                              </Badge>
                              <span className="font-medium">{issue.type}</span>
                            </div>
                            <p className="text-sm text-muted-foreground">{issue.message}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}

          {!auditResults && !isAuditing && (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Aucun audit lancé</h3>
                  <p className="text-muted-foreground mb-4">
                    Lancez un audit pour analyser tous vos articles de blog
                  </p>
                  <Button onClick={handleAudit}>
                    <FileText className="mr-2 h-4 w-4" />
                    Démarrer l'Audit
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="generate" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wand2 className="h-5 w-5" />
                Génération de Contenu IA
              </CardTitle>
              <CardDescription>
                Créez automatiquement des articles de blog optimisés pour le SEO
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="topic">Sujet de l'article</Label>
                <Input
                  id="topic"
                  placeholder="Ex: Les meilleures stratégies de dropshipping en 2024"
                  value={generationConfig.topic}
                  onChange={(e) => setGenerationConfig({ ...generationConfig, topic: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="keywords">Mots-clés SEO (séparés par des virgules)</Label>
                <Input
                  id="keywords"
                  placeholder="dropshipping, e-commerce, stratégie"
                  value={generationConfig.keywords}
                  onChange={(e) => setGenerationConfig({ ...generationConfig, keywords: e.target.value })}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="category">Catégorie</Label>
                  <Select
                    value={generationConfig.category}
                    onValueChange={(value) => setGenerationConfig({ ...generationConfig, category: value })}
                  >
                    <SelectTrigger id="category">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dropshipping">Dropshipping</SelectItem>
                      <SelectItem value="e-commerce">E-commerce</SelectItem>
                      <SelectItem value="marketing">Marketing</SelectItem>
                      <SelectItem value="seo">SEO</SelectItem>
                      <SelectItem value="guides">Guides</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tone">Ton de l'article</Label>
                  <Select
                    value={generationConfig.tone}
                    onValueChange={(value) => setGenerationConfig({ ...generationConfig, tone: value })}
                  >
                    <SelectTrigger id="tone">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="professional">Professionnel</SelectItem>
                      <SelectItem value="casual">Décontracté</SelectItem>
                      <SelectItem value="expert">Expert</SelectItem>
                      <SelectItem value="beginner">Débutant</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="length">Longueur de l'article</Label>
                <Select
                  value={generationConfig.length}
                  onValueChange={(value) => setGenerationConfig({ ...generationConfig, length: value })}
                >
                  <SelectTrigger id="length">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="short">Court (500-800 mots)</SelectItem>
                    <SelectItem value="medium">Moyen (800-1500 mots)</SelectItem>
                    <SelectItem value="long">Long (1500-2500 mots)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button 
                onClick={handleGenerate} 
                disabled={isGenerating || !generationConfig.topic}
                className="w-full"
              >
                {isGenerating ? (
                  <>
                    <Sparkles className="mr-2 h-4 w-4 animate-spin" />
                    Génération en cours...
                  </>
                ) : (
                  <>
                    <Wand2 className="mr-2 h-4 w-4" />
                    Générer l'Article
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="schedule" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Planification des Publications
              </CardTitle>
              <CardDescription>
                Planifiez automatiquement la publication de vos articles
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="frequency">Fréquence de publication</Label>
                <Select
                  value={scheduleConfig.frequency}
                  onValueChange={(value) => setScheduleConfig({ ...scheduleConfig, frequency: value })}
                >
                  <SelectTrigger id="frequency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Quotidien</SelectItem>
                    <SelectItem value="weekly">Hebdomadaire</SelectItem>
                    <SelectItem value="biweekly">Bi-hebdomadaire</SelectItem>
                    <SelectItem value="monthly">Mensuel</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Date de début</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={scheduleConfig.startDate}
                    onChange={(e) => setScheduleConfig({ ...scheduleConfig, startDate: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timeSlot">Heure de publication</Label>
                  <Input
                    id="timeSlot"
                    type="time"
                    value={scheduleConfig.timeSlot}
                    onChange={(e) => setScheduleConfig({ ...scheduleConfig, timeSlot: e.target.value })}
                  />
                </div>
              </div>

              <Button onClick={handleSchedule} className="w-full">
                <Calendar className="mr-2 h-4 w-4" />
                Planifier les Publications
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
