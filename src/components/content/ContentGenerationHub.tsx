import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { VideoGenerator } from './VideoGenerator';
import { SocialPostsGenerator } from './SocialPostsGenerator';
import { ImageEnhancer } from './ImageEnhancer';
import { BackgroundRemover } from './BackgroundRemover';
import { ProductDescriptionGenerator } from './ProductDescriptionGenerator';
import { SEOTitleGenerator } from './SEOTitleGenerator';
import { AIImageGenerator } from './AIImageGenerator';
import { Video, Share2, Sparkles, Scissors, FileText, Search, Wand2 } from 'lucide-react';

export function ContentGenerationHub() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Génération de Contenu IA</h1>
        <p className="text-muted-foreground mt-2">
          Créez du contenu professionnel en quelques secondes avec l'intelligence artificielle
        </p>
      </div>

      <Tabs defaultValue="descriptions" className="w-full">
        <TabsList className="grid grid-cols-4 lg:grid-cols-7 w-full">
          <TabsTrigger value="descriptions" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Descriptions</span>
          </TabsTrigger>
          <TabsTrigger value="seo" className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            <span className="hidden sm:inline">SEO</span>
          </TabsTrigger>
          <TabsTrigger value="images" className="flex items-center gap-2">
            <Wand2 className="h-4 w-4" />
            <span className="hidden sm:inline">Images IA</span>
          </TabsTrigger>
          <TabsTrigger value="videos" className="flex items-center gap-2">
            <Video className="h-4 w-4" />
            <span className="hidden sm:inline">Vidéos</span>
          </TabsTrigger>
          <TabsTrigger value="social" className="flex items-center gap-2">
            <Share2 className="h-4 w-4" />
            <span className="hidden sm:inline">Social</span>
          </TabsTrigger>
          <TabsTrigger value="enhance" className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            <span className="hidden sm:inline">Améliorer</span>
          </TabsTrigger>
          <TabsTrigger value="background" className="flex items-center gap-2">
            <Scissors className="h-4 w-4" />
            <span className="hidden sm:inline">Fond</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="descriptions" className="mt-6">
          <Card className="p-6">
            <ProductDescriptionGenerator />
          </Card>
        </TabsContent>

        <TabsContent value="seo" className="mt-6">
          <Card className="p-6">
            <SEOTitleGenerator />
          </Card>
        </TabsContent>

        <TabsContent value="images" className="mt-6">
          <Card className="p-6">
            <AIImageGenerator />
          </Card>
        </TabsContent>

        <TabsContent value="videos" className="mt-6">
          <Card className="p-6">
            <VideoGenerator />
          </Card>
        </TabsContent>

        <TabsContent value="social" className="mt-6">
          <Card className="p-6">
            <SocialPostsGenerator />
          </Card>
        </TabsContent>

        <TabsContent value="enhance" className="mt-6">
          <Card className="p-6">
            <ImageEnhancer />
          </Card>
        </TabsContent>

        <TabsContent value="background" className="mt-6">
          <Card className="p-6">
            <BackgroundRemover />
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}