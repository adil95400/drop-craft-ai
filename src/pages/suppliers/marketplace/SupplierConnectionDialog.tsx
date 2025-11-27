import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSupplierEcosystem } from "@/hooks/useSupplierEcosystem";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { BaseSupplier } from "@/types/suppliers";

interface SupplierConnectionDialogProps {
  supplier: BaseSupplier | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CREDENTIAL_FIELDS: Record<string, { label: string; type: string; required: boolean }[]> = {
  bigbuy: [
    { label: "API Key", type: "password", required: true }
  ],
  vidaxl: [
    { label: "API Key", type: "password", required: true }
  ],
  aliexpress: [
    { label: "App Key", type: "text", required: true },
    { label: "App Secret", type: "password", required: true }
  ],
  alibaba: [
    { label: "Client ID", type: "text", required: true },
    { label: "Client Secret", type: "password", required: true }
  ],
  'dropshipping-europe': [
    { label: "API Key", type: "password", required: true }
  ],
  btswholesaler: [
    { label: "Username", type: "text", required: true },
    { label: "Password", type: "password", required: true }
  ],
  matterhorn: [
    { label: "API Key", type: "password", required: true }
  ],
  b2bsportswholesale: [
    { label: "API Key", type: "password", required: true }
  ],
  watchimport: [
    { label: "Username", type: "text", required: true },
    { label: "Password", type: "password", required: true }
  ]
};

export function SupplierConnectionDialog({ supplier, open, onOpenChange }: SupplierConnectionDialogProps) {
  const [connectionMethod, setConnectionMethod] = useState<'api' | 'csv' | 'xml' | 'ftp'>('api');
  const [credentials, setCredentials] = useState<Record<string, string>>({});
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testMessage, setTestMessage] = useState('');

  const { connectSupplier, testConnection, isConnecting, isTesting } = useSupplierEcosystem();
  const { toast } = useToast();

  if (!supplier) return null;

  const fields = CREDENTIAL_FIELDS[supplier.id] || [
    { label: "API Key", type: "password", required: true }
  ];

  const mapCredentials = (creds: Record<string, string>) => {
    const mapped: Record<string, string> = {};
    
    if (creds.apikey) mapped.apiKey = creds.apikey;
    if (creds.appkey) mapped.appKey = creds.appkey;
    if (creds.appsecret) mapped.appSecret = creds.appsecret;
    if (creds.clientid) mapped.clientId = creds.clientid;
    if (creds.clientsecret) mapped.clientSecret = creds.clientsecret;
    if (creds.username) mapped.username = creds.username;
    if (creds.password) mapped.password = creds.password;
    
    // Add file-based credentials
    if (creds.csvUrl) mapped.csvUrl = creds.csvUrl;
    if (creds.xmlUrl) mapped.xmlUrl = creds.xmlUrl;
    if (creds.ftpHost) mapped.ftpHost = creds.ftpHost;
    if (creds.ftpUsername) mapped.ftpUsername = creds.ftpUsername;
    if (creds.ftpPassword) mapped.ftpPassword = creds.ftpPassword;
    if (creds.ftpPath) mapped.ftpPath = creds.ftpPath;
    if (creds.syncInterval) mapped.syncInterval = creds.syncInterval;
    
    return mapped;
  };

  const handleTest = async () => {
    setTestStatus('testing');
    setTestMessage('Test de connexion en cours...');
    
    try {
      const creds: Record<string, string> = {};
      
      if (connectionMethod === 'api') {
        fields.forEach((field) => {
          const key = field.label.toLowerCase().replace(/\s+/g, '');
          creds[key] = credentials[key] || '';
        });
      } else {
        // For file-based methods, use the relevant credentials
        Object.keys(credentials).forEach(key => {
          creds[key] = credentials[key];
        });
      }

      const mappedCreds = mapCredentials(creds);
      
      console.log('Testing with credentials:', Object.keys(mappedCreds), 'for supplier:', supplier.id);
      
      const result = await testConnection({ supplierId: supplier.id, credentials: mappedCreds });
      
      setTestStatus(result ? 'success' : 'error');
      setTestMessage(result ? 'Connexion réussie' : 'Échec du test de connexion');
    } catch (error: any) {
      console.error('Test connection error:', error);
      setTestStatus('error');
      setTestMessage(error?.message || 'Erreur lors du test de connexion');
    }
  };

