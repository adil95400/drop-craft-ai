import { Helmet } from 'react-helmet-async';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BulkVideoGenerator } from '@/components/bulk-content/BulkVideoGenerator';
import { BulkImageGenerator } from '@/components/bulk-content/BulkImageGenerator';
import { BulkTextGenerator } from '@/components/bulk-content/BulkTextGenerator';
import { BulkJobsMonitor } from '@/components/bulk-content/BulkJobsMonitor';
import { CanvaDesignStudio } from '@/components/bulk-content/CanvaDesignStudio';
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';
import { Video, Images, Activity, Palette, Sparkles, FileText } from 'lucide-react';

export default function BulkContentCreationPage() {
  return (
    <>
      <Helmet>
        <title>Génération en Masse | DropShipper</title>
        <meta name="description" content="Générez descriptions, titres SEO, vidéos et images pour vos produits en masse avec l'IA" />
      </Helmet>

      <ChannablePageWrapper
        title="AI Content Creation Suite"
        subtitle="Génération en Masse"
        description="Descriptions, titres SEO, vidéos et images — générés par l'IA pour tout votre catalogue"
        heroImage="ai"
        badge={{ label: 'IA Créative', icon: Sparkles }}
      >
        <Tabs defaultValue="descriptions" className="w-full">
          <TabsList className="grid grid-cols-5 w-full max-w-3xl">
            <TabsTrigger value="descriptions" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Descriptions
            </TabsTrigger>
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
              Design
            </TabsTrigger>
            <TabsTrigger value="jobs" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Jobs
            </TabsTrigger>
          </TabsList>

          <TabsContent value="descriptions" className="mt-6">
            <Card className="p-6">
              <BulkTextGenerator />
            </Card>
          </TabsContent>

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
      </ChannablePageWrapper>
    </>
  );
}
