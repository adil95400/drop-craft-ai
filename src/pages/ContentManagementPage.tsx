import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Image, Video, Layout, Plus, Eye } from 'lucide-react';

const ContentManagementPage: React.FC = () => {
  const pages = [
    { id: 1, title: 'Accueil', status: 'published', views: 15234, lastModified: '2024-01-15' },
    { id: 2, title: 'À propos', status: 'published', views: 3421, lastModified: '2024-01-10' },
    { id: 3, title: 'Blog - Article 1', status: 'draft', views: 0, lastModified: '2024-01-16' },
  ];

  const media = [
    { id: 1, name: 'banner-hero.jpg', type: 'image', size: '2.4 MB', uploaded: '2024-01-15' },
    { id: 2, name: 'product-demo.mp4', type: 'video', size: '15.8 MB', uploaded: '2024-01-14' },
    { id: 3, name: 'logo.png', type: 'image', size: '156 KB', uploaded: '2024-01-12' },
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Gestion de contenu</h1>
          <p className="text-muted-foreground">
            Créez et gérez le contenu de votre site
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Nouvelle page
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pages publiées</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">3 brouillons</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Articles de blog</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">45</div>
            <p className="text-xs text-muted-foreground">8 ce mois</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Médias</CardTitle>
            <Image className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">234</div>
            <p className="text-xs text-muted-foreground">1.2 GB utilisés</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pages vues</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">23.4K</div>
            <p className="text-xs text-muted-foreground">Ce mois</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="pages" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pages">Pages</TabsTrigger>
          <TabsTrigger value="blog">Blog</TabsTrigger>
          <TabsTrigger value="media">Médiathèque</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="pages" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Vos pages</CardTitle>
              <CardDescription>Gérez les pages de votre site</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pages.map((page) => (
                  <div
                    key={page.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{page.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          Modifié le {page.lastModified}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-sm font-semibold">{page.views.toLocaleString()}</div>
                        <div className="text-xs text-muted-foreground">vues</div>
                      </div>
                      <Badge variant={page.status === 'published' ? 'default' : 'secondary'}>
                        {page.status === 'published' ? 'Publié' : 'Brouillon'}
                      </Badge>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4 mr-1" />
                          Voir
                        </Button>
                        <Button size="sm">Modifier</Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="blog">
          <Card>
            <CardHeader>
              <CardTitle>Articles de blog</CardTitle>
              <CardDescription>Gérez votre contenu éditorial</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Liste des articles de blog...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="media" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Médiathèque</CardTitle>
                  <CardDescription>Vos images, vidéos et fichiers</CardDescription>
                </div>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Uploader
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                {media.map((item) => (
                  <Card key={item.id}>
                    <CardContent className="p-4">
                      <div className="h-32 bg-muted rounded-lg mb-3 flex items-center justify-center">
                        {item.type === 'image' ? (
                          <Image className="h-12 w-12 text-muted-foreground" />
                        ) : (
                          <Video className="h-12 w-12 text-muted-foreground" />
                        )}
                      </div>
                      <h4 className="font-semibold text-sm truncate">{item.name}</h4>
                      <div className="flex justify-between text-xs text-muted-foreground mt-1">
                        <span>{item.size}</span>
                        <span>{item.uploaded}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates">
          <Card>
            <CardHeader>
              <CardTitle>Templates de pages</CardTitle>
              <CardDescription>Modèles prédéfinis pour vos pages</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="cursor-pointer hover:shadow-lg transition-shadow">
                    <CardContent className="p-4">
                      <div className="h-40 bg-muted rounded-lg mb-3 flex items-center justify-center">
                        <Layout className="h-12 w-12 text-muted-foreground" />
                      </div>
                      <h4 className="font-semibold">Template {i}</h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        Template de page moderne
                      </p>
                      <Button className="w-full mt-3" size="sm">
                        Utiliser
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ContentManagementPage;
