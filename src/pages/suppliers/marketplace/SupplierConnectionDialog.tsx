import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
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
    // Map form field keys to edge function expected keys
    const mapped: Record<string, string> = {};
    
    if (creds.apikey) mapped.apiKey = creds.apikey;
    if (creds.appkey) mapped.appKey = creds.appkey;
    if (creds.appsecret) mapped.appSecret = creds.appsecret;
    if (creds.clientid) mapped.clientId = creds.clientid;
    if (creds.clientsecret) mapped.clientSecret = creds.clientsecret;
    if (creds.username) mapped.username = creds.username;
    if (creds.password) mapped.password = creds.password;
    
    return mapped;
  };

  const handleTest = async () => {
    setTestStatus('testing');
    try {
      const creds: Record<string, string> = {};
      fields.forEach((field) => {
        const key = field.label.toLowerCase().replace(/\s+/g, '');
        creds[key] = credentials[key] || '';
      });

      const mappedCreds = mapCredentials(creds);
      
      // Pass the mapped credentials to testConnection
      await testConnection(supplier.id, mappedCreds);
      setTestStatus('success');
      setTestMessage('Connexion réussie');
    } catch (error) {
      setTestStatus('error');
      setTestMessage('Erreur lors du test de connexion');
    }
  };

  const handleConnect = async () => {
    setTestStatus('idle');
    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        toast({
          title: "Erreur",
          description: "Vous devez être connecté",
          variant: "destructive"
        });
        return;
      }

      // Create supplier record first to get a UUID
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

      // Now connect with the UUID
      const creds: Record<string, string> = {};
      fields.forEach((field) => {
        const key = field.label.toLowerCase().replace(/\s+/g, '');
        creds[key] = credentials[key] || '';
      });

      const mappedCreds = mapCredentials(creds);

      connectSupplier({
        supplierId: supplierRecord.id, // Use the UUID from database
        credentials: mappedCreds,
        connectionType: 'api',
        settings: { connectorId: supplier.id } // Store the original connector ID
      });

      onOpenChange(false);
      setCredentials({});
      setTestStatus('idle');
      
      toast({
        title: "Succès",
        description: `${supplier.displayName} a été connecté avec succès`,
      });
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
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Connecter {supplier.displayName}</DialogTitle>
          <DialogDescription>
            Entrez vos identifiants API pour connecter ce fournisseur
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
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
                />
              </div>
            );
          })}

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

        <DialogFooter className="gap-2">
          <Button 
            variant="outline" 
            onClick={handleTest}
            disabled={isTesting || !Object.values(credentials).every(v => v)}
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
