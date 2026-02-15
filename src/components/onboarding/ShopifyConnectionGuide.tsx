import { useState } from 'react';
import { edgeFunctionUrl } from '@/lib/supabase-env';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  CheckCircle2, 
  Circle, 
  ExternalLink, 
  Copy, 
  ShoppingBag, 
  Key, 
  Webhook, 
  Package,
  ArrowRight,
  AlertTriangle,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';

interface Step {
  id: number;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  completed: boolean;
}

export const ShopifyConnectionGuide = () => {
  const { user } = useUnifiedAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle');
  
  const [credentials, setCredentials] = useState({
    shopDomain: '',
    accessToken: '',
    apiKey: '',
    apiSecret: ''
  });

  const steps: Step[] = [
    {
      id: 1,
      title: 'Créer une app Shopify',
      description: 'Configurez une application privée dans votre admin Shopify',
      icon: ShoppingBag,
      completed: currentStep > 1
    },
    {
      id: 2,
      title: 'Obtenir les credentials',
      description: 'Récupérez votre Access Token et API Key',
      icon: Key,
      completed: currentStep > 2
    },
    {
      id: 3,
      title: 'Configurer les webhooks',
      description: 'Activez les notifications en temps réel',
      icon: Webhook,
      completed: currentStep > 3
    },
    {
      id: 4,
      title: 'Synchroniser les produits',
      description: 'Importez vos produits et testez la connexion',
      icon: Package,
      completed: currentStep > 4
    }
  ];

  const progress = ((currentStep - 1) / steps.length) * 100;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copié dans le presse-papier`);
  };

  const testConnection = async () => {
    if (!credentials.shopDomain || !credentials.accessToken) {
      toast.error('Veuillez renseigner le domaine et l\'Access Token');
      return;
    }

    setTestingConnection(true);
    setConnectionStatus('idle');

    try {
      const { data, error } = await supabase.functions.invoke('test-marketplace-connection', {
        body: {
          platform: 'shopify',
          credentials: {
            shop_domain: credentials.shopDomain,
            access_token: credentials.accessToken
          }
        }
      });

      if (error) throw error;

      if (data?.success) {
        setConnectionStatus('success');
        toast.success('Connexion Shopify réussie !');
        setCurrentStep(3);
      } else {
        setConnectionStatus('error');
        toast.error(data?.error || 'Échec de la connexion');
      }
    } catch (error: any) {
      setConnectionStatus('error');
      toast.error(error.message || 'Erreur lors du test de connexion');
    } finally {
      setTestingConnection(false);
    }
  };

  const saveConnection = async () => {
    if (!user?.id) {
      toast.error('Vous devez être connecté');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('integrations')
        .upsert({
          user_id: user.id,
          platform: 'shopify',
          status: 'active',
          settings: {
            shop_domain: credentials.shopDomain,
            api_version: '2024-01',
            webhooks_configured: true
          }
        });

      if (error) throw error;

      toast.success('Connexion Shopify enregistrée !');
      setCurrentStep(4);
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de l\'enregistrement');
    } finally {
      setLoading(false);
    }
  };

  const syncProducts = async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('shopify-sync', {
        body: {
          action: 'sync_products',
          shop_domain: credentials.shopDomain
        }
      });

      if (error) throw error;

      toast.success(`${data?.products_synced || 0} produits synchronisés !`);
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la synchronisation');
    } finally {
      setLoading(false);
    }
  };

  const webhookUrl = edgeFunctionUrl('shopify-webhook');

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <ShoppingBag className="h-6 w-6 text-[#96bf48]" />
              Connexion Shopify
            </CardTitle>
            <CardDescription>
              Guide pas-à-pas pour connecter votre boutique Shopify
            </CardDescription>
          </div>
          <Badge variant={connectionStatus === 'success' ? 'default' : 'secondary'}>
            {connectionStatus === 'success' ? 'Connecté' : 'Non connecté'}
          </Badge>
        </div>
        <Progress value={progress} className="mt-4" />
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Steps indicator */}
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const StepIcon = step.icon;
            const isActive = step.id === currentStep;
            const isCompleted = step.completed;

            return (
              <div key={step.id} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={`
                      w-10 h-10 rounded-full flex items-center justify-center
                      ${isCompleted ? 'bg-success text-success-foreground' : ''}
                      ${isActive ? 'bg-primary text-primary-foreground' : ''}
                      ${!isActive && !isCompleted ? 'bg-muted text-muted-foreground' : ''}
                    `}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : (
                      <StepIcon className="h-5 w-5" />
                    )}
                  </div>
                  <span className="text-xs mt-1 text-center max-w-[80px]">{step.title}</span>
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-12 h-0.5 mx-2 ${step.completed ? 'bg-success' : 'bg-muted'}`} />
                )}
              </div>
            );
          })}
        </div>

        <Tabs value={`step-${currentStep}`} className="mt-6">
          {/* Step 1: Create Shopify App */}
          <TabsContent value="step-1" className="space-y-4">
            <Alert>
              <ShoppingBag className="h-4 w-4" />
              <AlertTitle>Créer une application privée</AlertTitle>
              <AlertDescription className="space-y-3">
                <ol className="list-decimal list-inside space-y-2 mt-2">
                  <li>Connectez-vous à votre <strong>Admin Shopify</strong></li>
                  <li>Allez dans <strong>Paramètres → Apps et canaux de vente</strong></li>
                  <li>Cliquez sur <strong>Développer des apps</strong></li>
                  <li>Cliquez sur <strong>Créer une app</strong></li>
                  <li>Nommez l'app "ShopOpti+ Integration"</li>
                  <li>Configurez les scopes API suivants:</li>
                </ol>
                
                <div className="bg-muted p-3 rounded-md font-mono text-xs mt-3">
                  read_products, write_products, read_orders, write_orders,<br />
                  read_inventory, write_inventory, read_fulfillments, write_fulfillments
                </div>

                <Button 
                  variant="outline" 
                  className="mt-3"
                  onClick={() => window.open('https://admin.shopify.com', '_blank')}
                >
                  Ouvrir Admin Shopify
                  <ExternalLink className="h-4 w-4 ml-2" />
                </Button>
              </AlertDescription>
            </Alert>

            <Button onClick={() => setCurrentStep(2)} className="w-full">
              J'ai créé mon application
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </TabsContent>

          {/* Step 2: Get Credentials */}
          <TabsContent value="step-2" className="space-y-4">
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="shopDomain">Domaine de la boutique</Label>
                <Input
                  id="shopDomain"
                  placeholder="votre-boutique.myshopify.com"
                  value={credentials.shopDomain}
                  onChange={(e) => setCredentials(prev => ({ ...prev, shopDomain: e.target.value }))}
                />
                <p className="text-xs text-muted-foreground">
                  Le domaine complet de votre boutique Shopify
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="accessToken">Access Token (Admin API)</Label>
                <Input
                  id="accessToken"
                  type="password"
                  placeholder="shpat_xxxxxxxxxxxxx"
                  value={credentials.accessToken}
                  onChange={(e) => setCredentials(prev => ({ ...prev, accessToken: e.target.value }))}
                />
                <p className="text-xs text-muted-foreground">
                  Trouvable dans votre app → API credentials → Admin API access token
                </p>
              </div>

              {connectionStatus === 'error' && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Échec de connexion</AlertTitle>
                  <AlertDescription>
                    Vérifiez que les credentials sont corrects et que l'app a les permissions nécessaires.
                  </AlertDescription>
                </Alert>
              )}

              {connectionStatus === 'success' && (
                <Alert className="border-success">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                  <AlertTitle>Connexion réussie !</AlertTitle>
                  <AlertDescription>
                    Votre boutique Shopify est bien connectée.
                  </AlertDescription>
                </Alert>
              )}
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setCurrentStep(1)}>
                Retour
              </Button>
              <Button 
                onClick={testConnection} 
                disabled={testingConnection || !credentials.shopDomain || !credentials.accessToken}
                className="flex-1"
              >
                {testingConnection ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Test en cours...
                  </>
                ) : (
                  <>
                    Tester la connexion
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </TabsContent>

          {/* Step 3: Configure Webhooks */}
          <TabsContent value="step-3" className="space-y-4">
            <Alert>
              <Webhook className="h-4 w-4" />
              <AlertTitle>Configuration des webhooks</AlertTitle>
              <AlertDescription className="space-y-3">
                <p>Les webhooks permettent à Shopify de notifier ShopOpti+ en temps réel des changements.</p>
                
                <div className="space-y-2 mt-3">
                  <Label>URL du webhook à configurer:</Label>
                  <div className="flex items-center gap-2">
                    <Input 
                      value={webhookUrl} 
                      readOnly 
                      className="font-mono text-xs"
                    />
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={() => copyToClipboard(webhookUrl, 'URL webhook')}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="mt-3">
                  <Label>Événements à configurer:</Label>
                  <ul className="list-disc list-inside mt-2 text-sm space-y-1">
                    <li>orders/create - Nouvelle commande</li>
                    <li>orders/updated - Mise à jour commande</li>
                    <li>products/update - Mise à jour produit</li>
                    <li>inventory_levels/update - Mise à jour stock</li>
                  </ul>
                </div>
              </AlertDescription>
            </Alert>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setCurrentStep(2)}>
                Retour
              </Button>
              <Button onClick={saveConnection} disabled={loading} className="flex-1">
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  <>
                    Enregistrer et continuer
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </TabsContent>

          {/* Step 4: Sync Products */}
          <TabsContent value="step-4" className="space-y-4">
            <Alert className="border-success">
              <CheckCircle2 className="h-4 w-4 text-success" />
              <AlertTitle>Connexion établie !</AlertTitle>
              <AlertDescription>
                Votre boutique Shopify est maintenant connectée à ShopOpti+.
                Vous pouvez lancer la première synchronisation de vos produits.
              </AlertDescription>
            </Alert>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold">Synchronisation des produits</h4>
                    <p className="text-sm text-muted-foreground">
                      Importez tous vos produits depuis Shopify
                    </p>
                  </div>
                  <Button onClick={syncProducts} disabled={loading}>
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Synchroniser
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => window.location.href = '/products'}
            >
              Voir mes produits
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
