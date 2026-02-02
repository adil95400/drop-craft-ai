import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Chrome, 
  Link2, 
  Copy, 
  Check, 
  RefreshCw,
  Wifi,
  WifiOff,
  Settings,
  Zap,
  Download,
  Key,
  Eye,
  EyeOff
} from 'lucide-react';
import { 
  useExtensionConnectionStatus, 
  useGenerateExtensionToken,
  useExtensionRealtimeImport 
} from '@/hooks/useExtensionRealtimeImport';

export function ExtensionQuickImportCard() {
  const [showToken, setShowToken] = useState(false);
  const [copied, setCopied] = useState(false);
  const [generatedToken, setGeneratedToken] = useState<string | null>(null);
  
  const { data: connectionStatus, isLoading } = useExtensionConnectionStatus();
  const generateToken = useGenerateExtensionToken();
  const { extensionSettings, saveSettings, isSavingSettings } = useExtensionRealtimeImport();

  const handleGenerateToken = async () => {
    const result = await generateToken.mutateAsync();
    setGeneratedToken(result.token);
  };

  const copyToClipboard = () => {
    if (generatedToken) {
      navigator.clipboard.writeText(generatedToken);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Chrome className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle>Extension Chrome ShopOpti+</CardTitle>
              <CardDescription>
                Import 1-Click depuis AliExpress, Amazon, eBay...
              </CardDescription>
            </div>
          </div>
          <ConnectionStatus 
            connected={connectionStatus?.connected || false} 
            isLoading={isLoading}
          />
        </div>
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue="connect" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="connect">Connexion</TabsTrigger>
            <TabsTrigger value="settings">Paramètres</TabsTrigger>
            <TabsTrigger value="download">Télécharger</TabsTrigger>
          </TabsList>

          <TabsContent value="connect" className="space-y-4 mt-4">
            {/* Token Generation */}
            <div className="space-y-3">
              <Label>Token d'authentification</Label>
              <p className="text-sm text-muted-foreground">
                Générez un token pour connecter l'extension à votre compte
              </p>
              
              {generatedToken ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Input
                      type={showToken ? 'text' : 'password'}
                      value={generatedToken}
                      readOnly
                      className="font-mono text-sm"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setShowToken(!showToken)}
                    >
                      {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={copyToClipboard}
                    >
                      {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Copiez ce token et collez-le dans les paramètres de l'extension
                  </p>
                </div>
              ) : (
                <Button
                  onClick={handleGenerateToken}
                  disabled={generateToken.isPending}
                  className="w-full"
                >
                  {generateToken.isPending ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Key className="h-4 w-4 mr-2" />
                  )}
                  Générer un token
                </Button>
              )}
            </div>

            {/* Connection Status */}
            <div className="p-4 rounded-lg bg-muted/50">
              <div className="flex items-center justify-between">
                <span className="text-sm">Statut de connexion</span>
                {connectionStatus?.connected ? (
                  <Badge className="bg-green-500">Connecté</Badge>
                ) : (
                  <Badge variant="secondary">Déconnecté</Badge>
                )}
              </div>
              {connectionStatus?.lastSeen && (
                <p className="text-xs text-muted-foreground mt-1">
                  Dernière activité: {new Date(connectionStatus.lastSeen).toLocaleString('fr-FR')}
                </p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Import automatique</Label>
                  <p className="text-xs text-muted-foreground">
                    Importer directement sans confirmation
                  </p>
                </div>
                <Switch
                  checked={extensionSettings?.settings?.auto_import || false}
                  onCheckedChange={(checked) => 
                    saveSettings({ ...extensionSettings?.settings, auto_import: checked })
                  }
                  disabled={isSavingSettings}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Appliquer règles de prix</Label>
                  <p className="text-xs text-muted-foreground">
                    Utiliser vos règles de marge automatiquement
                  </p>
                </div>
                <Switch
                  checked={extensionSettings?.settings?.apply_pricing || false}
                  onCheckedChange={(checked) => 
                    saveSettings({ ...extensionSettings?.settings, apply_pricing: checked })
                  }
                  disabled={isSavingSettings}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Enrichissement IA</Label>
                  <p className="text-xs text-muted-foreground">
                    Optimiser titre/description avec l'IA
                  </p>
                </div>
                <Switch
                  checked={extensionSettings?.settings?.ai_enrichment || false}
                  onCheckedChange={(checked) => 
                    saveSettings({ ...extensionSettings?.settings, ai_enrichment: checked })
                  }
                  disabled={isSavingSettings}
                />
              </div>

              <div className="space-y-2">
                <Label>Multiplicateur de prix par défaut</Label>
                <Input
                  type="number"
                  step="0.1"
                  min="1"
                  max="10"
                  value={extensionSettings?.settings?.price_multiplier || 2}
                  onChange={(e) => 
                    saveSettings({ 
                      ...extensionSettings?.settings, 
                      price_multiplier: parseFloat(e.target.value) 
                    })
                  }
                  className="w-24"
                  disabled={isSavingSettings}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="download" className="space-y-4 mt-4">
            <div className="text-center space-y-4">
              <div className="p-6 rounded-lg bg-muted/30 border-2 border-dashed">
                <Chrome className="h-16 w-16 mx-auto mb-4 text-primary" />
                <h3 className="font-semibold text-lg">ShopOpti+ Extension</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Importez des produits en 1-click depuis 15+ marketplaces
                </p>
                
                <div className="flex flex-col gap-2">
                  <Button className="w-full">
                    <Download className="h-4 w-4 mr-2" />
                    Télécharger pour Chrome
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    Compatible Chrome, Edge, Brave, Opera
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="p-3 rounded-lg bg-muted/50">
                  <Zap className="h-5 w-5 text-primary mx-auto mb-1" />
                  <span>Import 1-Click</span>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <Link2 className="h-5 w-5 text-primary mx-auto mb-1" />
                  <span>15+ Plateformes</span>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

function ConnectionStatus({ connected, isLoading }: { connected: boolean; isLoading: boolean }) {
  if (isLoading) {
    return (
      <div className="flex items-center gap-2">
        <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Vérification...</span>
      </div>
    );
  }

  return connected ? (
    <div className="flex items-center gap-2">
      <div className="relative">
        <Wifi className="h-5 w-5 text-green-500" />
        <span className="absolute -top-0.5 -right-0.5 h-2 w-2 bg-green-500 rounded-full animate-pulse" />
      </div>
      <span className="text-sm text-green-600 font-medium">Connectée</span>
    </div>
  ) : (
    <div className="flex items-center gap-2">
      <WifiOff className="h-5 w-5 text-muted-foreground" />
      <span className="text-sm text-muted-foreground">Déconnectée</span>
    </div>
  );
}
