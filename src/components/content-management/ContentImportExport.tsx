import { useState, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { 
  Upload, Download, FileJson, FileSpreadsheet, FileText, 
  CheckCircle, XCircle, AlertCircle, File
} from 'lucide-react';
import { toast } from 'sonner';

interface ContentImportExportProps {
  contentType: 'blog' | 'library' | 'templates' | 'calendar';
}

const EXPORT_FORMATS = [
  { value: 'json', label: 'JSON', icon: FileJson },
  { value: 'csv', label: 'CSV', icon: FileSpreadsheet },
  { value: 'markdown', label: 'Markdown', icon: FileText },
];

export function ContentImportExport({ contentType }: ContentImportExportProps) {
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState('json');
  const [exportOptions, setExportOptions] = useState({
    includeMetadata: true,
    includeDrafts: true,
    dateRange: 'all'
  });
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importProgress, setImportProgress] = useState(0);
  const [importResult, setImportResult] = useState<{
    success: number;
    failed: number;
    errors: string[];
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const getTableName = () => {
    switch (contentType) {
      case 'blog': return 'blog_posts';
      case 'library': return 'content_library';
      case 'templates': return 'content_templates';
      case 'calendar': return 'content_calendar';
    }
  };

  const exportMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase
        .from(getTableName())
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      let content: string;
      let filename: string;
      let mimeType: string;
      
      switch (exportFormat) {
        case 'json':
          content = JSON.stringify(data, null, 2);
          filename = `${contentType}_export_${Date.now()}.json`;
          mimeType = 'application/json';
          break;
        case 'csv':
          if (!data || data.length === 0) {
            content = '';
          } else {
            const headers = Object.keys(data[0]).join(',');
            const rows = data.map(row => 
              Object.values(row).map(v => 
                typeof v === 'string' ? `"${v.replace(/"/g, '""')}"` : v
              ).join(',')
            );
            content = [headers, ...rows].join('\n');
          }
          filename = `${contentType}_export_${Date.now()}.csv`;
          mimeType = 'text/csv';
          break;
        case 'markdown':
          content = data.map((item: Record<string, unknown>) => {
            const title = item.title || item.name || 'Sans titre';
            const body = item.content || '';
            return `# ${title}\n\n${body}\n\n---\n`;
          }).join('\n');
          filename = `${contentType}_export_${Date.now()}.md`;
          mimeType = 'text/markdown';
          break;
        default:
          throw new Error('Format non supporté');
      }
      
      // Download file
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      return data.length;
    },
    onSuccess: (count) => {
      toast.success(`${count} éléments exportés`);
      setIsExportOpen(false);
    },
    onError: () => {
      toast.error('Erreur lors de l\'export');
    }
  });

  const importMutation = useMutation({
    mutationFn: async (file: File) => {
      setImportProgress(10);
      const text = await file.text();
      setImportProgress(30);
      
      let items: Record<string, unknown>[];
      
      if (file.name.endsWith('.json')) {
        items = JSON.parse(text);
        if (!Array.isArray(items)) items = [items];
      } else if (file.name.endsWith('.csv')) {
        const lines = text.split('\n');
        const headers = lines[0].split(',');
        items = lines.slice(1).filter(l => l.trim()).map(line => {
          const values = line.split(',');
          return headers.reduce((obj, header, i) => {
            obj[header.trim()] = values[i]?.replace(/^"|"$/g, '') || '';
            return obj;
          }, {} as Record<string, unknown>);
        });
      } else {
        throw new Error('Format non supporté');
      }
      
      setImportProgress(50);
      
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Non authentifié');
      
      let success = 0;
      let failed = 0;
      const errors: string[] = [];
      
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        // Remove id and user_id to create new entries
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { id: _id, user_id: _userId, ...cleanItem } = item as Record<string, unknown>;
        
        const insertData = {
          ...cleanItem,
          user_id: userData.user.id
        };
        
        const { error } = await supabase
          .from(getTableName())
          .insert(insertData as never);
        
        if (error) {
          failed++;
          errors.push(`Ligne ${i + 1}: ${error.message}`);
        } else {
          success++;
        }
        
        setImportProgress(50 + ((i + 1) / items.length) * 50);
      }
      
      return { success, failed, errors };
    },
    onSuccess: (result) => {
      setImportResult(result);
      queryClient.invalidateQueries({ queryKey: [getTableName().replace('_', '-')] });
      if (result.failed === 0) {
        toast.success(`${result.success} éléments importés`);
      } else {
        toast.warning(`${result.success} importés, ${result.failed} échecs`);
      }
    },
    onError: (error) => {
      toast.error('Erreur lors de l\'import');
      setImportResult({
        success: 0,
        failed: 1,
        errors: [error.message]
      });
    }
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImportFile(file);
      setImportResult(null);
      setImportProgress(0);
    }
  };

  const handleImport = () => {
    if (importFile) {
      importMutation.mutate(importFile);
    }
  };

  return (
    <>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => setIsExportOpen(true)} className="gap-2">
          <Download className="h-4 w-4" />
          Exporter
        </Button>
        <Button variant="outline" size="sm" onClick={() => setIsImportOpen(true)} className="gap-2">
          <Upload className="h-4 w-4" />
          Importer
        </Button>
      </div>

      {/* Export Dialog */}
      <Dialog open={isExportOpen} onOpenChange={setIsExportOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Exporter le contenu
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Format d'export</Label>
              <div className="grid grid-cols-3 gap-2">
                {EXPORT_FORMATS.map((format) => {
                  const Icon = format.icon;
                  return (
                    <Card
                      key={format.value}
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        exportFormat === format.value 
                          ? 'ring-2 ring-primary bg-primary/5' 
                          : ''
                      }`}
                      onClick={() => setExportFormat(format.value)}
                    >
                      <CardContent className="p-3 text-center">
                        <Icon className="h-6 w-6 mx-auto mb-1" />
                        <span className="text-sm">{format.label}</span>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>

            <div className="space-y-3">
              <Label>Options</Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="metadata"
                    checked={exportOptions.includeMetadata}
                    onCheckedChange={(checked) => 
                      setExportOptions(prev => ({ ...prev, includeMetadata: !!checked }))
                    }
                  />
                  <label htmlFor="metadata" className="text-sm">
                    Inclure les métadonnées
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="drafts"
                    checked={exportOptions.includeDrafts}
                    onCheckedChange={(checked) => 
                      setExportOptions(prev => ({ ...prev, includeDrafts: !!checked }))
                    }
                  />
                  <label htmlFor="drafts" className="text-sm">
                    Inclure les brouillons
                  </label>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsExportOpen(false)}>
              Annuler
            </Button>
            <Button 
              onClick={() => exportMutation.mutate()}
              disabled={exportMutation.isPending}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              {exportMutation.isPending ? 'Export...' : 'Exporter'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import Dialog */}
      <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Importer du contenu
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept=".json,.csv"
              className="hidden"
            />

            {!importFile ? (
              <Card
                className="border-dashed cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <CardContent className="py-8 text-center">
                  <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="font-medium">Cliquez pour sélectionner un fichier</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Formats supportés: JSON, CSV
                  </p>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <File className="h-10 w-10 text-primary" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{importFile.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {(importFile.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setImportFile(null);
                        setImportResult(null);
                      }}
                    >
                      <XCircle className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {importMutation.isPending && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Import en cours...</span>
                  <span>{Math.round(importProgress)}%</span>
                </div>
                <Progress value={importProgress} />
              </div>
            )}

            {importResult && (
              <Card className={importResult.failed > 0 ? 'border-yellow-500' : 'border-green-500'}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    {importResult.failed === 0 ? (
                      <CheckCircle className="h-8 w-8 text-green-500" />
                    ) : (
                      <AlertCircle className="h-8 w-8 text-yellow-500" />
                    )}
                    <div>
                      <p className="font-medium">
                        {importResult.success} éléments importés
                      </p>
                      {importResult.failed > 0 && (
                        <p className="text-sm text-muted-foreground">
                          {importResult.failed} échecs
                        </p>
                      )}
                    </div>
                  </div>
                  {importResult.errors.length > 0 && (
                    <div className="mt-3 p-2 bg-muted rounded text-xs max-h-20 overflow-auto">
                      {importResult.errors.slice(0, 3).map((err, i) => (
                        <p key={i} className="text-destructive">{err}</p>
                      ))}
                      {importResult.errors.length > 3 && (
                        <p className="text-muted-foreground">
                          +{importResult.errors.length - 3} autres erreurs
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsImportOpen(false)}>
              Fermer
            </Button>
            <Button 
              onClick={handleImport}
              disabled={!importFile || importMutation.isPending}
              className="gap-2"
            >
              <Upload className="h-4 w-4" />
              Importer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