  // Vérifier si les champs requis sont remplis pour la méthode sélectionnée
  const canTest = () => {
    if (connectionMethod === 'api') {
      const requiredFields = fields.filter(f => f.required);
      return requiredFields.every(field => {
        const key = field.label.toLowerCase().replace(/\s+/g, '');
        return credentials[key] && credentials[key].trim().length > 0;
      });
    } else if (connectionMethod === 'csv' || connectionMethod === 'xml') {
      return !!(credentials.csvUrl || credentials.xmlUrl);
    } else if (connectionMethod === 'ftp') {
      return !!(credentials.ftpHost && credentials.ftpUsername);
    }
    return false;
  };

  const handleConnect = async () => {
    setTestStatus('idle');
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        toast({
          title: "Erreur",
          description: "Vous devez être connecté",
          variant: "destructive"
        });
        return;
      }

      const { data: supplierRecord, error: supplierError } = await supabase
        .from('suppliers')
        .insert({
          user_id: user.id,
          name: supplier.displayName,
          status: 'active'
        })
        .select()
        .single();

      if (supplierError) {
        console.error('Failed to create supplier:', supplierError);
        toast({
          title: "Erreur",
          description: "Impossible de créer le fournisseur",
          variant: "destructive"
        });
        return;
      }

      const creds: Record<string, string> = {};
      
      if (connectionMethod === 'api') {
        fields.forEach((field) => {
          const key = field.label.toLowerCase().replace(/\s+/g, '');
          creds[key] = credentials[key] || '';
        });
      } else {
        Object.keys(credentials).forEach(key => {
          creds[key] = credentials[key];
        });
      }

      const mappedCreds = mapCredentials(creds);

      connectSupplier({
        supplierId: supplierRecord.id,
        credentials: mappedCreds,
        connectionType: connectionMethod,
        settings: { connectorId: supplier.id }
      });

