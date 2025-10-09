import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { VideoGenerator } from './VideoGenerator';
import { SocialPostsGenerator } from './SocialPostsGenerator';
import { ImageEnhancer } from './ImageEnhancer';
import { BackgroundRemover } from './BackgroundRemover';
import { Video, Share2, Sparkles, Scissors } from 'lucide-react';

export function ContentGenerationHub() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Génération de Contenu Automatique</h1>
        <p className="text-muted-foreground mt-2">
          Créez du contenu professionnel en quelques secondes avec l'IA
        </p>
      </div>

      <Tabs defaultValue="videos" className="w-full">
        <TabsList className="grid grid-cols-4 w-full max-w-2xl">
          <TabsTrigger value="videos" className="flex items-center gap-2">
            <Video className="h-4 w-4" />
            Vidéos
          </TabsTrigger>
          <TabsTrigger value="social" className="flex items-center gap-2">
            <Share2 className="h-4 w-4" />
            Posts Sociaux
          </TabsTrigger>
          <TabsTrigger value="enhance" className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Améliorer Photos
          </TabsTrigger>
          <TabsTrigger value="background" className="flex items-center gap-2">
            <Scissors className="h-4 w-4" />
            Supprimer Fond
          </TabsTrigger>
        </TabsList>

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
