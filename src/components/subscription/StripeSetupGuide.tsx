import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertTriangle, ExternalLink, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

export const StripeSetupGuide = () => {
  const { toast } = useToast();
  const [copiedItem, setCopiedItem] = useState<string | null>(null);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedItem(label);
    toast({
      title: "Copié !",
      description: `${label} copié dans le presse-papier`,
    });
    setTimeout(() => setCopiedItem(null), 2000);
  };

  const webhookUrl = `https://dtozyrmmekdnvekissuh.supabase.co/functions/v1/stripe-webhook`;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Configuration Stripe</CardTitle>
          <CardDescription>
            Suivez ces étapes pour configurer complètement votre intégration Stripe
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Étape 1: Webhook */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge>Étape 1</Badge>
              <h3 className="font-semibold">Configuration du Webhook</h3>
            </div>
            
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Important</AlertTitle>
              <AlertDescription>
                Le webhook est essentiel pour synchroniser automatiquement les paiements avec votre base de données.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                1. Connectez-vous à votre <a 
                  href="https://dashboard.stripe.com/webhooks" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline inline-flex items-center gap-1"
                >
                  Dashboard Stripe
                  <ExternalLink className="w-3 h-3" />
                </a>
              </p>
              <p className="text-sm text-muted-foreground">
                2. Cliquez sur "Add endpoint"
              </p>
              <p className="text-sm text-muted-foreground">
                3. Copiez et collez cette URL :
              </p>
              
              <div className="flex items-center gap-2 bg-muted p-3 rounded-lg">
                <code className="flex-1 text-xs font-mono break-all">
                  {webhookUrl}
                </code>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(webhookUrl, "URL du webhook")}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>

              <p className="text-sm text-muted-foreground">
                4. Sélectionnez ces événements :
              </p>
              <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                <li>• checkout.session.completed</li>
                <li>• customer.subscription.updated</li>
                <li>• customer.subscription.deleted</li>
                <li>• invoice.payment_failed</li>
              </ul>
            </div>
          </div>

          {/* Étape 2: Customer Portal */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge>Étape 2</Badge>
              <h3 className="font-semibold">Activation du Customer Portal</h3>
            </div>

            <p className="text-sm text-muted-foreground">
              Le Customer Portal permet à vos utilisateurs de gérer leur abonnement facilement.
            </p>

            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                1. Allez dans <a 
                  href="https://dashboard.stripe.com/settings/billing/portal" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline inline-flex items-center gap-1"
                >
                  Settings → Customer Portal
                  <ExternalLink className="w-3 h-3" />
                </a>
              </p>
              <p className="text-sm text-muted-foreground">
                2. Activez le portail client
              </p>
              <p className="text-sm text-muted-foreground">
                3. Configurez les actions autorisées (annulation, changement de plan, etc.)
              </p>
            </div>
          </div>

          {/* Étape 3: URLs de retour */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge>Étape 3</Badge>
              <h3 className="font-semibold">URLs de retour configurées</h3>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <span className="text-sm">Succès : <code className="text-xs">/payment/success</code></span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <span className="text-sm">Annulation : <code className="text-xs">/payment/cancelled</code></span>
              </div>
            </div>
          </div>

          {/* Étape 4: Test Mode */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant="secondary">Optionnel</Badge>
              <h3 className="font-semibold">Mode Test</h3>
            </div>

            <Alert>
              <AlertDescription>
                Utilisez les <a 
                  href="https://stripe.com/docs/testing" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  cartes de test Stripe
                </a> pour tester vos paiements sans être débité.
              </AlertDescription>
            </Alert>

            <div className="bg-muted p-3 rounded-lg space-y-1">
              <p className="text-xs font-mono">4242 4242 4242 4242</p>
              <p className="text-xs text-muted-foreground">Carte de test qui fonctionne</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
