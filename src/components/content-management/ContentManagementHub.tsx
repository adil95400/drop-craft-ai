import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ContentLibrary } from './ContentLibrary';
import { ContentCalendar } from './ContentCalendar';
import { ContentTemplates } from './ContentTemplates';
import { BlogManager } from './BlogManager';
import { 
  Library, Calendar, LayoutTemplate, FileText, Sparkles
} from 'lucide-react';

export function ContentManagementHub() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Sparkles className="h-8 w-8 text-primary" />
          Gestion de Contenu
        </h1>
        <p className="text-muted-foreground mt-2">
          Créez, organisez et planifiez tout votre contenu au même endroit
        </p>
      </div>

      <Tabs defaultValue="library" className="w-full">
        <TabsList className="grid grid-cols-4 w-full max-w-2xl">
          <TabsTrigger value="library" className="flex items-center gap-2">
            <Library className="h-4 w-4" />
            <span className="hidden sm:inline">Bibliothèque</span>
          </TabsTrigger>
          <TabsTrigger value="blog" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Blog</span>
          </TabsTrigger>
          <TabsTrigger value="calendar" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span className="hidden sm:inline">Calendrier</span>
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <LayoutTemplate className="h-4 w-4" />
            <span className="hidden sm:inline">Templates</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="library" className="mt-6">
          <ContentLibrary />
        </TabsContent>

        <TabsContent value="blog" className="mt-6">
          <BlogManager />
        </TabsContent>

        <TabsContent value="calendar" className="mt-6">
          <ContentCalendar />
        </TabsContent>

        <TabsContent value="templates" className="mt-6">
          <ContentTemplates />
        </TabsContent>
      </Tabs>
    </div>
  );
}
