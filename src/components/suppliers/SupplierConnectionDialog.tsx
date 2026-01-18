import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle, AlertTriangle, Key, Globe, User, Lock, Eye, EyeOff, Zap, Shield } from 'lucide-react';
import { useSupplierAPI } from '@/hooks/useSupplierAPI';

interface SupplierConnectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplier: {
    id: string;
    name: string;
    type?: string;
    logo?: string;
    website?: string;
  } | null;
  onConnected?: () => void;
}

interface CredentialField {
  key: string;
  label: string;
  type: 'text' | 'password' | 'url';
  placeholder: string;
  required: boolean;
  icon: typeof Key;
}

const SUPPLIER_CREDENTIAL_FIELDS: Record<string, CredentialField[]> = {
  aliexpress: [
    { key: 'app_key', label: 'App Key', type: 'text', placeholder: 'Votre App Key AliExpress', required: true, icon: Key },
    { key: 'app_secret', label: 'App Secret', type: 'password', placeholder: 'Votre App Secret', required: true, icon: Lock },
    { key: 'access_token', label: 'Access Token', type: 'password', placeholder: 'Token d\'accès (optionnel)', required: false, icon: Shield },
  ],
  cjdropshipping: [
    { key: 'api_key', label: 'API Key', type: 'password', placeholder: 'Votre clé API CJ Dropshipping', required: true, icon: Key },
    { key: 'email', label: 'Email du compte', type: 'text', placeholder: 'email@example.com', required: true, icon: User },
  ],
  bigbuy: [
    { key: 'api_key', label: 'API Key', type: 'password', placeholder: 'Votre clé API BigBuy', required: true, icon: Key },
  ],
  printful: [
    { key: 'api_key', label: 'API Key', type: 'password', placeholder: 'Votre clé API Printful', required: true, icon: Key },
  ],
  printify: [
    { key: 'api_token', label: 'API Token', type: 'password', placeholder: 'Votre token API Printify', required: true, icon: Key },
    { key: 'shop_id', label: 'Shop ID', type: 'text', placeholder: 'ID de votre boutique', required: true, icon: Globe },
  ],
  spocket: [
    { key: 'api_key', label: 'API Key', type: 'password', placeholder: 'Votre clé API Spocket', required: true, icon: Key },
  ],
  oberlo: [
    { key: 'api_key', label: 'API Key', type: 'password', placeholder: 'Votre clé API', required: true, icon: Key },
    { key: 'store_url', label: 'URL Boutique', type: 'url', placeholder: 'https://votre-boutique.myshopify.com', required: true, icon: Globe },
  ],
  default: [
    { key: 'api_key', label: 'API Key', type: 'password', placeholder: 'Votre clé API', required: true, icon: Key },
    { key: 'api_secret', label: 'API Secret', type: 'password', placeholder: 'Votre secret API (optionnel)', required: false, icon: Lock },
    { key: 'store_url', label: 'URL API', type: 'url', placeholder: 'https://api.fournisseur.com', required: false, icon: Globe },
  ],
};

