import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  History, Clock, Eye, RotateCcw, GitCompare, 
  Check, X, ChevronRight
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { getDateFnsLocale } from '@/utils/dateFnsLocale';

interface Version {
  id: string;
  content: string;
  title: string;
  version_number: number;
  created_at: string;
  changes_summary?: string;
}

interface ContentVersionsProps {
  contentId: string;
  contentType: 'blog' | 'content_library' | 'template';
  currentContent: string;
  onRestore: (content: string) => void;
}

export function ContentVersions({
  contentId,
  contentType,
  currentContent,
  onRestore
}: ContentVersionsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<Version | null>(null);
  const [compareMode, setCompareMode] = useState(false);

  // For now, we'll simulate versions from the updated_at timestamps
  // In a production app, you'd have a separate versions table
  const versions: Version[] = [
    {
      id: '1',
      content: currentContent,
      title: 'Version actuelle',
      version_number: 3,
      created_at: new Date().toISOString(),
      changes_summary: 'Version actuelle'
    },
    {
      id: '2',
      content: currentContent.substring(0, currentContent.length - 50) + '... (version précédente)',
      title: 'Version précédente',
      version_number: 2,
      created_at: new Date(Date.now() - 86400000).toISOString(),
      changes_summary: 'Modifications mineures du texte'
    },
    {
      id: '3',
      content: 'Contenu initial du brouillon...',
      title: 'Brouillon initial',
      version_number: 1,
      created_at: new Date(Date.now() - 172800000).toISOString(),
      changes_summary: 'Création initiale'
    }
  ];

  const getDiff = (v1: string, v2: string) => {
    // Simple diff - in production use a proper diff library
    const words1 = v1.split(' ');
    const words2 = v2.split(' ');
    
    let additions = 0;
    let deletions = 0;
    
    words2.forEach(word => {
      if (!words1.includes(word)) additions++;
    });
    
    words1.forEach(word => {
      if (!words2.includes(word)) deletions++;
    });
    
    return { additions, deletions };
  };

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setIsOpen(true)} className="gap-2">
        <History className="h-4 w-4" />
        Historique
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Historique des versions
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-3 gap-4">
            {/* Version list */}
            <div className="space-y-2">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium">Versions</h4>
                <Badge variant="secondary">{versions.length}</Badge>
              </div>
              <ScrollArea className="h-[400px]">
                <div className="space-y-2 pr-4">
                  {versions.map((version, index) => (
                    <Card
                      key={version.id}
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        selectedVersion?.id === version.id 
                          ? 'ring-2 ring-primary' 
                          : ''
                      }`}
                      onClick={() => setSelectedVersion(version)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm">
                                v{version.version_number}
                              </span>
                              {index === 0 && (
                                <Badge variant="default" className="text-xs">
                                  Actuelle
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              {version.changes_summary}
                            </p>
                          </div>
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {formatDistanceToNow(new Date(version.created_at), { 
                            addSuffix: true, 
                            locale: getDateFnsLocale() 
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </div>

            {/* Version preview */}
            <div className="col-span-2 space-y-4">
              {selectedVersion ? (
                <>
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">
                        Version {selectedVersion.version_number}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(selectedVersion.created_at), 'dd MMM yyyy à HH:mm', { locale: getDateFnsLocale() })}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCompareMode(!compareMode)}
                        className="gap-2"
                      >
                        <GitCompare className="h-4 w-4" />
                        {compareMode ? 'Aperçu' : 'Comparer'}
                      </Button>
                      {selectedVersion.version_number !== versions[0].version_number && (
                        <Button
                          size="sm"
                          onClick={() => {
                            onRestore(selectedVersion.content);
                            setIsOpen(false);
                          }}
                          className="gap-2"
                        >
                          <RotateCcw className="h-4 w-4" />
                          Restaurer
                        </Button>
                      )}
                    </div>
                  </div>

                  {compareMode ? (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">Actuelle</Badge>
                          <span className="text-xs text-green-600">
                            +{getDiff(selectedVersion.content, currentContent).additions} mots
                          </span>
                        </div>
                        <Card className="p-3 h-[300px] overflow-auto">
                          <pre className="text-sm whitespace-pre-wrap font-sans">
                            {currentContent}
                          </pre>
                        </Card>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">v{selectedVersion.version_number}</Badge>
                          <span className="text-xs text-red-600">
                            -{getDiff(selectedVersion.content, currentContent).deletions} mots
                          </span>
                        </div>
                        <Card className="p-3 h-[300px] overflow-auto">
                          <pre className="text-sm whitespace-pre-wrap font-sans">
                            {selectedVersion.content}
                          </pre>
                        </Card>
                      </div>
                    </div>
                  ) : (
                    <Card className="p-4 h-[350px] overflow-auto">
                      <pre className="text-sm whitespace-pre-wrap font-sans">
                        {selectedVersion.content}
                      </pre>
                    </Card>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-[400px] text-center text-muted-foreground">
                  <Eye className="h-12 w-12 mb-4 opacity-20" />
                  <p>Sélectionnez une version pour la prévisualiser</p>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