      onOpenChange(false);
      setCredentials({});
      setTestStatus('idle');
      setConnectionMethod('api');
    } catch (error) {
      console.error('Connection error:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors de la connexion",
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Connecter {supplier.displayName}</DialogTitle>
          <DialogDescription>
            Choisissez votre méthode de connexion et configurez l'intégration
          </DialogDescription>
        </DialogHeader>

        <Tabs value={connectionMethod} onValueChange={(v) => setConnectionMethod(v as any)} className="py-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="api">API</TabsTrigger>
            <TabsTrigger value="csv">CSV</TabsTrigger>
            <TabsTrigger value="xml">XML</TabsTrigger>
            <TabsTrigger value="ftp">FTP</TabsTrigger>
          </TabsList>

          <div className="mt-4 space-y-4">
            {testStatus !== 'idle' && (
              <div className={`flex items-center gap-2 p-3 rounded-lg ${
                testStatus === 'success' ? 'bg-green-500/10 text-green-600' :
                testStatus === 'error' ? 'bg-destructive/10 text-destructive' :
                'bg-muted'
              }`}>
                {testStatus === 'testing' && <Loader2 className="h-4 w-4 animate-spin" />}
                {testStatus === 'success' && <CheckCircle2 className="h-4 w-4" />}
                {testStatus === 'error' && <XCircle className="h-4 w-4" />}
                <span className="text-sm">{testMessage}</span>
              </div>
            )}

            <TabsContent value="api" className="space-y-4 mt-0">
              {fields.map((field) => {
                const key = field.label.toLowerCase().replace(/\s+/g, '');
                return (
                  <div key={key} className="space-y-2">
                    <Label htmlFor={key}>
                      {field.label} {field.required && <span className="text-destructive">*</span>}
                    </Label>
                    <Input
                      id={key}
                      type={field.type}
                      value={credentials[key] || ''}
                      onChange={(e) => setCredentials({ ...credentials, [key]: e.target.value })}
                      placeholder={`Entrez ${field.label.toLowerCase()}`}
                      disabled={isConnecting || isTesting}
                    />
                  </div>
                );
              })}
            </TabsContent>

            <TabsContent value="csv" className="space-y-4 mt-0">
              <div className="space-y-2">
                <Label htmlFor="csv-url">URL du fichier CSV</Label>
                <Input
                  id="csv-url"
                  type="url"
                  placeholder="https://example.com/products.csv"
                  value={credentials.csvUrl || ''}
                  onChange={(e) => setCredentials({ ...credentials, csvUrl: e.target.value })}
                  disabled={isConnecting || isTesting}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="csv-interval">Fréquence de synchronisation</Label>
                <Select 
                  value={credentials.syncInterval || 'daily'}
                  onValueChange={(v) => setCredentials({ ...credentials, syncInterval: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hourly">Toutes les heures</SelectItem>
                    <SelectItem value="daily">Quotidienne</SelectItem>
                    <SelectItem value="weekly">Hebdomadaire</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>

            <TabsContent value="xml" className="space-y-4 mt-0">
              <div className="space-y-2">
                <Label htmlFor="xml-url">URL du flux XML</Label>
                <Input
                  id="xml-url"
                  type="url"
                  placeholder="https://example.com/feed.xml"
                  value={credentials.xmlUrl || ''}
                  onChange={(e) => setCredentials({ ...credentials, xmlUrl: e.target.value })}
                  disabled={isConnecting || isTesting}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="xml-interval">Fréquence de synchronisation</Label>
                <Select 
                  value={credentials.syncInterval || 'daily'}
                  onValueChange={(v) => setCredentials({ ...credentials, syncInterval: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hourly">Toutes les heures</SelectItem>
                    <SelectItem value="daily">Quotidienne</SelectItem>
                    <SelectItem value="weekly">Hebdomadaire</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>

            <TabsContent value="ftp" className="space-y-4 mt-0">
              <div className="space-y-2">
                <Label htmlFor="ftp-host">Serveur FTP</Label>
                <Input
                  id="ftp-host"
                  placeholder="ftp.example.com"
                  value={credentials.ftpHost || ''}
                  onChange={(e) => setCredentials({ ...credentials, ftpHost: e.target.value })}
                  disabled={isConnecting || isTesting}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ftp-username">Nom d'utilisateur</Label>
                  <Input
                    id="ftp-username"
                    value={credentials.ftpUsername || ''}
                    onChange={(e) => setCredentials({ ...credentials, ftpUsername: e.target.value })}
                    disabled={isConnecting || isTesting}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ftp-password">Mot de passe</Label>
                  <Input
                    id="ftp-password"
                    type="password"
                    value={credentials.ftpPassword || ''}
                    onChange={(e) => setCredentials({ ...credentials, ftpPassword: e.target.value })}
                    disabled={isConnecting || isTesting}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="ftp-path">Chemin du fichier</Label>
                <Input
                  id="ftp-path"
                  placeholder="/catalog/products.csv"
                  value={credentials.ftpPath || ''}
                  onChange={(e) => setCredentials({ ...credentials, ftpPath: e.target.value })}
                  disabled={isConnecting || isTesting}
                />
              </div>
            </TabsContent>

            {supplier.website && (
              <div className="flex items-start gap-2 p-3 bg-blue-500/10 text-blue-600 rounded-lg">
                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <p className="text-sm">
                  Vous n'avez pas encore de compte ? {' '}
                  <a 
                    href={supplier.website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="underline hover:no-underline"
                  >
                    Créer un compte sur {supplier.displayName}
                  </a>
                </p>
              </div>
            )}
          </div>
        </Tabs>

        <DialogFooter className="gap-2">
          <Button 
            variant="outline" 
            onClick={handleTest}
            disabled={isTesting || !canTest()}
          >
            {isTesting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Test en cours...
              </>
            ) : (
              'Tester la connexion'
            )}
          </Button>
          <Button 
            onClick={handleConnect}
            disabled={isConnecting || testStatus !== 'success'}
          >
            {isConnecting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Connexion...
              </>
            ) : (
              'Connecter'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}