export function SupplierConnectionDialog({ 
  open, 
  onOpenChange, 
  supplier,
  onConnected 
}: SupplierConnectionDialogProps) {
  const [credentials, setCredentials] = useState<Record<string, string>>({});
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  
  const { saveCredentials, testConnection, isTestingConnection, isSavingCredentials } = useSupplierAPI();

  if (!supplier) return null;

  const supplierKey = supplier.name.toLowerCase().replace(/\s+/g, '');
  const fields = SUPPLIER_CREDENTIAL_FIELDS[supplierKey] || SUPPLIER_CREDENTIAL_FIELDS.default;

  const handleCredentialChange = (key: string, value: string) => {
    setCredentials(prev => ({ ...prev, [key]: value }));
    setConnectionStatus('idle');
    setErrorMessage('');
  };

  const togglePasswordVisibility = (key: string) => {
    setShowPasswords(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleTestConnection = () => {
    setConnectionStatus('testing');
    testConnection(
      { supplierId: supplier.id, supplierName: supplier.name },
      {
        onSuccess: (data) => {
          if (data?.success) {
            setConnectionStatus('success');
          } else {
            setConnectionStatus('error');
            setErrorMessage(data?.error || 'Échec de la connexion');
          }
        },
        onError: (error) => {
          setConnectionStatus('error');
          setErrorMessage(error.message);
        }
      }
    );
  };

  const handleSaveCredentials = () => {
    saveCredentials(
      { 
        supplierId: supplier.id, 
        supplierName: supplier.name, 
        credentials 
      },
      {
        onSuccess: () => {
          handleTestConnection();
          onConnected?.();
        }
      }
    );
  };

  const isFormValid = fields
    .filter(f => f.required)
    .every(f => credentials[f.key]?.trim());

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-3">
            {supplier.logo ? (
              <img src={supplier.logo} alt={supplier.name} className="w-10 h-10 rounded-lg object-contain" />
            ) : (
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Zap className="h-5 w-5 text-primary" />
              </div>
            )}
            <div>
              <DialogTitle>Connecter {supplier.name}</DialogTitle>
              <DialogDescription>
                Entrez vos identifiants API pour activer la synchronisation
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="credentials" className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="credentials">Identifiants</TabsTrigger>
            <TabsTrigger value="help">Aide</TabsTrigger>
          </TabsList>

          <TabsContent value="credentials" className="space-y-4 mt-4">
            {fields.map((field) => (
              <div key={field.key} className="space-y-2">
                <Label htmlFor={field.key} className="flex items-center gap-2">
                  <field.icon className="h-4 w-4 text-muted-foreground" />
                  {field.label}
                  {field.required && <span className="text-red-500">*</span>}
                </Label>
                <div className="relative">
                  <Input
                    id={field.key}
                    type={field.type === 'password' && !showPasswords[field.key] ? 'password' : 'text'}
                    placeholder={field.placeholder}
                    value={credentials[field.key] || ''}
                    onChange={(e) => handleCredentialChange(field.key, e.target.value)}
                    className="pr-10"
                  />
                  {field.type === 'password' && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                      onClick={() => togglePasswordVisibility(field.key)}
                    >
                      {showPasswords[field.key] ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  )}
                </div>
              </div>
            ))}

            {/* Statut de connexion */}
            {connectionStatus === 'success' && (
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  Connexion réussie ! Le fournisseur est maintenant actif.
                </AlertDescription>
              </Alert>
            )}

            {connectionStatus === 'error' && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  {errorMessage || 'Impossible de se connecter. Vérifiez vos identifiants.'}
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>

          <TabsContent value="help" className="space-y-4 mt-4">
            <div className="space-y-3">
              <h4 className="font-medium">Comment obtenir vos identifiants API ?</h4>
              
              <div className="text-sm text-muted-foreground space-y-2">
                <p>1. Connectez-vous à votre compte {supplier.name}</p>
                <p>2. Accédez aux paramètres développeur ou API</p>
                <p>3. Créez une nouvelle application ou clé API</p>
                <p>4. Copiez les identifiants générés</p>
              </div>

              {supplier.website && (
                <Button variant="outline" className="w-full" asChild>
                  <a href={supplier.website} target="_blank" rel="noopener noreferrer">
                    <Globe className="h-4 w-4 mr-2" />
                    Accéder à {supplier.name}
                  </a>
                </Button>
              )}

              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  Vos identifiants sont chiffrés et stockés de manière sécurisée. 
                  Nous ne partageons jamais vos données avec des tiers.
                </AlertDescription>
              </Alert>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="mt-6 gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          
          <Button
            variant="secondary"
            onClick={handleTestConnection}
            disabled={!isFormValid || isTestingConnection}
          >
            {isTestingConnection ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Test en cours...
              </>
            ) : (
              'Tester la connexion'
            )}
          </Button>

          <Button
            onClick={handleSaveCredentials}
            disabled={!isFormValid || isSavingCredentials}
          >
            {isSavingCredentials ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Connexion...
              </>
            ) : (
              <>
                <Zap className="h-4 w-4 mr-2" />
                Connecter
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
