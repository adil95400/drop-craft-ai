import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Key, Plus, Copy, Eye, EyeOff, Trash2, FileText, ExternalLink, AlertTriangle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useApiKeys } from '@/hooks/useApiKeys';

export function ApiTab() {
  const navigate = useNavigate();
  const { apiKeys, generateApiKey, deleteApiKey, loading } = useApiKeys();
  const [keyVisibility, setKeyVisibility] = useState<Record<string, boolean>>({});

  const handleGenerate = async () => {
    try {
      await generateApiKey('Nouvelle API Key', ['read', 'write']);
    } catch (error) {
      // Error handled in hook
    }
  };

  const toggleVisibility = (id: string) => {
    setKeyVisibility(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Clé API copiée');
  };

  const handleDelete = async (id: string) => {
    if (confirm('Supprimer cette clé API ?')) {
      await deleteApiKey(id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card className="border-border bg-card shadow-card">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Key className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>Gestion des API</CardTitle>
                <CardDescription>Gérez vos clés et accédez à la documentation</CardDescription>
              </div>
            </div>
            <Button variant="outline" onClick={() => navigate('/api-docs')}>
              <FileText className="mr-2 h-4 w-4" />
              Documentation
              <ExternalLink className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* API Keys */}
      <Card className="border-border bg-card shadow-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h4 className="font-semibold">Clés API</h4>
              <Badge variant="outline">{apiKeys.length} clé{apiKeys.length !== 1 ? 's' : ''}</Badge>
            </div>
            <Button onClick={handleGenerate} size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Nouvelle clé
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
            </div>
          ) : apiKeys.length === 0 ? (
            <div className="text-center py-8">
              <div className="h-12 w-12 rounded-full bg-muted mx-auto mb-3 flex items-center justify-center">
                <Key className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground mb-4">Aucune clé API</p>
              <Button onClick={handleGenerate} variant="outline">
                <Plus className="mr-2 h-4 w-4" />
                Créer une clé
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {apiKeys.map((apiKey) => (
                <div 
                  key={apiKey.id} 
                  className="p-4 border border-border rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="font-medium flex items-center gap-2">
                        {apiKey.name}
                        {apiKey.is_active && (
                          <Badge variant="secondary" className="text-xs">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Active
                          </Badge>
                        )}
                      </div>
                      <div className="font-mono text-sm text-muted-foreground truncate">
                        {keyVisibility[apiKey.id] 
                          ? apiKey.key 
                          : (apiKey.key_prefix || apiKey.key.substring(0, 10)) + '••••••••••••'}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Créée le {new Date(apiKey.created_at).toLocaleDateString('fr-FR')}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleVisibility(apiKey.id)}
                        title={keyVisibility[apiKey.id] ? 'Masquer' : 'Afficher'}
                      >
                        {keyVisibility[apiKey.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => copyToClipboard(apiKey.key)}
                        title="Copier"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(apiKey.id)}
                        className="text-destructive hover:text-destructive"
                        title="Supprimer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Security Info */}
      <Card className="border-yellow-500/30 bg-yellow-500/5">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
            <div className="space-y-2">
              <h5 className="font-semibold text-yellow-700 dark:text-yellow-400">Sécurité des clés API</h5>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Les clés API donnent accès à toutes vos données</li>
                <li>• Ne partagez jamais vos clés publiquement</li>
                <li>• Utilisez des environnements séparés (dev/prod)</li>
                <li>• Régénérez immédiatement si compromises</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
