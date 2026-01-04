import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ContentLibrary } from './ContentLibrary';
import { ContentCalendar } from './ContentCalendar';
import { ContentTemplates } from './ContentTemplates';
import { BlogManager } from './BlogManager';
import { ContentImportExport } from './ContentImportExport';
import { 
  Library, Calendar, LayoutTemplate, FileText, Sparkles, Settings
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';

export function ContentManagementHub() {
  const [activeTab, setActiveTab] = useState('library');

  const getContentTypeForExport = () => {
    switch (activeTab) {
      case 'library': return 'library' as const;
      case 'blog': return 'blog' as const;
      case 'templates': return 'templates' as const;
      case 'calendar': return 'calendar' as const;
      default: return 'library' as const;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Sparkles className="h-8 w-8 text-primary" />
            Gestion de Contenu
          </h1>
          <p className="text-muted-foreground mt-2">
            Créez, organisez et planifiez tout votre contenu au même endroit
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ContentImportExport contentType={getContentTypeForExport()} />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <Settings className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Paramètres</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                Préférences de génération IA
              </DropdownMenuItem>
              <DropdownMenuItem>
                Paramètres SEO par défaut
              </DropdownMenuItem>
              <DropdownMenuItem>
                Intégrations de publication
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
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
