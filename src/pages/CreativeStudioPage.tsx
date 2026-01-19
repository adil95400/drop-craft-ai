import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { 
  Palette, 
  Image, 
  Video, 
  Type, 
  Sparkles, 
  Download,
  Share,
  Eye,
  Heart,
  Star,
  Wand2
} from 'lucide-react';
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';

export default function CreativeStudioPage() {
  return (
    <ChannablePageWrapper
      title="Creative Studio"
      description="Créez du contenu visuel professionnel avec l'intelligence artificielle"
      heroImage="marketing"
      badge={{ label: "Studio IA" }}
    >
      <Helmet>
        <title>Creative Studio - Création de Contenu IA</title>
        <meta name="description" content="Studio créatif avec IA pour générer des visuels, vidéos, textes et designs pour vos campagnes marketing." />
      </Helmet>

      <div className="space-y-6">

        <Tabs defaultValue="templates" className="space-y-6">
          <TabsList>
            <TabsTrigger value="templates">Templates</TabsTrigger>
            <TabsTrigger value="generator">Générateur IA</TabsTrigger>
            <TabsTrigger value="gallery">Galerie</TabsTrigger>
            <TabsTrigger value="tools">Outils</TabsTrigger>
          </TabsList>

          <TabsContent value="templates" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  title: 'Post Instagram',
                  type: 'Social Media',
                  size: '1080x1080',
                  preview: '/placeholder.svg',
                  popular: true
                },
                {
                  title: 'Bannière Web',
                  type: 'Marketing',
                  size: '1200x400',
                  preview: '/placeholder.svg',
                  popular: false
                },
                {
                  title: 'Story Facebook',
                  type: 'Social Media',
                  size: '1080x1920',
                  preview: '/placeholder.svg',
                  popular: true
                },
                {
                  title: 'Thumbnail YouTube',
                  type: 'Video',
                  size: '1280x720',
                  preview: '/placeholder.svg',
                  popular: false
                },
                {
                  title: 'Logo Design',
                  type: 'Branding',
                  size: 'Vectoriel',
                  preview: '/placeholder.svg',
                  popular: true
                },
                {
                  title: 'Flyer A4',
                  type: 'Print',
                  size: '210x297mm',
                  preview: '/placeholder.svg',
                  popular: false
                }
              ].map((template, index) => (
                <Card key={index} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="aspect-video bg-muted relative">
                    <img 
                      src={template.preview} 
                      alt={template.title}
                      className="w-full h-full object-cover"
                    />
                    {template.popular && (
                      <Badge className="absolute top-2 right-2 bg-gradient-to-r from-orange-500 to-red-500">
                        Populaire
                      </Badge>
                    )}
                  </div>
                  <CardHeader>
                    <CardTitle className="text-base">{template.title}</CardTitle>
                    <CardDescription>
                      <Badge variant="outline" className="mr-2">{template.type}</Badge>
                      <span className="text-xs text-muted-foreground">{template.size}</span>
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex gap-2">
                      <Button size="sm" className="flex-1">
                        <Eye className="h-3 w-3 mr-1" />
                        Aperçu
                      </Button>
                      <Button variant="outline" size="sm">
                        <Wand2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="generator" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    Générateur IA
                  </CardTitle>
                  <CardDescription>
                    Décrivez votre vision, l'IA crée le contenu
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Type de contenu</label>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {[
                        { icon: Image, label: 'Image' },
                        { icon: Video, label: 'Vidéo' },
                        { icon: Type, label: 'Texte' },
                        { icon: Palette, label: 'Design' }
                      ].map((type, index) => (
                        <Button key={index} variant="outline" className="justify-start">
                          <type.icon className="h-4 w-4 mr-2" />
                          {type.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">Description</label>
                    <Input 
                      placeholder="Ex: Un chat mignon avec des lunettes de soleil sur une plage..."
                      className="mt-2"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Style</label>
                      <select className="w-full mt-1 p-2 border rounded">
                        <option>Réaliste</option>
                        <option>Cartoon</option>
                        <option>Minimaliste</option>
                        <option>Artistique</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Format</label>
                      <select className="w-full mt-1 p-2 border rounded">
                        <option>Carré (1:1)</option>
                        <option>Portrait (4:5)</option>
                        <option>Paysage (16:9)</option>
                        <option>Story (9:16)</option>
                      </select>
                    </div>
                  </div>

                  <Button className="w-full" size="lg">
                    <Sparkles className="h-4 w-4 mr-2" />
                    Générer avec l'IA
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Résultat</CardTitle>
                  <CardDescription>
                    Votre création apparaîtra ici
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="aspect-square bg-muted rounded-lg flex items-center justify-center">
                    <div className="text-center text-muted-foreground">
                      <Sparkles className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>Lancez la génération pour voir le résultat</p>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button variant="outline" disabled>
                      <Download className="h-4 w-4 mr-2" />
                      Télécharger
                    </Button>
                    <Button variant="outline" disabled>
                      <Share className="h-4 w-4 mr-2" />
                      Partager
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="gallery" className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Mes Créations</h3>
              <Button variant="outline">
                <Eye className="h-4 w-4 mr-2" />
                Voir tout
              </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 8 }).map((_, index) => (
                <Card key={index} className="overflow-hidden group">
                  <div className="aspect-square bg-gradient-to-br from-primary/20 to-secondary/20 relative">
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/50 transition-opacity">
                      <div className="flex gap-2">
                        <Button size="sm" variant="secondary">
                          <Eye className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="secondary">
                          <Download className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="secondary">
                          <Share className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  <CardContent className="p-3">
                    <p className="text-sm font-medium truncate">Création {index + 1}</p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-muted-foreground">Il y a 2h</span>
                      <div className="flex items-center gap-1">
                        <Heart className="h-3 w-3 text-red-500" />
                        <span className="text-xs">12</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="tools" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  title: 'Éditeur d\'images',
                  description: 'Retouche et modification avancée',
                  icon: Image,
                  color: 'text-blue-500'
                },
                {
                  title: 'Générateur de palettes',
                  description: 'Créez des palettes de couleurs harmonieuses',
                  icon: Palette,
                  color: 'text-purple-500'
                },
                {
                  title: 'Optimiseur de formats',
                  description: 'Adaptez vos créations aux différentes plateformes',
                  icon: Type,
                  color: 'text-green-500'
                },
                {
                  title: 'Studio vidéo',
                  description: 'Montage et effets vidéo automatisés',
                  icon: Video,
                  color: 'text-red-500'
                },
                {
                  title: 'Générateur de QR codes',
                  description: 'QR codes personnalisés et stylisés',
                  icon: Star,
                  color: 'text-orange-500'
                },
                {
                  title: 'Watermark automatique',
                  description: 'Protection de vos créations',
                  icon: Wand2,
                  color: 'text-indigo-500'
                }
              ].map((tool, index) => (
                <Card key={index} className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <tool.icon className={`h-6 w-6 ${tool.color}`} />
                      {tool.title}
                    </CardTitle>
                    <CardDescription>{tool.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button className="w-full">Ouvrir l'outil</Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </ChannablePageWrapper>
  );
}