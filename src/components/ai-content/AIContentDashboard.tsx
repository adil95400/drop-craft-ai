import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Sparkles, 
  FileText, 
  CheckCircle2, 
  Clock, 
  Plus,
  Play,
  ThumbsUp,
  ThumbsDown,
  Eye,
  Wand2,
  TrendingUp
} from 'lucide-react';
import { useAIContentTemplates, useGeneratedContent, useAIContentStats, useUpdateContentStatus } from '@/hooks/useAIContent';
import { CreateTemplateDialog } from './CreateTemplateDialog';
import { formatDistanceToNow } from 'date-fns';
import { useDateFnsLocale } from '@/hooks/useDateFnsLocale';

export function AIContentDashboard() {
  const locale = useDateFnsLocale();
  const [activeTab, setActiveTab] = useState('overview');
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const { data: templates = [], isLoading: loadingTemplates } = useAIContentTemplates();
  const { data: generatedContent = [], isLoading: loadingContent } = useGeneratedContent();
  const { data: stats } = useAIContentStats();
  const updateStatus = useUpdateContentStatus();

  const handleApprove = (id: string) => {
    updateStatus.mutate({ id, status: 'approved' });
  };

  const handleReject = (id: string) => {
    updateStatus.mutate({ id, status: 'rejected' });
  };

  const handleApply = (id: string) => {
    updateStatus.mutate({ id, status: 'applied' });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
      draft: { variant: 'secondary', label: 'Brouillon' },
      approved: { variant: 'default', label: 'Approuvé' },
      applied: { variant: 'outline', label: 'Appliqué' },
      rejected: { variant: 'destructive', label: 'Rejeté' }
    };
    const config = variants[status] || variants.draft;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getContentTypeBadge = (type: string) => {
    const labels: Record<string, string> = {
      description: 'Description',
      title: 'Titre',
      seo: 'SEO',
      bullet_points: 'Points clés'
    };
    return <Badge variant="outline">{labels[type] || type}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contenus générés</CardTitle>
            <Sparkles className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalGenerated || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En attente</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.pendingApproval || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Appliqués</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.applied || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Score qualité</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.avgQualityScore ? `${(stats.avgQualityScore * 100).toFixed(0)}%` : '-'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex justify-between items-center">
          <TabsList>
            <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
            <TabsTrigger value="generated">Contenus générés</TabsTrigger>
          </TabsList>

          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nouveau template
          </Button>
        </div>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Templates populaires</CardTitle>
                <CardDescription>Vos templates les plus utilisés</CardDescription>
              </CardHeader>
              <CardContent>
                {templates.slice(0, 5).map((template) => (
                  <div key={template.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div>
                      <p className="font-medium">{template.name}</p>
                      <p className="text-sm text-muted-foreground">{template.content_type}</p>
                    </div>
                    <Badge variant="secondary">{template.usage_count} utilisations</Badge>
                  </div>
                ))}
                {templates.length === 0 && (
                  <p className="text-muted-foreground text-center py-4">Aucun template créé</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Contenus récents</CardTitle>
                <CardDescription>Derniers contenus générés</CardDescription>
              </CardHeader>
              <CardContent>
                {generatedContent.slice(0, 5).map((content) => (
                  <div key={content.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div>
                      <p className="font-medium">{content.product?.name || 'Produit'}</p>
                      <p className="text-sm text-muted-foreground">
{formatDistanceToNow(new Date(content.created_at), { addSuffix: true, locale })}
                      </p>
                    </div>
                    {getStatusBadge(content.status)}
                  </div>
                ))}
                {generatedContent.length === 0 && (
                  <p className="text-muted-foreground text-center py-4">Aucun contenu généré</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="templates">
          <Card>
            <CardHeader>
              <CardTitle>Templates de contenu</CardTitle>
              <CardDescription>Gérez vos templates de génération IA</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Ton</TableHead>
                    <TableHead>Langue</TableHead>
                    <TableHead>Utilisations</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {templates.map((template) => (
                    <TableRow key={template.id}>
                      <TableCell className="font-medium">{template.name}</TableCell>
                      <TableCell>{getContentTypeBadge(template.content_type)}</TableCell>
                      <TableCell className="capitalize">{template.tone}</TableCell>
                      <TableCell>{template.language.toUpperCase()}</TableCell>
                      <TableCell>{template.usage_count}</TableCell>
                      <TableCell>
                        <Badge variant={template.is_active ? 'default' : 'secondary'}>
                          {template.is_active ? 'Actif' : 'Inactif'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">
                          <Wand2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="generated">
          <Card>
            <CardHeader>
              <CardTitle>Contenus générés</CardTitle>
              <CardDescription>Tous les contenus générés par l'IA</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produit</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Qualité</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {generatedContent.map((content) => (
                    <TableRow key={content.id}>
                      <TableCell className="font-medium">
                        {content.product?.name || 'N/A'}
                      </TableCell>
                      <TableCell>{getContentTypeBadge(content.content_type)}</TableCell>
                      <TableCell>
                        {content.quality_score 
                          ? `${(content.quality_score * 100).toFixed(0)}%` 
                          : '-'}
                      </TableCell>
                      <TableCell>{getStatusBadge(content.status)}</TableCell>
                      <TableCell>
                        {formatDistanceToNow(new Date(content.created_at), { addSuffix: true, locale })}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          {content.status === 'draft' && (
                            <>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleApprove(content.id)}
                              >
                                <ThumbsUp className="h-4 w-4 text-green-600" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleReject(content.id)}
                              >
                                <ThumbsDown className="h-4 w-4 text-red-600" />
                              </Button>
                            </>
                          )}
                          {content.status === 'approved' && (
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleApply(content.id)}
                            >
                              <Play className="h-4 w-4 text-blue-600" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <CreateTemplateDialog 
        open={showCreateDialog} 
        onOpenChange={setShowCreateDialog} 
      />
    </div>
  );
}
