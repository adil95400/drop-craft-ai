import { Helmet } from 'react-helmet-async';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BulkVideoGenerator } from '@/components/bulk-content/BulkVideoGenerator';
import { BulkImageGenerator } from '@/components/bulk-content/BulkImageGenerator';
import { BulkJobsMonitor } from '@/components/bulk-content/BulkJobsMonitor';
import { CanvaDesignStudio } from '@/components/bulk-content/CanvaDesignStudio';
import { Video, Images, Activity, Palette } from 'lucide-react';

export default function BulkContentCreationPage() {
  return (
    <>
      <Helmet>
        <title>Génération en Masse - Vidéos & Images IA</title>
        <meta name="description" content="Générez des centaines de vidéos et images pour vos produits en quelques clics avec l'IA" />
      </Helmet>
      <div className="container mx-auto p-6">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">AI Content Creation Suite</h1>
            <p className="text-muted-foreground mt-2">
              Génération en masse de vidéos TikTok, images produits et designs Canva
            </p>
          </div>

          <Tabs defaultValue="videos" className="w-full">
            <TabsList className="grid grid-cols-4 w-full max-w-2xl">
              <TabsTrigger value="videos" className="flex items-center gap-2">
                <Video className="h-4 w-4" />
                Vidéos
              </TabsTrigger>
              <TabsTrigger value="images" className="flex items-center gap-2">
                <Images className="h-4 w-4" />
                Images
              </TabsTrigger>
              <TabsTrigger value="canva" className="flex items-center gap-2">
                <Palette className="h-4 w-4" />
                Design Canva
              </TabsTrigger>
              <TabsTrigger value="jobs" className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Jobs
              </TabsTrigger>
            </TabsList>

            <TabsContent value="videos" className="mt-6">
              <Card className="p-6">
                <BulkVideoGenerator />
              </Card>
            </TabsContent>

            <TabsContent value="images" className="mt-6">
              <Card className="p-6">
                <BulkImageGenerator />
              </Card>
            </TabsContent>

            <TabsContent value="canva" className="mt-6">
              <Card className="p-6">
                <CanvaDesignStudio />
              </Card>
            </TabsContent>

            <TabsContent value="jobs" className="mt-6">
              <Card className="p-6">
                <BulkJobsMonitor />
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
}
